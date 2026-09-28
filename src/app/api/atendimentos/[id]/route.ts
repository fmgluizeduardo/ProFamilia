import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { normalizarFicha } from "@/lib/ficha-dados";
import { fichaNoEscopo } from "@/lib/escopo";
import { numeroAtendimento } from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";
import { falhaInterna, rota } from "@/lib/erros-servidor";

type Contexto = { params: Promise<{ id: string }> };

async function buscar(id: string, usuario: Parameters<typeof fichaNoEscopo>[0]) {
  const [ficha] = await db
    .select({
      id: atendimentos.id,
      numero: atendimentos.numero,
      nome: atendimentos.nomeCompleto,
      criadoPorId: atendimentos.criadoPorId,
    })
    .from(atendimentos)
    .where(eq(atendimentos.id, id))
    .limit(1);
  // Fora do escopo, a ficha é tratada como inexistente.
  return ficha && fichaNoEscopo(usuario, ficha) ? ficha : null;
}

/** Edição completa da ficha (mesma validação do cadastro). */
export const PUT = rota(async function PUT(req: Request, { params }: Contexto) {
  const auth = await autorizarApi(req, "fichas.editar");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  const existente = await buscar(id, auth.usuario);
  if (!existente) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Corpo não é um objeto JSON.");
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }
  const resultado = normalizarFicha(body);
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro, faltando: resultado.faltando }, { status: resultado.status });
  }

  try {
    await db
      .update(atendimentos)
      .set({ ...resultado.dados, atualizadoPorId: auth.usuario.id, atualizadoEm: new Date() })
      .where(eq(atendimentos.id, id));
    await registrarAuditoria({
      usuario: auth.usuario, acao: "ficha.editada", entidade: "ficha", entidadeId: id,
      detalhes: `${numeroAtendimento(existente.numero)} — ${resultado.dados.nomeCompleto}`, req,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return falhaInterna(req, e, { mensagem: "Não foi possível salvar as alterações." });
  }
});

/** Exclusão definitiva da ficha e, em cascata, de suas evoluções. */
export const DELETE = rota(async function DELETE(req: Request, { params }: Contexto) {
  const auth = await autorizarApi(req, "fichas.excluir");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  const existente = await buscar(id, auth.usuario);
  if (!existente) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  try {
    const [{ total }] = await db.select({ total: count() }).from(evolucoes).where(eq(evolucoes.atendimentoId, id));
    await db.delete(atendimentos).where(eq(atendimentos.id, id));
    await registrarAuditoria({
      usuario: auth.usuario, acao: "ficha.excluida", entidade: "ficha", entidadeId: id,
      detalhes: `${numeroAtendimento(existente.numero)} — ${existente.nome} (${total} evoluções removidas)`, req,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return falhaInterna(req, e, { mensagem: "Não foi possível excluir a ficha." });
  }
});
