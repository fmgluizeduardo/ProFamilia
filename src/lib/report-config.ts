/** Configuração compartilhada entre interface e servidor; não importa código de banco. */
export type Periodo = { de: string; ate: string };
export type TipoRelatorio = "completo" | "indicadores" | "fichas" | "veiculos";

/**
 * Limite de fichas nos PDFs nominais. Além do tempo de geração, a hospedagem
 * (Vercel) recusa respostas acima de 4,5 MB — com fichas e assinaturas, cerca
 * de 250 fichas é o máximo seguro. Para volumes maiores, use a planilha CSV.
 */
export const LIMITE_FICHAS_PDF = 250;

/** Tamanho máximo de arquivo devolvido (margem sob o limite de 4,5 MB da Vercel). */
export const LIMITE_BYTES_RESPOSTA = 4_200_000;

export const TIPOS_RELATORIO: Record<TipoRelatorio, { titulo: string; descricao: string }> = {
  completo: {
    titulo: "Relatório completo",
    descricao: "Indicadores, perfis, fichas integrais, evoluções e controle de veículo.",
  },
  indicadores: {
    titulo: "Indicadores e análise",
    descricao: "Panorama estatístico sem fichas nominais das pessoas atendidas; inclui dados operacionais da equipe.",
  },
  fichas: {
    titulo: "Prontuários e evoluções",
    descricao: "Cada ficha com todos os campos e o histórico completo de evoluções.",
  },
  veiculos: {
    titulo: "Controle de veículo",
    descricao: "Frota, deslocamentos, motoristas, quilômetros e percurso de cada saída.",
  },
};
