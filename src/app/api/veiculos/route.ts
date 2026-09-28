import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros, veiculos } from "@/db/schema";
import { dataReal, horaReal, kmValido, texto, uuidValido } from "@/lib/validacoes";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { rotuloVeiculo } from "@/lib/frota";
import { kmReferencia, percursoAberto } from "@/lib/frota-dados";
import { fmtData } from "@/lib/format";

/** Registra a saída de um veículo da frota. */
export async function POST(req: Request) {
  const auth = await autorizarApi(req, "veiculos.registrar");
  if (!auth.ok) return auth.resposta;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const veiculoId = typeof body.veiculoId === "string" ? body.veiculoId : "";
  const data = typeof body.data === "string" ? body.data : "";
  const motorista = texto(body.motorista, 120);
  const saidaHora = typeof body.saidaHora === "string" ? body.saidaHora : "";
  const saidaLocal = texto(body.saidaLocal, 300);

  if (!uuidValido(veiculoId)) {
    return NextResponse.json({ erro: "Selecione o veículo." }, { status: 422 });
  }
  if (!dataReal(data)) {
    return NextResponse.json({ erro: "Data inválida. Use uma data existente (AAAA-MM-DD)." }, { status: 422 });
  }
  if (!motorista || !saidaLocal) {
    return NextResponse.json({ erro: "Informe motorista e local de saída." }, { status: 422 });
  }
  if (!horaReal(saidaHora)) {
    return NextResponse.json({ erro: "Horário de saída inválido. Use o formato HH:MM." }, { status: 422 });
  }
  if (!kmValido(Number(body.saidaKm))) {
    return NextResponse.json({ erro: "KM de saída inválido." }, { status: 422 });
  }
  const saidaKm = Number(body.saidaKm);

  const [veiculo] = await db.select().from(veiculos).where(eq(veiculos.id, veiculoId)).limit(1);
  if (!veiculo) return NextResponse.json({ erro: "Veículo não encontrado." }, { status: 404 });
  if (!veiculo.ativo) {
    return NextResponse.json({ erro: "Este veículo está desativado na frota." }, { status: 422 });
  }
  const rotulo = rotuloVeiculo(veiculo);

  // Um veículo não pode ter dois percursos em aberto ao mesmo tempo.
  const aberto = await percursoAberto(veiculoId);
  if (aberto) {
    return NextResponse.json(
      { erro: `${rotulo} já possui uma saída em aberto (registrada em ${fmtData(aberto.data)}). Registre a chegada antes de iniciar outra.` },
      { status: 409 },
    );
  }

  // O hodômetro nunca regride em relação aos registros até esta data.
  const minimo = await kmReferencia(veiculoId, veiculo.kmInicial, data);
  if (saidaKm < minimo) {
    return NextResponse.json(
      { erro: `KM de saída (${saidaKm.toLocaleString("pt-BR")}) menor que o último registro de ${rotulo} (${minimo.toLocaleString("pt-BR")}). Confira o hodômetro.` },
      { status: 422 },
    );
  }

  try {
    const [criado] = await db
      .insert(veiculoRegistros)
      .values({ data, veiculoId, veiculo: rotulo, motorista, saidaHora, saidaKm, saidaLocal, registradoPorId: auth.usuario.id })
      .returning({ id: veiculoRegistros.id });
    await registrarAuditoria({
      usuario: auth.usuario, acao: "veiculo.saida", entidade: "veiculo", entidadeId: criado.id,
      detalhes: `${rotulo} · ${motorista} · ${saidaKm} km · ${saidaLocal}`, req,
    });
    return NextResponse.json(criado, { status: 201 });
  } catch (erro) {
    console.error("Erro ao registrar saída de veículo:", erro);
    return NextResponse.json({ erro: "Não foi possível registrar a saída. Tente novamente." }, { status: 500 });
  }
}
