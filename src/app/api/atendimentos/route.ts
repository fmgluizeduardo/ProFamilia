import { NextResponse } from "next/server";
import { db } from "@/db";
import { atendimentos } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { normalizarFicha } from "@/lib/ficha-dados";
import { numeroAtendimento } from "@/lib/format";
import { temPermissao } from "@/lib/permissoes";

export async function POST(req: Request) {
  const auth = await autorizarApi(req, "fichas.criar");
  if (!auth.ok) return auth.resposta;
  const { usuario } = auth;

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
    const [criado] = await db
      .insert(atendimentos)
      .values({ ...resultado.dados, criadoPorId: usuario.id })
      .returning({ id: atendimentos.id, numero: atendimentos.numero });

    await registrarAuditoria({
      usuario, acao: "ficha.criada", entidade: "ficha", entidadeId: criado.id,
      detalhes: `${numeroAtendimento(criado.numero)} — ${resultado.dados.nomeCompleto}`, req,
    });

    return NextResponse.json(
      { id: criado.id, numero: criado.numero, podeVer: temPermissao(usuario, "fichas.ver") },
      { status: 201 },
    );
  } catch (e) {
    console.error("Erro ao salvar atendimento:", e);
    return NextResponse.json({ erro: "Não foi possível salvar a ficha. Tente novamente." }, { status: 500 });
  }
}
