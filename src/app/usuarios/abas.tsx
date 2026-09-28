import Link from "next/link";
import { ScrollText, UsersRound } from "lucide-react";

export function AbasAdmin({ ativa }: { ativa: "usuarios" | "auditoria" }) {
  const abas = [
    { id: "usuarios", href: "/usuarios", rotulo: "Usuários", icone: UsersRound },
    { id: "auditoria", href: "/usuarios/auditoria", rotulo: "Auditoria", icone: ScrollText },
  ] as const;
  return (
    <div className="flex gap-1 rounded-xl bg-ink-100/70 p-1">
      {abas.map((a) => (
        <Link key={a.id} href={a.href}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-all sm:flex-none ${
            ativa === a.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          }`}>
          <a.icone className="h-4 w-4" /> {a.rotulo}
        </Link>
      ))}
    </div>
  );
}
