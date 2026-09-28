import { CODIGO_REGEX, codigoPorStatus, infoErro, type CorpoErro } from "@/lib/erros-catalogo";

/**
 * Cliente das APIs do sistema (uso no navegador). Toda falha vira um ErroApi
 * com código do catálogo, referência (quando houver) e orientação ao usuário.
 */
export class ErroApi extends Error {
  readonly codigo: string;
  readonly titulo: string;
  readonly orientacao: string;
  readonly status: number;
  readonly referencia?: string;
  readonly tecnico?: string;
  readonly quando: Date;

  constructor(dados: {
    codigo: string;
    mensagem?: string;
    status: number;
    titulo?: string;
    referencia?: string;
    tecnico?: string;
  }) {
    const info = infoErro(dados.codigo);
    super(dados.mensagem?.trim() || info.titulo);
    this.name = "ErroApi";
    this.codigo = CODIGO_REGEX.test(dados.codigo) ? dados.codigo : info.codigo;
    this.titulo = dados.titulo?.trim() || info.titulo;
    this.orientacao = info.orientacao;
    this.status = dados.status;
    this.referencia = dados.referencia;
    this.tecnico = dados.tecnico;
    this.quando = new Date();
  }
}

/** Converte uma resposta de erro (JSON do sistema ou página da hospedagem) em ErroApi. */
export async function erroDaResposta(res: Response): Promise<ErroApi> {
  const erroHospedagem = res.headers.get("x-vercel-error") ?? undefined;
  const idHospedagem = res.headers.get("x-vercel-id") ?? undefined;

  if ((res.headers.get("content-type") ?? "").includes("application/json")) {
    try {
      const corpo = (await res.json()) as Partial<CorpoErro> | null;
      if (corpo && typeof corpo.erro === "string") {
        return new ErroApi({
          codigo:
            typeof corpo.codigo === "string" && CODIGO_REGEX.test(corpo.codigo)
              ? corpo.codigo
              : codigoPorStatus(res.status),
          mensagem: corpo.erro,
          status: res.status,
          titulo: typeof corpo.titulo === "string" ? corpo.titulo : undefined,
          referencia: typeof corpo.referencia === "string" ? corpo.referencia : undefined,
          tecnico: typeof corpo.tecnico === "string" ? corpo.tecnico : undefined,
        });
      }
    } catch {
      /* corpo ilegível: tratado abaixo */
    }
  }

  // Resposta fora do padrão (ex.: tempo limite ou limite de tamanho da hospedagem).
  const codigo =
    res.status === 504 || erroHospedagem?.includes("TIMEOUT")
      ? "SIS-004"
      : res.status === 413 || erroHospedagem?.includes("PAYLOAD_TOO_LARGE")
        ? "REL-002"
        : "SIS-003";
  return new ErroApi({
    codigo,
    status: res.status,
    referencia: idHospedagem,
    tecnico: `HTTP ${res.status}${erroHospedagem ? ` · ${erroHospedagem}` : ""}`,
  });
}

function erroDeRede(e: unknown): ErroApi {
  return new ErroApi({ codigo: "SIS-002", status: 0, tecnico: e instanceof Error ? e.message : String(e) });
}

/** Chama uma API JSON do sistema. Lança ErroApi em qualquer falha. */
export async function chamarApi<T = Record<string, unknown>>(
  url: string,
  opcoes: { method?: string; json?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opcoes.method ?? (opcoes.json !== undefined ? "POST" : "GET"),
      headers: opcoes.json !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: opcoes.json !== undefined ? JSON.stringify(opcoes.json) : undefined,
      signal: opcoes.signal,
    });
  } catch (e) {
    throw erroDeRede(e);
  }
  if (!res.ok) throw await erroDaResposta(res);
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

/** Baixa um arquivo (PDF/CSV) tratando erros no mesmo padrão. */
export async function baixarArquivo(url: string, nomePadrao: string): Promise<{ blob: Blob; nome: string }> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw erroDeRede(e);
  }
  if (!res.ok) throw await erroDaResposta(res);
  const blob = await res.blob();
  if (!blob.size) {
    throw new ErroApi({ codigo: "SIS-003", mensagem: "O arquivo recebido está vazio.", status: res.status });
  }
  const nome = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? nomePadrao;
  return { blob, nome };
}

/** Qualquer erro capturado → ErroApi (erros de programação viram SIS-001). */
export function paraErroApi(erro: unknown): ErroApi {
  if (erro instanceof ErroApi) return erro;
  return new ErroApi({
    codigo: "SIS-001",
    status: 0,
    tecnico: erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro),
  });
}

/** Texto para o botão “Copiar detalhes”, pronto para enviar ao administrador. */
export function textoDoErro(erro: ErroApi): string {
  const quando = erro.quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const pagina = typeof window !== "undefined" ? window.location.pathname : "";
  return [
    "Instituto PróFamília — relatório de erro",
    `Código: ${erro.codigo} (${erro.titulo})`,
    erro.referencia ? `Referência: ${erro.referencia}` : "",
    `Mensagem: ${erro.message}`,
    `Quando: ${quando}`,
    pagina ? `Página: ${pagina}` : "",
    erro.tecnico ? `Detalhe técnico: ${erro.tecnico}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
