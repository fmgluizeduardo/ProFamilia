"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  ClipboardPlus,
  Files,
  House,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Truck,
  UsersRound,
} from "lucide-react";
import { Logo } from "./logo";
import { temPermissao, type RequisitoAcesso } from "@/lib/permissoes";

export type UsuarioShell = {
  nome: string;
  login: string;
  cargo: string | null;
  papel: "admin" | "usuario";
  permissoes: string[];
  deveTrocarSenha: boolean;
};

type ItemNav = {
  href: string;
  label: string;
  curto?: string;
  icon: React.ElementType;
  exact?: boolean;
  cta?: boolean;
  requisito?: RequisitoAcesso;
};

const NAV: ItemNav[] = [
  { href: "/", label: "Início", icon: House, exact: true },
  { href: "/fichas", label: "Fichas", icon: Files, requisito: "fichas.ver" },
  { href: "/nova", label: "Nova Ficha", curto: "Nova", icon: ClipboardPlus, cta: true, requisito: "fichas.criar" },
  { href: "/veiculos", label: "Veículo", icon: Truck, requisito: "veiculos.ver" },
  { href: "/guia", label: "Guia & Diretrizes", icon: BookOpen },
  { href: "/manual", label: "Manual de Uso", icon: LifeBuoy },
  { href: "/gerencia", label: "Gerência", icon: LayoutDashboard, requisito: "gerencia.ver" },
  { href: "/usuarios", label: "Usuários e acessos", icon: UsersRound, requisito: "admin" },
];

const MOBILE = ["/", "/fichas", "/nova", "/veiculos", "/gerencia"];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function iniciais(nome: string) {
  return nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function MenuConta({ usuario, escuro = false }: { usuario: UsuarioShell; escuro?: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors ${
          escuro ? "hover:bg-white/5" : "hover:bg-ink-50"
        }`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[0.78rem] font-bold ${
          usuario.papel === "admin" ? "bg-sun-500 text-white" : "bg-brand-500 text-white"
        }`}>
          {iniciais(usuario.nome)}
        </span>
        <span className={`min-w-0 flex-1 ${escuro ? "" : "hidden sm:block"}`}>
          <span className={`block truncate text-[0.8rem] font-bold ${escuro ? "text-white" : "text-ink-900"}`}>
            {usuario.nome}
          </span>
          <span className={`block truncate text-[0.66rem] font-semibold ${escuro ? "text-ink-400" : "text-ink-400"}`}>
            {usuario.papel === "admin" ? "Administrador" : usuario.cargo || `@${usuario.login}`}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${aberto ? "rotate-180" : ""} ${escuro ? "text-ink-400" : "text-ink-400"}`} />
      </button>

      {aberto && (
        <div
          role="menu"
          className={`animate-pop absolute z-50 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-card py-1.5 shadow-lift ${
            escuro ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"
          }`}
        >
          <div className="border-b border-ink-100 px-4 pb-2.5 pt-1.5">
            <p className="truncate text-[0.82rem] font-bold text-ink-900">{usuario.nome}</p>
            <p className="truncate text-[0.7rem] text-ink-400">@{usuario.login}</p>
            {usuario.papel === "admin" && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-sun-700">
                <ShieldCheck className="h-3 w-3" /> Administrador
              </span>
            )}
          </div>
          {usuario.papel === "admin" && (
            <Link role="menuitem" href="/usuarios" onClick={() => setAberto(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-semibold text-ink-700 hover:bg-ink-50">
              <UsersRound className="h-4 w-4 text-ink-400" /> Usuários e acessos
            </Link>
          )}
          <Link role="menuitem" href="/trocar-senha" onClick={() => setAberto(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-semibold text-ink-700 hover:bg-ink-50">
            <KeyRound className="h-4 w-4 text-ink-400" /> Alterar minha senha
          </Link>
          <Link role="menuitem" href="/manual" onClick={() => setAberto(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-semibold text-ink-700 hover:bg-ink-50">
            <LifeBuoy className="h-4 w-4 text-ink-400" /> Manual de uso
          </Link>
          <button role="menuitem" type="button" onClick={sair} className="flex w-full items-center gap-2.5 border-t border-ink-100 px-4 py-2.5 text-[0.82rem] font-bold text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, usuario }: { children: ReactNode; usuario: UsuarioShell | null }) {
  const pathname = usePathname();

  // Telas sem o menu do app: impressão, login e troca obrigatória de senha.
  const semChrome =
    !usuario ||
    pathname.startsWith("/imprimir") ||
    pathname.startsWith("/login") ||
    (usuario.deveTrocarSenha && pathname.startsWith("/trocar-senha"));
  if (semChrome) return <>{children}</>;

  const itens = NAV.filter((i) => !i.requisito || temPermissao(usuario, i.requisito));
  const moveis = itens.filter((i) => MOBILE.includes(i.href));

  return (
    <div className="min-h-dvh">
      {/* ——— Sidebar (desktop) ——— */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-ink-950 text-white lg:flex">
        <div className="px-7 pb-7 pt-9">
          <Logo invert />
          <p className="mt-5 text-[0.68rem] font-medium leading-relaxed tracking-wide text-ink-400">
            Serviço Especializado em
            <br />
            Abordagem Social · Barretos/SP
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {itens.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-sun-500 transition-all duration-300 ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`} />
                <Icon className={`h-[1.15rem] w-[1.15rem] transition-colors ${
                  active ? "text-sun-400" : "text-ink-400 group-hover:text-ink-200"
                }`} strokeWidth={2.2} />
                {item.label}
                {item.cta && (
                  <span className="ml-auto rounded-full bg-sun-500/15 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-sun-300">
                    Campo
                  </span>
                )}
                {item.requisito === "admin" && (
                  <ShieldCheck className="ml-auto h-3.5 w-3.5 text-sun-400/70" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <MenuConta usuario={usuario} escuro />
        </div>
      </aside>

      {/* ——— Barra superior (mobile) ——— */}
      <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-ink-100/80 bg-paper/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label="Início">
          <Logo markClassName="h-9 w-9" />
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/guia"
            className="flex items-center gap-1.5 rounded-full border border-ink-200/90 bg-card px-3 py-1 text-[0.7rem] font-bold text-ink-700 shadow-sm transition-all active:scale-95"
            aria-label="Guia da Abordagem"
          >
            <BookOpen className="h-3.5 w-3.5 text-sun-600" />
            <span>Diretrizes</span>
          </Link>
          <MenuConta usuario={usuario} />
        </div>
      </header>

      {/* ——— Conteúdo ——— */}
      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-9">
          {children}
        </div>
      </main>

      {/* ——— Navegação inferior (mobile) ——— */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-card/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${moveis.length}, minmax(0, 1fr))` }}>
          {moveis.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            if (item.cta) {
              return (
                <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center gap-1 py-2" aria-label={item.label}>
                  <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sun-400 to-sun-600 shadow-lift transition-transform duration-200 active:scale-95">
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.4} />
                  </span>
                  <span className={`text-[0.62rem] font-bold ${active ? "text-sun-600" : "text-ink-500"}`}>
                    {item.curto ?? item.label}
                  </span>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 py-2.5" aria-label={item.label}>
                <Icon className={`h-[1.35rem] w-[1.35rem] transition-colors ${active ? "text-brand-600" : "text-ink-300"}`} strokeWidth={active ? 2.4 : 2} />
                <span className={`text-[0.62rem] font-bold transition-colors ${active ? "text-brand-700" : "text-ink-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
