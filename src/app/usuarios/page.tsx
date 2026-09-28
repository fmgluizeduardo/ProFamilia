import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { ChevronRight, KeyRound, Lock, ShieldCheck, UserPlus } from "lucide-react";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { PERFIS, normalizarPermissoes } from "@/lib/permissoes";
import { AbasAdmin } from "./abas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuários e acessos" };

function nomePerfil(papel: string, permissoes: string[]) {
  if (papel === "admin") return "Administrador";
  const lista = normalizarPermissoes(permissoes);
  const perfil = PERFIS.find((p) => {
    const alvo = normalizarPermissoes(p.permissoes);
    return alvo.length === lista.length && alvo.every((x) => lista.includes(x));
  });
  return perfil ? perfil.nome : `Personalizado (${lista.length} permissões)`;
}

export default async function UsuariosPage() {
  const atual = await exigirUsuario("admin");
  const lista = await db.select().from(usuarios).orderBy(desc(usuarios.ativo), asc(usuarios.nome));
  const agora = new Date();
  const ativos = lista.filter((u) => u.ativo).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
            <ShieldCheck className="h-4 w-4" /> Administração
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Usuários e acessos</h1>
          <p className="mt-1 text-[0.82rem] text-ink-500">{ativos} ativos · {lista.length - ativos} desativados</p>
        </div>
        <Link href="/usuarios/novo"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-[0.84rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98]">
          <UserPlus className="h-4 w-4" /> Novo usuário
        </Link>
      </div>

      <AbasAdmin ativa="usuarios" />

      <div className="space-y-2.5">
        {lista.map((u) => {
          const bloqueado = !!u.bloqueadoAte && u.bloqueadoAte > agora;
          return (
            <Link key={u.id} href={`/usuarios/${u.id}`}
              className={`group flex items-center gap-3.5 rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift ${u.ativo ? "" : "opacity-60"}`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
                u.papel === "admin" ? "bg-sun-100 text-sun-700" : "bg-brand-100 text-brand-700"
              }`}>
                {u.nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-[0.92rem] font-bold text-ink-900">{u.nome}</span>
                  {u.id === atual.id && <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-ink-500">Você</span>}
                  {!u.ativo && <span className="rounded bg-ink-200 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-ink-600">Desativado</span>}
                  {bloqueado && <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-red-700"><Lock className="h-2.5 w-2.5" /> Bloqueado</span>}
                  {u.ativo && u.deveTrocarSenha && <span className="inline-flex items-center gap-1 rounded bg-sun-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-sun-700"><KeyRound className="h-2.5 w-2.5" /> Aguardando 1º acesso</span>}
                </p>
                <p className="mt-0.5 text-[0.74rem] text-ink-400">
                  <span className="font-mono">@{u.login}</span>
                  {u.cargo ? ` · ${u.cargo}` : ""} · <span className="font-semibold text-ink-600">{nomePerfil(u.papel, u.permissoes)}</span>
                </p>
                <p className="mt-0.5 text-[0.68rem] text-ink-400">
                  Último acesso: {u.ultimoAcesso ? fmtDataHora(u.ultimoAcesso) : "nunca acessou"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-200 group-hover:text-ink-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
