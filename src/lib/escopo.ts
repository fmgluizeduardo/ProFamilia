import { eq, type SQL } from "drizzle-orm";
import { atendimentos } from "@/db/schema";
import { temPermissao, type SujeitoPermissao } from "@/lib/permissoes";

/**
 * Escopo de acesso às fichas:
 * - com "fichas.ver_todas" (ou admin): todas as fichas da equipe;
 * - sem ela: somente as fichas que o próprio usuário cadastrou.
 * Aplicado em listas, detalhes, impressão, edição, exclusão e evoluções.
 */
type Sujeito = SujeitoPermissao & { id: string };

export function veTodasAsFichas(usuario: Sujeito): boolean {
  return temPermissao(usuario, "fichas.ver_todas");
}

/** Condição SQL para restringir consultas de fichas ao escopo do usuário. */
export function filtroEscopoFichas(usuario: Sujeito): SQL | undefined {
  return veTodasAsFichas(usuario) ? undefined : eq(atendimentos.criadoPorId, usuario.id);
}

/** Verifica se uma ficha específica está no escopo do usuário. */
export function fichaNoEscopo(usuario: Sujeito, ficha: { criadoPorId: string | null }): boolean {
  return veTodasAsFichas(usuario) || ficha.criadoPorId === usuario.id;
}
