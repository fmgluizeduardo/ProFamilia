import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { veiculos } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { rotuloVeiculo } from "@/lib/frota";
import { normalizarVeiculo } from "@/lib/frota-dados";

/** Cadastra um novo veículo na frota. */
export async function POST(req: Request) {
  const auth = await autorizarApi(req, "frota.cadastrar");
  if (!auth.ok) return auth.resposta;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const resultado = normalizarVeiculo(body);
  if (!resultado.ok) return NextResponse.json({ erro: resultado.erro }, { status: 422 });
  const { dados } = resultado;

  const [existe] = await db.select({ id: veiculos.id }).from(veiculos).where(eq(veiculos.placa, dados.placa)).limit(1);
  if (existe) {
    return NextResponse.json({ erro: "Já existe um veículo cadastrado com esta placa." }, { status: 409 });
  }

  try {
    const [criado] = await db
      .insert(veiculos)
      .values({ ...dados, criadoPorId: auth.usuario.id })
      .returning({ id: veiculos.id });
    await registrarAuditoria({
      usuario: auth.usuario, acao: "frota.criado", entidade: "veiculo_frota", entidadeId: criado.id,
      detalhes: `${rotuloVeiculo(dados)} · KM inicial ${dados.kmInicial.toLocaleString("pt-BR")}`, req,
    });
    return NextResponse.json({ id: criado.id }, { status: 201 });
  } catch (erro) {
    console.error("Erro ao cadastrar veículo:", erro);
    return NextResponse.json({ erro: "Não foi possível cadastrar o veículo." }, { status: 500 });
  }
}
