"use client";

import { Printer } from "lucide-react";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-[0.8rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" />
      Imprimir / salvar PDF
    </button>
  );
}
