"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Copy, TriangleAlert, WifiOff, X } from "lucide-react";
import { paraErroApi, textoDoErro } from "@/lib/api-cliente";
import { ehFalhaDoSistema } from "@/lib/erros-catalogo";

/**
 * Aviso de erro padrão do sistema: título amigável, orientação, código do
 * catálogo, referência da ocorrência e botão para copiar os detalhes.
 * Aceita um ErroApi, qualquer exceção ou um texto simples (validação local).
 */
export function AvisoErro({
  erro,
  className = "",
  compacto = false,
  onFechar,
}: {
  erro: unknown;
  className?: string;
  compacto?: boolean;
  onFechar?: () => void;
}) {
  if (erro === null || erro === undefined || erro === false || erro === "") return null;
  if (typeof erro === "string") {
    return (
      <p
        role="alert"
        className={`rounded-xl border border-sun-300 bg-sun-50 px-3.5 py-2.5 text-[0.8rem] font-semibold text-sun-900 ${className}`}
      >
        {erro}
      </p>
    );
  }
  return <CartaoErro erro={erro} className={className} compacto={compacto} onFechar={onFechar} />;
}

function CartaoErro({
  erro,
  className,
  compacto,
  onFechar,
}: {
  erro: unknown;
  className: string;
  compacto: boolean;
  onFechar?: () => void;
}) {
  const e = useMemo(() => paraErroApi(erro), [erro]);
  const [copiado, setCopiado] = useState(false);
  const grave = ehFalhaDoSistema(e.codigo);
  const Icone = e.codigo === "SIS-002" ? WifiOff : TriangleAlert;
  const cor = grave
    ? { caixa: "border-red-200 bg-red-50", titulo: "text-red-800", texto: "text-red-700", icone: "bg-red-100 text-red-600", codigo: "border-red-200 text-red-700" }
    : { caixa: "border-sun-300 bg-sun-50", titulo: "text-sun-900", texto: "text-sun-800", icone: "bg-sun-100 text-sun-700", codigo: "border-sun-300 text-sun-800" };

  async function copiar() {
    const texto = textoDoErro(e);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie os detalhes do erro:", texto);
    }
  }

  return (
    <div role="alert" aria-live="assertive" className={`animate-pop rounded-xl border p-3.5 ${cor.caixa} ${className}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor.icone}`}>
          <Icone className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[0.86rem] font-bold leading-snug ${cor.titulo}`}>{e.titulo}</p>
          {e.message && e.message !== e.titulo && (
            <p className={`mt-0.5 text-[0.8rem] font-semibold leading-snug ${cor.texto}`}>{e.message}</p>
          )}
          {!compacto && <p className="mt-1 text-[0.76rem] leading-relaxed text-ink-600">{e.orientacao}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.7rem]">
            <span className={`rounded-md border bg-white px-1.5 py-0.5 font-mono font-bold ${cor.codigo}`}>
              Código {e.codigo}
            </span>
            {e.referencia && (
              <span className="rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-mono font-semibold text-ink-600">
                Ref. {e.referencia}
              </span>
            )}
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold text-ink-600 transition-colors hover:bg-white"
            >
              {copiado ? <Check className="h-3 w-3 text-leaf-600" /> : <Copy className="h-3 w-3" />}
              {copiado ? "Copiado" : "Copiar detalhes"}
            </button>
            {e.codigo === "AUT-001" ? (
              <Link href="/login" className="font-bold text-brand-700 hover:underline">
                Entrar novamente
              </Link>
            ) : (
              <Link href="/manual#codigos-de-erro" className="font-bold text-brand-700 hover:underline">
                O que significa?
              </Link>
            )}
          </div>
          {e.tecnico && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[0.7rem] font-bold text-ink-500">Detalhes técnicos</summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/80 p-2 font-mono text-[0.66rem] text-ink-700">
                {e.tecnico}
              </pre>
            </details>
          )}
        </div>
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar aviso"
            className="rounded-md p-1 text-ink-400 transition-colors hover:bg-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
