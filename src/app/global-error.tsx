"use client";

import "./globals.css";
import { TelaErro } from "@/components/tela-erro";

/** Falhas no layout raiz (ex.: banco indisponível ao ler a sessão). */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <TelaErro referencia={error.digest} onTentarNovamente={reset} />
      </body>
    </html>
  );
}
