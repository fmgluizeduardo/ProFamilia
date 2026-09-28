import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, type Atendimento } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fichaNoEscopo } from "@/lib/escopo";
import { uuidValido } from "@/lib/validacoes";
import { Wizard, type FormState } from "../../../nova/wizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar ficha" };

/** Converte o registro do banco para o formato do formulário (nulos → vazio). */
function paraFormulario(a: Atendimento): FormState {
  const t = (v: string | null) => v ?? "";
  return {
    dataAtendimento: a.dataAtendimento,
    horario: a.horario,
    localAbordagem: a.localAbordagem,
    pontoReferencia: t(a.pontoReferencia),
    profissionalResponsavel: a.profissionalResponsavel,
    equipe: t(a.equipe),
    motivoAbordagem: a.motivoAbordagem,
    motivoOutro: t(a.motivoOutro),
    nomeCompleto: a.nomeCompleto,
    nomeSocial: t(a.nomeSocial),
    dataNascimento: t(a.dataNascimento),
    nomeMae: t(a.nomeMae),
    nomePai: t(a.nomePai),
    idade: a.idade !== null ? String(a.idade) : "",
    telefone: t(a.telefone),
    sexo: t(a.sexo),
    sexoOutro: t(a.sexoOutro),
    estadoCivil: t(a.estadoCivil),
    naturalidade: t(a.naturalidade),
    municipioOrigem: t(a.municipioOrigem),
    cpf: t(a.cpf),
    rg: t(a.rg),
    possuiDocumentacao: t(a.possuiDocumentacao),
    situacaoAtual: a.situacaoAtual,
    situacaoAtualOutro: t(a.situacaoAtualOutro),
    tempoSituacao: t(a.tempoSituacao),
    ruaTipo: t(a.ruaTipo),
    ruaMotivo: t(a.ruaMotivo),
    ruaQuantoTempo: t(a.ruaQuantoTempo),
    ruaOndePermanece: t(a.ruaOndePermanece),
    vinculoPreservado: t(a.vinculoPreservado),
    vinculoFamiliar: t(a.vinculoFamiliar),
    refFamiliarNome: t(a.refFamiliarNome),
    refFamiliarTelefone: t(a.refFamiliarTelefone),
    refFamiliarMunicipio: t(a.refFamiliarMunicipio),
    condicaoMoradia: t(a.condicaoMoradia),
    condicaoMoradiaOutro: t(a.condicaoMoradiaOutro),
    saudeCondicao: t(a.saudeCondicao),
    usoMedicacao: t(a.usoMedicacao),
    usoMedicacaoQual: t(a.usoMedicacaoQual),
    atendimentoImediato: t(a.atendimentoImediato),
    usoDrogas: t(a.usoDrogas),
    substancias: a.substancias,
    escolaridade: t(a.escolaridade),
    possuiRenda: t(a.possuiRenda),
    origemRenda: t(a.origemRenda),
    origemRendaOutro: t(a.origemRendaOutro),
    valorRenda: a.valorRenda !== null ? Number(a.valorRenda).toFixed(2).replace(".", ",") : "",
    beneficios: a.beneficios,
    beneficiosOutro: t(a.beneficiosOutro),
    numeroNis: t(a.numeroNis),
    demandas: a.demandas,
    demandasOutro: t(a.demandasOutro),
    providencias: a.providencias,
    providenciasOutro: t(a.providenciasOutro),
    procedimentos: a.procedimentos,
    encaminhamentos: a.encaminhamentos,
    encaminhamentosOutro: t(a.encaminhamentosOutro),
    necessitaAcompanhamento: t(a.necessitaAcompanhamento),
    acompanhamentoLocal: t(a.acompanhamentoLocal),
    responsavelNome: t(a.responsavelNome),
    responsavelCargo: t(a.responsavelCargo),
    assinaturaUsuario: a.assinaturaUsuario,
  };
}

export default async function EditarFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await exigirUsuario("fichas.editar");
  const { id } = await params;
  if (!uuidValido(id)) notFound();
  const [ficha] = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  if (!ficha || !fichaNoEscopo(usuario, ficha)) notFound();

  return (
    <Wizard
      usuarioNome={usuario.nome}
      usuarioCargo={usuario.cargo}
      edicao={{ id: ficha.id, numero: String(ficha.numero).padStart(4, "0"), inicial: paraFormulario(ficha) }}
    />
  );
}
