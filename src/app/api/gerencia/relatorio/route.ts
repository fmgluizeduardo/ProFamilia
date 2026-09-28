import { NextResponse } from "next/server";
import { carregarDadosRelatorioComRepeticao, resolverPeriodo, TIPOS_RELATORIO, type TipoRelatorio } from "@/lib/relatorios";
import { gerarRelatorioPdf } from "@/lib/gerar-relatorio-pdf";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { veTodasAsFichas } from "@/lib/escopo";
import { erroApi, falhaInterna, rota } from "@/lib/erros-servidor";
import { LIMITE_BYTES_RESPOSTA, LIMITE_FICHAS_PDF } from "@/lib/report-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// PDFs nominais podem ter muitas páginas; a Vercel encerra funções longas sem isso.
export const maxDuration = 60;

export const GET = rota(async function GET(req: Request) {
  const auth = await autorizarApi(req, "relatorios.exportar");
  if (!auth.ok) return auth.resposta;

  const { searchParams } = new URL(req.url);
  const periodo = resolverPeriodo(searchParams.get("de"), searchParams.get("ate"));
  if (!periodo) {
    return erroApi(req, "REL-003", "Período inválido. Informe datas válidas e uma data inicial anterior à final.");
  }

  const tipoRaw = searchParams.get("tipo") || "completo";
  if (!Object.prototype.hasOwnProperty.call(TIPOS_RELATORIO, tipoRaw)) {
    return erroApi(req, "VAL-002", "Tipo de relatório inválido.");
  }
  const tipo = tipoRaw as TipoRelatorio;
  // Relatórios com dados pessoais exigem acesso às fichas de toda a equipe.
  if ((tipo === "completo" || tipo === "fichas") && !veTodasAsFichas(auth.usuario)) {
    return erroApi(req, "AUT-003", "Relatórios nominais exigem acesso às fichas de toda a equipe.");
  }
  const baixar = searchParams.get("baixar") === "1";

  let dados;
  try {
    // Uma repetição cobre a retomada do banco após inatividade.
    dados = await carregarDadosRelatorioComRepeticao(periodo);
  } catch (erro) {
    return falhaInterna(req, erro, { codigo: "REL-001", mensagem: "Não foi possível carregar os dados do relatório." });
  }

  if (tipo !== "indicadores" && dados.fichas.length > LIMITE_FICHAS_PDF) {
    return erroApi(
      req,
      "REL-002",
      `O período tem ${dados.fichas.length.toLocaleString("pt-BR")} fichas; o limite do PDF nominal é de ${LIMITE_FICHAS_PDF} fichas. Reduza o intervalo ou exporte a planilha CSV.`,
    );
  }

  let pdf: Buffer;
  try {
    pdf = await gerarRelatorioPdf(dados, tipo);
  } catch (erro) {
    return falhaInterna(req, erro, { codigo: "REL-001", mensagem: "Não foi possível montar o arquivo PDF do relatório." });
  }

  // A hospedagem recusa respostas acima de 4,5 MB.
  if (pdf.length > LIMITE_BYTES_RESPOSTA) {
    return erroApi(
      req,
      "REL-002",
      `O PDF ficou com ${(pdf.length / 1024 / 1024).toFixed(1)} MB, acima do limite de envio de 4 MB. Reduza o período selecionado.`,
    );
  }

  await registrarAuditoria({
    usuario: auth.usuario,
    acao: "relatorio.pdf",
    detalhes: `${TIPOS_RELATORIO[tipo].titulo} · ${dados.fichas.length} fichas · ${periodo.de} a ${periodo.ate}`,
    req,
  });
  const nome = `profamilia-${tipo}-${periodo.de}-a-${periodo.ate}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
