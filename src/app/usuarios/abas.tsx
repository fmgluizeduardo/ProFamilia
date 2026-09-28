import Link from "next/link";
import { Grid3x3, ScrollText, UsersRound } from "lucide-react";

export function AbasAdmin({ ativa }: { ativa: "usuarios" | "matriz" | "auditoria" }) {
  const abas = [
    { id: "usuarios", href: "/usuarios", rotulo: "Usuários", icone: UsersRound },
    { id: "matriz", href: "/usuarios/matriz", rotulo: "Matriz de acessos", icone: Grid3x3 },
    { id: "auditoria", href: "/usuarios/auditoria", rotulo: "Auditoria", icone: ScrollText },
  ] as const;
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100/70 p-1">
      {abas.map((a) => (
        <Link key={a.id} href={a.href}
          className={`flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-all sm:flex-none ${
            ativa === a.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          }`}>
          <a.icone className="h-4 w-4" /> {a.rotulo}
        </Link>
      ))}
    </div>
  );
}
