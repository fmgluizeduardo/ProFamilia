import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, MonitorSmartphone, ScrollText } from "lucide-react";
import { SessoesLista } from "@/components/sessoes-lista";
import { listarSessoesAtivas } from "@/lib/sessoes-dados";
import { db } from "@/db";
import { auditoria, usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";
import { rotuloAcao } from "../auditoria/rotulos";
import { UsuarioForm } from "../usuario-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const atual = await exigirUsuario("admin");
  const { id } = await params;
  if (!uuidValido(id)) notFound();

  const [u] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!u) notFound();

  const [atividade, sessoesAtivas] = await Promise.all([
    db.select().from(auditoria).where(eq(auditoria.usuarioId, id)).orderBy(desc(auditoria.createdAt)).limit(12),
    listarSessoesAtivas(id, u.id === atual.id ? atual.sessaoId : undefined),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/usuarios" className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Usuários
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">{u.nome}</h1>
        <p className="mt-1 text-[0.8rem] text-ink-500">
          <span className="font-mono">@{u.login}</span> · criado em {fmtDataHora(u.createdAt)} · último acesso{" "}
          {u.ultimoAcesso ? fmtDataHora(u.ultimoAcesso) : "nunca"}
        </p>
      </div>

      <UsuarioForm
        ehProprio={u.id === atual.id}
        usuario={{
          id: u.id, nome: u.nome, login: u.login, cargo: u.cargo,
          papel: u.papel === "admin" ? "admin" : "usuario",
          permissoes: u.permissoes, ativo: u.ativo,
          bloqueado: !!u.bloqueadoAte && u.bloqueadoAte > new Date(),
          deveTrocarSenha: u.deveTrocarSenha,
          acessoAte: u.acessoAte,
        }}
      />

      <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
          <MonitorSmartphone className="h-4.5 w-4.5 text-brand-600" /> Sessões ativas ({sessoesAtivas.length})
        </h2>
        <p className="mt-1 text-[0.8rem] text-ink-500">
          Aparelhos conectados com esta conta. Encerre em caso de celular perdido, troca de função ou suspeita de uso indevido.
        </p>
        <div className="mt-3">
          <SessoesLista
            sessoes={sessoesAtivas}
            acao={{ url: `/api/usuarios/${u.id}`, metodo: "PATCH", corpo: { acao: "encerrar_sessoes" } }}
            rotuloBotao={u.id === atual.id ? "Encerrar minhas outras sessões" : "Encerrar todas as sessões"}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[0.98rem] font-bold text-ink-900">
          <ScrollText className="h-4.5 w-4.5 text-brand-600" /> Atividade recente
        </h2>
        {atividade.length === 0 ? (
          <p className="mt-3 text-[0.8rem] text-ink-400">Nenhuma atividade registrada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-50">
            {atividade.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
                <span className="text-[0.82rem] font-semibold text-ink-800">{rotuloAcao(a.acao)}
                  {a.detalhes && <span className="ml-1.5 font-normal text-ink-500">— {a.detalhes}</span>}
                </span>
                <span className="text-[0.7rem] font-semibold text-ink-400">{fmtDataHora(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/usuarios/auditoria?usuario=${u.id}`} className="mt-3 inline-block text-[0.78rem] font-bold text-brand-600 hover:text-brand-700">
          Ver histórico completo →
        </Link>
      </section>
    </div>
  );
}
