/** Utilitários de frota — seguros para cliente e servidor (sem banco). */

/** Remove separadores e padroniza em maiúsculas: "dmn-4326" → "DMN4326". */
export function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

/** Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23). */
export function placaValida(placa: string): boolean {
  return /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(placa);
}

/** Exibição: antigo "DMN-4326"; Mercosul "ABC1D23" (sem hífen, como na placa). */
export function formatarPlaca(placa: string): string {
  return /^[A-Z]{3}\d{4}$/.test(placa) ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}

/** Rótulo gravado nos percursos e usado nos relatórios: "Kombi · DMN-4326". */
export function rotuloVeiculo(v: { modelo: string; placa: string }): string {
  return `${v.modelo} · ${formatarPlaca(v.placa)}`;
}

export const ANO_MINIMO = 1950;
