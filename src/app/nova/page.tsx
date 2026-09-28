import type { Metadata } from "next";
import { exigirUsuario } from "@/lib/auth";
import { Wizard } from "./wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nova Ficha de Atendimento",
};

export default async function NovaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await exigirUsuario("fichas.criar");
  const sp = await searchParams;
  const salva = typeof sp.salva === "string" && /^\d{1,8}$/.test(sp.salva) ? sp.salva : undefined;
  return <Wizard usuarioNome={usuario.nome} usuarioCargo={usuario.cargo} salva={salva} />;
}
