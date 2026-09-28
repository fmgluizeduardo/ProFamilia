import type { Metadata } from "next";
import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { Bug, CircleCheck, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { errosSistema, type ErroSistema } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { descreverErro } from "@/lib/erros-servidor";
import { ehFalhaDoSistema, infoErro } from "@/lib/erros-catalogo";
import { fmtDataHora } from "@/lib/format";
import { AbasAdmin } from "../abas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Erros do sistema" };

/** Consulta das ocorrências pela referência exibida ao usuário no aviso de erro. */
export default async function ErrosSistemaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigirUsuario("admin");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";

  let lista: ErroSistema[] = [];
  let falha: string | null = null;
  try {
    const termo = `%${q.replace(/[%_\\]/g, " ")}%`;
    lista = await db
      .select()
      .from(errosSistema)
      .where(
        q
          ? or(
              ilike(errosSistema.referencia, termo),
              ilike(errosSistema.codigo, termo),
              ilike(errosSistema.rota, termo),
              ilike(errosSistema.usuarioNome, termo),
              ilike(errosSistema.tecnico, termo),
            )
          : undefined,
      )
      .orderBy(desc(errosSistema.createdAt))
      .limit(200);
  } catch (e) {
    falha = descreverErro(e);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
          <ShieldCheck className="h-4 w-4" /> Administração
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Erros do sistema</h1>
        <p className="mt-1 max-w-2xl text-[0.82rem] text-ink-500">
          Cada falha recebe uma referência (ex.: K7Q2-M9XA), exibida no aviso de erro da pessoa que a encontrou.
          Busque pela referência para ver o detalhe técnico e corrigir a causa.
        </p>
      </div>

      <AbasAdmin ativa="erros" />

      <form action="/usuarios/erros" className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-100/80 bg-card p-3.5 shadow-card">
        <input
          name="q"
          defaultValue={q}
          placeholder="Referência, código (ex.: REL-001), endereço ou usuário"
          className="h-10 min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-[0.82rem] font-semibold text-ink-700 focus:border-brand-400 focus:outline-none"
        />
        <button type="submit" className="h-10 rounded-lg bg-ink-900 px-4 text-[0.8rem] font-bold text-white hover:bg-ink-800">
          Buscar
        </button>
        {q && (
          <Link href="/usuarios/erros" className="text-[0.78rem] font-bold text-ink-500 hover:text-ink-800">
            Limpar
          </Link>
        )}
      </form>

      {falha ? (
        <div role="alert" className="rounded-2xl border border-sun-300 bg-sun-50 p-4 text-[0.8rem] leading-relaxed text-sun-900">
          <p className="font-bold">Não foi possível ler o registro de erros.</p>
          <p className="mt-1">
            Se o detalhe abaixo citar a tabela “erros_sistema”, aplique as atualizações do banco
            (<code className="font-mono">npx drizzle-kit migrate</code> com a DATABASE_URL de produção).
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/70 p-2 font-mono text-[0.7rem]">{falha}</pre>
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-10 text-center">
          <CircleCheck className="mx-auto h-8 w-8 text-leaf-500" />
          <p className="mt-2 text-[0.86rem] font-bold text-ink-700">
            {q ? "Nenhuma ocorrência encontrada para a busca." : "Nenhuma falha registrada."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {lista.map((e) => {
            const info = infoErro(e.codigo);
            const grave = ehFalhaDoSistema(e.codigo);
            return (
              <li key={e.id} className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-center gap-2 text-[0.72rem]">
                  <span
                    className={`rounded-md border bg-white px-1.5 py-0.5 font-mono font-bold ${
                      grave ? "border-red-200 text-red-700" : "border-sun-300 text-sun-800"
                    }`}
                  >
                    {e.codigo}
                  </span>
                  <span className="rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-mono font-semibold text-ink-700">
                    Ref. {e.referencia}
                  </span>
                  <span className="font-semibold text-ink-400">{fmtDataHora(e.createdAt)}</span>
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 text-[0.86rem] font-bold text-ink-900">
                  <Bug className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <span>
                    {info.titulo}
                    {e.mensagem && e.mensagem !== info.titulo ? (
                      <span className="font-semibold text-ink-600"> — {e.mensagem}</span>
                    ) : null}
                  </span>
                </p>
                <p className="mt-0.5 break-all text-[0.74rem] text-ink-500">
                  {e.metodo ?? "—"} {e.rota ?? ""} · {e.usuarioNome ?? "usuário não identificado"}
                  {e.ip ? ` · IP ${e.ip}` : ""}
                </p>
                {e.tecnico && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[0.74rem] font-bold text-brand-700">Detalhe técnico</summary>
                    <pre className="mt-1 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink-50 p-2.5 font-mono text-[0.68rem] text-ink-700">
                      {e.tecnico}
                      {e.pilha ? `\n\n${e.pilha}` : ""}
                    </pre>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {lista.length === 200 && (
        <p className="text-center text-[0.72rem] text-ink-400">Exibindo as 200 ocorrências mais recentes. Use a busca para refinar.</p>
      )}
    </div>
  );
}
