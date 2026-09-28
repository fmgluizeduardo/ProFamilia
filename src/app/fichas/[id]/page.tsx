import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CircleUserRound,
  HeartPulse,
  History,
  Landmark,
  MapPin,
  Pencil,
  Printer,
  Stethoscope,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { RUA_TIPOS, USO_DROGAS, VINCULOS } from "@/lib/constants";
import {
  fmtData,
  fmtDataHora,
  labelSN,
  moedaBR,
  numeroAtendimento,
} from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";
import { exigirUsuario } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { BotaoExcluir } from "@/components/botao-excluir";
import { EvolucaoForm } from "./evolucao-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ficha de Atendimento",
};

function Dado({
  label,
  value,
  destaque,
}: {
  label: string;
  value?: string | number | null;
  destaque?: boolean;
}) {
  const v = value === null || value === undefined || value === "" ? null : String(value);
  return (
    <div>
      <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[0.88rem] leading-snug ${
          v ? (destaque ? "font-bold text-sun-700" : "font-semibold text-ink-900") : "font-medium text-ink-300"
        }`}
      >
        {v ?? "Não informado"}
      </dd>
    </div>
  );
}

function Chips({ items, tom = "brand" }: { items: string[]; tom?: "brand" | "leaf" | "sun" }) {
  if (!items.length)
    return <p className="text-[0.85rem] font-medium text-ink-300">Nenhum registro.</p>;
  const cores = {
    brand: "bg-brand-50 text-brand-700 border-brand-200",
    leaf: "bg-leaf-50 text-leaf-700 border-leaf-200",
    sun: "bg-sun-50 text-sun-700 border-sun-200",
  }[tom];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i, indice) => (
        <span
          key={`${indice}-${i}`}
          className={`rounded-lg border px-2.5 py-1 text-[0.74rem] font-bold ${cores}`}
        >
          {i}
        </span>
      ))}
    </div>
  );
}

function Bloco({
  icon: Icon,
  titulo,
  children,
}: {
  icon: React.ElementType;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2.5 font-display text-[0.95rem] font-bold tracking-tight text-ink-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </span>
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function FichaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await exigirUsuario("fichas.ver");
  const podeEditar = temPermissao(usuario, "fichas.editar");
  const podeExcluir = temPermissao(usuario, "fichas.excluir");
  const podeEvoluir = temPermissao(usuario, "evolucoes.criar");
  const podeExcluirEvo = temPermissao(usuario, "evolucoes.excluir");
  const { id } = await params;
  const sp = await searchParams;
  const novo = sp.novo === "1";
  const editado = sp.editado === "1";

  // Endereço inválido ou apagado deve cair na página de "não encontrado",
  // não em erro interno de banco.
  if (!uuidValido(id)) notFound();

  const [ficha] = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.id, id))
    .limit(1);

  if (!ficha) notFound();

  const evos = await db
    .select()
    .from(evolucoes)
    .where(eq(evolucoes.atendimentoId, id))
    .orderBy(asc(evolucoes.createdAt));

  const ruaTipoLabel = RUA_TIPOS.find((t) => t.value === ficha.ruaTipo)?.label;
  const vinculoLabel = VINCULOS.find((v) => v.value === ficha.vinculoFamiliar);
  const usoDrogasLabel = USO_DROGAS.find((u) => u.value === ficha.usoDrogas)?.label;

  return (
    <div className="space-y-5">
      {/* ——— Voltar + ações ——— */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/fichas"
          className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-ink-500 transition-colors hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Todas as fichas
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/imprimir/${ficha.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-card px-4 py-2.5 text-[0.8rem] font-bold text-ink-600 transition-all hover:border-ink-300 hover:shadow-card active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Link>
          {podeEditar && (
            <Link
              href={`/fichas/${ficha.id}/editar`}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-[0.8rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          )}
          {podeExcluir && (
            <BotaoExcluir
              url={`/api/atendimentos/${ficha.id}`}
              titulo={`Excluir a ficha ${numeroAtendimento(ficha.numero)}?`}
              descricao={`A ficha de ${ficha.nomeCompleto} será apagada definitivamente${evos.length ? `, junto com ${evos.length} ${evos.length === 1 ? "evolução" : "evoluções"}` : ""}.`}
              redirecionarPara="/fichas"
            />
          )}
        </div>
      </div>

      {(novo || editado) && (
        <div className="animate-pop no-print flex items-center gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-3.5">
          <BadgeCheck className="h-5 w-5 shrink-0 text-leaf-600" />
          <p className="text-[0.84rem] font-bold text-leaf-800">
            {editado ? "Alterações salvas com sucesso." : "Ficha salva com sucesso e já disponível para a gerência."}
          </p>
        </div>
      )}

      {/* ——— Cabeçalho da ficha ——— */}
      <header className="animate-rise overflow-hidden rounded-2xl border border-ink-100/80 bg-card shadow-card">
        <div className="bg-ink-950 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-[0.68rem] font-bold tracking-[0.2em] text-sun-400">
                FICHA {numeroAtendimento(ficha.numero)}
              </p>
              <h1 className="font-display mt-1.5 text-xl font-bold leading-tight text-white sm:text-2xl">
                {ficha.nomeSocial
                  ? `${ficha.nomeSocial} · ${ficha.nomeCompleto}`
                  : ficha.nomeCompleto}
              </h1>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.76rem] font-medium text-ink-300">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {fmtData(ficha.dataAtendimento)} às {ficha.horario}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {ficha.localAbordagem}
                </span>
              </div>
            </div>
            {ficha.necessitaAcompanhamento === "sim" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-500/15 px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-leaf-300">
                <Landmark className="h-3.5 w-3.5" />
                Em acompanhamento{ficha.acompanhamentoLocal ? ` · ${ficha.acompanhamentoLocal}` : ""}
              </span>
            )}
          </div>
          {ficha.situacaoAtual.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ficha.situacaoAtual.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-white/10 px-2 py-1 text-[0.68rem] font-bold text-ink-100"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink-100/70 text-center">
          {[
            { n: ficha.demandas.length, l: "demandas" },
            { n: ficha.providencias.length, l: "providências" },
            { n: ficha.encaminhamentos.length, l: "encaminhamentos" },
          ].map((s) => (
            <div key={s.l} className="px-2 py-3.5">
              <p className="font-display text-lg font-bold text-ink-900">{s.n}</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-400">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </header>

      {/* ——— Conteúdo ——— */}
      <div className="animate-rise space-y-4" style={{ animationDelay: "80ms" }}>
        <Bloco icon={MapPin} titulo="Dados do atendimento">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Dado label="Data" value={fmtData(ficha.dataAtendimento)} />
            <Dado label="Horário" value={ficha.horario} />
            <Dado label="Motivo" value={ficha.motivoAbordagem === "Outro" ? `Outro: ${ficha.motivoOutro ?? "—"}` : ficha.motivoAbordagem} />
            <div className="col-span-2 sm:col-span-1">
              <Dado label="Local da abordagem" value={ficha.localAbordagem} />
            </div>
            <Dado label="Ponto de referência" value={ficha.pontoReferencia} />
            <Dado label="Profissional responsável" value={ficha.profissionalResponsavel} />
            <Dado label="Equipe" value={ficha.equipe} />
          </dl>
        </Bloco>

        <Bloco icon={UserRound} titulo="Identificação pessoal">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Dado label="Nome completo" value={ficha.nomeCompleto} />
            <Dado label="Nome social" value={ficha.nomeSocial} />
            <Dado
              label="Nascimento / idade"
              value={`${fmtData(ficha.dataNascimento)}${ficha.idade !== null ? ` · ${ficha.idade} anos` : ""}`}
            />
            <Dado label="Nome da mãe" value={ficha.nomeMae} />
            <Dado label="Nome do pai" value={ficha.nomePai} />
            <Dado label="Telefone" value={ficha.telefone} />
            <Dado
              label="Sexo / identidade (autodeclarada)"
              value={ficha.sexoOutro && ficha.sexo === "Outra identificação"
                ? `Outra identificação: ${ficha.sexoOutro}`
                : ficha.sexo}
            />
            <Dado label="Estado civil" value={ficha.estadoCivil} />
            <Dado label="Naturalidade" value={ficha.naturalidade} />
            <Dado label="Município de origem" value={ficha.municipioOrigem} />
            <Dado label="CPF" value={ficha.cpf} />
            <Dado label="RG" value={ficha.rg} />
            <Dado label="Documentação" value={labelSN(ficha.possuiDocumentacao)} destaque={ficha.possuiDocumentacao === "nao"} />
          </dl>
        </Bloco>

        <Bloco icon={CircleUserRound} titulo="Situação atual e familiar">
          <Chips items={ficha.situacaoAtual} tom="sun" />
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Dado label="Tempo na situação" value={ficha.tempoSituacao} />
            {ruaTipoLabel && <Dado label="Tipo (rua)" value={ruaTipoLabel} />}
            {ficha.ruaMotivo && <Dado label="Motivo (rua)" value={ficha.ruaMotivo} />}
            {ficha.ruaQuantoTempo && <Dado label="Quanto tempo (rua)" value={ficha.ruaQuantoTempo} />}
            {ficha.ruaOndePermanece && (
              <div className="col-span-2 sm:col-span-1">
                <Dado label="Onde permanece" value={ficha.ruaOndePermanece} />
              </div>
            )}
            <Dado label="Vínculo preservado" value={labelSN(ficha.vinculoPreservado)} />
            {vinculoLabel && (
              <div className="col-span-2">
                <Dado label="Vínculo familiar" value={`${vinculoLabel.value} — ${vinculoLabel.hint}`} />
              </div>
            )}
            <Dado label="Referência familiar" value={ficha.refFamiliarNome} />
            <Dado label="Tel. referência" value={ficha.refFamiliarTelefone} />
            <Dado label="Município da família" value={ficha.refFamiliarMunicipio} />
            <Dado label="Condição de moradia" value={ficha.condicaoMoradia === "Outro" ? `Outro: ${ficha.condicaoMoradiaOutro ?? "—"}` : ficha.condicaoMoradia} />
          </dl>
        </Bloco>

        <Bloco icon={Stethoscope} titulo="Saúde, escolaridade e renda">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3">
              <Dado label="Condição de saúde informada" value={ficha.saudeCondicao} />
            </div>
            <Dado
              label="Medicação contínua"
              value={ficha.usoMedicacao === "sim" ? `Sim — ${ficha.usoMedicacaoQual ?? "não especificada"}` : labelSN(ficha.usoMedicacao)}
            />
            <Dado label="Atendimento imediato" value={labelSN(ficha.atendimentoImediato)} destaque={ficha.atendimentoImediato === "sim"} />
            <Dado
              label="Álcool / outras drogas"
              value={`${usoDrogasLabel ?? "—"}${ficha.substancias.length ? ` (${ficha.substancias.join(", ")})` : ""}`}
            />
            <Dado label="Escolaridade" value={ficha.escolaridade} />
            <Dado
              label="Renda"
              value={
                ficha.possuiRenda === "sim"
                  ? `${ficha.origemRenda ?? "Sim"}${ficha.valorRenda ? ` · ${moedaBR(ficha.valorRenda)}` : ""}`
                  : labelSN(ficha.possuiRenda)
              }
            />
            <Dado label="NIS" value={ficha.numeroNis} />
          </dl>
          <div className="mt-4">
            <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
              Benefícios sociais
            </p>
            <Chips items={ficha.beneficios} />
          </div>
        </Bloco>

        <Bloco icon={HeartPulse} titulo="Demandas, providências e encaminhamentos">
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Demandas identificadas
              </p>
              <Chips items={ficha.demandas} />
            </div>
            <div>
              <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Providências adotadas
              </p>
              <Chips items={ficha.providencias} tom="leaf" />
            </div>
            <div>
              <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Procedimentos
              </p>
              <Chips items={ficha.procedimentos} />
            </div>
            <div>
              <p className="mb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Encaminhamentos realizados
              </p>
              <Chips items={ficha.encaminhamentos} />
            </div>
          </div>
        </Bloco>

        <Bloco icon={UsersRound} titulo="Responsável pelo registro">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            <Dado label="Nome" value={ficha.responsavelNome ?? ficha.profissionalResponsavel} />
            <Dado label="Cargo" value={ficha.responsavelCargo} />
            <Dado label="Registrada em" value={fmtDataHora(ficha.createdAt)} />
            {ficha.atualizadoEm && <Dado label="Última edição" value={fmtDataHora(ficha.atualizadoEm)} />}
          </dl>
          {ficha.assinaturaUsuario && (
            <div className="mt-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-400">
                Ciência do usuário
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ficha.assinaturaUsuario}
                alt="Assinatura do usuário"
                className="mt-2 h-24 rounded-lg border border-ink-100 bg-white object-contain p-1.5"
              />
            </div>
          )}
        </Bloco>
      </div>

      {/* ——— Evolução ——— */}
      <div className="animate-rise space-y-4" style={{ animationDelay: "140ms" }}>
        <h2 className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-ink-900">
          <History className="h-5 w-5 text-brand-600" />
          Evolução do caso
          <span className="rounded-full bg-ink-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-ink-500">
            {evos.length}
          </span>
        </h2>

        {evos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-card p-6 text-center text-[0.82rem] font-medium text-ink-400">
            Nenhuma evolução registrada. Acompanhe o caso registrando a primeira.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-ink-100 pl-5">
            {evos
              .slice()
              .reverse()
              .map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.72rem] top-1.5 h-3 w-3 rounded-full border-2 border-paper bg-brand-500" />
                  <div className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
                    <p className="whitespace-pre-line text-[0.88rem] leading-relaxed text-ink-800">
                      {e.texto}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-bold text-ink-400">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-ink-600">
                        <CircleUserRound className="h-3 w-3" />
                        {e.autorNome}
                        {e.autorCargo ? ` · ${e.autorCargo}` : ""}
                      </span>
                      <span>{fmtDataHora(e.createdAt)}</span>
                      {podeExcluirEvo && (
                        <span className="no-print ml-auto">
                          <BotaoExcluir
                            compacto
                            url={`/api/evolucoes/${e.id}`}
                            titulo="Excluir esta evolução?"
                            descricao={`Evolução registrada por ${e.autorNome} em ${fmtDataHora(e.createdAt)}.`}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ol>
        )}

        {podeEvoluir && (
          <div className="no-print">
            <EvolucaoForm atendimentoId={ficha.id} autor={`${usuario.nome}${usuario.cargo ? ` · ${usuario.cargo}` : ""}`} />
          </div>
        )}
      </div>
    </div>
  );
}
