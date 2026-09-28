import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { autorizarApi, encerrarSessoesDoUsuario, registrarAuditoria } from "@/lib/auth";
import { senhaForte } from "@/lib/permissoes";
import { hashSenha, verificarSenha } from "@/lib/senha";

export async function POST(req: Request) {
  const auth = await autorizarApi(req, undefined, { permitirTrocaPendente: true });
  if (!auth.ok) return auth.resposta;
  const { usuario } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  const atual = typeof body.senhaAtual === "string" ? body.senhaAtual : "";
  const nova = typeof body.novaSenha === "string" ? body.novaSenha : "";

  const [registro] = await db.select().from(usuarios).where(eq(usuarios.id, usuario.id)).limit(1);
  if (!registro || !(await verificarSenha(atual, registro.senhaHash))) {
    return NextResponse.json({ erro: "A senha atual não confere." }, { status: 422 });
  }
  if (!senhaForte(nova, registro.login)) {
    return NextResponse.json(
      { erro: "A nova senha precisa ter ao menos 8 caracteres, letras e números, e ser diferente do usuário e de “admin”." },
      { status: 422 },
    );
  }
  if (await verificarSenha(nova, registro.senhaHash)) {
    return NextResponse.json({ erro: "A nova senha deve ser diferente da atual." }, { status: 422 });
  }

  await db.update(usuarios).set({
    senhaHash: await hashSenha(nova),
    deveTrocarSenha: false,
    senhaAlteradaEm: new Date(),
    updatedAt: new Date(),
  }).where(eq(usuarios.id, usuario.id));

  // Outras sessões abertas (outros aparelhos) são encerradas por segurança.
  await encerrarSessoesDoUsuario(usuario.id, usuario.sessaoId);
  await registrarAuditoria({ usuario, acao: "senha.alterada", entidade: "usuario", entidadeId: usuario.id, req });

  return NextResponse.json({ ok: true });
}
