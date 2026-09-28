/** Configuração compartilhada entre interface e servidor; não importa código de banco. */
export type Periodo = { de: string; ate: string };
export type TipoRelatorio = "completo" | "indicadores" | "fichas" | "veiculos";

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
    descricao: "Deslocamentos, motoristas, quilômetros e percurso de cada saída.",
  },
};
