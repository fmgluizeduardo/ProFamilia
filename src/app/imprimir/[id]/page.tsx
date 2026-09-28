import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Printer } from "lucide-react";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { LogoMark } from "@/components/logo";
import { ORGAO, RUA_TIPOS, USO_DROGAS, VINCULOS } from "@/lib/constants";
import {
  fmtData,
  fmtDataHora,
  labelSN,
  moedaBR,
  numeroAtendimento,
} from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";
import { exigirUsuario } from "@/lib/auth";
import { BotaoImprimir } from "./botao-imprimir";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impressão da Ficha",
};

function P({ label, value, span = 1 }: { label: string; value?: string | null; span?: 1 | 2 | 3 }) {
  return (
    <div className={span === 3 ? "col-span-3" : span === 2 ? "col-span-2" : ""}>
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 min-h-4 text-[0.78rem] font-semibold text-neutral-900">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function SecPrint({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 break-inside-avoid">
      <h2 className="border-b border-neutral-800 pb-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-neutral-900">
        <span className="mr-1.5 text-neutral-400">{numero}</span>
        {titulo}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function ListaPrint({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="mt-2">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-[0.78rem] font-semibold leading-relaxed text-neutral-900">
        {items.length ? items.join("  ·  ") : "—"}
      </p>
    </div>
  );
}

export default async function ImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirUsuario("fichas.ver");
  const { id } = await params;

  if (!uuidValido(id)) notFound();

  const [f] = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.id, id))
    .limit(1);
  if (!f) notFound();

  const evos = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.atendimentoId, id))
    .orderBy(asc(evolucoes.createdAt));

  const ruaTipo = RUA_TIPOS.find((t) => t.value === f.ruaTipo);
  const vinculo = VINCULOS.find((v) => v.value === f.vinculoFamiliar);
  const drogas = USO_DROGAS.find((u) => u.value === f.usoDrogas);

  return (
    <div className="min-h-dvh bg-neutral-200 py-6 print:bg-white print:py-0">
      {/* Ações (não imprime) */}
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between px-4">
        <Link
          href={`/fichas/${f.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[0.8rem] font-bold text-neutral-600 shadow-sm transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à ficha
        </Link>
        <BotaoImprimir />
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-3xl bg-white px-8 py-9 shadow-lift print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* Cabeçalho institucional */}
        <header className="flex items-center gap-4 border-2 border-neutral-800 p-4">
          <div className="flex items-center gap-2.5 border-r border-neutral-300 pr-4">
            <LogoMark className="h-14 w-14" />
            <div className="leading-none">
              <p className="text-[0.55rem] font-semibold tracking-[0.3em] text-neutral-500">
                INSTITUTO
              </p>
              <p className="font-display text-lg font-bold text-neutral-900">
                PróFamília
              </p>
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="font-display text-[0.85rem] font-bold tracking-wide text-neutral-900">
              {ORGAO.instituto}
            </p>
            <p className="mt-0.5 text-[0.66rem] font-bold text-neutral-700">{ORGAO.cnpj}</p>
            <p className="mt-0.5 text-[0.62rem] leading-snug text-neutral-500">
              {ORGAO.endereco}
              <br />
              {ORGAO.cep} · {ORGAO.contato}
            </p>
          </div>
        </header>

        <div className="mt-4 text-center">
          <p className="text-[0.72rem] font-bold tracking-wide text-neutral-900">
            {ORGAO.prefeitura}
          </p>
          <p className="text-[0.66rem] font-semibold text-neutral-600">{ORGAO.secretaria}</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <p className="font-display text-[0.95rem] font-bold tracking-[0.18em] text-neutral-900">
              {ORGAO.ficha} {numeroAtendimento(f.numero)}
            </p>
          </div>
          <p className="mt-0.5 text-[0.66rem] font-bold tracking-[0.3em] text-neutral-500">
            {ORGAO.servico}
          </p>
        </div>

        <SecPrint numero="1" titulo="Dados do atendimento">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <P label="Data" value={fmtData(f.dataAtendimento)} />
            <P label="Horário" value={f.horario} />
            <P label="Motivo da abordagem" value={f.motivoAbordagem === "Outro" ? `Outro: ${f.motivoOutro ?? ""}` : f.motivoAbordagem} />
            <P label="Local da abordagem" value={f.localAbordagem} span={2} />
            <P label="Ponto de referência" value={f.pontoReferencia} />
            <P label="Profissional responsável" value={f.profissionalResponsavel} span={2} />
            <P label="Equipe" value={f.equipe} />
          </div>
        </SecPrint>

        <SecPrint numero="2" titulo="Identificação pessoal">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <P label="Nome completo" value={f.nomeCompleto} span={2} />
            <P label="Nome social" value={f.nomeSocial} />
            <P label="Data de nascimento" value={fmtData(f.dataNascimento)} />
            <P label="Idade" value={f.idade !== null ? `${f.idade} anos` : null} />
            <P label="Telefone" value={f.telefone} />
            <P label="Nome da mãe" value={f.nomeMae} span={2} />
            <P label="Nome do pai" value={f.nomePai} />
            <P
              label="Sexo / identidade (autodeclarada)"
              value={f.sexoOutro && f.sexo === "Outra identificação"
                ? `Outra identificação: ${f.sexoOutro}`
                : f.sexo}
            />
            <P label="Estado civil" value={f.estadoCivil} />
            <P label="Possui documentação?" value={labelSN(f.possuiDocumentacao)} />
            <P label="Naturalidade" value={f.naturalidade} />
            <P label="Município de origem" value={f.municipioOrigem} />
            <P label="CPF" value={f.cpf} />
            <P label="RG" value={f.rg} />
          </div>
        </SecPrint>

        <SecPrint numero="3" titulo="Situação atual, familiar e moradia">
          <ListaPrint items={f.situacaoAtual} label="Situação atual identificada" />
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-3">
            <P label="Tempo na situação" value={f.tempoSituacao} />
            <P label="Tipo (rua)" value={ruaTipo ? `${ruaTipo.label} — ${ruaTipo.hint}` : null} span={2} />
            <P label="Motivo (rua)" value={f.ruaMotivo} span={2} />
            <P label="Onde permanece" value={f.ruaOndePermanece} />
            <P label="Vínculo familiar preservado?" value={labelSN(f.vinculoPreservado)} />
            <P label="Vínculo familiar" value={vinculo ? `${vinculo.value} — ${vinculo.hint}` : null} span={2} />
            <P label="Referência familiar" value={f.refFamiliarNome} />
            <P label="Telefone" value={f.refFamiliarTelefone} />
            <P label="Município da família" value={f.refFamiliarMunicipio} />
            <P label="Condição de moradia" value={f.condicaoMoradia === "Outro" ? `Outro: ${f.condicaoMoradiaOutro ?? ""}` : f.condicaoMoradia} />
          </div>
        </SecPrint>

        <SecPrint numero="4" titulo="Saúde, escolaridade, renda e benefícios">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3">
            <P label="Condição de saúde informada" value={f.saudeCondicao} span={3} />
            <P label="Medicação contínua?" value={labelSN(f.usoMedicacao)} />
            <P label="Qual?" value={f.usoMedicacaoQual} span={2} />
            <P label="Atendimento de saúde imediato?" value={labelSN(f.atendimentoImediato)} />
            <P label="Álcool / outras drogas" value={drogas?.label ?? null} />
            <P label="Substâncias" value={f.substancias.length ? f.substancias.join(", ") : null} />
            <P label="Escolaridade" value={f.escolaridade} />
            <P label="Possui renda?" value={labelSN(f.possuiRenda)} />
            <P label="Origem / valor" value={f.possuiRenda === "sim" ? `${f.origemRenda ?? "—"} · ${moedaBR(f.valorRenda)}` : null} />
            <P label="Número do NIS" value={f.numeroNis} />
          </div>
          <ListaPrint items={f.beneficios} label="Benefícios sociais" />
        </SecPrint>

        <SecPrint numero="5" titulo="Demandas, providências e encaminhamentos">
          <ListaPrint items={f.demandas} label="Demandas identificadas" />
          <ListaPrint items={f.providencias} label="Providências adotadas" />
          <ListaPrint items={f.procedimentos} label="Procedimentos" />
          <ListaPrint items={f.encaminhamentos} label="Encaminhamentos realizados" />
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-3">
            <P label="Necessita acompanhamento?" value={labelSN(f.necessitaAcompanhamento)} />
            <P label="Local do acompanhamento" value={f.acompanhamentoLocal} span={2} />
          </div>
        </SecPrint>

        <SecPrint numero="6" titulo="Evolução">
          {evos.length === 0 ? (
            <p className="text-[0.76rem] text-neutral-400">
              Sem evoluções registradas até a impressão deste documento.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {evos.map((e) => (
                <li key={e.id} className="break-inside-avoid border-l-2 border-neutral-300 pl-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-neutral-500">
                    {fmtDataHora(e.createdAt)} — {e.autorNome}
                    {e.autorCargo ? ` (${e.autorCargo})` : ""}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-[0.76rem] leading-relaxed text-neutral-800">
                    {e.texto}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </SecPrint>

        {/* Assinaturas */}
        <footer className="mt-8 break-inside-avoid">
          <div className="grid grid-cols-2 gap-10">
            <div className="text-center">
              <div className="h-14 border-b border-neutral-700" />
              <p className="mt-1.5 text-[0.68rem] font-bold text-neutral-800">
                {f.responsavelNome ?? f.profissionalResponsavel}
              </p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                Responsável pelo registro{f.responsavelCargo ? ` — ${f.responsavelCargo}` : ""}
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-14 items-end justify-center border-b border-neutral-700 pb-1">
                {f.assinaturaUsuario ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.assinaturaUsuario}
                    alt="Assinatura do usuário"
                    className="max-h-12 object-contain"
                  />
                ) : null}
              </div>
              <p className="mt-1.5 text-[0.68rem] font-bold text-neutral-800">
                Ciência do usuário (quando possível)
              </p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                {f.nomeSocial ?? f.nomeCompleto}
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-[0.58rem] text-neutral-400">
            Documento gerado eletronicamente pelo sistema do Instituto PróFamília em{" "}
            {fmtDataHora(new Date())} · Ficha {numeroAtendimento(f.numero)}
          </p>
        </footer>
      </div>

      <div className="no-print mx-auto mt-5 max-w-3xl px-4 pb-4">
        <p className="flex items-center gap-2 text-[0.72rem] font-medium text-neutral-500">
          <Printer className="h-3.5 w-3.5" />
          Use o botão Imprimir para gerar o PDF ou enviar à impressora. Margens e
          quebras de página já estão configuradas.
        </p>
      </div>
    </div>
  );
}
