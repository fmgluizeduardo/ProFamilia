import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { obterUsuarioAtual, sistemaSemUsuarios } from "@/lib/auth";
import { FormLogin } from "./form-login";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const usuario = await obterUsuarioAtual();
  if (usuario) redirect(usuario.deveTrocarSenha ? "/trocar-senha" : "/");
  const primeiroAcesso = await sistemaSemUsuarios();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-950 px-4 py-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(59,143,212,.35), transparent 40%), radial-gradient(circle at 85% 80%, rgba(230,126,34,.3), transparent 40%)",
        }}
      />
      <div className="animate-rise relative w-full max-w-sm">
        <div className="mb-7 flex justify-center">
          <Logo invert markClassName="h-12 w-12" />
        </div>
        <div className="rounded-3xl bg-card p-7 shadow-lift">
          <h1 className="font-display text-xl font-bold text-ink-900">Acesse sua conta</h1>
          <p className="mt-1 text-[0.82rem] text-ink-500">
            Serviço Especializado em Abordagem Social · Barretos/SP
          </p>
          {primeiroAcesso && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-[0.78rem] leading-relaxed text-brand-900">
              <strong>Primeiro acesso ao sistema:</strong> entre com usuário{" "}
              <code className="rounded bg-white px-1 font-bold">admin</code> e senha{" "}
              <code className="rounded bg-white px-1 font-bold">admin</code>. Você deverá cadastrar
              uma nova senha em seguida.
            </div>
          )}
          <FormLogin />
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acesso restrito à equipe do Instituto PróFamília
        </p>
      </div>
    </div>
  );
}
