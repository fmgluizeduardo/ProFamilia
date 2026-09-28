import { NextResponse } from "next/server";
import { autorizarApi, encerrarSessoesDoUsuario, registrarAuditoria } from "@/lib/auth";
import { rota } from "@/lib/erros-servidor";

/** O próprio usuário encerra as sessões dos outros aparelhos (mantém a atual). */
export const POST = rota(async function POST(req: Request) {
  const auth = await autorizarApi(req);
  if (!auth.ok) return auth.resposta;
  await encerrarSessoesDoUsuario(auth.usuario.id, auth.usuario.sessaoId);
  await registrarAuditoria({
    usuario: auth.usuario, acao: "usuario.sessoes_encerradas", entidade: "usuario", entidadeId: auth.usuario.id,
    detalhes: "Encerrou as sessões dos outros aparelhos", req,
  });
  return NextResponse.json({ ok: true });
});
