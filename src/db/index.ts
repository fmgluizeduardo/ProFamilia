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
    // O Neon gratuito hiberna quando fica sem uso; acordar pode levar vários
    // segundos, então a espera por conexão precisa ser generosa.
    connectionTimeoutMillis: 25_000,
    keepAlive: true,
  });

// Um erro de conexão ocioso não pode derrubar o servidor: as rotas já tratam
// falhas de banco e fazem nova tentativa quando o erro é transitório.
pool.on("error", (erro) => {
  console.error("Conexão ociosa com o banco falhou:", erro.message);
});

globalForDb.__profamiliaPool = pool;

export const db = drizzle(pool);
