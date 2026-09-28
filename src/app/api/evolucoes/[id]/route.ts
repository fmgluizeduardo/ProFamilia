import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { atendimentos, evolucoes } from "@/db/schema";
import { fichaNoEscopo } from "@/lib/escopo";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { uuidValido } from "@/lib/validacoes";
import { rota } from "@/lib/erros-servidor";

export const DELETE = rota(async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await autorizarApi(req, "evolucoes.excluir");
  if (!auth.ok) return auth.resposta;
  const { id } = await params;
  if (!uuidValido(id)) return NextResponse.json({ erro: "Evolução não encontrada." }, { status: 404 });

  const [evo] = await db.select().from(evolucoes).where(eq(evolucoes.id, id)).limit(1);
  if (!evo) return NextResponse.json({ erro: "Evolução não encontrada." }, { status: 404 });
  const [ficha] = await db
    .select({ criadoPorId: atendimentos.criadoPorId })
    .from(atendimentos)
    .where(eq(atendimentos.id, evo.atendimentoId))
    .limit(1);
  if (!ficha || !fichaNoEscopo(auth.usuario, ficha)) {
    return NextResponse.json({ erro: "Evolução não encontrada." }, { status: 404 });
  }

  await db.delete(evolucoes).where(eq(evolucoes.id, id));
  await registrarAuditoria({
    usuario: auth.usuario, acao: "evolucao.excluida", entidade: "ficha", entidadeId: evo.atendimentoId,
    detalhes: `Evolução de ${evo.autorNome} em ${fmtDataHora(evo.createdAt)}: “${evo.texto.slice(0, 120)}”`, req,
  });
  return NextResponse.json({ ok: true });
});
