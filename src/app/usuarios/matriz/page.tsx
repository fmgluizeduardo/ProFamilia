import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirUsuario } from "@/lib/auth";
import { fmtData, hojeISO } from "@/lib/format";
import { MODULOS, perfilCorrespondente, temPermissao } from "@/lib/permissoes";
import { AbasAdmin } from "../abas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Matriz de acessos" };

/** Visão consolidada de quem pode fazer o quê — útil para revisões periódicas de acesso. */
export default async function MatrizPage() {
  await exigirUsuario("admin");
  const lista = await db.select().from(usuarios).where(eq(usuarios.ativo, true)).orderBy(asc(usuarios.nome));
  const hoje = hojeISO();
  const colunas = MODULOS.flatMap((m) => m.acoes.map((a) => ({ ...a, modulo: m.titulo })));

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
          <ShieldCheck className="h-4 w-4" /> Administração
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Matriz de acessos</h1>
        <p className="mt-1 text-[0.82rem] text-ink-500">
          Usuários ativos × permissões. Revise periodicamente e remova acessos que não são mais necessários.
        </p>
      </div>

      <AbasAdmin ativa="matriz" />

      <div className="overflow-x-auto rounded-2xl border border-ink-100/80 bg-card shadow-card">
        <table className="w-full min-w-[980px] border-collapse text-left text-[0.76rem]">
          <thead>
            <tr className="border-b border-ink-100">
              <th rowSpan={2} className="sticky left-0 z-10 bg-card px-4 py-3 text-[0.66rem] font-bold uppercase tracking-wider text-ink-400">Usuário</th>
              {MODULOS.map((m) => (
                <th key={m.id} colSpan={m.acoes.length} className="border-l border-ink-100 px-2 py-2 text-center text-[0.64rem] font-bold uppercase tracking-wider text-ink-500">
                  {m.titulo}
                </th>
              ))}
            </tr>
            <tr className="border-b border-ink-100">
              {colunas.map((c, i) => (
                <th key={c.chave} title={c.detalhe}
                  className={`px-1.5 py-2 text-center text-[0.64rem] font-semibold text-ink-500 ${i === 0 || colunas[i - 1].modulo !== c.modulo ? "border-l border-ink-100" : ""}`}>
                  {c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => {
              const expirado = !!u.acessoAte && u.acessoAte < hoje;
              return (
                <tr key={u.id} className={`border-b border-ink-50 last:border-0 hover:bg-brand-50/30 ${expirado ? "opacity-50" : ""}`}>
                  <td className="sticky left-0 z-10 bg-card px-4 py-2.5">
                    <Link href={`/usuarios/${u.id}`} className="font-bold text-ink-900 hover:text-brand-700 hover:underline">{u.nome}</Link>
                    <p className="text-[0.66rem] text-ink-400">
                      {perfilCorrespondente(u.papel, u.permissoes) ?? "Personalizado"}
                      {u.acessoAte ? ` · ${expirado ? "expirou" : "até"} ${fmtData(u.acessoAte)}` : ""}
                    </p>
                  </td>
                  {colunas.map((c, i) => {
                    const tem = temPermissao(u, c.chave);
                    return (
                      <td key={c.chave} className={`px-1.5 py-2.5 text-center ${i === 0 || colunas[i - 1].modulo !== c.modulo ? "border-l border-ink-100" : ""}`}>
                        {tem ? (
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                            u.papel === "admin" ? "bg-sun-100 text-sun-700" : c.tipo === "excluir" ? "bg-red-100 text-red-600" : "bg-leaf-100 text-leaf-700"
                          }`}>
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : (
                          <Minus className="mx-auto h-3 w-3 text-ink-200" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-ink-500">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sun-300" />Administrador (acesso total)</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-leaf-300" />Permissão concedida</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-300" />Permissão de exclusão</span>
      </p>
    </div>
  );
}
