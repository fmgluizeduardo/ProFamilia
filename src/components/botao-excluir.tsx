"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";

/**
 * Exclusão com confirmação explícita em modal. Usado em fichas, evoluções e
 * lançamentos de veículo — sempre protegido também no servidor por permissão.
 */
export function BotaoExcluir({
  url,
  titulo,
  descricao,
  rotulo = "Excluir",
  redirecionarPara,
  compacto = false,
}: {
  url: string;
  titulo: string;
  descricao: string;
  rotulo?: string;
  redirecionarPara?: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !enviando && setAberto(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto, enviando]);

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.erro ?? "Não foi possível excluir.");
      setAberto(false);
      if (redirecionarPara) router.push(redirecionarPara);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
    setEnviando(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setErro(null); setAberto(true); }}
        className={compacto
          ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-bold text-red-600 transition-colors hover:bg-red-50"
          : "inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[0.8rem] font-bold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98]"}
        aria-label={rotulo}
      >
        <Trash2 className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {!compacto || rotulo !== "Excluir" ? <span className={compacto ? "" : "hidden sm:inline"}>{rotulo}</span> : null}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/50 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="titulo-excluir"
          onClick={(e) => { if (e.target === e.currentTarget && !enviando) setAberto(false); }}>
          <div className="animate-pop w-full max-w-md rounded-2xl bg-card p-6 shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <TriangleAlert className="h-5.5 w-5.5" />
            </span>
            <h2 id="titulo-excluir" className="font-display mt-3 text-lg font-bold text-ink-900">{titulo}</h2>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-600">{descricao}</p>
            <p className="mt-2 text-[0.76rem] font-semibold text-red-600">Esta ação não pode ser desfeita e ficará registrada na auditoria.</p>
            {erro && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-semibold text-red-700">{erro}</p>}
            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row">
              <button type="button" disabled={enviando} onClick={() => setAberto(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-white text-[0.84rem] font-bold text-ink-700 hover:border-ink-300">
                Cancelar
              </button>
              <button type="button" disabled={enviando} onClick={confirmar}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-[0.84rem] font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
