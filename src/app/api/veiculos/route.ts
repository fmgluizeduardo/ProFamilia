import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros } from "@/db/schema";
import { VEICULO_PADRAO } from "@/lib/constants";
import { dataReal, horaReal, kmValido } from "@/lib/validacoes";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await autorizarApi(req, "veiculos.registrar");
  if (!auth.ok) return auth.resposta;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const data = typeof body.data === "string" ? body.data : "";
  const motorista = typeof body.motorista === "string" ? body.motorista.trim() : "";
  const saidaHora = typeof body.saidaHora === "string" ? body.saidaHora : "";
  const saidaLocal = typeof body.saidaLocal === "string" ? body.saidaLocal.trim() : "";
  const veiculo =
    typeof body.veiculo === "string" && body.veiculo.trim()
      ? body.veiculo.trim()
      : VEICULO_PADRAO;

  if (!dataReal(data)) {
    return NextResponse.json(
      { erro: "Data inválida. Use uma data existente (AAAA-MM-DD)." },
      { status: 422 },
    );
  }
  if (!motorista || !saidaLocal) {
    return NextResponse.json(
      { erro: "Informe motorista e local de saída." },
      { status: 422 },
    );
  }
  if (!horaReal(saidaHora)) {
    return NextResponse.json(
      { erro: "Horário de saída inválido. Use o formato HH:MM." },
      { status: 422 },
    );
  }
  if (!kmValido(Number(body.saidaKm))) {
    return NextResponse.json({ erro: "KM de saída inválido." }, { status: 422 });
  }
  const saidaKm = Number(body.saidaKm);

  // Um veículo não pode ter dois percursos em aberto: a tela só mostra o primeiro,
  // então o segundo ficaria inacessível para registro de chegada.
  const [aberto] = await db
    .select({ id: veiculoRegistros.id, data: veiculoRegistros.data, veiculo: veiculoRegistros.veiculo })
    .from(veiculoRegistros)
    .where(and(eq(veiculoRegistros.veiculo, veiculo), isNull(veiculoRegistros.chegadaHora)))
    .orderBy(desc(veiculoRegistros.data))
    .limit(1);

  if (aberto) {
    return NextResponse.json(
      { erro: `O veículo ${veiculo} já possui uma saída em aberto (registrada em ${aberto.data.split("-").reverse().join("/")}). Registre a chegada antes de iniciar outra.` },
      { status: 409 },
    );
  }

  // O hodômetro nunca regride: protege o histórico de erro de digitação.
  const [ultimo] = await db
    .select({ km: veiculoRegistros.saidaKm, chegadaKm: veiculoRegistros.chegadaKm })
    .from(veiculoRegistros)
    .where(eq(veiculoRegistros.veiculo, veiculo))
    .orderBy(desc(veiculoRegistros.data), desc(veiculoRegistros.createdAt))
    .limit(1);

  const ultimoKm = ultimo?.chegadaKm ?? ultimo?.km ?? null;
  if (ultimoKm !== null && saidaKm < ultimoKm) {
    return NextResponse.json(
      { erro: `KM de saída (${saidaKm.toLocaleString("pt-BR")}) menor que o último registro do veículo (${ultimoKm.toLocaleString("pt-BR")}). Confira o hodômetro.` },
      { status: 422 },
    );
  }

  try {
    const [criado] = await db
      .insert(veiculoRegistros)
      .values({ data, veiculo, motorista, saidaHora, saidaKm, saidaLocal, registradoPorId: auth.usuario.id })
      .returning({ id: veiculoRegistros.id });
    await registrarAuditoria({
      usuario: auth.usuario, acao: "veiculo.saida", entidade: "veiculo", entidadeId: criado.id,
      detalhes: `${veiculo} · ${motorista} · ${saidaKm} km · ${saidaLocal}`, req,
    });
    return NextResponse.json(criado, { status: 201 });
  } catch (erro) {
    console.error("Erro ao registrar saída de veículo:", erro);
    return NextResponse.json(
      { erro: "Não foi possível registrar a saída. Tente novamente." },
      { status: 500 },
    );
  }
}
