import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import {
  BLOQUEIO_MS,
  COOKIE_SESSAO,
  MAX_TENTATIVAS,
  criarSessao,
  garantirAdminInicial,
  opcoesCookie,
  registrarAuditoria,
} from "@/lib/auth";
import { obterHashFicticio, verificarSenha } from "@/lib/senha";

const ERRO_GENERICO = "Usuário ou senha inválidos.";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const login = typeof body.login === "string" ? body.login.trim().toLowerCase().slice(0, 64) : "";
  const senha = typeof body.senha === "string" ? body.senha.slice(0, 128) : "";
  // “Lembrar senha” significa manter a sessão neste aparelho; a senha nunca é guardada no navegador.
  const lembrar = body.lembrar === true;
  if (!login || !senha) {
    return NextResponse.json({ erro: "Informe usuário e senha." }, { status: 422 });
  }

  try {
    await garantirAdminInicial();

    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.login, login)).limit(1);

    if (!usuario) {
      // Mesmo custo de processamento para não revelar quais usuários existem.
      await verificarSenha(senha, await obterHashFicticio());
      await registrarAuditoria({ acao: "login.falha", detalhes: `Usuário inexistente: ${login}`, req });
      return NextResponse.json({ erro: ERRO_GENERICO }, { status: 401 });
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      const minutos = Math.ceil((usuario.bloqueadoAte.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { erro: `Acesso bloqueado por excesso de tentativas. Tente novamente em ${minutos} min ou peça ao administrador para desbloquear.` },
        { status: 429 },
      );
    }

    const confere = await verificarSenha(senha, usuario.senhaHash);

    if (!confere || !usuario.ativo) {
      if (confere && !usuario.ativo) {
        await registrarAuditoria({ usuario, acao: "login.falha", detalhes: "Usuário desativado", req });
        return NextResponse.json({ erro: "Este usuário está desativado. Fale com o administrador." }, { status: 403 });
      }
      const tentativas = usuario.tentativasFalhas + 1;
      const bloquear = tentativas >= MAX_TENTATIVAS;
      await db.update(usuarios).set({
        tentativasFalhas: bloquear ? 0 : tentativas,
        bloqueadoAte: bloquear ? new Date(Date.now() + BLOQUEIO_MS) : null,
      }).where(eq(usuarios.id, usuario.id));
      await registrarAuditoria({
        usuario, acao: bloquear ? "login.bloqueio" : "login.falha",
        detalhes: bloquear ? `Bloqueado por ${BLOQUEIO_MS / 60000} min após ${MAX_TENTATIVAS} tentativas` : `Tentativa ${tentativas}`,
        req,
      });
      return NextResponse.json(
        { erro: bloquear ? "Muitas tentativas incorretas. Acesso bloqueado por 15 minutos." : ERRO_GENERICO },
        { status: bloquear ? 429 : 401 },
      );
    }

    await db.update(usuarios).set({
      tentativasFalhas: 0,
      bloqueadoAte: null,
      ultimoAcesso: new Date(),
    }).where(eq(usuarios.id, usuario.id));

    const { token, expiraEm } = await criarSessao(usuario.id, req, lembrar);
    await registrarAuditoria({
      usuario, acao: "login.sucesso",
      detalhes: lembrar ? "Sessão estendida neste aparelho (30 dias)" : "Sessão até fechar o navegador (máx. 12h)",
      req,
    });

    const resposta = NextResponse.json({ ok: true, deveTrocarSenha: usuario.deveTrocarSenha });
    resposta.cookies.set(COOKIE_SESSAO, token, opcoesCookie(expiraEm, lembrar));
    return resposta;
  } catch (erro) {
    console.error("Erro no login:", erro);
    return NextResponse.json({ erro: "Não foi possível entrar agora. Tente novamente." }, { status: 500 });
  }
}
