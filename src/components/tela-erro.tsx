"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, House, RefreshCw, TriangleAlert } from "lucide-react";
import { infoErro } from "@/lib/erros-catalogo";

/**
 * Tela de erro de página (error.tsx / global-error.tsx). A referência é o
 * "digest" do Next.js, o mesmo gravado em Usuários › Erros do sistema.
 */
export function TelaErro({
  referencia,
  onTentarNovamente,
  codigo = "SIS-005",
}: {
  referencia?: string;
  onTentarNovamente?: () => void;
  codigo?: string;
}) {
  const info = infoErro(codigo);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const texto = [
      "Instituto PróFamília — relatório de erro",
      `Código: ${info.codigo} (${info.titulo})`,
      referencia ? `Referência: ${referencia}` : "",
      `Quando: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
      `Página: ${window.location.pathname}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie os detalhes do erro:", texto);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div role="alert" className="w-full max-w-md rounded-2xl border border-red-200 bg-card p-7 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-lg font-bold text-ink-900">{info.titulo}</h1>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-500">
          Ocorreu uma falha ao carregar esta tela. As informações já salvas não foram afetadas.
        </p>
        <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-500">{info.orientacao}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[0.72rem]">
          <span className="rounded-md border border-red-200 bg-white px-2 py-0.5 font-mono font-bold text-red-700">
            Código {info.codigo}
          </span>
          {referencia && (
            <span className="rounded-md border border-ink-200 bg-white px-2 py-0.5 font-mono font-semibold text-ink-600">
              Ref. {referencia}
            </span>
          )}
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold text-ink-600 transition-colors hover:bg-ink-50"
          >
            {copiado ? <Check className="h-3 w-3 text-leaf-600" /> : <Copy className="h-3 w-3" />}
            {copiado ? "Copiado" : "Copiar detalhes"}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          {onTentarNovamente && (
            <button
              type="button"
              onClick={onTentarNovamente}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.85rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          )}
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[0.85rem] font-bold text-ink-700 transition-all hover:border-ink-300 active:scale-[0.98]"
          >
            <House className="h-4 w-4" />
            Início
          </Link>
        </div>
        <p className="mt-4 text-[0.7rem] text-ink-400">
          Ao pedir ajuda, informe o código e a referência.{" "}
          <Link href="/manual#codigos-de-erro" className="font-bold text-brand-700 hover:underline">
            O que significa?
          </Link>
        </p>
      </div>
    </div>
  );
}
