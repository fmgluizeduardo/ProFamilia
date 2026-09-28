"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";

// ——— Layout de formulário ———

export function Section({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card sm:p-6"
    >
      <h3 className="font-display text-[0.95rem] font-bold tracking-tight text-ink-900">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-[0.8rem] leading-relaxed text-ink-400">
          {description}
        </p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex items-baseline gap-1 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500">
        {label}
        {required && <span className="text-sun-500">*</span>}
        {hint && (
          <span className="ml-auto text-[0.68rem] font-medium normal-case tracking-normal text-ink-300">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-ink-200/90 bg-white px-4 text-[0.95rem] font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-300 transition-all duration-150 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function TextInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} h-13 ${className}`} {...props} />;
}

export function TextArea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputBase} min-h-24 py-3 leading-relaxed ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} h-13 appearance-none pr-10 ${className}`} {...props}>
      {children}
    </select>
  );
}

// ——— Opções ———

export type Opcao = { value: string; label: string; hint?: string };

export function RadioPills({
  options,
  value,
  onChange,
  columns = 0,
}: {
  options: (Opcao | string)[];
  value: string;
  onChange: (v: string) => void;
  /** 0 = auto (flex wrap). 2 ou 3 força grade. */
  columns?: 0 | 2 | 3;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const grid =
    columns === 2
      ? "grid grid-cols-2 gap-2"
      : columns === 3
        ? "grid grid-cols-3 gap-2"
        : "flex flex-wrap gap-2";
  return (
    <div className={grid}>
      {opts.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? "" : o.value)}
            className={`rounded-xl border px-3.5 py-2.5 text-left text-[0.82rem] font-semibold transition-all duration-150 active:scale-[0.97] ${
              columns ? "w-full" : ""
            } ${
              active
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                : "border-ink-200/90 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            {o.hint ? (
              <span>
                <span className="block">{o.label}</span>
                <span
                  className={`mt-0.5 block text-[0.68rem] font-medium leading-snug ${
                    active ? "text-brand-600/80" : "text-ink-400"
                  }`}
                >
                  {o.hint}
                </span>
              </span>
            ) : (
              o.label
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CheckChips({
  options,
  values,
  onToggle,
  columns = 0,
}: {
  options: (Opcao | string)[];
  values: string[];
  onToggle: (v: string) => void;
  columns?: 0 | 2;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const grid =
    columns === 2 ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2";
  return (
    <div className={grid}>
      {opts.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[0.82rem] font-semibold transition-all duration-150 active:scale-[0.97] ${
              columns ? "w-full" : ""
            } ${
              active
                ? "border-leaf-500 bg-leaf-50 text-leaf-700 ring-2 ring-leaf-200"
                : "border-ink-200/90 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[0.35rem] border transition-colors ${
                active ? "border-leaf-500 bg-leaf-500" : "border-ink-300 bg-white"
              }`}
            >
              {active && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ——— Bloco de subtítulo dentro de seção ———

export function SubTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="h-px flex-1 bg-ink-100" />
      <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink-400">
        {children}
      </span>
      <span className="h-px flex-1 bg-ink-100" />
    </div>
  );
}
