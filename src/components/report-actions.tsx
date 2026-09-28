"use client";

import { useState } from "react";
import {
  ChartNoAxesCombined,
  Download,
  FileStack,
  FileText,
  LockKeyhole,
  Printer,
  Truck,
} from "lucide-react";
import { TIPOS_RELATORIO, type Periodo, type TipoRelatorio } from "@/lib/report-config";

const OPCOES = [
  { tipo: "completo" as const, icone: FileStack, detalhe: "Tudo em um único documento" },
  { tipo: "indicadores" as const, icone: ChartNoAxesCombined, detalhe: "Sem fichas nominais das pessoas atendidas" },
  { tipo: "fichas" as const, icone: FileText, detalhe: "Fichas integrais e evoluções" },
  { tipo: "veiculos" as const, icone: Truck, detalhe: "Saídas, chegadas e quilometragem" },
];

/** Acima disso o PDF nominal ficaria lento demais; o CSV continua imediato. */
const LIMITE_FICHAS_PDF = 1500;

const NOMINAIS: TipoRelatorio[] = ["completo", "fichas"];

export function ReportActions({
  periodo,
  totalFichas,
  totalPercursos,
  podeNominais,
}: {
  periodo: Periodo;
  totalFichas: number;
  /** Saídas de veículo no período (para avisar quando o relatório sairá vazio). */
  totalPercursos: number;
  /** Relatórios com dados pessoais exigem acesso às fichas de toda a equipe. */
  podeNominais: boolean;
}) {
  const [tipo, setTipo] = useState<TipoRelatorio>(podeNominais ? "completo" : "indicadores");
  const bloqueiaNominais = totalFichas > LIMITE_FICHAS_PDF;
  const indisponivel = (t: TipoRelatorio) =>
    (bloqueiaNominais && t !== "indicadores") || (!podeNominais && NOMINAIS.includes(t));
  const bloqueado = indisponivel(tipo);
  const base = `/api/gerencia/relatorio?de=${periodo.de}&ate=${periodo.ate}&tipo=${tipo}`;

  return (
    <section className="animate-rise overflow-hidden rounded-2xl border border-ink-100/80 bg-card shadow-card">
      <div className="bg-ink-950 px-5 py-5 sm:px-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sun-400">
          Documentos da coordenação
        </p>
        <h2 className="font-display mt-1 text-lg font-bold text-white sm:text-xl">
          Relatórios profissionais em PDF
        </h2>
        <p className="mt-1 max-w-xl text-[0.78rem] leading-relaxed text-ink-300">
          Capa institucional, gráficos e tabelas vetoriais, páginas A4 numeradas.
          Arquivo gerado a partir dos dados do período acima — não é uma captura da tela.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink-400">
          Escolha o conteúdo
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPCOES.map(({ tipo: escolha, icone: Icone, detalhe }) => {
            const ativo = tipo === escolha;
            return (
              <button
                key={escolha}
                type="button"
                aria-pressed={ativo}
                disabled={indisponivel(escolha)}
                onClick={() => setTipo(escolha)}
                className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 ${
                  ativo && !bloqueado
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
                    : "border-ink-100 bg-white hover:border-ink-200 hover:bg-ink-50/50"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  ativo && !bloqueado ? "bg-brand-100 text-brand-700" : "bg-ink-50 text-ink-500"
                }`}>
                  <Icone className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[0.8rem] font-bold ${ativo && !bloqueado ? "text-brand-900" : "text-ink-800"}`}>
                    {TIPOS_RELATORIO[escolha].titulo}
                  </span>
                  <span className="mt-0.5 block text-[0.69rem] text-ink-400">{detalhe}</span>
                </span>
                <span className={`h-4 w-4 shrink-0 rounded-full border-[5px] ${
                  ativo && !bloqueado ? "border-brand-600 bg-white" : "border-ink-200 bg-white"
                }`} />
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-[0.74rem] leading-relaxed text-ink-600">
          {TIPOS_RELATORIO[tipo].descricao}
        </p>

        {(tipo === "veiculos" ? totalPercursos === 0 : totalFichas === 0) && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-brand-900">
            Não há {tipo === "veiculos" ? "saídas de veículo" : "fichas"} neste período. O documento será
            emitido com o cabeçalho e as seções vazias — escolha outro período para ver dados preenchidos.
          </div>
        )}
        {!podeNominais && (
          <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-ink-600">
            Relatórios com dados pessoais (Completo e Prontuários) exigem acesso às fichas de toda a equipe.
            Você pode emitir os relatórios de Indicadores e de Veículo.
          </div>
        )}
        {bloqueiaNominais && (
          <div className="mt-3 rounded-lg border border-sun-300 bg-sun-50 px-3 py-2.5 text-[0.75rem] leading-relaxed text-sun-800">
            Este período tem <strong>{totalFichas.toLocaleString("pt-BR")} fichas</strong> e os
            relatórios nominais ficariam lentos demais. Reduza o intervalo ou use{" "}
            <strong>Exportar CSV</strong> mais abaixo, que traz todas as fichas de forma imediata.
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <a
            aria-disabled={bloqueado}
            href={bloqueado ? undefined : `${base}&baixar=1`}
            onClick={(e) => { if (bloqueado) e.preventDefault(); }}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[0.84rem] font-bold shadow-card transition-all active:scale-[0.98] ${
              bloqueado
                ? "cursor-not-allowed bg-ink-200 text-ink-400"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </a>
          <a
            aria-disabled={bloqueado}
            href={bloqueado ? undefined : base}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (bloqueado) e.preventDefault(); }}
            className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-[0.84rem] font-bold shadow-card transition-all active:scale-[0.98] ${
              bloqueado
                ? "cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400"
                : "border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50"
            }`}
          >
            <Printer className="h-4 w-4" />
            Abrir para imprimir
          </a>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[0.69rem] leading-relaxed text-ink-400">
          <span>
            A opção de impressão abre o PDF diagramado. No visualizador, toque em Imprimir.
          </span>
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
