"use client";

import { useEffect } from "react";
import { TelaErro } from "@/components/tela-erro";

export default function ErroDePagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falha ao exibir a página:", error);
  }, [error]);

  return <TelaErro referencia={error.digest} onTentarNovamente={reset} />;
}
