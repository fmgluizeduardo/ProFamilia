import { and, desc, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos } from "@/db/schema";
import { fmtData, labelSN, moedaBR } from "@/lib/format";
import { USO_DROGAS } from "@/lib/constants";
import { dataReal } from "@/lib/validacoes";
import { NextResponse } from "next/server";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { veTodasAsFichas } from "@/lib/escopo";
import { comRetentativa } from "@/lib/db-retry";
import { classificarFalha, respostaErro } from "@/lib/respostas-api";

function csvCampo(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const auth = await autorizarApi(req, "relatorios.exportar");
  if (!auth.ok) return auth.resposta;
  // A planilha é nominal (todas as fichas): exige acesso às fichas de toda a equipe.
  if (!veTodasAsFichas(auth.usuario)) {
    return respostaErro(req, 403, "Acesso restrito",
      "A exportação nominal exige permissão para ver as fichas de toda a equipe.", "PERMISSAO");
  }
  const url = new URL(req.url);
  const de = url.searchParams.get("de");
  const ate = url.searchParams.get("ate");

  const condicoes: SQL[] = [];
  if (dataReal(de)) {
    condicoes.push(gte(atendimentos.dataAtendimento, de));
  }
  if (dataReal(ate)) {
    condicoes.push(lte(atendimentos.dataAtendimento, ate));
  }

  let fichas;
  try {
    // Nova tentativa automática: o banco pode estar acordando da hibernação.
    fichas = await comRetentativa(() =>
      db.select().from(atendimentos)
        .where(condicoes.length ? and(...condicoes) : undefined)
        .orderBy(desc(atendimentos.numero)),
    );
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    const f = classificarFalha(error);
    return respostaErro(req, f.status, f.mensagem.replace("o relatório", "a planilha"), f.detalhe, f.codigo);
  }

  const CABECALHO = [
    "Nº Atendimento", "Data", "Horário", "Local da Abordagem", "Ponto de Referência",
    "Profissional Responsável", "Equipe", "Motivo da Abordagem",
    "Nome Completo", "Nome Social", "Data de Nascimento", "Idade",
    "Sexo / identidade (autodeclarada)", "Outra identificação (descrição)", "Estado Civil", "Nome da Mãe", "Nome do Pai", "Telefone",
    "Naturalidade", "Município de Origem", "CPF", "RG", "Possui Documentação",
    "Situações Atuais", "Tempo na Situação", "Tipo Situação de Rua",
    "Vínculo Preservado", "Vínculo Familiar", "Referência Familiar",
    "Tel. Referência", "Município da Família", "Condição de Moradia",
    "Condição de Saúde", "Medicação Contínua", "Qual Medicação",
    "Atendimento Imediato", "Álcool/Outras Drogas", "Substâncias",
    "Escolaridade", "Possui Renda", "Origem da Renda", "Valor da Renda (R$)",
    "Benefícios Sociais", "NIS", "Demandas", "Providências", "Procedimentos",
    "Encaminhamentos", "Necessita Acompanhamento", "Local do Acompanhamento",
    "Responsável pelo Registro", "Cargo", "Registrada em",
  ];

  const usoDrogasLabel = (v: string | null) =>
    USO_DROGAS.find((u) => u.value === v)?.label ?? (v ?? "");

  const linhas = fichas.map((f) =>
    [
      String(f.numero).padStart(4, "0"),
      fmtData(f.dataAtendimento),
      f.horario,
      f.localAbordagem,
      f.pontoReferencia,
      f.profissionalResponsavel,
      f.equipe,
      f.motivoAbordagem === "Outro" ? `Outro: ${f.motivoOutro ?? ""}` : f.motivoAbordagem,
      f.nomeCompleto,
      f.nomeSocial,
      fmtData(f.dataNascimento),
      f.idade,
      f.sexo,
      f.sexoOutro,
      f.estadoCivil,
      f.nomeMae,
      f.nomePai,
      f.telefone,
      f.naturalidade,
      f.municipioOrigem,
      f.cpf,
      f.rg,
      labelSN(f.possuiDocumentacao),
      f.situacaoAtual.join(" | "),
      f.tempoSituacao,
      f.ruaTipo,
      labelSN(f.vinculoPreservado),
      f.vinculoFamiliar,
      f.refFamiliarNome,
      f.refFamiliarTelefone,
      f.refFamiliarMunicipio,
      f.condicaoMoradia === "Outro" ? `Outro: ${f.condicaoMoradiaOutro ?? ""}` : f.condicaoMoradia,
      f.saudeCondicao,
      labelSN(f.usoMedicacao),
      f.usoMedicacaoQual,
      labelSN(f.atendimentoImediato),
      usoDrogasLabel(f.usoDrogas),
      f.substancias.join(" | "),
      f.escolaridade,
      labelSN(f.possuiRenda),
      f.origemRenda === "Outro" ? `Outro: ${f.origemRendaOutro ?? ""}` : f.origemRenda,
      f.valorRenda === null ? "" : moedaBR(f.valorRenda),
      f.beneficios.join(" | "),
      f.numeroNis,
      f.demandas.join(" | "),
      f.providencias.join(" | "),
      f.procedimentos.join(" | "),
      f.encaminhamentos.join(" | "),
      labelSN(f.necessitaAcompanhamento),
      f.acompanhamentoLocal,
      f.responsavelNome,
      f.responsavelCargo,
      f.createdAt ? new Date(f.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "",
    ]
      .map(csvCampo)
      .join(";"),
  );

  const csv = "\uFEFF" + CABECALHO.map(csvCampo).join(";") + "\r\n" + linhas.join("\r\n");
  const nomeArquivo = `atendimentos-profamilia${de ? `-${de}` : ""}${ate ? `-${ate}` : ""}.csv`;
  await registrarAuditoria({
    usuario: auth.usuario, acao: "relatorio.csv",
    detalhes: `${fichas.length} fichas · período ${de ?? "início"} a ${ate ?? "hoje"}`, req,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
