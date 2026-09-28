import Link from "next/link";
import { CalendarClock, ChevronRight, Landmark, MapPin } from "lucide-react";
import type { Atendimento } from "@/db/schema";
import { fmtData, numeroAtendimento } from "@/lib/format";

export function FichaCard({ a }: { a: Atendimento }) {
  const iniciais = (a.nomeSocial || a.nomeCompleto)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const emRua = a.situacaoAtual.includes("Situação de Rua");

  return (
    <Link
      href={`/fichas/${a.id}`}
      className="group flex items-center gap-3.5 rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.99]"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${
          emRua ? "bg-sun-100 text-sun-700" : "bg-brand-100 text-brand-700"
        }`}
      >
        {iniciais || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[0.92rem] font-bold text-ink-900">
            {a.nomeSocial ? `${a.nomeSocial} (${a.nomeCompleto})` : a.nomeCompleto}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.72rem] font-medium text-ink-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="max-w-44 truncate sm:max-w-64">{a.localAbordagem}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {fmtData(a.dataAtendimento)} · {a.horario}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="rounded-md bg-ink-50 px-1.5 py-0.5 font-display text-[0.62rem] font-bold tracking-wide text-ink-400">
          {numeroAtendimento(a.numero)}
        </span>
        {a.necessitaAcompanhamento === "sim" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-leaf-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-leaf-700">
            <Landmark className="h-2.5 w-2.5" />
            Acomp.
          </span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-200 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-400" />
    </Link>
  );
}
