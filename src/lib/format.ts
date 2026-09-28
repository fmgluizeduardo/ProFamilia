const TZ = "America/Sao_Paulo";

const dfData = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dfDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dfMesAno = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  month: "short",
  year: "2-digit",
});

/** "2026-01-31" (ISO) → "31/01/2026" (sem conversão de fuso) */
export function fmtData(iso?: string | null): string {
  if (!iso) return "—";
  const m = String(iso).slice(0, 10).split("-");
  if (m.length !== 3) return String(iso);
  return `${m[2]}/${m[1]}/${m[0]}`;
}

export function fmtDataHora(dt?: Date | string | null): string {
  if (!dt) return "—";
  return dfDataHora.format(new Date(dt)).replace(",", " às");
}

export function fmtMesAno(iso: string): string {
  const [y, m] = iso.slice(0, 10).split("-").map(Number);
  return dfMesAno.format(new Date(Date.UTC(y, m - 1, 15)));
}

export function hojeISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function agoraHM(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

export function idadeDe(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(`${dataNascimento.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date(`${hojeISO()}T12:00:00`);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 && idade < 130 ? idade : null;
}

export function moedaBR(v?: string | number | null): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function labelSN(v?: string | null): string {
  if (v === "sim") return "Sim";
  if (v === "nao") return "Não";
  if (v === "parcialmente") return "Parcialmente";
  return "—";
}

// ——— Máscaras de entrada (cliente) ———

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function numeroAtendimento(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

export function dashISO(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
