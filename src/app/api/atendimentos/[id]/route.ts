import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { normalizarFicha } from "@/lib/ficha-dados";
import { numeroAtendimento } from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";

type Contexto = { params: Promise<{ id: string }> };

async function buscar(id: string) {
  const [ficha] = await db
    .select({ id: atendimentos.id, numero: atendimentos.numero, nome: atendimentos.nomeCompleto })
    .from(atendimentos)
    .where(eq(atendimentos.id, id))
    .limit(1);
  return ficha ?? null;
}

/** Edição completa da ficha (mesma validação do cadastro). */
export async function PUT(req: Request, { params }: Contexto) {
  const auth = await autorizarApi(req, "fichas.editar");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  const existente = await buscar(id);
  if (!existente) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
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
    console.error("Erro ao editar ficha:", e);
    return NextResponse.json({ erro: "Não foi possível salvar as alterações." }, { status: 500 });
  }
}

/** Exclusão definitiva da ficha e, em cascata, de suas evoluções. */
export async function DELETE(req: Request, { params }: Contexto) {
  const auth = await autorizarApi(req, "fichas.excluir");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  const existente = await buscar(id);
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
    console.error("Erro ao excluir ficha:", e);
    return NextResponse.json({ erro: "Não foi possível excluir a ficha." }, { status: 500 });
  }
}
