import Link from "next/link";
import { CarFront, Route } from "lucide-react";

export function AbasVeiculos({ ativa }: { ativa: "percursos" | "frota" }) {
  const abas = [
    { id: "percursos", href: "/veiculos", rotulo: "Percursos", icone: Route },
    { id: "frota", href: "/veiculos/frota", rotulo: "Frota", icone: CarFront },
  ] as const;
  return (
    <div className="flex gap-1 rounded-xl bg-ink-100/70 p-1">
      {abas.map((a) => (
        <Link
          key={a.id}
          href={a.href}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-all sm:flex-none ${
            ativa === a.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          <a.icone className="h-4 w-4" /> {a.rotulo}
        </Link>
      ))}
    </div>
  );
}
