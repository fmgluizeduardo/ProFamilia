import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CarFront, GaugeCircle, Navigation, Route } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { formatarPlaca } from "@/lib/frota";
import { carregarFrota } from "@/lib/frota-dados";
import { fmtData } from "@/lib/format";
import { AbasVeiculos } from "../abas";
import { VeiculoModal } from "./veiculo-modal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Frota" };

export default async function FrotaPage() {
  const usuario = await exigirUsuario("veiculos.ver");
  const podeCadastrar = temPermissao(usuario, "frota.cadastrar");
  const podeEditar = temPermissao(usuario, "frota.editar");
  const frota = await carregarFrota();
  const ativos = frota.filter((v) => v.ativo).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-leaf-600">Ronda móvel</p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Frota</h1>
          <p className="mt-1 text-[0.82rem] text-ink-500">
            {ativos} {ativos === 1 ? "veículo ativo" : "veículos ativos"}
            {frota.length - ativos > 0 && ` · ${frota.length - ativos} inativo(s)`}
          </p>
        </div>
        {podeCadastrar && <VeiculoModal />}
      </div>

      <AbasVeiculos ativa="frota" />

      {frota.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-card p-10 text-center">
          <CarFront className="mx-auto h-9 w-9 text-ink-200" />
          <p className="mt-3 text-[0.9rem] font-bold text-ink-600">Nenhum veículo cadastrado</p>
          <p className="mt-1 text-[0.8rem] text-ink-400">
            {podeCadastrar ? "Use “Cadastrar veículo” para incluir o primeiro." : "Peça a quem gerencia a frota para cadastrar os veículos."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {frota.map((v) => {
            const status = !v.ativo
              ? { texto: "Inativo", cls: "bg-ink-200 text-ink-600" }
              : v.resumo.emRota
                ? { texto: "Em rota", cls: "bg-leaf-100 text-leaf-700" }
                : { texto: "Disponível", cls: "bg-brand-100 text-brand-700" };
            return (
              <div key={v.id} className={`rounded-2xl border border-ink-100/80 bg-card p-5 shadow-card ${v.ativo ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-600">
                      <CarFront className="h-5.5 w-5.5" />
                    </span>
                    <div>
                      <p className="font-display text-[1rem] font-bold text-ink-900">
                        {v.modelo}{v.marca ? <span className="ml-1.5 text-[0.78rem] font-semibold text-ink-400">{v.marca}</span> : null}
                      </p>
                      <p className="mt-0.5 inline-block rounded-md border border-ink-200 bg-white px-2 py-0.5 font-mono text-[0.8rem] font-bold tracking-wider text-ink-800">
                        {formatarPlaca(v.placa)}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide ${status.cls}`}>{status.texto}</span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-paper px-2 py-2">
                    <dt className="flex items-center justify-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-400"><GaugeCircle className="h-3 w-3" /> KM atual</dt>
                    <dd className="font-display text-[0.9rem] font-bold text-ink-900">{v.resumo.kmAtual.toLocaleString("pt-BR")}</dd>
                  </div>
                  <div className="rounded-lg bg-paper px-2 py-2">
                    <dt className="flex items-center justify-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-400"><Navigation className="h-3 w-3" /> Saídas</dt>
                    <dd className="font-display text-[0.9rem] font-bold text-ink-900">{v.resumo.percursos}</dd>
                  </div>
                  <div className="rounded-lg bg-paper px-2 py-2">
                    <dt className="flex items-center justify-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink-400"><Route className="h-3 w-3" /> Rodados</dt>
                    <dd className="font-display text-[0.9rem] font-bold text-ink-900">{v.resumo.kmRodados.toLocaleString("pt-BR")} km</dd>
                  </div>
                </dl>

                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.74rem] text-ink-500">
                  {v.ano && <span>Ano {v.ano}</span>}
                  {v.cor && <span>Cor {v.cor}</span>}
                  <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Último uso: {v.resumo.ultimoUso ? fmtData(v.resumo.ultimoUso) : "nunca"}</span>
                </p>
                {v.observacoes && <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-[0.76rem] text-ink-600">{v.observacoes}</p>}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {v.resumo.percursos > 0 && (
                    <Link href={`/veiculos?veiculo=${v.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.74rem] font-bold text-brand-700 hover:bg-brand-50">
                      <Route className="h-3.5 w-3.5" /> Ver percursos
                    </Link>
                  )}
                  {podeEditar && (
                    <span className="ml-auto">
                      <VeiculoModal veiculo={{
                        id: v.id, modelo: v.modelo, marca: v.marca, placa: v.placa, ano: v.ano, cor: v.cor,
                        kmInicial: v.kmInicial, observacoes: v.observacoes, ativo: v.ativo,
                        emRota: v.resumo.emRota, temPercursos: v.resumo.percursos > 0,
                      }} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!podeCadastrar && !podeEditar && (
        <p className="text-[0.74rem] text-ink-400">
          Você pode consultar a frota. O cadastro e a edição de veículos dependem de permissão concedida pelo administrador.
        </p>
      )}
    </div>
  );
}
