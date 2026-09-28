import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { normalizarPermissoes, type Papel } from "@/lib/permissoes";
import { dataReal } from "@/lib/validacoes";

export const LIMITE_NOME = 120;

/**
 * Validade do acesso (contas temporárias). Vazio = sem prazo; data inválida = false.
 * Administradores nunca expiram (evita trancar o sistema sem administrador).
 */
export function lerValidade(valor: unknown): string | null | false {
  if (valor === undefined || valor === null || valor === "") return null;
  return dataReal(valor) ? valor : false;
}

export function papelValido(v: unknown): Papel | null {
  return v === "admin" || v === "usuario" ? v : null;
}

/** Quantos administradores ativos existem além do usuário informado. */
export async function outrosAdminsAtivos(excetoId: string): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(usuarios)
    .where(and(eq(usuarios.papel, "admin"), eq(usuarios.ativo, true), ne(usuarios.id, excetoId)));
  return total;
}

/** Admin tem acesso total implícito; guardamos a lista vazia para evitar ambiguidade. */
export function permissoesParaPapel(papel: Papel, lista: unknown): string[] {
  return papel === "admin" ? [] : normalizarPermissoes(lista);
}

export function descreverMudancas(antes: Record<string, unknown>, depois: Record<string, unknown>): string {
  const partes: string[] = [];
  for (const chave of Object.keys(depois)) {
    const a = JSON.stringify(antes[chave] ?? null);
    const d = JSON.stringify(depois[chave] ?? null);
    if (a !== d) partes.push(`${chave}: ${a} → ${d}`);
  }
  return partes.join(" · ") || "Sem alterações";
}
