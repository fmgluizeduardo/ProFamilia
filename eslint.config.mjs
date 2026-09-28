import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  // fontes-pdf.ts é gerado automaticamente (fontes em base64) e não precisa de análise.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/lib/fontes-pdf.ts"]),
]);
