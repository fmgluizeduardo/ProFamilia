import { SEXOS, SEXO_OUTRA_IDENTIFICACAO } from "@/lib/constants";
import { dataReal, horaReal } from "@/lib/validacoes";
import type { atendimentos } from "@/db/schema";

/**
 * Validação e normalização únicas da ficha de atendimento, usadas tanto no
 * cadastro (POST) quanto na edição (PUT) — a mesma regra nos dois caminhos.
 */

const OBRIGATORIOS = [
  "dataAtendimento", "horario", "localAbordagem",
  "profissionalResponsavel", "motivoAbordagem", "nomeCompleto",
] as const;

const ARRAYS = [
  "situacaoAtual", "substancias", "beneficios", "demandas",
  "providencias", "procedimentos", "encaminhamentos",
] as const;

const TEXTO = [
  "dataAtendimento", "horario", "localAbordagem", "pontoReferencia",
  "profissionalResponsavel", "equipe", "motivoAbordagem", "motivoOutro",
  "nomeCompleto", "nomeSocial", "dataNascimento", "nomeMae", "nomePai",
  "telefone", "sexo", "sexoOutro", "estadoCivil", "naturalidade", "municipioOrigem",
  "cpf", "rg", "possuiDocumentacao", "situacaoAtualOutro", "tempoSituacao",
  "ruaTipo", "ruaMotivo", "ruaQuantoTempo", "ruaOndePermanece",
  "vinculoPreservado", "vinculoFamiliar", "refFamiliarNome",
  "refFamiliarTelefone", "refFamiliarMunicipio", "condicaoMoradia",
  "condicaoMoradiaOutro", "saudeCondicao", "usoMedicacao", "usoMedicacaoQual",
  "atendimentoImediato", "usoDrogas", "escolaridade", "possuiRenda",
  "origemRenda", "origemRendaOutro", "beneficiosOutro", "numeroNis",
  "demandasOutro", "providenciasOutro", "encaminhamentosOutro",
  "necessitaAcompanhamento", "acompanhamentoLocal", "responsavelNome",
  "responsavelCargo",
] as const;

function limparNumeroBR(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? n.toFixed(2) : null;
}

export type DadosFicha = Omit<typeof atendimentos.$inferInsert, "id" | "numero" | "createdAt">;

export type ResultadoNormalizacao =
  | { ok: true; dados: DadosFicha }
  | { ok: false; status: number; erro: string; faltando?: string[] };

export function normalizarFicha(body: Record<string, unknown>): ResultadoNormalizacao {
  const faltando = OBRIGATORIOS.filter((k) => typeof body[k] !== "string" || !(body[k] as string).trim());
  if (faltando.length) {
    return { ok: false, status: 422, erro: "Campos obrigatórios ausentes.", faltando };
  }
  if (!dataReal(body.dataAtendimento)) {
    return { ok: false, status: 422, erro: "Data do atendimento inválida. Use uma data existente (AAAA-MM-DD)." };
  }
  if (!horaReal(body.horario)) {
    return { ok: false, status: 422, erro: "Horário inválido. Use o formato HH:MM." };
  }
  if (typeof body.dataNascimento === "string" && body.dataNascimento.trim() && !dataReal(body.dataNascimento)) {
    return { ok: false, status: 422, erro: "Data de nascimento inválida." };
  }

  const dados: Record<string, unknown> = {};
  for (const k of TEXTO) {
    const v = body[k];
    dados[k] = typeof v === "string" && v.trim() ? v.trim().slice(0, 2000) : null;
  }
  for (const k of ARRAYS) {
    const v = body[k];
    dados[k] = Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.slice(0, 200)))]
      : [];
  }

  const sexo = dados.sexo;
  if (typeof sexo !== "string" || (!SEXOS.includes(sexo) && sexo !== "Outro")) dados.sexo = null;
  dados.sexoOutro = dados.sexo === SEXO_OUTRA_IDENTIFICACAO && typeof dados.sexoOutro === "string"
    ? dados.sexoOutro.slice(0, 180)
    : null;

  dados.dataNascimento = dataReal(body.dataNascimento) ? body.dataNascimento : null;
  const idade = Number(body.idade);
  dados.idade = body.idade !== null && body.idade !== "" && Number.isInteger(idade) && idade >= 0 && idade < 130 ? idade : null;
  dados.valorRenda = limparNumeroBR(body.valorRenda);

  // Assinatura: somente PNG em data URL e com tamanho limitado (~2 MB).
  const assinatura = body.assinaturaUsuario;
  dados.assinaturaUsuario =
    typeof assinatura === "string" && assinatura.startsWith("data:image/png;base64,") && assinatura.length <= 3_000_000
      ? assinatura
      : null;

  return { ok: true, dados: dados as DadosFicha };
}
