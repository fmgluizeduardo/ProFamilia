import { NextResponse } from "next/server";
import { erroTransitorio } from "@/lib/db-retry";

/**
 * Erros de relatórios podem ser abertos diretamente numa aba do navegador
 * ("Abrir para imprimir"). Nesse caso devolvemos uma página legível em vez de
 * JSON cru; para chamadas da aplicação, mantemos o JSON.
 */
function pagina(mensagem: string, detalhe: string, status: number): string {
  const esc = (t: string) => t.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] as string));
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório não gerado · Instituto PróFamília</title>
<style>
  :root { color-scheme: light }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px;
         background:#f6f4ef; color:#16222f;
         font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif }
  .cartao { max-width:520px; width:100%; background:#fff; border:1px solid #e3eaf3;
            border-radius:18px; padding:28px; box-shadow:0 18px 44px -16px rgba(22,34,47,.22) }
  .aviso { width:44px; height:44px; border-radius:14px; background:#fdf4ea; color:#ad5017;
           display:grid; place-items:center; font-size:22px }
  h1 { font-size:1.15rem; margin:16px 0 8px }
  p { margin:0 0 10px; font-size:.93rem; line-height:1.6; color:#375074 }
  .detalhe { font-size:.8rem; color:#6e89ae; background:#f3f6fa; border-radius:10px; padding:10px 12px }
  .acoes { display:flex; gap:10px; flex-wrap:wrap; margin-top:20px }
  a, button { font:inherit; font-weight:700; font-size:.87rem; border-radius:12px; padding:12px 18px;
              text-decoration:none; cursor:pointer; border:1px solid #c5d2e3; background:#fff; color:#2a3d5b }
  .primario { background:#16222f; color:#fff; border-color:#16222f }
</style></head>
<body><div class="cartao">
  <div class="aviso">!</div>
  <h1>${esc(mensagem)}</h1>
  <p>${esc(detalhe)}</p>
  <p class="detalhe">Se o problema continuar, informe este código ao suporte: <strong>${status}</strong></p>
  <div class="acoes">
    <button class="primario" onclick="location.reload()">Tentar novamente</button>
    <a href="/gerencia">Voltar à Gerência</a>
  </div>
</div></body></html>`;
}

/** Devolve HTML para navegação do navegador e JSON para chamadas da aplicação. */
export function respostaErro(
  req: Request,
  status: number,
  mensagem: string,
  detalhe: string,
  codigo: string,
): NextResponse {
  const aceita = req.headers.get("accept") ?? "";
  const navegando = aceita.includes("text/html");
  if (!navegando) {
    const pontuado = /[.!?]$/.test(mensagem) ? mensagem : `${mensagem}.`;
    return NextResponse.json({ erro: `${pontuado} ${detalhe}`.trim(), codigo }, { status });
  }
  return new NextResponse(pagina(mensagem, detalhe, status), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Traduz a exceção em mensagem útil, distinguindo banco de falha de geração. */
export function classificarFalha(erro: unknown): {
  status: number;
  mensagem: string;
  detalhe: string;
  codigo: string;
} {
  if (erroTransitorio(erro)) {
    return {
      status: 503,
      mensagem: "O banco de dados não respondeu a tempo",
      detalhe:
        "O servidor do banco hiberna quando fica sem uso e leva alguns segundos para acordar. Aguarde um instante e tente novamente.",
      codigo: "BANCO_INDISPONIVEL",
    };
  }
  if (erro instanceof Error && /fontes do relatório/i.test(erro.message)) {
    return {
      status: 500,
      mensagem: "Falha ao carregar as fontes do relatório",
      detalhe: "Os arquivos de fonte usados no PDF não foram encontrados no servidor. Avise o responsável técnico.",
      codigo: "FONTES",
    };
  }
  return {
    status: 500,
    mensagem: "Não foi possível gerar o relatório",
    detalhe: "Ocorreu uma falha inesperada ao montar o documento. Tente novamente; se persistir, avise o responsável técnico.",
    codigo: "GERACAO",
  };
}
