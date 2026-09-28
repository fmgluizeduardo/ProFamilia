"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Power, X } from "lucide-react";
import { formatarPlaca, normalizarPlaca, placaValida } from "@/lib/frota";
import { inputCls, labelCls } from "../veiculo-forms";

export type VeiculoEditavel = {
  id: string;
  modelo: string;
  marca: string | null;
  placa: string;
  ano: number | null;
  cor: string | null;
  kmInicial: number;
  observacoes: string | null;
  ativo: boolean;
  emRota: boolean;
  temPercursos: boolean;
};

/** Cadastro (sem `veiculo`) ou edição (com `veiculo`) de um veículo da frota. */
export function VeiculoModal({ veiculo }: { veiculo?: VeiculoEditavel }) {
  const router = useRouter();
  const editando = !!veiculo;
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState<null | "salvar" | "status">(null);
  const [erro, setErro] = useState<string | null>(null);
  const valoresIniciais = () => ({
    modelo: veiculo?.modelo ?? "",
    marca: veiculo?.marca ?? "",
    placa: veiculo ? formatarPlaca(veiculo.placa) : "",
    ano: veiculo?.ano ? String(veiculo.ano) : "",
    cor: veiculo?.cor ?? "",
    kmInicial: veiculo ? String(veiculo.kmInicial) : "",
    observacoes: veiculo?.observacoes ?? "",
  });
  const [form, setForm] = useState(valoresIniciais);

  function abrir() {
    setForm(valoresIniciais());
    setErro(null);
    setAberto(true);
  }

  async function enviar(corpo: Record<string, unknown>, tipo: "salvar" | "status") {
    setEnviando(tipo);
    setErro(null);
    try {
      const res = await fetch(editando ? `/api/frota/${veiculo.id}` : "/api/frota", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.erro ?? "Não foi possível salvar.");
      setAberto(false);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
    setEnviando(null);
  }

  function salvar() {
    if (!form.modelo.trim()) return setErro("Informe o modelo do veículo.");
    if (!placaValida(normalizarPlaca(form.placa))) return setErro("Placa inválida. Use ABC-1234 ou Mercosul ABC1D23.");
    void enviar({ ...form, ano: form.ano || null, kmInicial: form.kmInicial || 0 }, "salvar");
  }

  function alternarStatus() {
    if (!veiculo) return;
    if (veiculo.ativo && !confirm(`Desativar ${veiculo.modelo}? Ele deixará de aparecer para novas saídas, mas o histórico será mantido.`)) return;
    void enviar({ ativo: !veiculo.ativo }, "status");
  }

  const campo = (chave: keyof typeof form, transformar?: (v: string) => string) => ({
    value: form[chave],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [chave]: transformar ? transformar(e.target.value) : e.target.value }),
  });

  return (
    <>
      {editando ? (
        <button type="button" onClick={abrir}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[0.74rem] font-bold text-ink-700 transition-colors hover:border-ink-300">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
      ) : (
        <button type="button" onClick={abrir}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-[0.84rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Cadastrar veículo
        </button>
      )}

      {aberto && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog" aria-modal="true" aria-labelledby="titulo-veiculo"
          onClick={(e) => { if (e.target === e.currentTarget && !enviando) setAberto(false); }}
        >
          <div className="animate-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <h2 id="titulo-veiculo" className="font-display text-lg font-bold text-ink-900">
                {editando ? "Editar veículo" : "Cadastrar veículo"}
              </h2>
              <button type="button" onClick={() => setAberto(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50" aria-label="Fechar">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Modelo *</label><input className={inputCls} placeholder="Ex.: Kombi" maxLength={60} {...campo("modelo")} /></div>
              <div><label className={labelCls}>Marca</label><input className={inputCls} placeholder="Ex.: Volkswagen" maxLength={60} {...campo("marca")} /></div>
              <div>
                <label className={labelCls}>Placa *</label>
                <input className={`${inputCls} font-mono uppercase`} placeholder="ABC-1234" maxLength={8}
                  {...campo("placa", (v) => v.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} />
              </div>
              <div><label className={labelCls}>Ano</label><input className={inputCls} inputMode="numeric" placeholder="Ex.: 2012" maxLength={4} {...campo("ano", (v) => v.replace(/\D/g, ""))} /></div>
              <div><label className={labelCls}>Cor</label><input className={inputCls} placeholder="Ex.: Branca" maxLength={30} {...campo("cor")} /></div>
              <div>
                <label className={labelCls}>KM inicial</label>
                <input className={inputCls} inputMode="numeric" placeholder="Hodômetro no cadastro" {...campo("kmInicial", (v) => v.replace(/\D/g, ""))} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Observações</label>
                <textarea
                  className="min-h-20 w-full rounded-xl border border-ink-200/90 bg-white px-4 py-3 text-[0.9rem] font-medium text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                  placeholder="Ex.: veículo cedido pela Prefeitura; revisão a cada 10.000 km"
                  maxLength={500}
                  {...campo("observacoes")}
                />
              </div>
            </div>
            <p className="mt-2 text-[0.72rem] text-ink-500">
              O KM inicial é a referência para a primeira saída. Correções de placa ou modelo atualizam o nome do veículo em todo o histórico.
            </p>

            {erro && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-semibold text-red-700">{erro}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row">
              {editando && (
                <button type="button" onClick={alternarStatus} disabled={!!enviando || (veiculo.ativo && veiculo.emRota)}
                  title={veiculo.ativo && veiculo.emRota ? "Registre a chegada antes de desativar" : undefined}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[0.82rem] font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                    veiculo.ativo ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "bg-leaf-600 text-white hover:bg-leaf-700"
                  }`}>
                  {enviando === "status" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  {veiculo.ativo ? "Desativar" : "Reativar"}
                </button>
              )}
              <button type="button" disabled={!!enviando} onClick={() => setAberto(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-ink-200 bg-white text-[0.84rem] font-bold text-ink-700 hover:border-ink-300">
                Cancelar
              </button>
              <button type="button" disabled={!!enviando} onClick={salvar}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.84rem] font-bold text-white hover:bg-ink-800 disabled:opacity-60">
                {enviando === "salvar" && <Loader2 className="h-4 w-4 animate-spin" />}
                {editando ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
