import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros } from "@/db/schema";
import { dataReal, horaReal, kmValido, texto, uuidValido } from "@/lib/validacoes";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { descreverMudancas } from "@/lib/usuarios-admin";

/** Correção completa de um lançamento (permissão "veiculos.editar"). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await autorizarApi(req, "veiculos.editar");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });

  const [registro] = await db.select().from(veiculoRegistros).where(eq(veiculoRegistros.id, id)).limit(1);
  if (!registro) return NextResponse.json({ erro: "Registro não encontrado." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const data = typeof body.data === "string" ? body.data : "";
  const motorista = texto(body.motorista, 120);
  const saidaHora = typeof body.saidaHora === "string" ? body.saidaHora : "";
  const saidaLocal = texto(body.saidaLocal, 300);
  const saidaKm = Number(body.saidaKm);

  if (!dataReal(data)) return NextResponse.json({ erro: "Data inválida." }, { status: 422 });
  if (!motorista || !saidaLocal) {
    return NextResponse.json({ erro: "Informe motorista e local de saída." }, { status: 422 });
  }
  if (!horaReal(saidaHora)) return NextResponse.json({ erro: "Horário de saída inválido." }, { status: 422 });
  if (!kmValido(saidaKm)) return NextResponse.json({ erro: "KM de saída inválido." }, { status: 422 });

  // Chegada: ou todos os campos, ou nenhum (percurso em aberto).
  const temChegada = [body.chegadaHora, body.chegadaKm, body.chegadaLocal].some(
    (v) => v !== undefined && v !== null && v !== "",
  );
  let chegadaHora: string | null = null;
  let chegadaKm: number | null = null;
  let chegadaLocal: string | null = null;
  if (temChegada) {
    chegadaHora = typeof body.chegadaHora === "string" ? body.chegadaHora : "";
    chegadaKm = Number(body.chegadaKm);
    chegadaLocal = texto(body.chegadaLocal, 300);
    if (!horaReal(chegadaHora) || !kmValido(chegadaKm) || !chegadaLocal) {
      return NextResponse.json(
        { erro: "Para registrar a chegada, informe horário, KM e local de chegada." },
        { status: 422 },
      );
    }
    if (chegadaKm < saidaKm) {
      return NextResponse.json({ erro: "O KM de chegada não pode ser menor que o de saída." }, { status: 422 });
    }
  } else if (registro.chegadaHora) {
    return NextResponse.json(
      { erro: "Não é possível reabrir um percurso concluído. Mantenha os dados de chegada." },
      { status: 422 },
    );
  }

  const antes = {
    data: registro.data, motorista: registro.motorista, saidaHora: registro.saidaHora, saidaKm: registro.saidaKm,
    saidaLocal: registro.saidaLocal, chegadaHora: registro.chegadaHora, chegadaKm: registro.chegadaKm, chegadaLocal: registro.chegadaLocal,
  };
  const depois = { data, motorista, saidaHora, saidaKm, saidaLocal, chegadaHora, chegadaKm, chegadaLocal };

  try {
    await db.update(veiculoRegistros).set(depois).where(eq(veiculoRegistros.id, id));
    await registrarAuditoria({
      usuario: auth.usuario, acao: "veiculo.editado", entidade: "veiculo", entidadeId: id,
      detalhes: `${registro.veiculo} · ${descreverMudancas(antes, depois)}`, req,
    });
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error("Erro ao corrigir percurso:", erro);
    return NextResponse.json({ erro: "Não foi possível salvar a correção." }, { status: 500 });
  }
}

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
