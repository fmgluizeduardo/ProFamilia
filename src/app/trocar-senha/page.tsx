import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { exigirUsuario } from "@/lib/auth";
import { FormTrocarSenha } from "./form-trocar-senha";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Definir nova senha" };

export default async function TrocarSenhaPage() {
  const usuario = await exigirUsuario(undefined, { permitirTrocaPendente: true });
  const obrigatoria = usuario.deveTrocarSenha;

  return (
    <div className={obrigatoria ? "flex min-h-dvh items-center justify-center bg-ink-950 px-4 py-10" : "mx-auto max-w-md"}>
      <div className="animate-rise w-full max-w-sm">
        {obrigatoria && (
          <div className="mb-7 flex justify-center">
            <Logo invert markClassName="h-12 w-12" />
          </div>
        )}
        <div className="rounded-3xl bg-card p-7 shadow-lift">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-100 text-sun-700">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="font-display mt-3 text-xl font-bold text-ink-900">
            {obrigatoria ? "Crie sua senha pessoal" : "Alterar minha senha"}
          </h1>
          <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-500">
            {obrigatoria
              ? `Olá, ${usuario.nome.split(" ")[0]}! Por segurança, defina uma senha só sua antes de usar o sistema. Não compartilhe com ninguém.`
              : "Após a alteração, seus outros aparelhos conectados serão desconectados."}
          </p>
          <FormTrocarSenha login={usuario.login} obrigatoria={obrigatoria} />
        </div>
      </div>
    </div>
  );
}
