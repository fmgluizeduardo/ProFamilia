import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessoes } from "@/db/schema";
import { fmtDataHora } from "@/lib/format";
import type { SessaoResumo } from "@/components/sessoes-lista";

/** Sessões ativas de um usuário, formatadas para exibição (sem o hash do token). */
export async function listarSessoesAtivas(usuarioId: string, sessaoAtualId?: string): Promise<SessaoResumo[]> {
  const linhas = await db
    .select({
      id: sessoes.id,
      criadaEm: sessoes.createdAt,
      expiraEm: sessoes.expiraEm,
      ip: sessoes.ip,
      userAgent: sessoes.userAgent,
    })
    .from(sessoes)
    .where(and(eq(sessoes.usuarioId, usuarioId), gt(sessoes.expiraEm, new Date())))
    .orderBy(desc(sessoes.createdAt));
  return linhas.map((s) => ({
    id: s.id,
    criadaEm: fmtDataHora(s.criadaEm),
    expiraEm: fmtDataHora(s.expiraEm),
    ip: s.ip,
    userAgent: s.userAgent,
    atual: s.id === sessaoAtualId,
  }));
}
