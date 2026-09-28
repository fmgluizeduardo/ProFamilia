import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarHeart,
  CheckCircle2,
  Compass,
  Footprints,
  HeartHandshake,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { DIRETRIZES_SERVICO, ORGAO } from "@/lib/constants";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guia Operacional da Abordagem Social",
  description:
    "Diretrizes, público-alvo, etapas de atendimento e princípios da Abordagem Social do Instituto PróFamília.",
};

export const dynamic = "force-dynamic";

export default async function GuiaPage() {
  await exigirUsuario();
  const d = DIRETRIZES_SERVICO;

  return (
    <div className="space-y-6">
      {/* ——— Topo institucional ——— */}
      <div className="animate-rise">
        <div className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-sun-600">
          <BookOpen className="h-4 w-4" />
          Protocolo Operacional de Campo
        </div>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Diretrizes da Abordagem Social
        </h1>
        <p className="mt-1 text-[0.84rem] text-ink-500">
          {ORGAO.instituto} · {ORGAO.secretaria}
        </p>
      </div>

      {/* ——— 1. O que é o serviço ——— */}
      <section
        className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 font-display text-sm font-bold text-brand-700">
            1
          </span>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
            O que é o Serviço Especializado em Abordagem Social?
          </h2>
        </div>
        <div className="mt-4 space-y-3 text-[0.92rem] leading-relaxed text-ink-700">
          <p>{d.conceito}</p>
          <div className="rounded-xl border border-brand-200 bg-brand-50/80 p-4 font-semibold text-brand-900">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
              <Compass className="h-4 w-4" /> Princípio da Proatividade
            </span>
            <p className="mt-1 text-[0.88rem]">{d.proatividade}</p>
          </div>
        </div>
      </section>

      {/* ——— 2. Público-Alvo ——— */}
      <section
        className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf-100 font-display text-sm font-bold text-leaf-700">
            2
          </span>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
            Público-Alvo
          </h2>
        </div>
        <p className="mt-2 text-[0.82rem] font-medium text-ink-500">
          O serviço atende pessoas e famílias em situação de risco pessoal e social:
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {d.publicoAlvo.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-paper/60 px-3.5 py-2.5 text-[0.84rem] font-semibold text-ink-800"
            >
              <span className="h-2 w-2 rounded-full bg-leaf-500" />
              {p}
            </div>
          ))}
        </div>

        {/* Destaque Barretos */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-sun-200 bg-sun-50 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-sun-600" />
          <div className="text-[0.85rem] text-sun-900">
            <p className="font-bold uppercase tracking-wider text-sun-800 text-[0.72rem]">
              Contexto Local · Barretos / SP
            </p>
            <p className="mt-0.5 font-medium leading-relaxed">
              {d.destaqueBarretos}
            </p>
          </div>
        </div>
      </section>

      {/* ——— 3. O que NÃO é Abordagem Social ——— */}
      <section
        className="animate-rise rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50/70 to-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 font-display text-sm font-bold text-red-700">
            3
          </span>
          <h2 className="font-display text-base font-bold text-red-950 sm:text-lg">
            O que NÃO é Abordagem Social
          </h2>
        </div>
        <p className="mt-1 text-[0.82rem] font-bold text-red-700">
          Muitas equipes cometem esse erro! A abordagem social não é:
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {d.oQueNaoE.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-3 text-[0.86rem] font-bold text-red-800"
            >
              <XCircle className="h-5 w-5 shrink-0 text-red-600" strokeWidth={2.4} />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-red-300 bg-red-600 px-4 py-3 text-center text-[0.92rem] font-bold text-white shadow-sm">
          ⭐ {d.regraDeOuro} A equipe trabalha com construção de vínculo.
        </div>
      </section>

      {/* ——— 4. Principais Objetivos ——— */}
      <section
        className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 font-display text-sm font-bold text-brand-700">
            4
          </span>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
            Principais Objetivos
          </h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {d.principaisObjetivos.map((obj, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-ink-100 bg-paper/60 p-4"
            >
              <div>
                <p className="font-display text-[0.92rem] font-bold text-ink-900">
                  {obj.titulo}
                </p>
                <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-600">
                  {obj.exemplo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— 5. Principais Etapas do Atendimento ——— */}
      <section
        className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf-100 font-display text-sm font-bold text-leaf-700">
            5
          </span>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
            Principais Etapas do Atendimento
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {d.etapasAtendimento.map((etapa, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-ink-100/80 bg-white p-4 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 font-display text-xs font-bold text-white">
                {etapa.numero}
              </span>
              <div>
                <p className="font-display text-[0.92rem] font-bold text-ink-900">
                  {etapa.nome}
                </p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-600">
                  {etapa.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— 6. O Que a Equipe Precisa Registrar ——— */}
      <section
        className="animate-rise rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
        style={{ animationDelay: "360ms" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sun-100 font-display text-sm font-bold text-sun-700">
            6
          </span>
          <h2 className="font-display text-base font-bold text-ink-900 sm:text-lg">
            O que a Equipe Precisa Registrar:{" "}
            <span className="text-sun-600">TUDO</span>
          </h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-ink-100 bg-paper/60 p-4">
            <p className="font-display text-[0.88rem] font-bold text-ink-900">
              Ficha de Abordagem
            </p>
            <ul className="mt-2 space-y-1 text-[0.8rem] text-ink-600">
              {d.oQueRegistrar.fichaAbordagem.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-leaf-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-ink-100 bg-paper/60 p-4">
            <p className="font-display text-[0.88rem] font-bold text-ink-900">
              Ficha de Atendimento
            </p>
            <ul className="mt-2 space-y-1 text-[0.8rem] text-ink-600">
              {d.oQueRegistrar.fichaAtendimento.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-leaf-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ——— Botão de ação direta para o campo ——— */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
        <Link
          href="/nova"
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sun-500 to-sun-600 px-8 text-[0.92rem] font-bold text-white shadow-lift transition-all hover:brightness-105 active:scale-[0.98] sm:w-auto"
        >
          Iniciar Ficha de Atendimento
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
        <Link
          href="/fichas"
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-6 text-[0.88rem] font-bold text-ink-700 shadow-card transition-all hover:border-ink-300 active:scale-[0.98] sm:w-auto"
        >
          Consultar Fichas Registradas
        </Link>
      </div>
    </div>
  );
}
