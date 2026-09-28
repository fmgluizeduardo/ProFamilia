// Gráficos em SVG puro — renderizáveis no servidor, leves e sem dependências.

export type Fatia = { label: string; valor: number; cor?: string };

const PALETA = [
  "#3b8fd4",
  "#e67e22",
  "#679e3f",
  "#2d74b8",
  "#eb8d33",
  "#84b75a",
  "#4b678f",
  "#efa75c",
  "#a7cc83",
  "#8dc7ef",
  "#d0671a",
  "#426b28",
  "#6e89ae",
  "#ad5017",
];

export function cores(i: number): string {
  return PALETA[i % PALETA.length];
}

/** Rosca (donut) com legenda lateral. */
export function Donut({
  dados,
  tamanho = 150,
}: {
  dados: Fatia[];
  tamanho?: number;
}) {
  const total = dados.reduce((a, d) => a + d.valor, 0);
  const r = 42;
  const circ = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[0.8rem] font-medium text-ink-300">
        Sem dados no período.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg
        width={tamanho}
        height={tamanho}
        viewBox="0 0 100 100"
        className="shrink-0 -rotate-90"
        role="img"
      >
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e3eaf3" strokeWidth="13" />
        {dados.map((d, i) => {
          const frac = d.valor / total;
          const inicio = dados.slice(0, i).reduce((soma, anterior) => soma + anterior.valor, 0) / total;
          return (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={d.cor ?? cores(i)}
              strokeWidth="13"
              strokeDasharray={`${Math.max(frac * circ - 0.6, 0)} ${circ}`}
              strokeDashoffset={-inicio * circ}
              strokeLinecap="butt"
            />
          );
        })}
        <text
          x="50"
          y="47"
          textAnchor="middle"
          className="rotate-90"
          transform="rotate(90 50 50)"
          style={{ font: "700 15px var(--font-display)" }}
          fill="#16222f"
        >
          {total}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          transform="rotate(90 50 50)"
          style={{ font: "700 5.5px var(--font-body)", letterSpacing: "0.08em" }}
          fill="#9bb1cc"
        >
          TOTAL
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {dados.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-[0.76rem]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[0.3rem]"
              style={{ background: d.cor ?? cores(i) }}
            />
            <span className="min-w-0 flex-1 truncate font-semibold text-ink-600">
              {d.label}
            </span>
            <span className="font-display font-bold text-ink-900">{d.valor}</span>
            <span className="w-10 text-right text-[0.68rem] font-bold text-ink-300">
              {Math.round((d.valor / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontais ordenadas (ranking). */
export function HBars({ dados, limite = 8 }: { dados: Fatia[]; limite?: number }) {
  const lista = dados.slice(0, limite);
  const max = Math.max(...lista.map((d) => d.valor), 1);
  if (lista.length === 0 || lista.every((d) => d.valor === 0)) {
    return (
      <div className="flex h-28 items-center justify-center text-[0.8rem] font-medium text-ink-300">
        Sem dados no período.
      </div>
    );
  }
  return (
    <ul className="space-y-2.5">
      {lista.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[0.76rem]">
            <span className="min-w-0 truncate font-semibold text-ink-600">
              {d.label}
            </span>
            <span className="font-display shrink-0 font-bold text-ink-900">
              {d.valor}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-ink-100/80">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${(d.valor / max) * 100}%`,
                background: d.cor ?? cores(i),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Barras verticais por período (ex.: atendimentos por mês). */
export function VBars({ dados }: { dados: Fatia[] }) {
  const max = Math.max(...dados.map((d) => d.valor), 1);
  if (dados.every((d) => d.valor === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-[0.8rem] font-medium text-ink-300">
        Sem dados no período.
      </div>
    );
  }
  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {dados.map((d, i) => (
          <div key={d.label} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="font-display text-[0.72rem] font-bold text-ink-900 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
              {d.valor > 0 ? d.valor : ""}
            </span>
            <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-ink-50/70">
              <div
                className="w-full rounded-lg transition-all duration-700 group-hover:brightness-110"
                style={{
                  height: `${Math.max((d.valor / max) * 100, d.valor > 0 ? 6 : 0)}%`,
                  background:
                    d.cor ??
                    `linear-gradient(180deg, ${cores(i)}cc, ${cores(i)})`,
                }}
              />
            </div>
            <span className="w-full truncate text-center text-[0.6rem] font-bold uppercase tracking-wide text-ink-400">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
