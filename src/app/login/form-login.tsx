"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { CampoSenha } from "@/components/campo-senha";
import { AvisoErro } from "@/components/aviso-erro";
import { chamarApi } from "@/lib/api-cliente";

export function FormLogin() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !senha) {
      setErro("Informe usuário e senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const json = await chamarApi<{ deveTrocarSenha?: boolean }>("/api/auth/login", {
        json: { login: login.trim(), senha, lembrar },
      });
      router.replace(json.deveTrocarSenha ? "/trocar-senha" : "/");
      router.refresh();
    } catch (err) {
      setErro(err);
      setSenha("");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mt-5 space-y-4" noValidate>
      <div>
        <label htmlFor="login" className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-500">
          Usuário
        </label>
        <input
          id="login"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={64}
          className="h-13 w-full rounded-xl border border-ink-200/90 bg-white px-4 text-[0.95rem] font-medium text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>
      <CampoSenha id="senha" rotulo="Senha" valor={senha} onChange={setSenha} />
      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-100 bg-paper/60 px-3.5 py-3 text-[0.78rem] text-ink-600">
        <input
          type="checkbox"
          checked={lembrar}
          onChange={(e) => setLembrar(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        <span>
          <strong className="block text-ink-800">Manter conectado neste aparelho</strong>
          <span className="text-[0.72rem] text-ink-500">
            Mantém sua sessão por até 30 dias. Use somente em aparelho pessoal, nunca em computador compartilhado.
          </span>
        </span>
      </label>
      {erro ? <AvisoErro erro={erro} /> : null}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.92rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <LogIn className="h-4.5 w-4.5" />}
        Entrar
      </button>
      <p className="text-center text-[0.72rem] text-ink-400">Esqueceu a senha? Peça ao administrador para redefini-la.</p>
    </form>
  );
}
