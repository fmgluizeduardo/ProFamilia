"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { regrasSenha } from "@/lib/permissoes";

export function CampoSenha({
  id,
  rotulo,
  valor,
  onChange,
  autoComplete = "current-password",
  placeholder,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={valor}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={128}
          onChange={(e) => onChange(e.target.value)}
          className="h-13 w-full rounded-xl border border-ink-200/90 bg-white pl-4 pr-12 text-[0.95rem] font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        >
          {visivel ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}

export function ChecklistSenha({ senha, login }: { senha: string; login?: string }) {
  return (
    <ul className="space-y-1">
      {regrasSenha(senha, login).map((r) => (
        <li key={r.texto} className={`flex items-center gap-2 text-[0.76rem] font-semibold ${r.ok ? "text-leaf-700" : "text-ink-400"}`}>
          <span className={`flex h-4 w-4 items-center justify-center rounded-full ${r.ok ? "bg-leaf-500 text-white" : "bg-ink-100 text-ink-400"}`}>
            {r.ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-2.5 w-2.5" strokeWidth={3} />}
          </span>
          {r.texto}
        </li>
      ))}
    </ul>
  );
}
