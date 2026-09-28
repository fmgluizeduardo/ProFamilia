import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { autorizarApi, encerrarSessoesDoUsuario, registrarAuditoria } from "@/lib/auth";
import {
  LIMITE_NOME,
  descreverMudancas,
  lerValidade,
  outrosAdminsAtivos,
  papelValido,
  permissoesParaPapel,
} from "@/lib/usuarios-admin";
import { texto, uuidValido } from "@/lib/validacoes";

/** Atualiza dados, papel, permissões, status ou desbloqueia o usuário. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autorizarApi(req, "admin");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  const [alvo] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (!alvo) return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const ehProprio = alvo.id === auth.usuario.id;

  // Ação isolada: encerrar as sessões abertas (ex.: aparelho perdido ou compartilhado).
  if (body.acao === "encerrar_sessoes") {
    await encerrarSessoesDoUsuario(id, ehProprio ? auth.usuario.sessaoId : undefined);
    await registrarAuditoria({
      usuario: auth.usuario, acao: "usuario.sessoes_encerradas", entidade: "usuario", entidadeId: id,
      detalhes: `@${alvo.login}${ehProprio ? " (exceto a sessão atual)" : ""}`, req,
    });
    return NextResponse.json({ ok: true });
  }

  // Ação isolada: desbloquear após tentativas excessivas.
  if (body.acao === "desbloquear") {
    await db.update(usuarios).set({ tentativasFalhas: 0, bloqueadoAte: null, updatedAt: new Date() }).where(eq(usuarios.id, id));
    await registrarAuditoria({ usuario: auth.usuario, acao: "usuario.desbloqueado", entidade: "usuario", entidadeId: id, detalhes: `@${alvo.login}`, req });
    return NextResponse.json({ ok: true });
  }

  const nome = body.nome !== undefined ? texto(body.nome, LIMITE_NOME) : alvo.nome;
  if (!nome) return NextResponse.json({ erro: "Informe o nome completo." }, { status: 422 });
  const cargo = body.cargo !== undefined ? texto(body.cargo, 120) : alvo.cargo;
  const papel = body.papel !== undefined ? papelValido(body.papel) : (alvo.papel as "admin" | "usuario");
  if (!papel) return NextResponse.json({ erro: "Papel inválido." }, { status: 422 });
  const ativo = typeof body.ativo === "boolean" ? body.ativo : alvo.ativo;
  const validade = body.acessoAte !== undefined ? lerValidade(body.acessoAte) : alvo.acessoAte;
  if (validade === false) return NextResponse.json({ erro: "Data de validade do acesso inválida." }, { status: 422 });
  // Administradores não expiram: evita que o sistema fique sem quem o administre.
  const acessoAte = papel === "admin" ? null : validade;
  const permissoes = body.permissoes !== undefined || papel !== alvo.papel
    ? permissoesParaPapel(papel, body.permissoes ?? alvo.permissoes)
    : alvo.permissoes;

  // ——— Salvaguardas ———
  if (ehProprio && !ativo) {
    return NextResponse.json({ erro: "Você não pode desativar o seu próprio usuário." }, { status: 422 });
  }
  if (ehProprio && papel !== "admin") {
    return NextResponse.json({ erro: "Você não pode remover o seu próprio papel de administrador." }, { status: 422 });
  }
  const perdeAdmin = alvo.papel === "admin" && alvo.ativo && (papel !== "admin" || !ativo);
  if (perdeAdmin && (await outrosAdminsAtivos(alvo.id)) === 0) {
    return NextResponse.json({ erro: "O sistema precisa ter pelo menos um administrador ativo." }, { status: 422 });
  }
  if (papel === "usuario" && permissoes.length === 0 && ativo) {
    return NextResponse.json({ erro: "Selecione ao menos uma permissão para usuários ativos." }, { status: 422 });
  }

  const antes = { nome: alvo.nome, cargo: alvo.cargo, papel: alvo.papel, ativo: alvo.ativo, permissoes: alvo.permissoes, acessoAte: alvo.acessoAte };
  const depois = { nome, cargo, papel, ativo, permissoes, acessoAte };

  await db.update(usuarios).set({ ...depois, updatedAt: new Date() }).where(eq(usuarios.id, id));

  // Usuário desativado perde o acesso imediatamente, em todos os aparelhos.
  if (alvo.ativo && !ativo) await encerrarSessoesDoUsuario(id);

  await registrarAuditoria({
    usuario: auth.usuario,
    acao: alvo.ativo && !ativo ? "usuario.desativado" : !alvo.ativo && ativo ? "usuario.reativado" : "usuario.editado",
    entidade: "usuario", entidadeId: id,
    detalhes: `@${alvo.login} · ${descreverMudancas(antes, depois)}`,
    req,
  });

  return NextResponse.json({ ok: true });
}
