"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleUserRound, Loader2, SendHorizonal } from "lucide-react";
import { chamarApi } from "@/lib/api-cliente";
import { AvisoErro } from "@/components/aviso-erro";

export function EvolucaoForm({ atendimentoId, autor }: { atendimentoId: string; autor: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  async function enviar() {
    if (!texto.trim()) {
      setErro("Descreva a evolução antes de registrar.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await chamarApi(`/api/atendimentos/${atendimentoId}/evolucoes`, { json: { texto: texto.trim() } });
      setTexto("");
      router.refresh();
    } catch (e) {
      setErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card">
      <label htmlFor="nova-evolucao" className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500">
        Nova evolução
      </label>
      <textarea
        id="nova-evolucao"
        value={texto}
        maxLength={8000}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Descreva o que ocorreu, contatos realizados, providências e próximos passos…"
        className="min-h-28 w-full rounded-xl border border-ink-200/90 bg-white px-4 py-3 text-[0.92rem] font-medium leading-relaxed text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
      <p className="mt-2 flex items-center gap-1.5 text-[0.74rem] text-ink-500">
        <CircleUserRound className="h-3.5 w-3.5" />
        Será registrada em nome de <strong className="text-ink-700">{autor}</strong>, com data e hora automáticas.
      </p>
      {erro ? <AvisoErro erro={erro} className="mt-3" /> : null}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.88rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        Registrar evolução
      </button>
    </div>
  );
}
