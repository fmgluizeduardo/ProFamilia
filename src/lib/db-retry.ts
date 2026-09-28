/**
 * Resiliência a falhas transitórias do banco.
 *
 * O Neon (plano gratuito) hiberna o banco após alguns minutos sem uso. A
 * primeira consulta depois disso precisa "acordar" o servidor e pode demorar
 * ou falhar. Sem tratamento, isso vira um erro genérico para o usuário.
 */

/** Códigos de erro que indicam problema de conexão, não de dados. */
const CODIGOS_TRANSITORIOS = new Set([
  "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EPIPE", "ENOTFOUND", "EAI_AGAIN",
  "08000", "08001", "08003", "08004", "08006", // classe 08: falha de conexão
  "57P01", "57P02", "57P03", // servidor encerrando / indisponível / iniciando
]);

const PADROES_TRANSITORIOS =
  /timeout|timed out|connection terminated|connection closed|connection reset|socket hang up|server closed|terminating connection|could not connect|endpoint is disabled|compute .*(start|suspend)|too many connections/i;

export function erroTransitorio(erro: unknown): boolean {
  if (!erro || typeof erro !== "object") return false;
  const e = erro as { code?: unknown; message?: unknown; cause?: unknown };
  if (typeof e.code === "string" && CODIGOS_TRANSITORIOS.has(e.code)) return true;
  if (typeof e.message === "string" && PADROES_TRANSITORIOS.test(e.message)) return true;
  return e.cause ? erroTransitorio(e.cause) : false;
}

/**
 * Executa a operação repetindo apenas em falhas de conexão (nunca em erros de
 * dados ou de permissão, que não melhoram com nova tentativa).
 */
export async function comRetentativa<T>(operacao: () => Promise<T>, tentativas = 3): Promise<T> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      return await operacao();
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa === tentativas || !erroTransitorio(erro)) throw erro;
      console.warn(`Banco indisponível (tentativa ${tentativa}/${tentativas}). Repetindo…`);
      await new Promise((r) => setTimeout(r, 500 * tentativa));
    }
  }
  throw ultimoErro;
}
