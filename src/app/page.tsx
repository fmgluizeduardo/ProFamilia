import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ClipboardPlus,
  Files,
  HeartPulse,
  House,
  LayoutDashboard,
  LifeBuoy,
  Route,
  Sparkles,
  Truck,
  UserCheck,
} from "lucide-react";
import { db } from "@/db";
import { atendimentos, veiculoRegistros } from "@/db/schema";
import { fmtDataHora, hojeISO } from "@/lib/format";
import { FichaCard } from "@/components/ficha-card";
import { exigirUsuario } from "@/lib/auth";
import { filtroEscopoFichas } from "@/lib/escopo";
import { temPermissao } from "@/lib/permissoes";

export const dynamic = "force-dynamic";

function saudacao(): string {
  const hora = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  if (hora < 6) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function HomePage() {
  const usuario = await exigirUsuario();
  const podeCriar = temPermissao(usuario, "fichas.criar");
  const podeVerFichas = temPermissao(usuario, "fichas.ver");
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);

  const [totalGeral, totalHoje, acompanhamentos, emRua, kmMes, recentes] =
    await Promise.all([
      db.select({ c: count() }).from(atendimentos),
      db
        .select({ c: count() })
        .from(atendimentos)
        .where(eq(atendimentos.dataAtendimento, hoje)),
      db
        .select({ c: count() })
        .from(atendimentos)
        .where(eq(atendimentos.necessitaAcompanhamento, "sim")),
      db
        .select({ c: count() })
        .from(atendimentos)
        .where(
          sql`${atendimentos.situacaoAtual} @> ARRAY['Situação de Rua']::text[]`,
        ),
      db
        .select({
          km: sql<number>`coalesce(sum(${veiculoRegistros.chegadaKm} - ${veiculoRegistros.saidaKm}), 0)`,
        })
        .from(veiculoRegistros)
        .where(
          sql`${veiculoRegistros.data} >= ${`${mesAtual}-01`}`,
        ),
      db
        .select()
        .from(atendimentos)
        .where(filtroEscopoFichas(usuario))
        .orderBy(desc(atendimentos.createdAt))
        .limit(5),
    ]);

  const stats = [
    {
      label: "Fichas hoje",
      valor: totalHoje[0]?.c ?? 0,
      icon: ClipboardPlus,
      cor: "text-sun-600 bg-sun-100",
    },
    {
      label: "Total de fichas",
      valor: totalGeral[0]?.c ?? 0,
      icon: Files,
      cor: "text-brand-600 bg-brand-100",
    },
    {
      label: "Em acompanhamento",
      valor: acompanhamentos[0]?.c ?? 0,
      icon: UserCheck,
      cor: "text-leaf-600 bg-leaf-100",
    },
    {
      label: "Situação de rua",
      valor: emRua[0]?.c ?? 0,
      icon: House,
      cor: "text-ink-600 bg-ink-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ——— Saudação ——— */}
      <div className="animate-rise">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink-400">
          {saudacao()}, equipe
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Abordagem Social{" "}
          <span className="text-brand-600">em campo</span>
        </h1>
      </div>

      {/* ——— CTA principal ——— */}
      {podeCriar && (
      <Link
        href="/nova"
        className="animate-rise group relative block overflow-hidden rounded-3xl bg-ink-950 p-6 shadow-lift transition-transform duration-300 hover:-translate-y-1 active:scale-[0.99] sm:p-7"
        style={{ animationDelay: "60ms" }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-25 blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #3b8fd4, transparent 60%), radial-gradient(circle at 75% 70%, #e67e22, transparent 55%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sun-400">
              Registrar agora
            </p>
            <p className="font-display mt-1.5 text-xl font-bold leading-tight text-white sm:text-2xl">
              Nova ficha de atendimento
            </p>
            <p className="mt-2 max-w-md text-[0.8rem] font-medium leading-relaxed text-ink-300">
              Preencha em etapas, direto do celular. O rascunho fica salvo no
              aparelho até o envio.
            </p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sun-400 to-sun-600 shadow-lift transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <ClipboardPlus className="h-6.5 w-6.5 text-white" strokeWidth={2.3} />
          </span>
        </div>
      </Link>
      )}

      {/* ——— Indicadores ——— */}
      <div
        className="animate-rise grid grid-cols-2 gap-3 lg:grid-cols-4"
        style={{ animationDelay: "120ms" }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card"
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.cor}`}
            >
              <s.icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <p className="font-display mt-2.5 text-2xl font-bold tracking-tight text-ink-900">
              {s.valor}
            </p>
            <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ——— Acesso rápido ——— */}
      <div
        className="animate-rise grid grid-cols-2 gap-3 sm:grid-cols-4"
        style={{ animationDelay: "180ms" }}
      >
        {[
          { href: "/fichas", icon: Files, label: "Todas as fichas", req: "fichas.ver" as const },
          { href: "/veiculos", icon: Truck, label: "Controle de veículo", req: "veiculos.ver" as const },
          { href: "/guia", icon: BookOpen, label: "Guia & Diretrizes", req: null },
          { href: "/gerencia", icon: LayoutDashboard, label: "Área de gerência", req: "gerencia.ver" as const },
        ].filter((a) => !a.req || temPermissao(usuario, a.req)).map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-ink-100/80 bg-card py-4 shadow-card transition-all hover:border-brand-200 hover:shadow-lift active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
              <a.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <span className="px-2 text-center text-[0.72rem] font-bold leading-tight text-ink-600">
              {a.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ——— Destaque do Protocolo Operacional de Campo ——— */}
      <Link
        href="/guia"
        className="animate-rise flex items-center justify-between gap-4 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-orange-50/70 p-4 shadow-card transition-all hover:border-amber-300 hover:shadow-lift"
        style={{ animationDelay: "210ms" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
            <BookOpen className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-amber-800">
              Protocolo Operacional Oficial
            </p>
            <p className="font-display text-[0.88rem] font-bold text-ink-900">
              Diretrizes de Abordagem, Público-Alvo &amp; Barretos
            </p>
            <p className="mt-0.5 text-[0.72rem] text-ink-600">
              Adesão voluntária · Construção de vínculo · As 4 etapas do atendimento
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-amber-700" />
      </Link>

      {/* ——— Central de ajuda ——— */}
      <Link
        href="/manual"
        className="animate-rise flex items-center justify-between gap-4 rounded-2xl border border-brand-200/90 bg-gradient-to-r from-brand-50/90 to-ink-50/70 p-4 shadow-card transition-all hover:border-brand-300 hover:shadow-lift"
        style={{ animationDelay: "225ms" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-700">
            <LifeBuoy className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-brand-700">
              Central de ajuda
            </p>
            <p className="font-display text-[0.88rem] font-bold text-ink-900">
              Manual do usuário passo a passo
            </p>
            <p className="mt-0.5 text-[0.72rem] text-ink-600">
              Nova ficha · Evoluções · Veículo · Relatórios · Dúvidas frequentes
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-brand-700" />
      </Link>

      {/* ——— Recentes ——— */}
      {podeVerFichas && (
      <div className="animate-rise" style={{ animationDelay: "240ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[1.02rem] font-bold tracking-tight text-ink-900">
            Fichas recentes
          </h2>
          <Link
            href="/fichas"
            className="inline-flex items-center gap-1 text-[0.78rem] font-bold text-brand-600 transition-colors hover:text-brand-700"
          >
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recentes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-8 text-center">
            <HeartPulse className="mx-auto h-8 w-8 text-ink-200" strokeWidth={1.6} />
            <p className="mt-3 text-[0.85rem] font-semibold text-ink-500">
              Nenhuma ficha registrada ainda.
            </p>
            <p className="mt-1 text-[0.78rem] text-ink-400">
              Comece registrando a primeira abordagem da equipe.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentes.map((a) => (
              <FichaCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>

      )}

      {/* ——— Resumo operacional ——— */}
      <div
        className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-100 text-leaf-600">
            <Route className="h-5 w-5" strokeWidth={2.1} />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-ink-900">
              {Math.round(kmMes[0]?.km ?? 0).toLocaleString("pt-BR")} km
            </p>
            <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-wider text-ink-400">
              Rodados neste mês
            </p>
          </div>
        </div>
        <Link
          href="/gerencia"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-[0.78rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.98]"
        >
          Relatórios completos
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="pb-2 text-center text-[0.66rem] font-medium text-ink-300">
        Última sincronização: {fmtDataHora(new Date())}
      </p>
    </div>
  );
}
