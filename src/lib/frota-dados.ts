import { and, asc, desc, eq, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros, veiculos } from "@/db/schema";
import { ANO_MINIMO, normalizarPlaca, placaValida } from "@/lib/frota";
import { hojeISO } from "@/lib/format";
import { kmValido, texto } from "@/lib/validacoes";

export type DadosVeiculo = {
  modelo: string;
  marca: string | null;
  placa: string;
  ano: number | null;
  cor: string | null;
  kmInicial: number;
  observacoes: string | null;
};

type Resultado = { ok: true; dados: DadosVeiculo } | { ok: false; erro: string };

/** Validação única do cadastro/edição de veículo (mesma regra nos dois caminhos). */
export function normalizarVeiculo(body: Record<string, unknown>): Resultado {
  const modelo = texto(body.modelo, 60);
  if (!modelo) return { ok: false, erro: "Informe o modelo do veículo (ex.: Kombi, Spin, Doblò)." };

  const placa = normalizarPlaca(typeof body.placa === "string" ? body.placa : "");
  if (!placaValida(placa)) {
    return { ok: false, erro: "Placa inválida. Use o padrão ABC-1234 ou Mercosul ABC1D23." };
  }

  let ano: number | null = null;
  if (body.ano !== undefined && body.ano !== null && body.ano !== "") {
    const n = Number(body.ano);
    const limite = Number(hojeISO().slice(0, 4)) + 1;
    if (!Number.isInteger(n) || n < ANO_MINIMO || n > limite) {
      return { ok: false, erro: `Ano inválido. Informe entre ${ANO_MINIMO} e ${limite}.` };
    }
    ano = n;
  }

  let kmInicial = 0;
  if (body.kmInicial !== undefined && body.kmInicial !== null && body.kmInicial !== "") {
    const n = Number(body.kmInicial);
    if (!kmValido(n)) return { ok: false, erro: "KM inicial inválido." };
    kmInicial = n;
  }

  return {
    ok: true,
    dados: {
      modelo,
      marca: texto(body.marca, 60),
      placa,
      ano,
      cor: texto(body.cor, 30),
      kmInicial,
      observacoes: texto(body.observacoes, 500),
    },
  };
}

/**
 * KM mínimo aceitável para uma saída na data informada: o maior KM registrado
 * em percursos até essa data (permite digitar folhas antigas em ordem), ou o
 * KM inicial do veículo quando ainda não há percursos anteriores.
 */
export async function kmReferencia(veiculoId: string, kmInicial: number, ateData: string): Promise<number> {
  const [linha] = await db
    .select({
      km: sql<number | null>`max(greatest(${veiculoRegistros.saidaKm}, coalesce(${veiculoRegistros.chegadaKm}, ${veiculoRegistros.saidaKm})))`,
    })
    .from(veiculoRegistros)
    .where(and(eq(veiculoRegistros.veiculoId, veiculoId), lte(veiculoRegistros.data, ateData)));
  return Math.max(kmInicial, Number(linha?.km ?? 0));
}

export async function percursoAberto(veiculoId: string) {
  const [aberto] = await db
    .select({ id: veiculoRegistros.id, data: veiculoRegistros.data })
    .from(veiculoRegistros)
    .where(and(eq(veiculoRegistros.veiculoId, veiculoId), isNull(veiculoRegistros.chegadaHora)))
    .orderBy(desc(veiculoRegistros.data))
    .limit(1);
  return aberto ?? null;
}

export type ResumoVeiculo = {
  kmAtual: number;
  percursos: number;
  kmRodados: number;
  ultimoUso: string | null;
  emRota: boolean;
};

/** Frota completa com indicadores de uso de cada veículo. */
export async function carregarFrota() {
  const [lista, estatisticas] = await Promise.all([
    db.select().from(veiculos).orderBy(desc(veiculos.ativo), asc(veiculos.modelo), asc(veiculos.placa)),
    db
      .select({
        veiculoId: veiculoRegistros.veiculoId,
        km: sql<number | null>`max(greatest(${veiculoRegistros.saidaKm}, coalesce(${veiculoRegistros.chegadaKm}, ${veiculoRegistros.saidaKm})))`,
        percursos: sql<number>`count(*)::int`,
        rodados: sql<number | null>`sum(${veiculoRegistros.chegadaKm} - ${veiculoRegistros.saidaKm}) filter (where ${veiculoRegistros.chegadaKm} is not null)`,
        ultimoUso: sql<string | null>`max(${veiculoRegistros.data})::text`,
        abertos: sql<number>`count(*) filter (where ${veiculoRegistros.chegadaHora} is null)::int`,
      })
      .from(veiculoRegistros)
      .groupBy(veiculoRegistros.veiculoId),
  ]);

  const porVeiculo = new Map(estatisticas.map((e) => [e.veiculoId, e]));
  return lista.map((v) => {
    const e = porVeiculo.get(v.id);
    const resumo: ResumoVeiculo = {
      kmAtual: Math.max(v.kmInicial, Number(e?.km ?? 0)),
      percursos: Number(e?.percursos ?? 0),
      kmRodados: Number(e?.rodados ?? 0),
      ultimoUso: e?.ultimoUso ?? null,
      emRota: Number(e?.abertos ?? 0) > 0,
    };
    return { ...v, resumo };
  });
}

export type VeiculoComResumo = Awaited<ReturnType<typeof carregarFrota>>[number];
