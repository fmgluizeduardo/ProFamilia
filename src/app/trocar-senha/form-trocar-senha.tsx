"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { CampoSenha, ChecklistSenha } from "@/components/campo-senha";
import { senhaForte } from "@/lib/permissoes";

export function FormTrocarSenha({ login, obrigatoria }: { login: string; obrigatoria: boolean }) {
  const router = useRouter();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const podeEnviar = !!atual && senhaForte(nova, login) && nova === confirma;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (nova !== confirma) return setErro("A confirmação não confere com a nova senha.");
    if (!podeEnviar) return setErro("Verifique os requisitos da nova senha.");
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual: atual, novaSenha: nova }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.erro ?? "Não foi possível alterar a senha.");
      setOk(true);
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 900);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
      setEnviando(false);
    }
  }

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (ok) {
    return (
      <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-leaf-200 bg-leaf-50 px-4 py-3.5 text-[0.85rem] font-bold text-leaf-800">
        <CheckCircle2 className="h-5 w-5" />
        Senha definida com sucesso! Entrando…
      </div>
    );
  }

  return (
    <form onSubmit={salvar} className="mt-5 space-y-4" noValidate>
      <CampoSenha
        id="atual"
        rotulo={obrigatoria ? "Senha atual (temporária)" : "Senha atual"}
        valor={atual}
        onChange={setAtual}
      />
      <CampoSenha id="nova" rotulo="Nova senha" valor={nova} onChange={setNova} autoComplete="new-password" />
      <ChecklistSenha senha={nova} login={login} />
      <CampoSenha id="confirma" rotulo="Confirme a nova senha" valor={confirma} onChange={setConfirma} autoComplete="new-password" />
      {confirma && nova !== confirma && (
        <p className="text-[0.76rem] font-semibold text-sun-700">As senhas não coincidem.</p>
      )}
      {erro && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.8rem] font-semibold text-red-700">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando || !podeEnviar}
        className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.92rem] font-bold text-white shadow-lift transition-all hover:bg-ink-800 active:scale-[0.98] disabled:opacity-50"
      >
        {enviando && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
        Salvar nova senha
      </button>
      {obrigatoria && (
        <button type="button" onClick={sair} className="inline-flex w-full items-center justify-center gap-1.5 text-[0.78rem] font-bold text-ink-400 hover:text-ink-700">
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      )}
    </form>
  );
}
