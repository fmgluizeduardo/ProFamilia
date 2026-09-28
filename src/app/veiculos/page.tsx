import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import {
  Bus,
  CircleCheck,
  FlagTriangleRight,
  GaugeCircle,
  MapPin,
  Navigation,
  Truck,
  UserRound,
} from "lucide-react";
import { db } from "@/db";
import { veiculoRegistros } from "@/db/schema";
import { VEICULO_PADRAO } from "@/lib/constants";
import { fmtData } from "@/lib/format";
import { ChegadaForm, SaidaForm } from "./veiculo-forms";
import { exigirUsuario } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { BotaoExcluir } from "@/components/botao-excluir";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Controle de Veículo",
};

export default async function VeiculosPage() {
  const usuario = await exigirUsuario("veiculos.ver");
  const podeRegistrar = temPermissao(usuario, "veiculos.registrar");
  const podeExcluir = temPermissao(usuario, "veiculos.excluir");
  const registros = await db
    .select()
    .from(veiculoRegistros)
    .orderBy(desc(veiculoRegistros.data), desc(veiculoRegistros.createdAt))
    .limit(60);

  const emRota = registros.find((r) => !r.chegadaHora) ?? null;
  const ultimoConcluido = registros.find((r) => r.chegadaKm !== null) ?? null;
  const ultimoKm = emRota
    ? emRota.saidaKm
    : ultimoConcluido?.chegadaKm ?? null;

  const kmTotal = registros.reduce(
    (acc, r) => acc + (r.chegadaKm !== null ? r.chegadaKm - r.saidaKm : 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-leaf-600">
            Ronda móvel
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Controle de veículo
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-card px-4 py-2">
          <Bus className="h-4 w-4 text-ink-500" />
          <span className="text-[0.78rem] font-bold text-ink-700">
            {VEICULO_PADRAO}
          </span>
        </div>
      </div>

      {/* ——— Em rota agora ——— */}
      {emRota && (
        <div
          className="animate-rise rounded-2xl border-2 border-leaf-300 bg-gradient-to-br from-leaf-50 to-card p-5 shadow-card"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-leaf-500" />
            </span>
            <h2 className="font-display text-[0.98rem] font-bold text-leaf-800">
              Veículo em rota agora
            </h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.84rem] sm:grid-cols-4">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">
                Saída
              </p>
              <p className="font-bold text-ink-900">
                {fmtData(emRota.data)} · {emRota.saidaHora}
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">
                KM
              </p>
              <p className="font-bold text-ink-900">
                {emRota.saidaKm.toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">
                Motorista
              </p>
              <p className="font-bold text-ink-900">{emRota.motorista}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">
                Destino
              </p>
              <p className="font-bold text-ink-900">{emRota.saidaLocal}</p>
            </div>
          </div>
          {podeRegistrar ? (
            <ChegadaForm registroId={emRota.id} saidaKm={emRota.saidaKm} />
          ) : (
            <p className="mt-4 border-t border-leaf-200/70 pt-3 text-[0.78rem] font-semibold text-leaf-800">
              O registro de chegada é feito por quem tem permissão para lançar percursos.
            </p>
          )}
        </div>
      )}

      {/* ——— Ações e resumo ——— */}
      <div className="animate-rise" style={{ animationDelay: "100ms" }}>
        {!emRota && podeRegistrar && <SaidaForm ultimoKm={ultimoKm} />}
        {emRota && podeRegistrar && (
          <p className="rounded-xl border border-ink-100 bg-card px-4 py-3 text-center text-[0.78rem] font-semibold text-ink-500">
            Nova saída disponível após a conclusão do percurso atual.
          </p>
        )}
      </div>

      <div
        className="animate-rise grid grid-cols-3 gap-3"
        style={{ animationDelay: "140ms" }}
      >
        {[
          { icon: Navigation, n: registros.length, l: "saídas registradas" },
          {
            icon: GaugeCircle,
            n: kmTotal.toLocaleString("pt-BR"),
            l: "km percorridos",
          },
          {
            icon: CircleCheck,
            n: registros.filter((r) => r.chegadaHora).length,
            l: "percursos concluídos",
          },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border border-ink-100/80 bg-card p-4 text-center shadow-card"
          >
            <s.icon className="mx-auto h-5 w-5 text-ink-400" strokeWidth={2} />
            <p className="font-display mt-2 text-lg font-bold leading-none text-ink-900 sm:text-xl">
              {s.n}
            </p>
            <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-400">
              {s.l}
            </p>
          </div>
        ))}
      </div>

      {/* ——— Histórico ——— */}
      <div className="animate-rise" style={{ animationDelay: "180ms" }}>
        <h2 className="font-display mb-3 text-[1.02rem] font-bold tracking-tight text-ink-900">
          Histórico de saídas
        </h2>
        {registros.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-8 text-center">
            <Truck className="mx-auto h-8 w-8 text-ink-200" strokeWidth={1.6} />
            <p className="mt-3 text-[0.85rem] font-semibold text-ink-500">
              Nenhuma saída registrada ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {registros.map((r) => {
              const rodado = r.chegadaKm !== null ? r.chegadaKm - r.saidaKm : null;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          r.chegadaHora
                            ? "bg-ink-50 text-ink-500"
                            : "bg-leaf-100 text-leaf-600"
                        }`}
                      >
                        <Truck className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                      <div>
                        <p className="text-[0.88rem] font-bold text-ink-900">
                          {fmtData(r.data)}
                          <span className="ml-2 text-[0.72rem] font-semibold text-ink-400">
                            {r.motorista}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] font-medium text-ink-400">
                          <MapPin className="h-3 w-3" />
                          {r.saidaLocal}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                    {rodado !== null ? (
                      <span className="rounded-lg bg-ink-50 px-2.5 py-1 font-display text-[0.72rem] font-bold text-ink-600">
                        {rodado.toLocaleString("pt-BR")} km
                      </span>
                    ) : (
                      <span className="rounded-lg bg-leaf-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-leaf-700">
                        Em rota
                      </span>
                    )}
                    {podeExcluir && (
                      <BotaoExcluir
                        compacto
                        url={`/api/veiculos/${r.id}`}
                        titulo="Excluir este lançamento?"
                        descricao={`Percurso de ${fmtData(r.data)} (${r.motorista}, saída ${r.saidaKm.toLocaleString("pt-BR")} km). Use apenas para corrigir lançamentos incorretos.`}
                      />
                    )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[0.74rem]">
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="flex items-center gap-1 font-bold text-ink-500">
                        <Navigation className="h-3 w-3" /> Saída
                      </p>
                      <p className="mt-0.5 font-semibold text-ink-800">
                        {r.saidaHora} · {r.saidaKm.toLocaleString("pt-BR")} km
                      </p>
                    </div>
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="flex items-center gap-1 font-bold text-ink-500">
                        <FlagTriangleRight className="h-3 w-3" /> Chegada
                      </p>
                      <p className="mt-0.5 font-semibold text-ink-800">
                        {r.chegadaHora
                          ? `${r.chegadaHora} · ${r.chegadaKm?.toLocaleString("pt-BR")} km`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-[0.68rem] font-medium text-ink-300">
        <UserRound className="h-3.5 w-3.5" />
        Controle diário conforme formulário interno do veículo {VEICULO_PADRAO}.
      </p>
    </div>
  );
}
