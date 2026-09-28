import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { numeroAtendimento } from "@/lib/format";
import { texto, uuidValido } from "@/lib/validacoes";
import { fichaNoEscopo } from "@/lib/escopo";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autorizarApi(req, "evolucoes.criar");
  if (!auth.ok) return auth.resposta;
  const { usuario } = auth;
  const { id } = await params;

  if (!uuidValido(id)) return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const descricao = texto(body.texto, 8000);
  if (!descricao) {
    return NextResponse.json({ erro: "Descreva a evolução antes de registrar." }, { status: 422 });
  }

  const [ficha] = await db
    .select({ id: atendimentos.id, numero: atendimentos.numero, criadoPorId: atendimentos.criadoPorId })
    .from(atendimentos)
    .where(eq(atendimentos.id, id))
    .limit(1);
  if (!ficha || !fichaNoEscopo(usuario, ficha)) {
    return NextResponse.json({ erro: "Ficha não encontrada." }, { status: 404 });
  }

  try {
    // Autoria vem da sessão, nunca do formulário: não é possível registrar em nome de outra pessoa.
    const [criada] = await db
      .insert(evolucoes)
      .values({
        atendimentoId: id,
        texto: descricao,
        autorNome: usuario.nome,
        autorCargo: usuario.cargo,
        autorId: usuario.id,
      })
      .returning();
    await registrarAuditoria({
      usuario, acao: "evolucao.criada", entidade: "ficha", entidadeId: id,
      detalhes: `Evolução na ficha ${numeroAtendimento(ficha.numero)}`, req,
    });
    return NextResponse.json(criada, { status: 201 });
  } catch (erro) {
    console.error("Erro ao registrar evolução:", erro);
    return NextResponse.json({ erro: "Não foi possível registrar a evolução. Tente novamente." }, { status: 500 });
  }
}
