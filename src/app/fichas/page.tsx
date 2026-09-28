import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { FileSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { db } from "@/db";
import { atendimentos } from "@/db/schema";
import { MOTIVOS, SITUACOES } from "@/lib/constants";
import { dataReal } from "@/lib/validacoes";
import { exigirUsuario } from "@/lib/auth";
import { filtroEscopoFichas, veTodasAsFichas } from "@/lib/escopo";
import { FichaCard } from "@/components/ficha-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fichas de Atendimento",
};

export default async function FichasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await exigirUsuario("fichas.ver");
  const somenteProprias = !veTodasAsFichas(usuario);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const situacao = typeof sp.situacao === "string" ? sp.situacao : "";
  const motivo = typeof sp.motivo === "string" ? sp.motivo : "";
  // Só aplica o filtro de data quando for uma data real; evita 500 em URL editada.
  const de = dataReal(sp.de) ? sp.de : "";
  const ate = dataReal(sp.ate) ? sp.ate : "";

  const condicoes: SQL[] = [];
  // Escopo: sem acesso a toda a equipe, lista somente as fichas cadastradas pelo usuário.
  const escopo = filtroEscopoFichas(usuario);
  if (escopo) condicoes.push(escopo);
  if (q) {
    // Remove caracteres com significado especial em LIKE e na busca.
    const like = `%${q.replace(/[%_\\]/g, " ")}%`;
    const busca = or(
      ilike(atendimentos.nomeCompleto, like),
      ilike(atendimentos.nomeSocial, like),
      ilike(atendimentos.localAbordagem, like),
      ilike(atendimentos.cpf, like),
      ilike(atendimentos.profissionalResponsavel, like),
    );
    if (busca) condicoes.push(busca);
  }
  if (situacao && SITUACOES.includes(situacao)) {
    condicoes.push(
      sql`${atendimentos.situacaoAtual} @> ARRAY[${situacao}]::text[]`,
    );
  }
  if (motivo && MOTIVOS.includes(motivo)) {
    condicoes.push(eq(atendimentos.motivoAbordagem, motivo));
  }
  if (de) condicoes.push(gte(atendimentos.dataAtendimento, de));
  if (ate) condicoes.push(lte(atendimentos.dataAtendimento, ate));

  const fichas = await db
    .select()
    .from(atendimentos)
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(atendimentos.numero))
    .limit(120);

  const temFiltro = !!(q || situacao || motivo || de || ate);

  return (
    <div className="space-y-5">
      <div className="animate-rise flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-600">
            Registros
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Fichas de atendimento
          </h1>
          {somenteProprias && (
            <p className="mt-1 text-[0.78rem] font-semibold text-ink-500">
              Seu perfil exibe somente as fichas que você cadastrou.
            </p>
          )}
        </div>
        <span className="rounded-full border border-ink-100 bg-card px-3.5 py-1.5 text-[0.72rem] font-bold text-ink-500">
          {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}
        </span>
      </div>

      {/* ——— Busca e filtros ——— */}
      <form
        action="/fichas"
        className="animate-rise space-y-2.5 rounded-2xl border border-ink-100/80 bg-card p-3.5 shadow-card"
        style={{ animationDelay: "60ms" }}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, CPF, local ou profissional…"
            className="h-12 w-full rounded-xl border border-ink-200/90 bg-white pl-10 pr-4 text-[0.9rem] font-medium text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <select
            name="situacao"
            defaultValue={situacao}
            className="h-11 rounded-xl border border-ink-200/90 bg-white px-3 text-[0.8rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
          >
            <option value="">Situação: todas</option>
            {SITUACOES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="motivo"
            defaultValue={motivo}
            className="h-11 rounded-xl border border-ink-200/90 bg-white px-3 text-[0.8rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
          >
            <option value="">Motivo: todos</option>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="de"
            defaultValue={de}
            aria-label="De"
            className="h-11 rounded-xl border border-ink-200/90 bg-white px-3 text-[0.8rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
          />
          <input
            type="date"
            name="ate"
            defaultValue={ate}
            aria-label="Até"
            className="h-11 rounded-xl border border-ink-200/90 bg-white px-3 text-[0.8rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.82rem] font-bold text-white transition-colors hover:bg-ink-800 active:scale-[0.99]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </button>
          {temFiltro && (
            <Link
              href="/fichas"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 text-[0.82rem] font-bold text-ink-500 transition-colors hover:border-ink-300"
            >
              <X className="h-4 w-4" />
              Limpar
            </Link>
          )}
        </div>
      </form>

      {/* ——— Resultados ——— */}
      {fichas.length === 0 ? (
        <div className="animate-rise rounded-2xl border border-dashed border-ink-200 bg-card p-10 text-center">
          <FileSearch className="mx-auto h-9 w-9 text-ink-200" strokeWidth={1.6} />
          <p className="mt-3 text-[0.9rem] font-bold text-ink-600">
            Nenhuma ficha encontrada
          </p>
          <p className="mt-1 text-[0.8rem] text-ink-400">
            {temFiltro
              ? "Ajuste os filtros ou limpe a busca para ver mais resultados."
              : "As fichas registradas pela equipe aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="animate-rise space-y-2.5" style={{ animationDelay: "120ms" }}>
          {fichas.map((a) => (
            <FichaCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
