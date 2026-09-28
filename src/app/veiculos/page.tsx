import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, isNull, type SQL } from "drizzle-orm";
import {
  CarFront,
  CircleCheck,
  FlagTriangleRight,
  GaugeCircle,
  MapPin,
  Navigation,
  Plus,
  Truck,
} from "lucide-react";
import { db } from "@/db";
import { veiculoRegistros } from "@/db/schema";
import { fmtData } from "@/lib/format";
import { exigirUsuario } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { rotuloVeiculo } from "@/lib/frota";
import { carregarFrota } from "@/lib/frota-dados";
import { uuidValido } from "@/lib/validacoes";
import { BotaoExcluir } from "@/components/botao-excluir";
import { AbasVeiculos } from "./abas";
import { EditarPercurso } from "./editar-percurso";
import { ChegadaForm, SaidaForm, type OpcaoVeiculo } from "./veiculo-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Controle de Veículo",
};

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await exigirUsuario("veiculos.ver");
  const podeRegistrar = temPermissao(usuario, "veiculos.registrar");
  const podeCorrigir = temPermissao(usuario, "veiculos.editar");
  const podeExcluir = temPermissao(usuario, "veiculos.excluir");
  const podeCadastrarFrota = temPermissao(usuario, "frota.cadastrar");

  const sp = await searchParams;
  const frota = await carregarFrota();
  const filtroId = typeof sp.veiculo === "string" && uuidValido(sp.veiculo) && frota.some((v) => v.id === sp.veiculo)
    ? sp.veiculo
    : "";

  const filtros: SQL[] = [];
  if (filtroId) filtros.push(eq(veiculoRegistros.veiculoId, filtroId));

  const [registros, emRota] = await Promise.all([
    db.select().from(veiculoRegistros)
      .where(filtros.length ? and(...filtros) : undefined)
      .orderBy(desc(veiculoRegistros.data), desc(veiculoRegistros.createdAt))
      .limit(80),
    db.select().from(veiculoRegistros)
      .where(isNull(veiculoRegistros.chegadaHora))
      .orderBy(desc(veiculoRegistros.data)),
  ]);

  const ativos = frota.filter((v) => v.ativo);
  const opcoes: OpcaoVeiculo[] = ativos.map((v) => ({
    id: v.id,
    rotulo: rotuloVeiculo(v),
    kmAtual: v.resumo.kmAtual,
    emRota: v.resumo.emRota,
  }));

  const escopoStats = filtroId ? frota.filter((v) => v.id === filtroId) : frota;
  const stats = escopoStats.reduce(
    (acc, v) => ({
      saidas: acc.saidas + v.resumo.percursos,
      km: acc.km + v.resumo.kmRodados,
    }),
    { saidas: 0, km: 0 },
  );
  const concluidos = registros.filter((r) => r.chegadaHora).length;
  const comHistorico = frota.filter((v) => v.ativo || v.resumo.percursos > 0);

  return (
    <div className="space-y-5">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-leaf-600">Ronda móvel</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Controle de veículo
          </h1>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-ink-100 bg-card px-4 py-2 text-[0.78rem] font-bold text-ink-700">
          <CarFront className="h-4 w-4 text-ink-500" />
          {ativos.length} {ativos.length === 1 ? "veículo ativo" : "veículos ativos"}
        </span>
      </div>

      <AbasVeiculos ativa="percursos" />

      {/* ——— Em rota agora ——— */}
      {emRota.map((r) => (
        <div key={r.id} className="animate-rise rounded-2xl border-2 border-leaf-300 bg-gradient-to-br from-leaf-50 to-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-leaf-500" />
            </span>
            <h2 className="font-display text-[0.98rem] font-bold text-leaf-800">Em rota agora · {r.veiculo}</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[0.84rem] sm:grid-cols-4">
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">Saída</p>
              <p className="font-bold text-ink-900">{fmtData(r.data)} · {r.saidaHora}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">KM</p>
              <p className="font-bold text-ink-900">{r.saidaKm.toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">Motorista</p>
              <p className="font-bold text-ink-900">{r.motorista}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-leaf-700/70">Destino</p>
              <p className="font-bold text-ink-900">{r.saidaLocal}</p>
            </div>
          </div>
          {podeRegistrar ? (
            <ChegadaForm registroId={r.id} saidaKm={r.saidaKm} />
          ) : (
            <p className="mt-4 border-t border-leaf-200/70 pt-3 text-[0.78rem] font-semibold text-leaf-800">
              O registro de chegada é feito por quem tem permissão para lançar percursos.
            </p>
          )}
        </div>
      ))}

      {/* ——— Nova saída ——— */}
      {podeRegistrar && (
        ativos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-6 text-center">
            <CarFront className="mx-auto h-8 w-8 text-ink-200" />
            <p className="mt-2 text-[0.86rem] font-bold text-ink-700">Nenhum veículo ativo na frota</p>
            <p className="mt-1 text-[0.78rem] text-ink-500">
              {podeCadastrarFrota ? "Cadastre um veículo para começar a registrar saídas." : "Peça a quem gerencia a frota para cadastrar um veículo."}
            </p>
            {podeCadastrarFrota && (
              <Link href="/veiculos/frota" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-[0.8rem] font-bold text-white hover:bg-ink-800">
                <Plus className="h-4 w-4" /> Cadastrar veículo
              </Link>
            )}
          </div>
        ) : (
          <SaidaForm veiculos={opcoes} />
        )
      )}

      {/* ——— Filtro por veículo ——— */}
      {comHistorico.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/veiculos" className={`rounded-full px-3.5 py-1.5 text-[0.76rem] font-bold transition-all ${!filtroId ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"}`}>
            Todos
          </Link>
          {comHistorico.map((v) => (
            <Link key={v.id} href={`/veiculos?veiculo=${v.id}`}
              className={`rounded-full px-3.5 py-1.5 text-[0.76rem] font-bold transition-all ${filtroId === v.id ? "bg-ink-900 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100"}`}>
              {rotuloVeiculo(v)}{!v.ativo ? " (inativo)" : ""}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Navigation, n: stats.saidas.toLocaleString("pt-BR"), l: "saídas registradas" },
          { icon: GaugeCircle, n: stats.km.toLocaleString("pt-BR"), l: "km percorridos" },
          { icon: CircleCheck, n: concluidos, l: "concluídos (lista)" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-ink-100/80 bg-card p-4 text-center shadow-card">
            <s.icon className="mx-auto h-5 w-5 text-ink-400" strokeWidth={2} />
            <p className="font-display mt-2 text-lg font-bold leading-none text-ink-900 sm:text-xl">{s.n}</p>
            <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-400">{s.l}</p>
          </div>
        ))}
      </div>

      {/* ——— Histórico ——— */}
      <div>
        <h2 className="font-display mb-3 text-[1.02rem] font-bold tracking-tight text-ink-900">Histórico de saídas</h2>
        {registros.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-8 text-center">
            <Truck className="mx-auto h-8 w-8 text-ink-200" strokeWidth={1.6} />
            <p className="mt-3 text-[0.85rem] font-semibold text-ink-500">Nenhuma saída registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {registros.map((r) => {
              const rodado = r.chegadaKm !== null ? r.chegadaKm - r.saidaKm : null;
              return (
                <div key={r.id} className="rounded-2xl border border-ink-100/80 bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.chegadaHora ? "bg-ink-50 text-ink-500" : "bg-leaf-100 text-leaf-600"}`}>
                        <Truck className="h-5 w-5" strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.88rem] font-bold text-ink-900">
                          {fmtData(r.data)}
                          <span className="ml-2 text-[0.72rem] font-semibold text-ink-400">{r.veiculo} · {r.motorista}</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[0.72rem] font-medium text-ink-400">
                          <MapPin className="h-3 w-3 shrink-0" /> {r.saidaLocal}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {rodado !== null ? (
                        <span className="rounded-lg bg-ink-50 px-2.5 py-1 font-display text-[0.72rem] font-bold text-ink-600">
                          {rodado.toLocaleString("pt-BR")} km
                        </span>
                      ) : (
                        <span className="rounded-lg bg-leaf-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-leaf-700">Em rota</span>
                      )}
                      {podeCorrigir && (
                        <EditarPercurso percurso={{
                          id: r.id, veiculo: r.veiculo, data: r.data, motorista: r.motorista,
                          saidaHora: r.saidaHora, saidaKm: r.saidaKm, saidaLocal: r.saidaLocal,
                          chegadaHora: r.chegadaHora, chegadaKm: r.chegadaKm, chegadaLocal: r.chegadaLocal,
                        }} />
                      )}
                      {podeExcluir && (
                        <BotaoExcluir
                          compacto
                          url={`/api/veiculos/${r.id}`}
                          titulo="Excluir este lançamento?"
                          descricao={`Percurso de ${fmtData(r.data)} (${r.veiculo}, ${r.motorista}, saída ${r.saidaKm.toLocaleString("pt-BR")} km). Use apenas para lançamentos incorretos.`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[0.74rem]">
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="flex items-center gap-1 font-bold text-ink-500"><Navigation className="h-3 w-3" /> Saída</p>
                      <p className="mt-0.5 font-semibold text-ink-800">{r.saidaHora} · {r.saidaKm.toLocaleString("pt-BR")} km</p>
                    </div>
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="flex items-center gap-1 font-bold text-ink-500"><FlagTriangleRight className="h-3 w-3" /> Chegada</p>
                      <p className="mt-0.5 font-semibold text-ink-800">
                        {r.chegadaHora ? `${r.chegadaHora} · ${r.chegadaKm?.toLocaleString("pt-BR")} km` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
