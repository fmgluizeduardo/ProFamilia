import Link from "next/link";
import { FileSearch, House } from "lucide-react";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-card p-7 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
          <FileSearch className="h-6 w-6" />
        </span>
        <h1 className="font-display mt-4 text-lg font-bold text-ink-900">
          Registro não encontrado
        </h1>
        <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-500">
          Esta ficha pode ter sido excluída ou o endereço está incorreto.
          Consulte a lista de atendimentos para localizar o registro desejado.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/fichas"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-ink-900 text-[0.85rem] font-bold text-white transition-all hover:bg-ink-800 active:scale-[0.98]"
          >
            Ver todas as fichas
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-[0.85rem] font-bold text-ink-700 transition-all hover:border-ink-300 active:scale-[0.98]"
          >
            <House className="h-4 w-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}
