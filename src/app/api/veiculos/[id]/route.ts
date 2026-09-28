import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros } from "@/db/schema";
import { horaReal, kmValido, texto, uuidValido } from "@/lib/validacoes";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await autorizarApi(req, "veiculos.excluir");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }
  const [registro] = await db.select().from(veiculoRegistros).where(eq(veiculoRegistros.id, id)).limit(1);
  if (!registro) return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });

  await db.delete(veiculoRegistros).where(eq(veiculoRegistros.id, id));
  await registrarAuditoria({
    usuario: auth.usuario, acao: "veiculo.excluido", entidade: "veiculo", entidadeId: id,
    detalhes: `${registro.data} · ${registro.motorista} · saída ${registro.saidaKm} km${registro.chegadaKm ? ` · chegada ${registro.chegadaKm} km` : " · em rota"}`,
    req,
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await autorizarApi(req, "veiculos.registrar");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;

  if (!uuidValido(id)) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const chegadaHora = typeof body.chegadaHora === "string" ? body.chegadaHora : "";
  const chegadaLocal = texto(body.chegadaLocal, 300);

  if (!horaReal(chegadaHora)) {
    return NextResponse.json(
      { erro: "Horário de chegada inválido. Use o formato HH:MM." },
      { status: 422 },
    );
  }
  if (!chegadaLocal) {
    return NextResponse.json(
      { erro: "Informe o local de chegada." },
      { status: 422 },
    );
  }
  if (!kmValido(Number(body.chegadaKm))) {
    return NextResponse.json({ erro: "KM de chegada inválido." }, { status: 422 });
  }
  const chegadaKm = Number(body.chegadaKm);

  const [registro] = await db
    .select()
    .from(veiculoRegistros)
    .where(eq(veiculoRegistros.id, id))
    .limit(1);

  if (!registro) {
    return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });
  }
  if (registro.chegadaHora) {
    return NextResponse.json(
      { erro: "Este percurso já foi concluído." },
      { status: 409 },
    );
  }
  if (chegadaKm < registro.saidaKm) {
    return NextResponse.json(
      { erro: `KM de chegada (${chegadaKm.toLocaleString("pt-BR")}) menor que o KM de saída (${registro.saidaKm.toLocaleString("pt-BR")}). Confira o hodômetro.` },
      { status: 422 },
    );
  }

  try {
    const [atualizado] = await db
      .update(veiculoRegistros)
      .set({ chegadaHora, chegadaKm, chegadaLocal })
      .where(eq(veiculoRegistros.id, id))
      .returning();

    await registrarAuditoria({
      usuario: auth.usuario, acao: "veiculo.chegada", entidade: "veiculo", entidadeId: id,
      detalhes: `${chegadaKm - registro.saidaKm} km rodados · ${chegadaLocal}`, req,
    });
    return NextResponse.json(atualizado);
  } catch (erro) {
    console.error("Erro ao registrar chegada do veículo:", erro);
    return NextResponse.json(
      { erro: "Não foi possível registrar a chegada. Tente novamente." },
      { status: 500 },
    );
  }
}
