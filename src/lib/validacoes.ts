/**
 * Validações compartilhadas pelas rotas de API.
 * Centralizadas para que nenhuma rota aceite dados que o PostgreSQL rejeitará
 * (o que transformaria um erro do usuário em falha interna 500).
 */

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Formato e existência real da data (rejeita 2026-13-45 e 2026-02-31). */
export function dataReal(valor: unknown): valor is string {
  if (typeof valor !== "string" || !RE_ISO.test(valor)) return false;
  const data = new Date(`${valor}T12:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

/** HH:MM de 00:00 a 23:59. */
export function horaReal(valor: unknown): valor is string {
  if (typeof valor !== "string" || !/^\d{2}:\d{2}$/.test(valor)) return false;
  const [h, m] = valor.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** Evita que um identificador malformado chegue ao banco como erro interno. */
export function uuidValido(valor: string | undefined | null): valor is string {
  return typeof valor === "string" && RE_UUID.test(valor);
}

/** Corta e normaliza texto livre, convertendo vazio em null. */
export function texto(
  valor: unknown,
  maximo = 500,
): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, maximo) : null;
}

/** Quilometragem plausível de um veículo utilitário. */
export function kmValido(valor: unknown): valor is number {
  return Number.isInteger(valor) && (valor as number) >= 0 && (valor as number) <= 2_000_000;
}
