"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlagTriangleRight, Loader2, LogIn, Plus, X } from "lucide-react";
import { agoraHM, hojeISO } from "@/lib/format";

const MOTORISTA_KEY = "profamilia:motorista";

const inputCls =
  "h-12 w-full rounded-xl border border-ink-200/90 bg-white px-4 text-[0.9rem] font-medium text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100";

const labelCls =
  "mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500";

export function SaidaForm({ ultimoKm }: { ultimoKm: number | null }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    data: "",
    motorista: "",
    saidaHora: "",
    saidaKm: "",
    saidaLocal: "",
  });

  useEffect(() => {
    try {
      const m = localStorage.getItem(MOTORISTA_KEY);
      setForm((f) => ({
        ...f,
        data: hojeISO(),
        saidaHora: agoraHM(),
        motorista: m ?? "",
        saidaKm: ultimoKm !== null ? String(ultimoKm) : "",
      }));
    } catch {
      /* ignora */
    }
  }, [ultimoKm, aberto]);

  async function enviar() {
    setErro(null);
    if (!form.motorista.trim() || !form.saidaLocal.trim() || !form.saidaKm) {
      setErro("Preencha motorista, KM e local de destino.");
      return;
    }
    setEnviando(true);
    try {
      localStorage.setItem(MOTORISTA_KEY, form.motorista.trim());
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: form.data,
          motorista: form.motorista.trim(),
          saidaHora: form.saidaHora,
          saidaKm: Number(form.saidaKm),
          saidaLocal: form.saidaLocal.trim(),
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.erro ?? "Falha ao registrar saída");
      setAberto(false);
      setForm((f) => ({ ...f, saidaLocal: "" }));
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar saída.");
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 text-[0.9rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.99] sm:w-auto sm:px-7"
      >
        <Plus className="h-4.5 w-4.5" />
        Registrar saída do veículo
      </button>
    );
  }

  return (
    <div className="animate-pop rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[0.95rem] font-bold text-ink-900">
          Nova saída
        </h3>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-50"
          aria-label="Fechar"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Data</label>
          <input
            type="date"
            className={inputCls}
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Hora da saída</label>
          <input
            type="time"
            className={inputCls}
            value={form.saidaHora}
            onChange={(e) => setForm({ ...form, saidaHora: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Motorista</label>
          <input
            className={inputCls}
            placeholder="Nome do motorista"
            value={form.motorista}
            onChange={(e) => setForm({ ...form, motorista: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>
            KM de saída{ultimoKm !== null ? ` (último: ${ultimoKm.toLocaleString("pt-BR")})` : ""}
          </label>
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder="Ex.: 48.250"
            value={form.saidaKm}
            onChange={(e) =>
              setForm({ ...form, saidaKm: e.target.value.replace(/\D/g, "") })
            }
          />
        </div>
      </div>
      <div className="mt-3">
        <label className={labelCls}>Local / destino da ronda</label>
        <input
          className={inputCls}
          placeholder="Ex.: Centro — Praças e Rodoviária"
          value={form.saidaLocal}
          onChange={(e) => setForm({ ...form, saidaLocal: e.target.value })}
        />
      </div>
      {erro && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.78rem] font-semibold text-red-700">
          {erro}
        </p>
      )}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sun-500 to-sun-600 text-[0.88rem] font-bold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Confirmar saída
      </button>
    </div>
  );
}

export function ChegadaForm({ registroId, saidaKm }: { registroId: string; saidaKm: number }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    chegadaHora: agoraHM(),
    chegadaKm: "",
    chegadaLocal: "Retorno à sede — Av. Loja Maçônica, 1.561",
  });

  async function enviar() {
    setErro(null);
    if (!form.chegadaKm) {
      setErro("Informe o KM de chegada.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/veiculos/${registroId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chegadaHora: form.chegadaHora,
          chegadaKm: Number(form.chegadaKm),
          chegadaLocal: form.chegadaLocal.trim(),
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.erro ?? "Falha ao registrar chegada");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar chegada.");
      setEnviando(false);
    }
  }

  return (
    <div className="mt-4 border-t border-leaf-200/70 pt-4">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-leaf-700">
        Registrar chegada
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Hora</label>
          <input
            type="time"
            className={inputCls}
            value={form.chegadaHora}
            onChange={(e) => setForm({ ...form, chegadaHora: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>KM (saída: {saidaKm.toLocaleString("pt-BR")})</label>
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder="KM atual"
            value={form.chegadaKm}
            onChange={(e) =>
              setForm({ ...form, chegadaKm: e.target.value.replace(/\D/g, "") })
            }
          />
        </div>
      </div>
      <div className="mt-3">
        <label className={labelCls}>Local de chegada</label>
        <input
          className={inputCls}
          value={form.chegadaLocal}
          onChange={(e) => setForm({ ...form, chegadaLocal: e.target.value })}
        />
      </div>
      {erro && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.78rem] font-semibold text-red-700">
          {erro}
        </p>
      )}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf-600 text-[0.88rem] font-bold text-white transition-all hover:bg-leaf-700 active:scale-[0.99] disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FlagTriangleRight className="h-4 w-4" />
        )}
        Concluir percurso
      </button>
    </div>
  );
}
