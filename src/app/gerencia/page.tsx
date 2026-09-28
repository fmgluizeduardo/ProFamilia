import type { Metadata } from "next";
import Link from "next/link";
import {
  Baby,
  BookOpen,
  CalendarRange,
  Download,
  FileSpreadsheet,
  FileText,
  House,
  IdCard,
  Landmark,
  Printer,
  Route,
  Truck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Donut, HBars, VBars } from "@/components/charts";
import { ReportActions } from "@/components/report-actions";
import { exigirUsuario } from "@/lib/auth";
import { veTodasAsFichas } from "@/lib/escopo";
import { temPermissao } from "@/lib/permissoes";
import {
  carregarDadosRelatorio,
  resolverPeriodo,
  resumirRelatorio,
  type Distribuicao,
} from "@/lib/relatorios";
import { dashISO, fmtData, hojeISO, numeroAtendimento } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gerência — Relatórios",
};

const PERIODOS = [
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
  { label: "1 ano", dias: 365 },
  { label: "Tudo", dias: 3650 },
];

function GraficoCard({
  titulo,
  dados,
  visual = "barras",
  limite = 8,
}: {
  titulo: string;
  dados: Distribuicao[];
  visual?: "barras" | "rosca" | "colunas";
  limite?: number;
}) {
  return (
    <div className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card">
      <h2 className="font-display text-[0.95rem] font-bold text-ink-900">{titulo}</h2>
      <div className="mt-4">
        {visual === "rosca" ? (
          <Donut dados={dados} tamanho={130} />
        ) : visual === "colunas" ? (
          <VBars dados={dados.slice(-limite)} />
        ) : (
          <HBars dados={dados} limite={limite} />
        )}
      </div>
      {dados.length > limite && visual === "barras" && (
        <p className="mt-3 text-[0.68rem] font-medium text-ink-400">
          Exibindo {limite} de {dados.length} categorias. Todas constam no relatório PDF.
        </p>
      )}
    </div>
  );
}

export default async function GerenciaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await exigirUsuario("gerencia.ver");
  const podeExportar = temPermissao(usuario, "relatorios.exportar");
  const podeVerFichas = temPermissao(usuario, "fichas.ver");
  const sp = await searchParams;
  const solicitadoDe = typeof sp.de === "string" ? sp.de : null;
  const solicitadoAte = typeof sp.ate === "string" ? sp.ate : null;
  const periodoValido = resolverPeriodo(solicitadoDe, solicitadoAte);
  const periodo = periodoValido ?? resolverPeriodo()!;
  const { de, ate } = periodo;
  const hoje = hojeISO();
  const dados = await carregarDadosRelatorio(periodo);
  const r = resumirRelatorio(dados);
  // Indicadores são estatísticos (todos os registros); a lista nominal respeita o escopo.
  const veTodas = veTodasAsFichas(usuario);
  const fichas = veTodas ? dados.fichas : dados.fichas.filter((f) => f.criadoPorId === usuario.id);
  const csvHref = `/api/atendimentos/export?de=${de}&ate=${ate}`;

  const kpis = [
    { label: "Atendimentos", valor: r.total, icon: FileText, tom: "bg-brand-100 text-brand-600" },
    { label: "Pessoas identificadas*", valor: r.unicos, icon: UsersRound, tom: "bg-ink-100 text-ink-600" },
    { label: "Situação de rua", valor: r.emRua, icon: House, tom: "bg-sun-100 text-sun-600" },
    { label: "Em acompanhamento", valor: r.acompanhamento, icon: UserCheck, tom: "bg-leaf-100 text-leaf-600" },
    { label: "Docs. pendentes", valor: r.docsPendentes, icon: IdCard, tom: "bg-brand-100 text-brand-700" },
    { label: "Saúde imediata", valor: r.saudeUrgente, icon: CalendarRange, tom: "bg-sun-100 text-sun-700" },
    { label: "Crianças/adolesc.", valor: r.criancas, icon: Baby, tom: "bg-ink-100 text-ink-700" },
    { label: "Idosos (60+)", valor: r.idosos, icon: Landmark, tom: "bg-leaf-100 text-leaf-700" },
  ];

  const graficos: { titulo: string; dados: Distribuicao[]; visual?: "barras" | "rosca" | "colunas"; limite?: number }[] = [
    { titulo: "Motivo da abordagem", dados: r.porMotivo, visual: "rosca" },
    { titulo: "Situações identificadas", dados: r.porSituacao },
    { titulo: "Demandas identificadas", dados: r.porDemandas },
    { titulo: "Encaminhamentos realizados", dados: r.porEncaminhamentos },
    { titulo: "Providências adotadas", dados: r.porProvidencias },
    { titulo: "Procedimentos", dados: r.porProcedimentos },
    { titulo: "Sexo / identidade autodeclarada", dados: r.porSexo, visual: "rosca" },
    { titulo: "Faixa etária", dados: r.porFaixa, visual: "colunas" },
    { titulo: "Escolaridade", dados: r.porEscolaridade },
    { titulo: "Condições de moradia", dados: r.porMoradia, visual: "rosca" },
    { titulo: "Documentação pessoal", dados: r.porDocumentacao, visual: "rosca" },
    { titulo: "Benefícios sociais", dados: r.porBeneficios },
    { titulo: "Álcool e outras drogas", dados: r.porDrogas },
    { titulo: "Município de origem", dados: r.porMunicipio },
    { titulo: "Por profissional responsável", dados: r.porProfissional },
    { titulo: "Locais de abordagem", dados: r.porLocal },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
            Coordenação · indicadores e documentos
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gerência &amp; relatórios
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/guia" className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-[0.78rem] font-bold text-ink-700 shadow-card transition-all hover:border-ink-300">
            <BookOpen className="h-4 w-4 text-sun-600" />
            Diretrizes
          </Link>
          <Link href="#relatorios" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[0.78rem] font-bold text-white shadow-card transition-colors hover:bg-brand-700">
            <Printer className="h-4 w-4" />
            Emitir relatório
          </Link>
        </div>
      </div>

      {/* O período controla painel, PDF e CSV. */}
      <div className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-ink-400">Período:</span>
          {PERIODOS.map((p) => {
            const url = `/gerencia?de=${dashISO(p.dias)}&ate=${hoje}`;
            const ativo = de === dashISO(p.dias) && ate === hoje;
            return (
              <Link key={p.label} href={url} className={`rounded-full px-3.5 py-1.5 text-[0.76rem] font-bold transition-all ${ativo ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"}`}>
                {p.label}
              </Link>
            );
          })}
          <form action="/gerencia" className="ml-auto flex flex-wrap items-center gap-2">
            <input type="date" name="de" defaultValue={de} aria-label="Data inicial"
              className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[0.76rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none" />
            <span className="text-[0.72rem] font-bold text-ink-300">até</span>
            <input type="date" name="ate" defaultValue={ate} aria-label="Data final"
              className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[0.76rem] font-semibold text-ink-600 focus:border-brand-400 focus:outline-none" />
            <button type="submit" className="h-9 rounded-lg bg-brand-600 px-3.5 text-[0.76rem] font-bold text-white transition-colors hover:bg-brand-700">Aplicar</button>
          </form>
        </div>
        {!periodoValido && (
          <p className="mt-2.5 rounded-lg bg-sun-50 px-3 py-2 text-[0.75rem] font-semibold text-sun-700">
            Período inválido. Exibindo o intervalo padrão de 90 dias.
          </p>
        )}
        <p className="mt-2.5 text-[0.74rem] font-semibold text-ink-400">
          Dados de <span className="text-ink-700">{fmtData(de)}</span> a <span className="text-ink-700">{fmtData(ate)}</span> · {r.total} {r.total === 1 ? "atendimento" : "atendimentos"} · {r.evolucoes} {r.evolucoes === 1 ? "evolução" : "evoluções"}
        </p>
      </div>

      <div id="relatorios" className="scroll-mt-8">
        {podeExportar ? (
          <ReportActions periodo={periodo} totalFichas={r.total} podeNominais={veTodas} />
        ) : (
          <p className="rounded-2xl border border-ink-100 bg-card px-4 py-3 text-[0.8rem] text-ink-500 shadow-card">
            A emissão de relatórios PDF e da planilha CSV depende de permissão de exportação. Solicite ao administrador, se necessário.
          </p>
        )}
      </div>

      <div className="animate-rise grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "100ms" }}>
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${k.tom}`}>
              <k.icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <p className="font-display mt-2 text-2xl font-bold tracking-tight text-ink-900">{k.valor}</p>
            <p className="mt-0.5 text-[0.66rem] font-bold uppercase tracking-wider text-ink-400">{k.label}</p>
          </div>
        ))}
      </div>
      <p className="-mt-3 text-[0.69rem] font-medium text-ink-400">
        *Aproximação por CPF ou nome e data de nascimento. Seleções múltiplas podem somar mais de 100%.
      </p>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-ink-400">Análise do período</p>
            <h2 className="font-display text-lg font-bold text-ink-900">Indicadores detalhados</h2>
          </div>
          <span className="rounded-full bg-ink-100 px-3 py-1 text-[0.7rem] font-bold text-ink-600">{graficos.length + 1} visualizações</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <GraficoCard titulo="Atendimentos por mês" dados={r.porMes} visual="colunas" limite={8} />
          </div>
          {graficos.map((g) => (
            <GraficoCard key={g.titulo} {...g} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100/80 bg-ink-950 p-5 shadow-card">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sun-400">
            <Truck className="h-5.5 w-5.5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-tight text-white">
              {r.saidas} saídas · {Math.round(r.kmRodados).toLocaleString("pt-BR")} km
            </p>
            <p className="text-[0.72rem] font-semibold text-ink-400">Operação de veículos no período selecionado</p>
          </div>
        </div>
        <Link href="/veiculos" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[0.78rem] font-bold text-white transition-colors hover:bg-white/15">
          <Route className="h-4 w-4" />
          Ver controle completo
        </Link>
      </div>

      {podeVerFichas && (
      <div className="rounded-2xl border border-ink-100/80 bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100/70 px-5 py-4">
          <div>
            <h2 className="font-display text-[0.95rem] font-bold text-ink-900">Fichas do período</h2>
            <p className="mt-0.5 text-[0.7rem] text-ink-400">Para todas as fichas, use o relatório completo ou o CSV.</p>
          </div>
          <a href={csvHref} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-ink-600 transition-colors hover:border-ink-300">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar CSV
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-ink-100/70 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink-400">
                <th className="px-5 py-3">Nº</th>
                <th className="px-3 py-3">Pessoa atendida</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Motivo</th>
                <th className="px-3 py-3">Situação</th>
                <th className="px-3 py-3">Profissional</th>
                <th className="px-5 py-3 text-right">Acomp.</th>
              </tr>
            </thead>
            <tbody>
              {fichas.slice(0, 20).map((f) => (
                <tr key={f.id} className="border-b border-ink-50 transition-colors last:border-0 hover:bg-brand-50/40">
                  <td className="px-5 py-3 font-display font-bold text-ink-400">{numeroAtendimento(f.numero)}</td>
                  <td className="px-3 py-3">
                    <Link href={`/fichas/${f.id}`} className="font-bold text-ink-900 underline-offset-2 hover:text-brand-600 hover:underline">{f.nomeSocial ?? f.nomeCompleto}</Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink-500">{fmtData(f.dataAtendimento)}</td>
                  <td className="px-3 py-3 font-semibold text-ink-600">{f.motivoAbordagem}</td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-56 flex-wrap gap-1">
                      {f.situacaoAtual.slice(0, 2).map((s) => <span key={s} className="rounded bg-ink-50 px-1.5 py-0.5 text-[0.66rem] font-bold text-ink-500">{s}</span>)}
                      {f.situacaoAtual.length > 2 && <span className="rounded bg-ink-50 px-1.5 py-0.5 text-[0.66rem] font-bold text-ink-400">+{f.situacaoAtual.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-ink-500">{f.profissionalResponsavel}</td>
                  <td className="px-5 py-3 text-right">
                    {f.necessitaAcompanhamento === "sim" ? <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[0.66rem] font-bold uppercase text-leaf-700">Sim</span> : <span className="text-[0.72rem] font-semibold text-ink-300">—</span>}
                  </td>
                </tr>
              ))}
              {fichas.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-400">Nenhum atendimento no período selecionado.</td></tr>}
            </tbody>
          </table>
        </div>
        {fichas.length > 20 && (
          <p className="border-t border-ink-100/70 px-5 py-3 text-center text-[0.72rem] font-semibold text-ink-400">
            Exibindo 20 de {fichas.length}. O PDF completo e o CSV incluem todos os registros.
          </p>
        )}
      </div>
      )}

      <p className="flex items-center gap-1.5 text-[0.68rem] font-medium text-ink-400">
        <Download className="h-3.5 w-3.5" />
        PDFs nominais contêm dados sensíveis. Antes de compartilhar ou imprimir, verifique quem terá acesso.
      </p>
    </div>
  );
}
