import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { and, count, eq, gt, gte, isNull, lt, or } from "drizzle-orm";
import { hojeISO } from "@/lib/format";
import { db } from "@/db";
import { auditoria, sessoes, usuarios } from "@/db/schema";
import { hashSenha } from "@/lib/senha";
import { temPermissao, type RequisitoAcesso } from "@/lib/permissoes";

export const COOKIE_SESSAO = "pf_sessao";
/** Sessão comum: termina ao fechar o navegador e expira no máximo em 12 horas. */
export const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000;
/** “Manter conectado”: apenas para aparelho pessoal, por até 30 dias. */
export const DURACAO_LEMBRAR_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MS = 15 * 60 * 1000;

export type UsuarioSessao = {
  id: string;
  nome: string;
  login: string;
  cargo: string | null;
  papel: "admin" | "usuario";
  permissoes: string[];
  deveTrocarSenha: boolean;
  sessaoId: string;
};

/** Dados do usuário seguros para enviar ao navegador. */
export type UsuarioPublico = Omit<UsuarioSessao, "sessaoId">;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Usuário da requisição atual (memorizado por requisição). */
export const obterUsuarioAtual = cache(async (): Promise<UsuarioSessao | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (!token || token.length > 128) return null;

  const [linha] = await db
    .select({
      sessaoId: sessoes.id,
      id: usuarios.id,
      nome: usuarios.nome,
      login: usuarios.login,
      cargo: usuarios.cargo,
      papel: usuarios.papel,
      permissoes: usuarios.permissoes,
      deveTrocarSenha: usuarios.deveTrocarSenha,
    })
    .from(sessoes)
    .innerJoin(usuarios, eq(sessoes.usuarioId, usuarios.id))
    .where(and(
      eq(sessoes.tokenHash, hashToken(token)),
      gt(sessoes.expiraEm, new Date()),
      eq(usuarios.ativo, true),
      // Acesso temporário: vale até o fim do dia informado (horário de Brasília).
      or(isNull(usuarios.acessoAte), gte(usuarios.acessoAte, hojeISO())),
    ))
    .limit(1);

  if (!linha) return null;
  return { ...linha, papel: linha.papel === "admin" ? "admin" : "usuario" };
});

export function paraPublico(u: UsuarioSessao): UsuarioPublico {
  return {
    id: u.id, nome: u.nome, login: u.login, cargo: u.cargo,
    papel: u.papel, permissoes: u.permissoes, deveTrocarSenha: u.deveTrocarSenha,
  };
}

/** Proteção de páginas: redireciona para login, troca de senha ou "sem acesso". */
export async function exigirUsuario(
  requisito?: RequisitoAcesso,
  opcoes: { permitirTrocaPendente?: boolean } = {},
): Promise<UsuarioSessao> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.deveTrocarSenha && !opcoes.permitirTrocaPendente) redirect("/trocar-senha");
  if (requisito && !temPermissao(usuario, requisito)) redirect("/sem-acesso");
  return usuario;
}

type ResultadoApi =
  | { ok: true; usuario: UsuarioSessao }
  | { ok: false; resposta: NextResponse };

function negar(status: number, erro: string, codigo: string): ResultadoApi {
  return { ok: false, resposta: NextResponse.json({ erro, codigo }, { status }) };
}

/** Bloqueia requisições de escrita vindas de outros sites (proteção CSRF). */
function origemConfiavel(req: Request): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origem = req.headers.get("origin");
  if (!origem) return true; // navegadores sempre enviam em requisições cross-site
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origem).host === host;
  } catch {
    return false;
  }
}

/** Proteção de rotas de API: 401 sem sessão, 403 sem permissão. */
export async function autorizarApi(
  req: Request,
  requisito?: RequisitoAcesso,
  opcoes: { permitirTrocaPendente?: boolean } = {},
): Promise<ResultadoApi> {
  if (!origemConfiavel(req)) return negar(403, "Origem da requisição não permitida.", "AUT-004");
  const usuario = await obterUsuarioAtual();
  if (!usuario) return negar(401, "Sua sessão expirou. Entre novamente.", "AUT-001");
  if (usuario.deveTrocarSenha && !opcoes.permitirTrocaPendente) {
    return negar(403, "Defina uma nova senha antes de continuar.", "AUT-002");
  }
  if (requisito && !temPermissao(usuario, requisito)) {
    return negar(403, "Você não tem permissão para esta ação. Fale com o administrador.", "AUT-003");
  }
  return { ok: true, usuario };
}

export function ipDaRequisicao(req: Request): string | null {
  const encaminhado = req.headers.get("x-forwarded-for");
  return (encaminhado?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null)?.slice(0, 64) ?? null;
}

export async function criarSessao(usuarioId: string, req: Request, lembrar = false) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + (lembrar ? DURACAO_LEMBRAR_MS : DURACAO_SESSAO_MS));
  await db.insert(sessoes).values({
    usuarioId,
    tokenHash: hashToken(token),
    expiraEm,
    ip: ipDaRequisicao(req),
    userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  });
  // Limpeza oportunista de sessões vencidas.
  await db.delete(sessoes).where(lt(sessoes.expiraEm, new Date()));
  return { token, expiraEm };
}

export function opcoesCookie(expiraEm: Date, lembrar = false) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // Sem “lembrar”, o cookie morre ao fechar o navegador; o banco ainda
    // limita a sessão a 12h. Com lembrar, persiste no aparelho por 30 dias.
    ...(lembrar ? { expires: expiraEm } : {}),
  };
}

export async function encerrarSessoesDoUsuario(usuarioId: string, excetoSessaoId?: string) {
  const sessoesUsuario = await db.select({ id: sessoes.id }).from(sessoes).where(eq(sessoes.usuarioId, usuarioId));
  for (const s of sessoesUsuario) {
    if (s.id !== excetoSessaoId) await db.delete(sessoes).where(eq(sessoes.id, s.id));
  }
}

/**
 * Primeiro acesso: se não houver nenhum usuário, cria o administrador padrão
 * (login "admin", senha "admin") com troca de senha obrigatória.
 */
export async function garantirAdminInicial(): Promise<void> {
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  if (total > 0) return;
  await db
    .insert(usuarios)
    .values({
      nome: "Administrador",
      login: "admin",
      cargo: "Administrador do sistema",
      senhaHash: await hashSenha("admin"),
      papel: "admin",
      permissoes: [],
      deveTrocarSenha: true,
    })
    .onConflictDoNothing({ target: usuarios.login });
}

export async function sistemaSemUsuarios(): Promise<boolean> {
  const [{ total }] = await db.select({ total: count() }).from(usuarios);
  return total === 0;
}

export async function registrarAuditoria(evento: {
  usuario?: { id: string; nome: string } | null;
  acao: string;
  entidade?: string;
  entidadeId?: string | number | null;
  detalhes?: string;
  req?: Request;
}) {
  try {
    let ip: string | null = null;
    if (evento.req) ip = ipDaRequisicao(evento.req);
    else {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    }
    await db.insert(auditoria).values({
      usuarioId: evento.usuario?.id ?? null,
      usuarioNome: evento.usuario?.nome ?? null,
      acao: evento.acao,
      entidade: evento.entidade ?? null,
      entidadeId: evento.entidadeId != null ? String(evento.entidadeId) : null,
      detalhes: evento.detalhes?.slice(0, 1000) ?? null,
      ip,
    });
  } catch (erro) {
    // A auditoria nunca deve impedir a operação principal.
    console.error("Falha ao registrar auditoria:", erro);
  }
}
