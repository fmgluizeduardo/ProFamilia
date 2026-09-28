import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Check, CircleUserRound, KeyRound, MonitorSmartphone, ShieldCheck, X } from "lucide-react";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fmtData, fmtDataHora } from "@/lib/format";
import { MODULOS, perfilCorrespondente, temPermissao } from "@/lib/permissoes";
import { listarSessoesAtivas } from "@/lib/sessoes-dados";
import { SessoesLista } from "@/components/sessoes-lista";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minha conta" };

/** Transparência: cada usuário vê seus dados, o que pode fazer e onde está conectado. */
export default async function ContaPage() {
  const usuario = await exigirUsuario();
  const [[dados], sessoesAtivas] = await Promise.all([
    db.select({
      acessoAte: usuarios.acessoAte,
      ultimoAcesso: usuarios.ultimoAcesso,
      senhaAlteradaEm: usuarios.senhaAlteradaEm,
      createdAt: usuarios.createdAt,
    }).from(usuarios).where(eq(usuarios.id, usuario.id)).limit(1),
    listarSessoesAtivas(usuario.id, usuario.sessaoId),
  ]);
  const perfil = perfilCorrespondente(usuario.papel, usuario.permissoes) ?? "Acesso personalizado";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-600">
          <CircleUserRound className="h-4 w-4" /> Minha conta
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{usuario.nome}</h1>
        <p className="mt-1 text-[0.82rem] text-ink-500">
          <span className="font-mono">@{usuario.login}</span>{usuario.cargo ? ` · ${usuario.cargo}` : ""} · {perfil}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { r: "Conta criada em", v: dados ? fmtData(dados.createdAt.toISOString()) : "—" },
          { r: "Senha alterada em", v: dados?.senhaAlteradaEm ? fmtDataHora(dados.senhaAlteradaEm) : "nunca" },
          { r: "Validade do acesso", v: dados?.acessoAte ? `até ${fmtData(dados.acessoAte)}` : "sem prazo" },
        ].map((c) => (
          <div key={c.r} className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
            <p className="text-[0.64rem] font-bold uppercase tracking-wider text-ink-400">{c.r}</p>
            <p className="mt-1 text-[0.9rem] font-bold text-ink-900">{c.v}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
          <ShieldCheck className="h-4.5 w-4.5 text-brand-600" /> O que posso fazer no sistema
        </h2>
        {usuario.papel === "admin" ? (
          <p className="mt-2 rounded-xl border border-sun-200 bg-sun-50 p-3.5 text-[0.82rem] text-sun-900">
            Você é <strong>administrador</strong>: tem acesso total, além da gestão de usuários, sessões e auditoria.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {MODULOS.map((m) => (
              <div key={m.id} className="rounded-xl border border-ink-100 p-3.5">
                <p className="text-[0.84rem] font-bold text-ink-900">{m.titulo}</p>
                <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {m.acoes.map((a) => {
                    const tem = temPermissao(usuario, a.chave);
                    return (
                      <li key={a.chave} className={`flex items-start gap-2 text-[0.78rem] ${tem ? "text-ink-800" : "text-ink-400"}`}>
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${tem ? "bg-leaf-500 text-white" : "bg-ink-100 text-ink-400"}`}>
                          {tem ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : <X className="h-2.5 w-2.5" strokeWidth={3.5} />}
                        </span>
                        <span><strong className="font-bold">{a.rotulo}</strong> — {a.detalhe}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <p className="text-[0.74rem] text-ink-500">Precisa de outro acesso para o seu trabalho? Solicite ao administrador do sistema.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
          <MonitorSmartphone className="h-4.5 w-4.5 text-brand-600" /> Onde estou conectado
        </h2>
        <p className="mt-1 text-[0.8rem] text-ink-500">Se reconhecer um aparelho estranho, encerre as sessões e altere sua senha.</p>
        <div className="mt-3">
          <SessoesLista
            sessoes={sessoesAtivas}
            acao={{ url: "/api/auth/sessoes", metodo: "POST", corpo: {} }}
            rotuloBotao="Encerrar sessões dos outros aparelhos"
          />
        </div>
      </section>

      <Link href="/trocar-senha"
        className="inline-flex h-12 items-center gap-2 rounded-xl bg-ink-900 px-6 text-[0.86rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800">
        <KeyRound className="h-4 w-4" /> Alterar minha senha
      </Link>
    </div>
  );
}
