import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessoes } from "@/db/schema";
import { COOKIE_SESSAO, obterUsuarioAtual, registrarAuditoria } from "@/lib/auth";

export async function POST(req: Request) {
  const usuario = await obterUsuarioAtual();
  if (usuario) {
    await db.delete(sessoes).where(eq(sessoes.id, usuario.sessaoId));
    await registrarAuditoria({ usuario, acao: "logout", req });
  }
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, "", { path: "/", expires: new Date(0), httpOnly: true });
  return resposta;
}
