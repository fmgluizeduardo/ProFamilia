import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, evolucoes, veiculoRegistros, veiculos } from "@/db/schema";
import type { Atendimento, Evolucao, Veiculo, VeiculoRegistro } from "@/db/schema";
import { USO_DROGAS } from "@/lib/constants";
import { dashISO, fmtMesAno, hojeISO, labelSN } from "@/lib/format";
import { ehErroConexao } from "@/lib/erros-servidor";
import type { Periodo } from "@/lib/report-config";
export { TIPOS_RELATORIO } from "@/lib/report-config";
export type { Periodo, TipoRelatorio } from "@/lib/report-config";

export type Distribuicao = { label: string; valor: number };

/** Datas estritas no formato local ISO, sem deslocamentos de fuso. */
export function dataISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

export function resolverPeriodo(de?: string | null, ate?: string | null): Periodo | null {
  const inicio = de ?? dashISO(90);
  const fim = ate ?? hojeISO();
  if (!dataISOValida(inicio) || !dataISOValida(fim) || inicio > fim) return null;
  return { de: inicio, ate: fim };
}

export type DadosRelatorio = {
  periodo: Periodo;
  fichas: Atendimento[];
  veiculos: VeiculoRegistro[];
  evolucoes: Evolucao[];
  frota: Veiculo[];
};

export async function carregarDadosRelatorio(periodo: Periodo): Promise<DadosRelatorio> {
  const { de, ate } = periodo;
  const filtroFichas = and(
    gte(atendimentos.dataAtendimento, de),
    lte(atendimentos.dataAtendimento, ate),
  );
  const [fichas, registros, evolucoesDoPeriodo, frota] = await Promise.all([
    db.select().from(atendimentos).where(filtroFichas).orderBy(desc(atendimentos.dataAtendimento), desc(atendimentos.numero)),
    db.select().from(veiculoRegistros)
      .where(and(gte(veiculoRegistros.data, de), lte(veiculoRegistros.data, ate)))
      .orderBy(desc(veiculoRegistros.data), desc(veiculoRegistros.createdAt)),
    db.select({ registro: evolucoes }).from(evolucoes)
      .innerJoin(atendimentos, eq(evolucoes.atendimentoId, atendimentos.id))
      .where(filtroFichas)
      .orderBy(asc(evolucoes.createdAt)),
    db.select().from(veiculos).orderBy(desc(veiculos.ativo), asc(veiculos.modelo), asc(veiculos.placa)),
  ]);
  return { periodo, fichas, veiculos: registros, evolucoes: evolucoesDoPeriodo.map((r) => r.registro), frota };
}

const ESPERA_REPETICAO_MS = 1500;

/** Carrega os dados do relatório, repetindo uma vez após falha transitória de conexão. */
export async function carregarDadosRelatorioComRepeticao(periodo: Periodo): Promise<DadosRelatorio> {
  try {
    return await carregarDadosRelatorio(periodo);
  } catch (erro) {
    if (!ehErroConexao(erro)) throw erro;
    await new Promise((r) => setTimeout(r, ESPERA_REPETICAO_MS));
    return carregarDadosRelatorio(periodo);
  }
}

function ordenar(mapa: Map<string, number>): Distribuicao[] {
  return [...mapa.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor || a.label.localeCompare(b.label, "pt-BR"));
}

/** Para respostas únicas, contabiliza explicitamente os não informados. */
export function contarValores(
  valores: (string | null | undefined)[],
  rotular: (valor: string) => string = (v) => v,
): Distribuicao[] {
  const mapa = new Map<string, number>();
  for (const bruto of valores) {
    const label = bruto?.trim() ? rotular(bruto.trim()) : "Não informado";
    mapa.set(label, (mapa.get(label) ?? 0) + 1);
  }
  return ordenar(mapa);
}

/** Seleções múltiplas: cada pessoa conta uma vez por categoria. */
export function contarSelecoes(valores: string[][]): Distribuicao[] {
  const mapa = new Map<string, number>();
  for (const itens of valores) {
    for (const item of new Set(itens)) {
      if (item?.trim()) mapa.set(item, (mapa.get(item) ?? 0) + 1);
    }
  }
  return ordenar(mapa);
}

function horaTurno(hora: string): string {
  const h = Number(hora.slice(0, 2));
  if (Number.isNaN(h)) return "Não informado";
  if (h >= 6 && h < 12) return "Manhã (6h–12h)";
  if (h >= 12 && h < 18) return "Tarde (12h–18h)";
  if (h >= 18 && h < 24) return "Noite (18h–0h)";
  return "Madrugada (0h–6h)";
}

export function resumirRelatorio({ fichas, veiculos, evolucoes }: DadosRelatorio) {
  const total = fichas.length;
  const pessoas = new Set(fichas.map((f) => {
    const cpf = f.cpf?.replace(/\D/g, "");
    return cpf && cpf.length === 11
      ? `cpf:${cpf}`
      : `nome:${f.nomeCompleto.trim().toLocaleLowerCase("pt-BR")}:${f.dataNascimento ?? ""}`;
  }));
  const emRua = fichas.filter((f) => f.situacaoAtual.includes("Situação de Rua")).length;
  const acompanhamento = fichas.filter((f) => f.necessitaAcompanhamento === "sim").length;
  const criancas = fichas.filter((f) => f.idade !== null && f.idade < 18).length;
  const idosos = fichas.filter((f) => f.idade !== null && f.idade >= 60).length;
  const docsPendentes = fichas.filter((f) =>
    f.possuiDocumentacao === "nao" || f.possuiDocumentacao === "parcialmente",
  ).length;
  const saudeUrgente = fichas.filter((f) => f.atendimentoImediato === "sim").length;
  const kmRodados = veiculos.reduce(
    (acc, r) => acc + (r.chegadaKm !== null ? Math.max(0, r.chegadaKm - r.saidaKm) : 0),
    0,
  );

  const mapaMes = new Map<string, number>();
  for (const f of fichas) {
    const mes = f.dataAtendimento.slice(0, 7);
    mapaMes.set(mes, (mapaMes.get(mes) ?? 0) + 1);
  }
  const porMes = [...mapaMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, valor]) => ({ label: fmtMesAno(`${chave}-15`), valor }));

  const faixas = [
    { label: "0 a 11 anos", min: 0, max: 11 },
    { label: "12 a 17 anos", min: 12, max: 17 },
    { label: "18 a 29 anos", min: 18, max: 29 },
    { label: "30 a 44 anos", min: 30, max: 44 },
    { label: "45 a 59 anos", min: 45, max: 59 },
    { label: "60 anos ou mais", min: 60, max: 129 },
  ];
  const porFaixa = faixas.map((faixa) => ({
    label: faixa.label,
    valor: fichas.filter((f) => f.idade !== null && f.idade >= faixa.min && f.idade <= faixa.max).length,
  }));
  const semIdade = fichas.filter((f) => f.idade === null).length;
  if (semIdade) porFaixa.push({ label: "Não informado", valor: semIdade });

  const diaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const porDiaSemana = contarValores(fichas.map((f) => {
    const data = new Date(`${f.dataAtendimento}T12:00:00Z`);
    return Number.isNaN(data.getTime()) ? null : diaSemana[data.getUTCDay()];
  }));

  const grupos = {
    porMes,
    porDiaSemana,
    porTurno: contarValores(fichas.map((f) => horaTurno(f.horario))),
    porMotivo: contarValores(fichas.map((f) => f.motivoAbordagem === "Outro" ? (f.motivoOutro ? `Outro: ${f.motivoOutro}` : "Outro") : f.motivoAbordagem)),
    porSituacao: contarSelecoes(fichas.map((f) => f.situacaoAtual)),
    porSexo: contarValores(fichas.map((f) => f.sexo === "Outra identificação" && f.sexoOutro ? "Outra identificação (autodescrita)" : f.sexo)),
    porFaixa,
    porEstadoCivil: contarValores(fichas.map((f) => f.estadoCivil)),
    porMunicipio: contarValores(fichas.map((f) => f.municipioOrigem)),
    porLocal: contarValores(fichas.map((f) => f.localAbordagem)),
    porEquipe: contarValores(fichas.map((f) => f.equipe)),
    porProfissional: contarValores(fichas.map((f) => f.profissionalResponsavel)),
    porDocumentacao: contarValores(fichas.map((f) => f.possuiDocumentacao), labelSN),
    porVinculo: contarValores(fichas.map((f) => f.vinculoPreservado), labelSN),
    porVinculoFamiliar: contarValores(fichas.map((f) => f.vinculoFamiliar)),
    porMoradia: contarValores(fichas.map((f) =>
      f.condicaoMoradia === "Outro" && f.condicaoMoradiaOutro
        ? `Outro: ${f.condicaoMoradiaOutro}`
        : f.condicaoMoradia,
    )),
    porMedicacao: contarValores(fichas.map((f) => f.usoMedicacao), labelSN),
    porSaudeImediata: contarValores(fichas.map((f) => f.atendimentoImediato), labelSN),
    porDrogas: contarValores(fichas.map((f) => f.usoDrogas), (v) => USO_DROGAS.find((o) => o.value === v)?.label ?? v),
    porSubstancias: contarSelecoes(fichas.map((f) => f.substancias)),
    porEscolaridade: contarValores(fichas.map((f) => f.escolaridade)),
    porRenda: contarValores(fichas.map((f) => f.possuiRenda), labelSN),
    porOrigemRenda: contarValores(fichas.map((f) => f.origemRenda)),
    porBeneficios: contarSelecoes(fichas.map((f) => f.beneficios)),
    porDemandas: contarSelecoes(fichas.map((f) => f.demandas)),
    porProvidencias: contarSelecoes(fichas.map((f) => f.providencias)),
    porProcedimentos: contarSelecoes(fichas.map((f) => f.procedimentos)),
    porEncaminhamentos: contarSelecoes(fichas.map((f) => f.encaminhamentos)),
    porAcompanhamento: contarValores(fichas.map((f) => f.necessitaAcompanhamento), labelSN),
    porMotorista: contarValores(veiculos.map((v) => v.motorista)),
    porVeiculo: contarValores(veiculos.map((v) => v.veiculo)),
  };

  return {
    total,
    unicos: pessoas.size,
    emRua,
    acompanhamento,
    criancas,
    idosos,
    docsPendentes,
    saudeUrgente,
    evolucoes: evolucoes.length,
    saidas: veiculos.length,
    concluidas: veiculos.filter((r) => r.chegadaKm !== null).length,
    emRota: veiculos.filter((r) => r.chegadaKm === null).length,
    kmRodados,
    ...grupos,
  };
}

export type ResumoRelatorio = ReturnType<typeof resumirRelatorio>;
