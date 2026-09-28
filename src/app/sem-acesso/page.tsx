import type { Metadata } from "next";
import Link from "next/link";
import { House, Lock } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acesso restrito" };

export default async function SemAcessoPage() {
  const usuario = await exigirUsuario();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-card p-7 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-sun-700">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-lg font-bold text-ink-900">Acesso restrito</h1>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-500">
          {usuario.nome.split(" ")[0]}, seu perfil não tem permissão para acessar esta área.
          Se precisar deste acesso para o seu trabalho, solicite ao administrador do sistema.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[0.85rem] font-bold text-white transition-all hover:bg-ink-800"
        >
          <House className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
