"use client";

import Link from "next/link";
import { useEffect } from "react";
import { House, RefreshCw, TriangleAlert } from "lucide-react";

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falha na aplicação:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-sun-200 bg-card p-7 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-sun-700">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-lg font-bold text-ink-900">
          Não foi possível carregar esta seção
        </h1>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-500">
          Ocorreu uma falha inesperada ao consultar os dados. Suas fichas salvas
          não foram afetadas. Verifique a conexão e tente novamente.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-lg bg-paper px-3 py-2 font-mono text-[0.68rem] text-ink-400">
            Código do erro: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.85rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[0.85rem] font-bold text-ink-700 transition-all hover:border-ink-300 active:scale-[0.98]"
          >
            <House className="h-4 w-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
