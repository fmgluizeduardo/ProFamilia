import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { UsuarioForm } from "../usuario-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Novo usuário" };

export default async function NovoUsuarioPage() {
  await exigirUsuario("admin");
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/usuarios" className="inline-flex items-center gap-1.5 text-[0.82rem] font-bold text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Usuários
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Novo usuário</h1>
        <p className="mt-1 text-[0.82rem] text-ink-500">Cadastre o funcionário e defina exatamente o que ele pode visualizar, cadastrar, editar e excluir.</p>
      </div>
      <UsuarioForm />
    </div>
  );
}
