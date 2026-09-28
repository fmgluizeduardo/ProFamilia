import type { Instrumentation } from "next";

/**
 * Registra falhas de páginas (renderização) em `erros_sistema`, usando o
 * "digest" do Next.js como referência — o mesmo exibido na tela de erro.
 * Rotas de API já registram suas falhas pelo wrapper `rota`.
 */
export const onRequestError: Instrumentation.onRequestError = async (erro, requisicao, contexto) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (contexto.routeType === "route") return;
  const digest = (erro as { digest?: unknown } | null)?.digest;
  const referencia = typeof digest === "string" ? digest : undefined;
  if (referencia?.startsWith("NEXT_")) return;

  try {
    const { registrarErroSistema } = await import("@/lib/erros-servidor");
    const cabecalho = (nome: string) => {
      const valor = requisicao.headers[nome];
      return (Array.isArray(valor) ? valor[0] : valor) ?? null;
    };
    await registrarErroSistema({
      codigo: "SIS-005",
      referencia: referencia ?? "sem-referencia",
      erro,
      mensagem: `Erro ao exibir ${contexto.routePath}`,
      rota: requisicao.path,
      metodo: requisicao.method,
      ip: cabecalho("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: cabecalho("user-agent"),
    });
  } catch {
    /* o registro nunca pode propagar erro */
  }
};
