import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Configuração do Drizzle Kit lendo a DATABASE_URL do ambiente.
 * - Desenvolvimento: vem do .env local (PostgreSQL local).
 * - Deploy: rode os comandos com a DATABASE_URL do Neon exportada —
 *   veja docs/guia-deploy-neon-vercel.md.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
