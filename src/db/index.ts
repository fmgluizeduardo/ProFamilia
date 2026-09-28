import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não configurada. Crie um arquivo .env a partir do .env.example " +
      "(desenvolvimento) ou configure a variável na Vercel (produção).",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __profamiliaPool?: Pool;
};

/**
 * Pool único por instância, reaproveitado entre invocações mornas na Vercel.
 * Limite baixo de conexões: cada instância serverless abre o próprio pool e o
 * Neon gratuito tem teto de conexões — use a string "Pooled connection".
 */
export const pool =
  globalForDb.__profamiliaPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 20_000,
    // Neon suspende o banco ocioso; a primeira conexão (retomada) pode levar
    // vários segundos. Timeout generoso + 1 repetição nas leituras críticas.
    connectionTimeoutMillis: 25_000,
  });

// Erros em conexões ociosas não devem derrubar o processo.
pool.on("error", (erro) => console.error("Erro em conexão ociosa do pool:", erro));

globalForDb.__profamiliaPool = pool;

export const db = drizzle(pool);
