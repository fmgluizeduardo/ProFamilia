import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que as fontes TTF do relatório PDF acompanhem a função
  // serverless na Vercel (o rastreador de arquivos não detecta sozinho
  // leituras dinâmicas via fs).
  outputFileTracingIncludes: {
    "/api/gerencia/relatorio": ["./assets/fonts/*.ttf"],
  },
};

export default nextConfig;
