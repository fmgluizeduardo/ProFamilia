"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CloudCheck,
  ClipboardPlus,
  HeartHandshake,
  Loader2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  BENEFICIOS,
  DEMANDAS,
  ENCAMINHAMENTOS,
  ESCOLARIDADES,
  ESTADOS_CIVIS,
  MORADIAS,
  MOTIVOS,
  ORIGENS_RENDA,
  PROCEDIMENTOS,
  PROVIDENCIAS,
  RUA_TIPOS,
  SEXOS,
  SEXO_OUTRA_IDENTIFICACAO,
  SIM_NAO,
  SIM_NAO_PARCIAL,
  SITUACOES,
  SUBSTANCIAS,
  USO_DROGAS,
  VINCULOS,
} from "@/lib/constants";
import {
  agoraHM,
  hojeISO,
  idadeDe,
  maskCPF,
  maskTelefone,
} from "@/lib/format";
import {
  CheckChips,
  Field,
  RadioPills,
  Section,
  SubTitle,
  TextArea,
  TextInput,
} from "@/components/ui";
import { SignaturePad } from "@/components/signature-pad";

export type FormState = {
  dataAtendimento: string;
  horario: string;
  localAbordagem: string;
  pontoReferencia: string;
  profissionalResponsavel: string;
  equipe: string;
  motivoAbordagem: string;
  motivoOutro: string;
  nomeCompleto: string;
  nomeSocial: string;
  dataNascimento: string;
  nomeMae: string;
  nomePai: string;
  idade: string;
  telefone: string;
  sexo: string;
  sexoOutro: string;
  estadoCivil: string;
  naturalidade: string;
  municipioOrigem: string;
  cpf: string;
  rg: string;
  possuiDocumentacao: string;
  situacaoAtual: string[];
  situacaoAtualOutro: string;
  tempoSituacao: string;
  ruaTipo: string;
  ruaMotivo: string;
  ruaQuantoTempo: string;
  ruaOndePermanece: string;
  vinculoPreservado: string;
  vinculoFamiliar: string;
  refFamiliarNome: string;
  refFamiliarTelefone: string;
  refFamiliarMunicipio: string;
  condicaoMoradia: string;
  condicaoMoradiaOutro: string;
  saudeCondicao: string;
  usoMedicacao: string;
  usoMedicacaoQual: string;
  atendimentoImediato: string;
  usoDrogas: string;
  substancias: string[];
  escolaridade: string;
  possuiRenda: string;
  origemRenda: string;
  origemRendaOutro: string;
  valorRenda: string;
  beneficios: string[];
  beneficiosOutro: string;
  numeroNis: string;
  demandas: string[];
  demandasOutro: string;
  providencias: string[];
  providenciasOutro: string;
  procedimentos: string[];
  encaminhamentos: string[];
  encaminhamentosOutro: string;
  necessitaAcompanhamento: string;
  acompanhamentoLocal: string;
  responsavelNome: string;
  responsavelCargo: string;
  assinaturaUsuario: string | null;
};

const VAZIO: FormState = {
  dataAtendimento: "",
  horario: "",
  localAbordagem: "",
  pontoReferencia: "",
  profissionalResponsavel: "",
  equipe: "",
  motivoAbordagem: "",
  motivoOutro: "",
  nomeCompleto: "",
  nomeSocial: "",
  dataNascimento: "",
  nomeMae: "",
  nomePai: "",
  idade: "",
  telefone: "",
  sexo: "",
  sexoOutro: "",
  estadoCivil: "",
  naturalidade: "",
  municipioOrigem: "",
  cpf: "",
  rg: "",
  possuiDocumentacao: "",
  situacaoAtual: [],
  situacaoAtualOutro: "",
  tempoSituacao: "",
  ruaTipo: "",
  ruaMotivo: "",
  ruaQuantoTempo: "",
  ruaOndePermanece: "",
  vinculoPreservado: "",
  vinculoFamiliar: "",
  refFamiliarNome: "",
  refFamiliarTelefone: "",
  refFamiliarMunicipio: "",
  condicaoMoradia: "",
  condicaoMoradiaOutro: "",
  saudeCondicao: "",
  usoMedicacao: "",
  usoMedicacaoQual: "",
  atendimentoImediato: "",
  usoDrogas: "",
  substancias: [],
  escolaridade: "",
  possuiRenda: "",
  origemRenda: "",
  origemRendaOutro: "",
  valorRenda: "",
  beneficios: [],
  beneficiosOutro: "",
  numeroNis: "",
  demandas: [],
  demandasOutro: "",
  providencias: [],
  providenciasOutro: "",
  procedimentos: [],
  encaminhamentos: [],
  encaminhamentosOutro: "",
  necessitaAcompanhamento: "",
  acompanhamentoLocal: "",
  responsavelNome: "",
  responsavelCargo: "",
  assinaturaUsuario: null,
};

const DRAFT_KEY = "profamilia:rascunho-ficha";

const ETAPAS = [
  { id: "atendimento", label: "Atendimento" },
  { id: "identificacao", label: "Identificação" },
  { id: "situacao", label: "Situação" },
  { id: "perfil", label: "Saúde & Perfil" },
  { id: "acoes", label: "Ações" },
  { id: "finalizar", label: "Finalizar" },
];

export type WizardProps = {
  /** Presente quando editando uma ficha existente. */
  edicao?: { id: string; numero: string; inicial: FormState };
  usuarioNome: string;
  usuarioCargo: string | null;
  /** Número da ficha recém-salva por quem não tem permissão de visualizá-la. */
  salva?: string;
};

export function Wizard({ edicao, usuarioNome, usuarioCargo, salva }: WizardProps) {
  const router = useRouter();
  const editando = !!edicao;
  const [etapa, setEtapa] = useState(0);
  const [form, setForm] = useState<FormState>(edicao?.inicial ?? VAZIO);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [restaurado, setRestaurado] = useState(false);
  const [hidratado, setHidratado] = useState(false);
  const salvarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topoRef = useRef<HTMLDivElement>(null);

  // Hidrata: rascunho salvo ou valores padrão de agora (edição usa os dados da ficha)
  useEffect(() => {
    if (editando) {
      setHidratado(true);
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { form: FormState; etapa: number };
        if (parsed?.form && (parsed.form.nomeCompleto || parsed.form.localAbordagem || parsed.form.motivoAbordagem)) {
          setForm({ ...VAZIO, ...parsed.form });
          setEtapa(Math.min(parsed.etapa ?? 0, ETAPAS.length - 1));
          setRestaurado(true);
          setHidratado(true);
          return;
        }
      }
    } catch {
      /* ignora */
    }
    setForm((f) => ({
      ...f,
      dataAtendimento: hojeISO(),
      horario: agoraHM(),
      profissionalResponsavel: f.profissionalResponsavel || usuarioNome,
      responsavelNome: f.responsavelNome || usuarioNome,
      responsavelCargo: f.responsavelCargo || usuarioCargo || "",
    }));
    setHidratado(true);
  }, [editando, usuarioNome, usuarioCargo]);

  // Salvamento automático do rascunho no aparelho (somente em novas fichas)
  useEffect(() => {
    if (!hidratado || editando) return;
    if (salvarTimer.current) clearTimeout(salvarTimer.current);
    salvarTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, etapa }));
      } catch {
        /* armazenamento cheio: ignora */
      }
    }, 500);
    return () => {
      if (salvarTimer.current) clearTimeout(salvarTimer.current);
    };
  }, [form, etapa, hidratado, editando]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggle = (key: keyof FormState, value: string) => {
    setForm((f) => {
      const arr = f[key] as string[];
      return {
        ...f,
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const idadeAuto = useMemo(() => idadeDe(form.dataNascimento), [form.dataNascimento]);

  useEffect(() => {
    if (idadeAuto !== null) set("idade", String(idadeAuto));
  }, [idadeAuto]);

  const emRua = form.situacaoAtual.includes("Situação de Rua");

  function validarEtapa(idx: number): string[] {
    const f = form;
    const faltando: string[] = [];
    if (idx === 0) {
      if (!f.dataAtendimento) faltando.push("Data do atendimento");
      if (!f.horario) faltando.push("Horário");
      if (!f.localAbordagem.trim()) faltando.push("Local da abordagem");
      if (!f.profissionalResponsavel.trim()) faltando.push("Profissional responsável");
      if (!f.motivoAbordagem) faltando.push("Motivo da abordagem");
    }
    if (idx === 1 && !f.nomeCompleto.trim()) faltando.push("Nome completo");
    return faltando;
  }

  function irPara(idx: number) {
    const problemas = validarEtapa(etapa);
    setErros(problemas);
    if (problemas.length && idx > etapa) {
      topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setEtapa(idx);
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  function limparRascunho() {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ ...VAZIO, dataAtendimento: hojeISO(), horario: agoraHM() });
    setEtapa(0);
    setErros([]);
    setRestaurado(false);
    window.scrollTo({ top: 0 });
  }

  async function enviar() {
    const problemas = [...validarEtapa(0), ...validarEtapa(1)];
    if (problemas.length) {
      setErros(problemas);
      setEtapa(0);
      return;
    }
    setEnviando(true);
    setErroEnvio(null);
    try {
      const payload = {
        ...form,
        idade: form.idade ? Number(form.idade) : null,
      };
      const res = await fetch(editando ? `/api/atendimentos/${edicao.id}` : "/api/atendimentos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Sua sessão expirou. Seus dados continuam salvos neste aparelho — entre novamente para enviar.");
      if (!res.ok) throw new Error(json?.erro ?? "Falha ao salvar");
      if (editando) {
        router.push(`/fichas/${edicao.id}?editado=1`);
        router.refresh();
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      if (json.podeVer) {
        router.push(`/fichas/${json.id}?novo=1`);
      } else {
        router.push(`/nova?salva=${String(json.numero).padStart(4, "0")}`);
        limparRascunho();
        setEnviando(false);
      }
    } catch (e) {
      setErroEnvio(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar. Verifique a conexão e tente novamente.",
      );
      setEnviando(false);
    }
  }

  const progresso = ((etapa + 1) / ETAPAS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      {/* ——— Cabeçalho da etapa ——— */}
      <div ref={topoRef} className="sticky top-[57px] z-30 -mx-4 bg-paper/90 px-4 pb-3 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:mx-0 lg:px-0 lg:pt-0">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sun-600">
              <ClipboardPlus className="h-3.5 w-3.5" strokeWidth={2.6} />
              {editando ? `Editando ficha #${edicao.numero}` : "Nova ficha de atendimento"}
            </div>
            <h1 className="font-display mt-1 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
              {ETAPAS[etapa].label}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-right">
            <Link
              href="/guia"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[0.68rem] font-bold text-ink-600 transition-colors hover:border-sun-300 hover:text-sun-700"
              title="Abrir diretrizes operacionais de campo"
            >
              <BookOpen className="h-3.5 w-3.5 text-sun-600" />
              <span className="hidden sm:inline">Diretrizes</span>
            </Link>
            <div>
              <span className="font-display text-sm font-bold text-ink-900">
                {etapa + 1}
                <span className="text-ink-300"> / {ETAPAS.length}</span>
              </span>
              <div className="hidden items-center gap-1.5 text-[0.62rem] font-semibold text-ink-400 sm:flex">
                <CloudCheck className="h-3.5 w-3.5 text-leaf-500" />
                Rascunho
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-leaf-400 to-sun-400 transition-all duration-500 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          {ETAPAS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              onClick={() => irPara(i)}
              className={`text-[0.58rem] font-bold uppercase tracking-wide transition-colors ${
                i === etapa
                  ? "text-brand-600"
                  : i < etapa
                    ? "text-ink-400"
                    : "text-ink-300"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* ——— Avisos ——— */}
      {salva && !editando && (
        <div className="animate-pop mt-3 flex items-center gap-2.5 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3 text-[0.82rem] font-bold text-leaf-800">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          Ficha #{salva} salva com sucesso. Você já pode registrar a próxima.
        </div>
      )}
      {restaurado && (
        <div className="animate-pop mt-3 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-[0.8rem] font-semibold text-brand-800">
            Rascunho recuperado do aparelho — continue de onde parou.
          </p>
          <button
            type="button"
            onClick={limparRascunho}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-bold text-brand-700 transition-colors hover:bg-brand-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Descartar
          </button>
        </div>
      )}

      {erros.length > 0 && (
        <div className="animate-pop mt-3 rounded-xl border border-sun-300 bg-sun-50 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.8rem] font-bold text-sun-800">
            <TriangleAlert className="h-4 w-4" />
            Preencha antes de avançar:
          </p>
          <ul className="mt-1 list-inside list-disc text-[0.78rem] font-medium text-sun-700">
            {erros.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ——— Conteúdo das etapas ——— */}
      <div className="animate-rise mt-5 space-y-5" key={etapa}>
        {etapa === 0 && (
          <Section
            title="Dados do atendimento"
            description="Quando, onde e por quem a abordagem foi realizada."
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" required>
                <TextInput
                  type="date"
                  value={form.dataAtendimento}
                  onChange={(e) => set("dataAtendimento", e.target.value)}
                />
              </Field>
              <Field label="Horário" required>
                <TextInput
                  type="time"
                  value={form.horario}
                  onChange={(e) => set("horario", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Local da abordagem" required>
              <TextInput
                placeholder="Ex.: Praça Francisco Barreto — Centro"
                value={form.localAbordagem}
                onChange={(e) => set("localAbordagem", e.target.value)}
              />
            </Field>
            <Field label="Ponto de referência">
              <TextInput
                placeholder="Ex.: Próximo ao coreto"
                value={form.pontoReferencia}
                onChange={(e) => set("pontoReferencia", e.target.value)}
              />
            </Field>
            <Field label="Profissional responsável" required>
              <TextInput
                placeholder="Nome do profissional"
                value={form.profissionalResponsavel}
                onChange={(e) => set("profissionalResponsavel", e.target.value)}
              />
            </Field>
            <Field label="Equipe">
              <TextInput
                placeholder="Ex.: Equipe A — Vespertino"
                value={form.equipe}
                onChange={(e) => set("equipe", e.target.value)}
              />
            </Field>
            <Field label="Motivo da abordagem" required>
              <RadioPills
                options={MOTIVOS}
                value={form.motivoAbordagem}
                onChange={(v) => set("motivoAbordagem", v)}
                columns={2}
              />
            </Field>
            {form.motivoAbordagem === "Outro" && (
              <Field label="Descreva o motivo">
                <TextInput
                  value={form.motivoOutro}
                  onChange={(e) => set("motivoOutro", e.target.value)}
                />
              </Field>
            )}
          </Section>
        )}

        {etapa === 1 && (
          <Section
            title="Identificação pessoal"
            description="Quem é a pessoa atendida. Nem todos os campos são conhecidos — registre o que for possível."
          >
            <Field label="Nome completo" required>
              <TextInput
                placeholder="Nome completo da pessoa atendida"
                value={form.nomeCompleto}
                onChange={(e) => set("nomeCompleto", e.target.value)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome social">
                <TextInput
                  value={form.nomeSocial}
                  onChange={(e) => set("nomeSocial", e.target.value)}
                />
              </Field>
              <Field label="Data de nascimento">
                <TextInput
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => set("dataNascimento", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Idade" hint={idadeAuto !== null ? "calculada" : undefined}>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={129}
                  value={form.idade}
                  onChange={(e) => set("idade", e.target.value)}
                />
              </Field>
              <Field label="Telefone">
                <TextInput
                  inputMode="tel"
                  placeholder="(17) 9.9999-9999"
                  value={form.telefone}
                  onChange={(e) => set("telefone", maskTelefone(e.target.value))}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome da mãe">
                <TextInput
                  value={form.nomeMae}
                  onChange={(e) => set("nomeMae", e.target.value)}
                />
              </Field>
              <Field label="Nome do pai">
                <TextInput
                  value={form.nomePai}
                  onChange={(e) => set("nomePai", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Sexo / identidade de gênero" hint="autodeclarado · opcional">
              <p className="mb-2.5 text-[0.77rem] leading-relaxed text-ink-500">
                Pergunte com respeito como a pessoa se identifica. Não presuma pela aparência
                e respeite se ela preferir não informar.
              </p>
              <RadioPills
                options={form.sexo === "Outro" ? [...SEXOS, "Outro"] : SEXOS}
                value={form.sexo}
                onChange={(v) => {
                  set("sexo", v);
                  if (v !== SEXO_OUTRA_IDENTIFICACAO) set("sexoOutro", "");
                }}
                columns={2}
              />
              {form.sexo === SEXO_OUTRA_IDENTIFICACAO && (
                <div className="mt-3">
                  <Field label="Como a pessoa se autodescreve?">
                    <TextInput
                      placeholder="Registre as palavras usadas pela pessoa"
                      value={form.sexoOutro}
                      maxLength={180}
                      onChange={(e) => set("sexoOutro", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </Field>
            <Field label="Estado civil">
              <RadioPills
                options={ESTADOS_CIVIS}
                value={form.estadoCivil}
                onChange={(v) => set("estadoCivil", v)}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Naturalidade">
                <TextInput
                  placeholder="Ex.: Barretos/SP"
                  value={form.naturalidade}
                  onChange={(e) => set("naturalidade", e.target.value)}
                />
              </Field>
              <Field label="Município de origem">
                <TextInput
                  value={form.municipioOrigem}
                  onChange={(e) => set("municipioOrigem", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <TextInput
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => set("cpf", maskCPF(e.target.value))}
                />
              </Field>
              <Field label="RG">
                <TextInput
                  value={form.rg}
                  onChange={(e) => set("rg", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Possui documentação?">
              <RadioPills
                options={SIM_NAO_PARCIAL}
                value={form.possuiDocumentacao}
                onChange={(v) => set("possuiDocumentacao", v)}
                columns={3}
              />
            </Field>
          </Section>
        )}

        {etapa === 2 && (
          <>
            <Section
              title="Situação atual"
              description="Marque todas as situações identificadas na abordagem."
            >
              <CheckChips
                options={SITUACOES}
                values={form.situacaoAtual}
                onToggle={(v) => toggle("situacaoAtual", v)}
                columns={2}
              />
              {form.situacaoAtual.includes("Outro") && (
                <Field label="Descreva a situação">
                  <TextInput
                    value={form.situacaoAtualOutro}
                    onChange={(e) => set("situacaoAtualOutro", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Tempo na situação identificada">
                <TextInput
                  placeholder="Ex.: cerca de 2 anos"
                  value={form.tempoSituacao}
                  onChange={(e) => set("tempoSituacao", e.target.value)}
                />
              </Field>
            </Section>

            {emRua && (
              <Section
                title="Situação de rua"
                description="Detalhes do cotidiano em situação de rua."
              >
                <Field label="Tipo">
                  <RadioPills
                    options={RUA_TIPOS}
                    value={form.ruaTipo}
                    onChange={(v) => set("ruaTipo", v)}
                    columns={2}
                  />
                </Field>
                <Field label="Motivo">
                  <TextInput
                    placeholder="Ex.: perda de emprego, conflito familiar…"
                    value={form.ruaMotivo}
                    onChange={(e) => set("ruaMotivo", e.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Quanto tempo">
                    <TextInput
                      value={form.ruaQuantoTempo}
                      onChange={(e) => set("ruaQuantoTempo", e.target.value)}
                    />
                  </Field>
                  <Field label="Onde costuma permanecer">
                    <TextInput
                      value={form.ruaOndePermanece}
                      onChange={(e) => set("ruaOndePermanece", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>
            )}

            <Section
              title="Composição familiar"
              description="Vínculos familiares e referências de contato."
            >
              <Field label="Possui vínculo familiar preservado?">
                <RadioPills
                  options={SIM_NAO_PARCIAL}
                  value={form.vinculoPreservado}
                  onChange={(v) => set("vinculoPreservado", v)}
                  columns={3}
                />
              </Field>
              <Field label="Vínculo familiar">
                <RadioPills
                  options={VINCULOS}
                  value={form.vinculoFamiliar}
                  onChange={(v) => set("vinculoFamiliar", v)}
                />
              </Field>
              <Field label="Nome de referência familiar">
                <TextInput
                  value={form.refFamiliarNome}
                  onChange={(e) => set("refFamiliarNome", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Telefone da referência">
                  <TextInput
                    inputMode="tel"
                    value={form.refFamiliarTelefone}
                    onChange={(e) =>
                      set("refFamiliarTelefone", maskTelefone(e.target.value))
                    }
                  />
                </Field>
                <Field label="Município onde reside a família">
                  <TextInput
                    value={form.refFamiliarMunicipio}
                    onChange={(e) => set("refFamiliarMunicipio", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Condições de moradia">
              <CheckChips
                options={MORADIAS}
                values={form.condicaoMoradia ? [form.condicaoMoradia] : []}
                onToggle={(v) =>
                  set("condicaoMoradia", form.condicaoMoradia === v ? "" : v)
                }
                columns={2}
              />
              {form.condicaoMoradia === "Outro" && (
                <Field label="Descreva">
                  <TextInput
                    value={form.condicaoMoradiaOutro}
                    onChange={(e) => set("condicaoMoradiaOutro", e.target.value)}
                  />
                </Field>
              )}
            </Section>
          </>
        )}

        {etapa === 3 && (
          <>
            <Section title="Saúde">
              <Field label="Possui alguma condição de saúde informada?">
                <TextArea
                  placeholder="Ex.: hipertensão, feridas, mobilidade reduzida…"
                  value={form.saudeCondicao}
                  onChange={(e) => set("saudeCondicao", e.target.value)}
                />
              </Field>
              <Field label="Faz uso contínuo de medicação?">
                <RadioPills
                  options={SIM_NAO}
                  value={form.usoMedicacao}
                  onChange={(v) => set("usoMedicacao", v)}
                  columns={3}
                />
              </Field>
              {form.usoMedicacao === "sim" && (
                <Field label="Qual medicação?">
                  <TextInput
                    value={form.usoMedicacaoQual}
                    onChange={(e) => set("usoMedicacaoQual", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Necessita atendimento de saúde imediato?">
                <RadioPills
                  options={SIM_NAO.map((o) =>
                    o.value === "sim" ? { ...o, label: "Sim — priorizar" } : o,
                  )}
                  value={form.atendimentoImediato}
                  onChange={(v) => set("atendimentoImediato", v)}
                  columns={2}
                />
              </Field>
              <Field label="Uso de álcool ou outras drogas">
                <RadioPills
                  options={USO_DROGAS}
                  value={form.usoDrogas}
                  onChange={(v) => set("usoDrogas", v)}
                  columns={2}
                />
              </Field>
              {form.usoDrogas && form.usoDrogas !== "nao_relata" && (
                <Field label="Substâncias relatadas">
                  <CheckChips
                    options={SUBSTANCIAS}
                    values={form.substancias}
                    onToggle={(v) => toggle("substancias", v)}
                  />
                </Field>
              )}
            </Section>

            <Section title="Escolaridade">
              <RadioPills
                options={ESCOLARIDADES}
                value={form.escolaridade}
                onChange={(v) => set("escolaridade", v)}
                columns={2}
              />
            </Section>

            <Section title="Renda">
              <Field label="Possui renda?">
                <RadioPills
                  options={SIM_NAO}
                  value={form.possuiRenda}
                  onChange={(v) => set("possuiRenda", v)}
                  columns={3}
                />
              </Field>
              {form.possuiRenda === "sim" && (
                <>
                  <Field label="Origem da renda">
                    <RadioPills
                      options={ORIGENS_RENDA}
                      value={form.origemRenda}
                      onChange={(v) => set("origemRenda", v)}
                      columns={2}
                    />
                  </Field>
                  {form.origemRenda === "Outro" && (
                    <Field label="Descreva a origem">
                      <TextInput
                        value={form.origemRendaOutro}
                        onChange={(e) => set("origemRendaOutro", e.target.value)}
                      />
                    </Field>
                  )}
                  <Field label="Valor aproximado">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.9rem] font-bold text-ink-400">
                        R$
                      </span>
                      <TextInput
                        className="pl-11"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={form.valorRenda}
                        onChange={(e) => set("valorRenda", e.target.value)}
                      />
                    </div>
                  </Field>
                </>
              )}
            </Section>

            <Section title="Benefícios sociais">
              <CheckChips
                options={BENEFICIOS}
                values={form.beneficios}
                onToggle={(v) => toggle("beneficios", v)}
                columns={2}
              />
              {form.beneficios.includes("Outro") && (
                <Field label="Qual benefício?">
                  <TextInput
                    value={form.beneficiosOutro}
                    onChange={(e) => set("beneficiosOutro", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Número do NIS (se possuir)">
                <TextInput
                  inputMode="numeric"
                  value={form.numeroNis}
                  onChange={(e) => set("numeroNis", e.target.value)}
                />
              </Field>
            </Section>
          </>
        )}

        {etapa === 4 && (
          <>
            <Section
              title="Demandas identificadas"
              description="O que a pessoa atendida necessita."
            >
              <CheckChips
                options={DEMANDAS}
                values={form.demandas}
                onToggle={(v) => toggle("demandas", v)}
                columns={2}
              />
              {form.demandas.includes("Outro") && (
                <Field label="Descreva">
                  <TextInput
                    value={form.demandasOutro}
                    onChange={(e) => set("demandasOutro", e.target.value)}
                  />
                </Field>
              )}
            </Section>

            <Section
              title="Providências adotadas"
              description="O que a equipe fez nesta abordagem."
            >
              <CheckChips
                options={PROVIDENCIAS}
                values={form.providencias}
                onToggle={(v) => toggle("providencias", v)}
                columns={2}
              />
              {form.providencias.includes("Outro") && (
                <Field label="Descreva">
                  <TextInput
                    value={form.providenciasOutro}
                    onChange={(e) => set("providenciasOutro", e.target.value)}
                  />
                </Field>
              )}
            </Section>

            <Section title="Procedimentos">
              <CheckChips
                options={PROCEDIMENTOS}
                values={form.procedimentos}
                onToggle={(v) => toggle("procedimentos", v)}
                columns={2}
              />
            </Section>

            <Section title="Encaminhamentos realizados">
              <CheckChips
                options={ENCAMINHAMENTOS}
                values={form.encaminhamentos}
                onToggle={(v) => toggle("encaminhamentos", v)}
                columns={2}
              />
              {form.encaminhamentos.includes("Outro") && (
                <Field label="Descreva">
                  <TextInput
                    value={form.encaminhamentosOutro}
                    onChange={(e) => set("encaminhamentosOutro", e.target.value)}
                  />
                </Field>
              )}
            </Section>

            <Section title="Acompanhamento">
              <Field label="Necessita acompanhamento?">
                <RadioPills
                  options={SIM_NAO}
                  value={form.necessitaAcompanhamento}
                  onChange={(v) => set("necessitaAcompanhamento", v)}
                  columns={3}
                />
              </Field>
              {form.necessitaAcompanhamento === "sim" && (
                <Field label="Local do acompanhamento">
                  <TextInput
                    placeholder="Ex.: CRAS Centro, CAPS AD…"
                    value={form.acompanhamentoLocal}
                    onChange={(e) => set("acompanhamentoLocal", e.target.value)}
                  />
                </Field>
              )}
            </Section>
          </>
        )}

        {etapa === 5 && (
          <>
            <Section
              title="Responsável pelo registro"
              description="Identificação do profissional que assina a ficha."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome">
                  <TextInput
                    value={form.responsavelNome}
                    onChange={(e) => set("responsavelNome", e.target.value)}
                  />
                </Field>
                <Field label="Cargo">
                  <TextInput
                    placeholder="Ex.: Assistente Social"
                    value={form.responsavelCargo}
                    onChange={(e) => set("responsavelCargo", e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Ciência do usuário (quando possível)"
              description="Assinatura da pessoa atendida, coletada na tela do aparelho."
            >
              {editando && edicao.inicial.assinaturaUsuario && (
                <div className="mb-3 rounded-xl border border-ink-100 bg-paper p-3">
                  <p className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-400">Assinatura já registrada</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={edicao.inicial.assinaturaUsuario} alt="Assinatura registrada" className="mt-1.5 h-16 rounded bg-white object-contain" />
                  <p className="mt-1.5 text-[0.72rem] text-ink-500">Ela será mantida. Para substituir, colete uma nova abaixo.</p>
                </div>
              )}
              <SignaturePad
                onChange={(v) => set("assinaturaUsuario", v ?? (editando ? edicao.inicial.assinaturaUsuario : null))}
              />
            </Section>

            <Section title="Resumo da ficha">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { n: form.situacaoAtual.length, l: "situações" },
                  { n: form.demandas.length, l: "demandas" },
                  { n: form.providencias.length, l: "providências" },
                  { n: form.encaminhamentos.length, l: "encaminhamentos" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-xl border border-ink-100 bg-paper px-3 py-2.5 text-center"
                  >
                    <div className="font-display text-xl font-bold text-ink-900">
                      {s.n}
                    </div>
                    <div className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-400">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
              <dl className="space-y-2 text-[0.85rem]">
                <div className="flex justify-between gap-3 border-b border-ink-100/70 pb-2">
                  <dt className="font-semibold text-ink-400">Pessoa atendida</dt>
                  <dd className="text-right font-bold text-ink-900">
                    {form.nomeCompleto || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-ink-100/70 pb-2">
                  <dt className="font-semibold text-ink-400">Local</dt>
                  <dd className="text-right font-bold text-ink-900">
                    {form.localAbordagem || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="font-semibold text-ink-400">Motivo</dt>
                  <dd className="text-right font-bold text-ink-900">
                    {form.motivoAbordagem || "—"}
                  </dd>
                </div>
              </dl>
              {erroEnvio && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.8rem] font-semibold text-red-700">
                  {erroEnvio}
                </p>
              )}
            </Section>
          </>
        )}
      </div>

      {/* ——— Navegação ——— */}
      <div className="mt-6 flex items-center gap-3">
        {etapa > 0 ? (
          <button
            type="button"
            onClick={() => irPara(etapa - 1)}
            className="inline-flex h-13 items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 text-[0.88rem] font-bold text-ink-600 transition-all hover:border-ink-300 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        ) : editando ? (
          <button
            type="button"
            onClick={() => router.push(`/fichas/${edicao.id}`)}
            className="inline-flex h-13 items-center gap-2 rounded-xl px-4 text-[0.85rem] font-bold text-ink-400 transition-colors hover:text-ink-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={limparRascunho}
            className="inline-flex h-13 items-center gap-2 rounded-xl px-4 text-[0.85rem] font-bold text-ink-400 transition-colors hover:text-ink-600"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </button>
        )}

        {etapa < ETAPAS.length - 1 ? (
          <button
            type="button"
            onClick={() => irPara(etapa + 1)}
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 text-[0.9rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98]"
          >
            Avançar
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sun-500 to-sun-600 px-6 text-[0.92rem] font-bold text-white shadow-lift transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Salvando ficha…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4.5 w-4.5" />
                {editando ? "Salvar alterações" : "Salvar ficha de atendimento"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
