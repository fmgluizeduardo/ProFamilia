"use client";

import { useState } from "react";
import {
  ChartNoAxesCombined,
  Download,
  FileSpreadsheet,
  FileStack,
  FileText,
  Loader2,
  LockKeyhole,
  Printer,
  Truck,
} from "lucide-react";
import { LIMITE_FICHAS_PDF, TIPOS_RELATORIO, type Periodo, type TipoRelatorio } from "@/lib/report-config";
import { ErroApi, baixarArquivo } from "@/lib/api-cliente";
import { AvisoErro } from "@/components/aviso-erro";

const OPCOES = [
  { tipo: "completo" as const, icone: FileStack, detalhe: "Tudo em um único documento" },
  { tipo: "indicadores" as const, icone: ChartNoAxesCombined, detalhe: "Sem fichas nominais das pessoas atendidas" },
  { tipo: "fichas" as const, icone: FileText, detalhe: "Fichas integrais e evoluções" },
  { tipo: "veiculos" as const, icone: Truck, detalhe: "Frota, saídas, chegadas e quilometragem" },
];

const NOMINAIS: TipoRelatorio[] = ["completo", "fichas"];

function salvarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function ReportActions({
  periodo,
  totalFichas,
  podeNominais,
}: {
  periodo: Periodo;
  totalFichas: number;
  /** Relatórios com dados pessoais exigem acesso às fichas de toda a equipe. */
  podeNominais: boolean;
}) {
  const [tipo, setTipo] = useState<TipoRelatorio>(podeNominais ? "completo" : "indicadores");
  const [gerando, setGerando] = useState<null | "baixar" | "imprimir">(null);
  const [erro, setErro] = useState<unknown>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const bloqueiaNominais = totalFichas > LIMITE_FICHAS_PDF;
  const indisponivel = (t: TipoRelatorio) =>
    (bloqueiaNominais && t !== "indicadores") || (!podeNominais && NOMINAIS.includes(t));
  const bloqueado = indisponivel(tipo);
  const base = `/api/gerencia/relatorio?de=${periodo.de}&ate=${periodo.ate}&tipo=${tipo}`;
  const nomePadrao = `profamilia-${tipo}-${periodo.de}-a-${periodo.ate}.pdf`;

  async function obterPdf(baixar: boolean) {
    if (bloqueado || gerando) return;
    setGerando(baixar ? "baixar" : "imprimir");
    setErro(null);
    setAviso(null);
    // No celular não há visualizador de PDF em aba: o arquivo é baixado.
    const movel = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const salvar = baixar || movel;
    // A aba é aberta já no clique — aberta depois da espera, o navegador a bloquearia.
    const aba = salvar ? null : window.open("", "_blank");
    if (aba) {
      try {
        aba.document.title = "Gerando relatório…";
        aba.document.body.innerHTML =
          '<p style="font-family:system-ui,sans-serif;padding:2rem;color:#1f2e45">Gerando o relatório em PDF… aguarde alguns segundos.</p>';
      } catch {
        /* aba sem acesso: segue normalmente */
      }
    }
    try {
      const { blob, nome } = await baixarArquivo(`${base}${baixar ? "&baixar=1" : ""}`, nomePadrao);
      if (!blob.type.includes("pdf")) {
        throw new ErroApi({ codigo: "SIS-003", mensagem: "O servidor não devolveu um arquivo PDF.", status: 200 });
      }
      if (salvar) {
        salvarArquivo(blob, nome);
        if (!baixar) setAviso("No celular o PDF é baixado: abra o arquivo e use Compartilhar › Imprimir.");
        return;
      }
      const url = URL.createObjectURL(blob);
      if (aba && !aba.closed) {
        aba.location.href = url;
      } else {
        salvarArquivo(blob, nome);
        setAviso("O navegador bloqueou a nova aba, então o PDF foi baixado. Abra o arquivo e use Imprimir.");
      }
      setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (e) {
      aba?.close();
      setErro(e);
    } finally {
      setGerando(null);
    }
  }

  return (
    <section className="animate-rise overflow-hidden rounded-2xl border border-ink-100/80 bg-card shadow-card">
      <div className="bg-ink-950 px-5 py-5 sm:px-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sun-400">Documentos da coordenação</p>
        <h2 className="font-display mt-1 text-lg font-bold text-white sm:text-xl">Relatórios profissionais em PDF</h2>
        <p className="mt-1 max-w-xl text-[0.78rem] leading-relaxed text-ink-300">
          Capa institucional, gráficos e tabelas vetoriais, páginas A4 numeradas. Arquivo gerado a partir dos
          dados do período acima — não é uma captura da tela.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">Escolha o conteúdo</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPCOES.map(({ tipo: escolha, icone: Icone, detalhe }) => {
            const ativo = tipo === escolha;
            return (
              <button
                key={escolha}
                type="button"
                aria-pressed={ativo}
                disabled={indisponivel(escolha)}
                onClick={() => {
                  setTipo(escolha);
                  setErro(null);
                  setAviso(null);
                }}
                className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${
                  ativo && !bloqueado
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                    : "border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50/50"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    ativo && !bloqueado ? "bg-brand-100 text-brand-700" : "bg-ink-50 text-ink-500"
                  }`}
                >
                  <Icone className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[0.8rem] font-bold ${ativo && !bloqueado ? "text-brand-900" : "text-ink-800"}`}>
                    {TIPOS_RELATORIO[escolha].titulo}
                  </span>
                  <span className="mt-0.5 block text-[0.69rem] text-ink-400">{detalhe}</span>
                </span>
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-[5px] ${
                    ativo && !bloqueado ? "border-brand-600 bg-white" : "border-ink-200 bg-white"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-[0.74rem] leading-relaxed text-ink-600">
          {TIPOS_RELATORIO[tipo].descricao}
        </p>

        {!podeNominais && (
          <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-ink-600">
            Relatórios com dados pessoais (Completo e Prontuários) exigem acesso às fichas de toda a equipe. Você
            pode emitir os relatórios de Indicadores e de Veículo.
          </div>
        )}
        {bloqueiaNominais && (
          <div className="mt-3 rounded-lg border border-sun-300 bg-sun-50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-sun-800">
            Este período tem <strong>{totalFichas.toLocaleString("pt-BR")} fichas</strong>; o limite para PDF
            nominal é de {LIMITE_FICHAS_PDF} fichas. Reduza o intervalo ou use <strong>Exportar CSV</strong> mais
            abaixo, que traz todas as fichas.
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            disabled={bloqueado || gerando !== null}
            onClick={() => void obterPdf(true)}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[0.84rem] font-bold shadow-card transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
              bloqueado ? "bg-ink-200 text-ink-400" : "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-70"
            }`}
          >
            {gerando === "baixar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {gerando === "baixar" ? "Gerando…" : "Exportar PDF"}
          </button>
          <button
            type="button"
            disabled={bloqueado || gerando !== null}
            onClick={() => void obterPdf(false)}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-[0.84rem] font-bold shadow-card transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
              bloqueado
                ? "border-ink-200 bg-ink-50 text-ink-400"
                : "border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 disabled:opacity-70"
            }`}
          >
            {gerando === "imprimir" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {gerando === "imprimir" ? "Gerando…" : "Abrir para imprimir"}
          </button>
        </div>

        {erro ? <AvisoErro erro={erro} className="mt-3" onFechar={() => setErro(null)} /> : null}
        {aviso && (
          <p role="status" className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-[0.76rem] font-semibold text-brand-800">
            {aviso}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.69rem] leading-relaxed text-ink-400">
          <span>A opção de impressão abre o PDF diagramado. No visualizador, toque em Imprimir.</span>
          {tipo !== "indicadores" && (
            <span className="inline-flex items-center gap-1 font-semibold text-sun-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Contém dados pessoais · compartilhe com cuidado
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** Botão da planilha CSV com o mesmo tratamento de erros dos PDFs. */
export function BotaoCsv({ href }: { href: string }) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<unknown>(null);

  async function baixar() {
    if (carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      const { blob, nome } = await baixarArquivo(href, "atendimentos-profamilia.csv");
      salvarArquivo(blob, nome);
    } catch (e) {
      setErro(e);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => void baixar()}
        disabled={carregando}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-ink-600 transition-colors hover:border-ink-300 disabled:opacity-60"
      >
        {carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
        Exportar CSV
      </button>
      {erro ? (
        <AvisoErro erro={erro} compacto className="w-full max-w-md text-left" onFechar={() => setErro(null)} />
      ) : null}
    </div>
  );
}
