import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { autorizarApi, encerrarSessoesDoUsuario, registrarAuditoria } from "@/lib/auth";
import { hashSenha } from "@/lib/senha";
import { uuidValido } from "@/lib/validacoes";
import { rota } from "@/lib/erros-servidor";

/** Administrador redefine a senha: nova senha temporária + troca obrigatória no próximo acesso. */
export const POST = rota(async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autorizarApi(req, "admin");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Corpo não é um objeto JSON.");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  const senha = typeof body.senhaTemporaria === "string" ? body.senhaTemporaria : "";
  if (senha.length < 8 || senha.length > 128) {
    return NextResponse.json({ erro: "A senha temporária precisa ter ao menos 8 caracteres." }, { status: 422 });
  }

  const [alvo] = await db.select({ id: usuarios.id, login: usuarios.login }).from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!alvo) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  await db.update(usuarios).set({
    senhaHash: await hashSenha(senha),
    deveTrocarSenha: true,
    tentativasFalhas: 0,
    bloqueadoAte: null,
    updatedAt: new Date(),
  }).where(eq(usuarios.id, id));

  // Sessões antigas deixam de valer (exceto a do próprio admin, se redefinir a si mesmo).
  await encerrarSessoesDoUsuario(id, id === auth.usuario.id ? auth.usuario.sessaoId : undefined);
  await registrarAuditoria({ usuario: auth.usuario, acao: "usuario.senha_redefinida", entidade: "usuario", entidadeId: id, detalhes: `@${alvo.login}`, req });

  return NextResponse.json({ ok: true });
});
