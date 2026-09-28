"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Monitor, Smartphone } from "lucide-react";

export type SessaoResumo = {
  id: string;
  criadaEm: string; // já formatada
  expiraEm: string; // já formatada
  ip: string | null;
  userAgent: string | null;
  atual: boolean;
};

/** Descrição amigável do aparelho a partir do user-agent. */
function descreverAparelho(ua: string | null): { texto: string; movel: boolean } {
  if (!ua) return { texto: "Aparelho não identificado", movel: false };
  const movel = /Android|iPhone|iPad|Mobile/i.test(ua);
  const sistema = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iPhone/iPad"
    : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Outro sistema";
  const navegador = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /curl/i.test(ua) ? "Script" : "Navegador";
  return { texto: `${navegador} · ${sistema}`, movel };
}

export function SessoesLista({
  sessoes,
  acao,
  rotuloBotao,
}: {
  sessoes: SessaoResumo[];
  /** Requisição que encerra as sessões (a atual é sempre preservada pelo servidor). */
  acao: { url: string; metodo: "POST" | "PATCH"; corpo: Record<string, unknown> };
  rotuloBotao: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const outras = sessoes.filter((s) => !s.atual).length;

  async function encerrar() {
    if (!confirm("Encerrar as sessões abertas? Os aparelhos precisarão entrar novamente.")) return;
    setEnviando(true);
    setMsg(null);
    try {
      const res = await fetch(acao.url, {
        method: acao.metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acao.corpo),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.erro ?? "Não foi possível encerrar.");
      setMsg("Sessões encerradas.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não foi possível encerrar.");
    }
    setEnviando(false);
  }

  return (
    <div>
      {sessoes.length === 0 ? (
        <p className="text-[0.8rem] text-ink-400">Nenhuma sessão ativa no momento.</p>
      ) : (
        <ul className="divide-y divide-ink-50">
          {sessoes.map((s) => {
            const aparelho = descreverAparelho(s.userAgent);
            const Icone = aparelho.movel ? Smartphone : Monitor;
            return (
              <li key={s.id} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                  <Icone className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] font-bold text-ink-800">
                    {aparelho.texto}
                    {s.atual && <span className="ml-2 rounded bg-leaf-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-leaf-700">Este aparelho</span>}
                  </p>
                  <p className="text-[0.7rem] text-ink-400">
                    Entrou em {s.criadaEm} · expira em {s.expiraEm}{s.ip ? ` · IP ${s.ip}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {outras > 0 && (
        <button type="button" onClick={encerrar} disabled={enviando}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[0.8rem] font-bold text-red-700 hover:bg-red-100 disabled:opacity-60">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {rotuloBotao}
        </button>
      )}
      {msg && <p className="mt-2 text-[0.76rem] font-semibold text-ink-600">{msg}</p>}
    </div>
  );
}
