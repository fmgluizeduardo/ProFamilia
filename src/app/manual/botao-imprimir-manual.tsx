"use client";

import { Printer } from "lucide-react";

export function BotaoImprimirManual() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[0.8rem] font-bold text-ink-700 shadow-card transition-all hover:border-ink-300 active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" />
      Imprimir manual
    </button>
  );
}
