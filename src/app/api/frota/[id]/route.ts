import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { veiculoRegistros, veiculos } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { rotuloVeiculo } from "@/lib/frota";
import { normalizarVeiculo, percursoAberto } from "@/lib/frota-dados";
import { descreverMudancas } from "@/lib/usuarios-admin";
import { uuidValido } from "@/lib/validacoes";
import { falhaInterna, rota } from "@/lib/erros-servidor";

/** Edita os dados do veículo e/ou ativa/desativa. */
export const PATCH = rota(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autorizarApi(req, "frota.editar");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Veículo não encontrado." }, { status: 404 });

  const [atual] = await db.select().from(veiculos).where(eq(veiculos.id, id)).limit(1);
  if (!atual) return NextResponse.json({ erro: "Veículo não encontrado." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Corpo não é um objeto JSON.");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  // Somente ativar/desativar, sem reenviar os demais dados.
  const apenasStatus = Object.keys(body).length === 1 && typeof body.ativo === "boolean";
  let dados = {
    modelo: atual.modelo, marca: atual.marca, placa: atual.placa, ano: atual.ano,
    cor: atual.cor, kmInicial: atual.kmInicial, observacoes: atual.observacoes,
  };
  if (!apenasStatus) {
    const resultado = normalizarVeiculo(body);
    if (!resultado.ok) return NextResponse.json({ erro: resultado.erro }, { status: 422 });
    dados = resultado.dados;
  }
  const ativo = typeof body.ativo === "boolean" ? body.ativo : atual.ativo;

  if (dados.placa !== atual.placa) {
    const [duplicada] = await db.select({ id: veiculos.id }).from(veiculos)
      .where(and(eq(veiculos.placa, dados.placa), ne(veiculos.id, id))).limit(1);
    if (duplicada) return NextResponse.json({ erro: "Já existe outro veículo com esta placa." }, { status: 409 });
  }

  if (atual.ativo && !ativo && (await percursoAberto(id))) {
    return NextResponse.json(
      { erro: "Este veículo está em rota. Registre a chegada antes de desativá-lo." },
      { status: 409 },
    );
  }

  if (dados.kmInicial !== atual.kmInicial) {
    const [menor] = await db
      .select({ km: sql<number | null>`min(${veiculoRegistros.saidaKm})` })
      .from(veiculoRegistros)
      .where(eq(veiculoRegistros.veiculoId, id));
    if (menor?.km !== null && menor?.km !== undefined && dados.kmInicial > Number(menor.km)) {
      return NextResponse.json(
        { erro: `O KM inicial não pode ser maior que o menor KM já registrado em percursos (${Number(menor.km).toLocaleString("pt-BR")}).` },
        { status: 422 },
      );
    }
  }

  try {
    await db.update(veiculos).set({ ...dados, ativo, updatedAt: new Date() }).where(eq(veiculos.id, id));

    // Mantém o rótulo dos percursos coerente com o cadastro (ex.: correção de placa).
    const rotuloNovo = rotuloVeiculo(dados);
    if (rotuloNovo !== rotuloVeiculo(atual)) {
      await db.update(veiculoRegistros).set({ veiculo: rotuloNovo }).where(eq(veiculoRegistros.veiculoId, id));
    }

    await registrarAuditoria({
      usuario: auth.usuario,
      acao: atual.ativo && !ativo ? "frota.desativado" : !atual.ativo && ativo ? "frota.reativado" : "frota.editado",
      entidade: "veiculo_frota", entidadeId: id,
      detalhes: `${rotuloVeiculo(atual)} · ${descreverMudancas({ ...atual }, { ...dados, ativo })}`,
      req,
    });
    return NextResponse.json({ ok: true });
  } catch (erro) {
    return falhaInterna(req, erro, { mensagem: "Não foi possível salvar as alterações." });
  }
});
