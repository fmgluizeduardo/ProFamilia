import crypto from "node:crypto";
import { db } from "@/db";
import { errosSistema } from "@/db/schema";
import { ipDaRequisicao, obterUsuarioAtual } from "@/lib/auth";
import {
  CODIGO_REGEX,
  codigoPorStatus,
  ehFalhaDoSistema,
  infoErro,
  type CodigoErro,
  type CorpoErro,
} from "@/lib/erros-catalogo";
import { fmtDataHora } from "@/lib/format";

/**
 * Tratamento padronizado de erros no servidor.
 *
 * Toda resposta de erro das APIs segue o formato
 *   { erro, codigo, titulo, referencia?, tecnico? }
 * - codigo: do catálogo (ex.: REL-001), sempre exibido ao usuário;
 * - referencia: identificador único da ocorrência (falhas do sistema), gravado
 *   com os detalhes técnicos na tabela `erros_sistema` e no log da hospedagem;
 * - tecnico: detalhe técnico, enviado somente a administradores.
 * Quando a URL é aberta diretamente no navegador, responde com uma página HTML
 * amigável em vez de JSON cru.
 */

const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sem 0/O e 1/I para não confundir

export function gerarReferencia(): string {
  let s = "";
  for (const b of crypto.randomBytes(8)) s += ALFABETO[b % ALFABETO.length];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/** Erro + causas encadeadas (o Drizzle embrulha o erro do PostgreSQL em `cause`). */
function cadeiaDeErros(erro: unknown): unknown[] {
  const lista: unknown[] = [];
  let atual: unknown = erro;
  while (atual && lista.length < 5 && !lista.includes(atual)) {
    lista.push(atual);
    atual = (atual as { cause?: unknown }).cause;
  }
  return lista;
}

function codigoDe(e: unknown): string {
  const c = (e as { code?: unknown } | null)?.code;
  return typeof c === "string" ? c : "";
}

function mensagemDe(e: unknown): string {
  return e instanceof Error ? e.message : String(e ?? "");
}

const CODIGOS_CONEXAO = new Set([
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "EPIPE",
  "EHOSTUNREACH", "ENETUNREACH", "57P01", "57P02", "57P03",
  "08000", "08001", "08003", "08004", "08006", "53300",
]);
const PADRAO_CONEXAO =
  /connection (terminated|refused|timeout|ended|error)|timeout exceeded when trying to connect|timed out|could not connect|too many (clients|connections)|getaddrinfo|socket hang up|server closed the connection|terminating connection|fetch failed/i;

/** Falha de rede/conexão com o banco (ex.: Neon retomando após inatividade). */
export function ehErroConexao(erro: unknown): boolean {
  return cadeiaDeErros(erro).some((e) => CODIGOS_CONEXAO.has(codigoDe(e)) || PADRAO_CONEXAO.test(mensagemDe(e)));
}

const CODIGOS_ESTRUTURA = new Set(["42P01", "42703", "42704", "42883"]);

/** Tabela/coluna inexistente: banco sem as migrações mais recentes. */
export function ehErroEstrutura(erro: unknown): boolean {
  return cadeiaDeErros(erro).some(
    (e) => CODIGOS_ESTRUTURA.has(codigoDe(e)) || /(relation|column) "?[\w.]+"? does not exist/i.test(mensagemDe(e)),
  );
}

/** Texto técnico legível com a cadeia de causas (SQL longa é resumida). */
export function descreverErro(erro: unknown): string {
  return cadeiaDeErros(erro)
    .map((e, i) => {
      const nome = e instanceof Error ? e.name : typeof e;
      const codigo = codigoDe(e);
      const msg = mensagemDe(e).replace(/\s+/g, " ").slice(0, 500);
      return `${i ? "causa → " : ""}${nome}: ${msg}${codigo ? ` [${codigo}]` : ""}`;
    })
    .join(" | ")
    .slice(0, 2000);
}

type UsuarioDoErro = { id: string; nome: string; login?: string; papel?: string } | null | undefined;

/** Registra a ocorrência no log da hospedagem e na tabela `erros_sistema`. */
export async function registrarErroSistema(dados: {
  codigo: string;
  referencia: string;
  erro: unknown;
  mensagem?: string;
  req?: Request;
  rota?: string;
  metodo?: string;
  usuario?: UsuarioDoErro;
  ip?: string | null;
  userAgent?: string | null;
  persistir?: boolean;
}): Promise<void> {
  const tecnico = descreverErro(dados.erro);
  const pilha = dados.erro instanceof Error ? (dados.erro.stack ?? "").slice(0, 6000) : null;
  let rota = dados.rota;
  let metodo = dados.metodo;
  if (dados.req) {
    try {
      const url = new URL(dados.req.url);
      rota ??= `${url.pathname}${url.search}`;
    } catch {
      /* URL inválida: segue sem rota */
    }
    metodo ??= dados.req.method;
  }

  console.error(
    `[PF-ERRO] ${dados.codigo} ref=${dados.referencia} ${metodo ?? "-"} ${rota ?? "-"} usuario=${dados.usuario?.login ?? "-"} :: ${tecnico}`,
    pilha ? `\n${pilha}` : "",
  );

  if (dados.persistir === false) return;
  try {
    await db.insert(errosSistema).values({
      referencia: dados.referencia,
      codigo: dados.codigo,
      mensagem: dados.mensagem?.slice(0, 500) ?? null,
      tecnico,
      pilha,
      rota: rota?.slice(0, 300) ?? null,
      metodo: metodo ?? null,
      usuarioId: dados.usuario?.id ?? null,
      usuarioNome: dados.usuario?.nome ?? null,
      ip: dados.ip ?? (dados.req ? ipDaRequisicao(dados.req) : null),
      userAgent: (dados.userAgent ?? dados.req?.headers.get("user-agent") ?? null)?.slice(0, 300) ?? null,
    });
  } catch (falha) {
    // Registrar o erro nunca pode gerar outro erro para o usuário.
    console.error(`[PF-ERRO] não foi possível gravar a ocorrência ref=${dados.referencia}:`, descreverErro(falha));
  }
}

/** A URL foi aberta diretamente no navegador (e não por uma chamada do sistema)? */
export function ehNavegacao(req: Request): boolean {
  if (req.method !== "GET") return false;
  const modo = req.headers.get("sec-fetch-mode");
  if (modo) return modo === "navigate";
  return (req.headers.get("accept") ?? "").includes("text/html");
}

export function respostaErro(req: Request, corpo: CorpoErro, status: number, cabecalhosBase?: HeadersInit): Response {
  const headers = new Headers(cabecalhosBase);
  headers.delete("content-length");
  headers.set("Cache-Control", "no-store");
  if (ehNavegacao(req)) {
    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(paginaErroHtml(corpo, req), { status, headers });
  }
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(corpo), { status, headers });
}

/** Erro previsto (validação, permissão, conflito, limite…) com código do catálogo. */
export function erroApi(req: Request, codigo: CodigoErro, mensagem?: string, extra?: Record<string, unknown>): Response {
  const info = infoErro(codigo);
  return respostaErro(req, { ...extra, erro: mensagem ?? info.titulo, codigo, titulo: info.titulo }, info.status);
}

/**
 * Falha inesperada: gera uma referência, registra os detalhes técnicos e
 * responde com mensagem amigável. Conexão com o banco vira BD-001 e tabela
 * inexistente vira BD-003, independentemente do código sugerido.
 */
export async function falhaInterna(
  req: Request,
  erro: unknown,
  opcoes: { codigo?: CodigoErro; mensagem?: string } = {},
): Promise<Response> {
  const conexao = ehErroConexao(erro);
  const codigo: CodigoErro = conexao ? "BD-001" : ehErroEstrutura(erro) ? "BD-003" : (opcoes.codigo ?? "SIS-001");
  const info = infoErro(codigo);
  const referencia = gerarReferencia();

  let usuario: Awaited<ReturnType<typeof obterUsuarioAtual>> = null;
  if (!conexao) {
    try {
      usuario = await obterUsuarioAtual();
    } catch {
      /* sem usuário identificado */
    }
  }

  const mensagem = conexao || codigo === "BD-003" ? info.titulo : (opcoes.mensagem ?? info.titulo);
  // Com o banco fora do ar, a ocorrência vai só para o log da hospedagem.
  await registrarErroSistema({ codigo, referencia, erro, mensagem, req, usuario, persistir: !conexao });

  return respostaErro(
    req,
    {
      erro: mensagem,
      codigo,
      titulo: info.titulo,
      referencia,
      // Detalhe técnico só para administradores: acelera o diagnóstico sem expor o sistema.
      ...(usuario?.papel === "admin" ? { tecnico: descreverErro(erro) } : {}),
    },
    info.status,
  );
}

/** Garante código, título e página amigável em qualquer resposta de erro. */
async function padronizarResposta(req: Request, res: Response): Promise<Response> {
  if (res.status < 400) return res;
  if (!(res.headers.get("content-type") ?? "").includes("application/json")) return res;
  let corpo: Record<string, unknown>;
  try {
    corpo = (await res.clone().json()) as Record<string, unknown>;
  } catch {
    return res;
  }
  const codigoAtual = typeof corpo.codigo === "string" && CODIGO_REGEX.test(corpo.codigo) ? corpo.codigo : null;
  if (codigoAtual && typeof corpo.titulo === "string" && !ehNavegacao(req)) return res;

  const codigo = codigoAtual ?? codigoPorStatus(res.status);
  const info = infoErro(codigo);
  const novo: CorpoErro = {
    ...corpo,
    erro: typeof corpo.erro === "string" && corpo.erro ? corpo.erro : info.titulo,
    codigo,
    titulo: typeof corpo.titulo === "string" ? corpo.titulo : info.titulo,
  };
  return respostaErro(req, novo, res.status, res.headers);
}

/**
 * Envolve um handler de rota da API: qualquer exceção não tratada vira uma
 * resposta amigável com código e referência, e todo erro sai padronizado.
 */
export function rota<A extends unknown[]>(handler: (req: Request, ...args: A) => Promise<Response>) {
  return async (req: Request, ...args: A): Promise<Response> => {
    let resposta: Response;
    try {
      resposta = await handler(req, ...args);
    } catch (erro) {
      // Controle de fluxo do Next.js (redirect/notFound) deve seguir adiante.
      const digest = (erro as { digest?: unknown } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_")) throw erro;
      return falhaInterna(req, erro);
    }
    return padronizarResposta(req, resposta);
  };
}

function escapar(valor: unknown): string {
  return String(valor ?? "").replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

/** Página HTML para quando a URL de uma API é aberta diretamente no navegador. */
export function paginaErroHtml(corpo: CorpoErro, req: Request): string {
  const info = infoErro(corpo.codigo);
  const quando = fmtDataHora(new Date());
  let caminho = "";
  try {
    caminho = new URL(req.url).pathname;
  } catch {
    /* sem caminho */
  }
  const voltar = caminho.startsWith("/api/gerencia") || caminho.startsWith("/api/atendimentos/export") ? "/gerencia" : "/";
  const grave = ehFalhaDoSistema(corpo.codigo);
  const detalhes = [
    "Instituto PróFamília — relatório de erro",
    `Código: ${corpo.codigo} (${corpo.titulo ?? info.titulo})`,
    corpo.referencia ? `Referência: ${corpo.referencia}` : "",
    `Mensagem: ${corpo.erro}`,
    `Quando: ${quando}`,
    caminho ? `Endereço: ${caminho}` : "",
    corpo.tecnico ? `Detalhe técnico: ${corpo.tecnico}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const acaoPrincipal =
    corpo.codigo === "AUT-001"
      ? `<a class="btn primario" href="/login">Entrar novamente</a>`
      : `<a class="btn primario" href="${voltar}">Voltar ao sistema</a>`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(corpo.titulo ?? info.titulo)} · Instituto PróFamília</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f6f4ef;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#16222f}
.card{width:100%;max-width:500px;background:#fff;border:1px solid #e3eaf3;border-radius:20px;padding:28px;box-shadow:0 18px 44px -16px rgba(22,34,47,.22)}
.marca{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#6e89ae;font-weight:700}.marca b{color:#16222f;letter-spacing:.04em}
.icone{margin-top:18px;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px}
.grave{background:#fde3e1;color:#b42318}.aviso{background:#fae4cc;color:#ad5017}
h1{font-size:20px;margin:14px 0 6px}.msg{margin:0;font-weight:600;color:#2a3d5b}.orientacao{color:#4b678f;font-size:14px;line-height:1.55}
.codigos{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}.etiqueta{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;border:1px solid #c5d2e3;border-radius:8px;padding:3px 8px;background:#fff;color:#375074}
.etiqueta.codigo{font-weight:800;color:${grave ? "#b42318" : "#ad5017"};border-color:${grave ? "#f5c2c0" : "#f5c694"}}
details{margin-top:12px;font-size:12px;color:#375074}summary{cursor:pointer;font-weight:700}pre{white-space:pre-wrap;word-break:break-word;background:#f3f6fa;border-radius:10px;padding:10px;font-size:11px}
.acoes{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.btn{flex:1;min-width:170px;text-align:center;border-radius:12px;padding:12px 16px;font-weight:700;font-size:14px;border:1px solid #c5d2e3;background:#fff;color:#1f2e45;text-decoration:none;cursor:pointer;font-family:inherit}
.primario{background:#16222f;color:#fff;border-color:#16222f}.rodape{margin-top:16px;font-size:12px;color:#6e89ae;line-height:1.5}.rodape a{color:#2d74b8}
</style>
</head>
<body>
<main class="card" role="alert">
<div class="marca">Instituto <b>PróFamília</b></div>
<div class="icone ${grave ? "grave" : "aviso"}">!</div>
<h1>${escapar(corpo.titulo ?? info.titulo)}</h1>
<p class="msg">${escapar(corpo.erro)}</p>
<p class="orientacao">${escapar(info.orientacao)}</p>
<div class="codigos">
<span class="etiqueta codigo">Código ${escapar(corpo.codigo)}</span>
${corpo.referencia ? `<span class="etiqueta">Referência ${escapar(corpo.referencia)}</span>` : ""}
<span class="etiqueta">${escapar(quando)}</span>
</div>
${corpo.tecnico ? `<details><summary>Detalhes técnicos (administrador)</summary><pre>${escapar(corpo.tecnico)}</pre></details>` : ""}
<div class="acoes">
${acaoPrincipal}
<button class="btn" id="copiar" type="button">Copiar detalhes do erro</button>
</div>
<p class="rodape">Ao pedir ajuda, informe o código${corpo.referencia ? " e a referência" : ""}. <a href="/manual#codigos-de-erro">O que significa este código?</a></p>
</main>
<textarea id="dados" hidden>${escapar(detalhes)}</textarea>
<script>
document.getElementById("copiar").addEventListener("click",function(){var t=document.getElementById("dados").value,b=this;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Detalhes copiados \\u2713"}).catch(function(){window.prompt("Copie os detalhes do erro:",t)})});
</script>
</body>
</html>`;
}
