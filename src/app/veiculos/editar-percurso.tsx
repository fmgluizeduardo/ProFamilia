"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X } from "lucide-react";
import { chamarApi } from "@/lib/api-cliente";
import { AvisoErro } from "@/components/aviso-erro";
import { inputCls, labelCls } from "./veiculo-forms";

export type PercursoEditavel = {
  id: string;
  veiculo: string;
  data: string;
  motorista: string;
  saidaHora: string;
  saidaKm: number;
  saidaLocal: string;
  chegadaHora: string | null;
  chegadaKm: number | null;
  chegadaLocal: string | null;
};

/** Correção de um lançamento de percurso (permissão "veiculos.editar"). */
export function EditarPercurso({ percurso }: { percurso: PercursoEditavel }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const valoresIniciais = () => ({
    data: percurso.data,
    motorista: percurso.motorista,
    saidaHora: percurso.saidaHora,
    saidaKm: String(percurso.saidaKm),
    saidaLocal: percurso.saidaLocal,
    chegadaHora: percurso.chegadaHora ?? "",
    chegadaKm: percurso.chegadaKm !== null ? String(percurso.chegadaKm) : "",
    chegadaLocal: percurso.chegadaLocal ?? "",
  });
  const [form, setForm] = useState(valoresIniciais);
  const concluido = percurso.chegadaHora !== null;

  function abrir() {
    setForm(valoresIniciais());
    setErro(null);
    setAberto(true);
  }

  async function salvar() {
    setEnviando(true);
    setErro(null);
    try {
      await chamarApi(`/api/veiculos/${percurso.id}`, {
        method: "PUT",
        json: {
          ...form,
          saidaKm: Number(form.saidaKm),
          chegadaKm: form.chegadaKm === "" ? null : Number(form.chegadaKm),
        },
      });
      setAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e);
    }
    setEnviando(false);
  }

  const campo = (chave: keyof typeof form) => ({
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [chave]: chave.endsWith("Km") ? e.target.value.replace(/\D/g, "") : e.target.value }),
  });

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-bold text-brand-700 transition-colors hover:bg-brand-50"
        aria-label="Corrigir lançamento"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-percurso"
          onClick={(e) => {
            if (e.target === e.currentTarget && !enviando) setAberto(false);
          }}
        >
          <div className="animate-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="titulo-percurso" className="font-display text-lg font-bold text-ink-900">Corrigir lançamento</h2>
                <p className="text-[0.78rem] text-ink-500">{percurso.veiculo}</p>
              </div>
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50" aria-label="Fechar">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">Saída</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Data</label><input type="date" className={inputCls} {...campo("data")} /></div>
              <div><label className={labelCls}>Hora</label><input type="time" className={inputCls} {...campo("saidaHora")} /></div>
              <div><label className={labelCls}>Motorista</label><input className={inputCls} {...campo("motorista")} /></div>
              <div><label className={labelCls}>KM</label><input inputMode="numeric" className={inputCls} {...campo("saidaKm")} /></div>
              <div className="col-span-2"><label className={labelCls}>Local / destino</label><input className={inputCls} {...campo("saidaLocal")} /></div>
            </div>

            <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">
              Chegada {concluido ? "" : "(deixe em branco se ainda em rota)"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Hora</label><input type="time" className={inputCls} {...campo("chegadaHora")} /></div>
              <div><label className={labelCls}>KM</label><input inputMode="numeric" className={inputCls} {...campo("chegadaKm")} /></div>
              <div className="col-span-2"><label className={labelCls}>Local de chegada</label><input className={inputCls} {...campo("chegadaLocal")} /></div>
            </div>

            <p className="mt-3 text-[0.72rem] text-ink-500">A correção fica registrada na auditoria com os valores anteriores e novos.</p>
            {erro ? <AvisoErro erro={erro} compacto className="mt-3" /> : null}
            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row">
              <button
                type="button"
                disabled={enviando}
                onClick={() => setAberto(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-white text-[0.84rem] font-bold text-ink-700 hover:border-ink-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviando}
                onClick={salvar}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.84rem] font-bold text-white hover:bg-ink-800 disabled:opacity-60"
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar correção
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
