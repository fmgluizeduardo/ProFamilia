import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Sora } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { obterUsuarioAtual, paraPublico } from "@/lib/auth";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  applicationName: "PróFamília",
  title: {
    default: "Instituto PróFamília — Abordagem Social",
    template: "%s · Instituto PróFamília",
  },
  description:
    "Registro digital de fichas de atendimento do Serviço Especializado em Abordagem Social — Instituto PróFamília, Barretos/SP.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PróFamília",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16222f",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // A sessão é lida uma vez por requisição (memorizada) e reaproveitada pelas páginas.
  const sessao = await obterUsuarioAtual();
  const usuario = sessao ? paraPublico(sessao) : null;

  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <AppShell usuario={usuario}>{children}</AppShell>
      </body>
    </html>
  );
}
