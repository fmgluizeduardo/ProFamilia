import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, gte, like, lte, type SQL } from "drizzle-orm";
import { ScrollText, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { auditoria, usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { dataReal, uuidValido } from "@/lib/validacoes";
import { AbasAdmin } from "../abas";
import { rotuloAcao, tomAcao } from "./rotulos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auditoria" };

const GRUPOS = [
  { v: "", r: "Todas as ações" },
  { v: "login", r: "Acessos (login/logout)" },
  { v: "ficha", r: "Fichas" },
  { v: "evolucao", r: "Evoluções" },
  { v: "veiculo", r: "Percursos de veículo" },
  { v: "frota", r: "Frota (cadastro de veículos)" },
  { v: "relatorio", r: "Relatórios e exportações" },
  { v: "usuario", r: "Gestão de usuários" },
];

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigirUsuario("admin");
  const sp = await searchParams;
  const usuarioId = typeof sp.usuario === "string" && uuidValido(sp.usuario) ? sp.usuario : "";
  const grupo = typeof sp.grupo === "string" && GRUPOS.some((g) => g.v === sp.grupo) ? sp.grupo : "";
  const de = dataReal(sp.de) ? sp.de : "";
  const ate = dataReal(sp.ate) ? sp.ate : "";

  const filtros: SQL[] = [];
  if (usuarioId) filtros.push(eq(auditoria.usuarioId, usuarioId));
  if (grupo) filtros.push(like(auditoria.acao, `${grupo}%`));
  if (de) filtros.push(gte(auditoria.createdAt, new Date(`${de}T00:00:00-03:00`)));
  if (ate) filtros.push(lte(auditoria.createdAt, new Date(`${ate}T23:59:59-03:00`)));

  const [eventos, pessoas] = await Promise.all([
    db.select().from(auditoria).where(filtros.length ? and(...filtros) : undefined).orderBy(desc(auditoria.createdAt)).limit(300),
    db.select({ id: usuarios.id, nome: usuarios.nome }).from(usuarios).orderBy(asc(usuarios.nome)),
  ]);

  const sel = "h-10 rounded-lg border border-ink-200 bg-white px-3 text-[0.8rem] font-semibold text-ink-700 focus:border-brand-400 focus:outline-none";

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
          <ShieldCheck className="h-4 w-4" /> Administração
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Trilha de auditoria</h1>
        <p className="mt-1 text-[0.82rem] text-ink-500">Registro permanente de acessos, alterações de dados, exportações e gestão de usuários.</p>
      </div>

      <AbasAdmin ativa="auditoria" />

      <form action="/usuarios/auditoria" className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-100/80 bg-card p-3.5 shadow-card">
        <select name="usuario" defaultValue={usuarioId} className={sel} aria-label="Usuário">
          <option value="">Todos os usuários</option>
          {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select name="grupo" defaultValue={grupo} className={sel} aria-label="Tipo de ação">
          {GRUPOS.map((g) => <option key={g.v} value={g.v}>{g.r}</option>)}
        </select>
        <input type="date" name="de" defaultValue={de} className={sel} aria-label="De" />
        <input type="date" name="ate" defaultValue={ate} className={sel} aria-label="Até" />
        <button type="submit" className="h-10 rounded-lg bg-ink-900 px-4 text-[0.8rem] font-bold text-white hover:bg-ink-800">Filtrar</button>
        {(usuarioId || grupo || de || ate) && (
          <Link href="/usuarios/auditoria" className="text-[0.78rem] font-bold text-ink-500 hover:text-ink-800">Limpar</Link>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-ink-100/80 bg-card shadow-card">
        {eventos.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText className="mx-auto h-8 w-8 text-ink-200" />
            <p className="mt-2 text-[0.84rem] font-semibold text-ink-500">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-50">
            {eventos.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                <span className="w-36 shrink-0 text-[0.72rem] font-semibold text-ink-400">{fmtDataHora(e.createdAt)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${tomAcao(e.acao)}`}>{rotuloAcao(e.acao)}</span>
                    <span className="text-[0.8rem] font-bold text-ink-800">{e.usuarioNome ?? "Visitante não identificado"}</span>
                  </p>
                  {e.detalhes && <p className="mt-1 break-words text-[0.76rem] text-ink-500">{e.detalhes}</p>}
                </div>
                {e.ip && <span className="shrink-0 font-mono text-[0.66rem] text-ink-300">{e.ip}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {eventos.length === 300 && (
        <p className="text-center text-[0.72rem] text-ink-400">Exibindo os 300 eventos mais recentes. Use os filtros para refinar.</p>
      )}
    </div>
  );
}
