import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { LOGIN_REGEX, rotuloPermissao } from "@/lib/permissoes";
import { hashSenha } from "@/lib/senha";
import { LIMITE_NOME, lerValidade, papelValido, permissoesParaPapel } from "@/lib/usuarios-admin";
import { fmtData, hojeISO } from "@/lib/format";
import { texto } from "@/lib/validacoes";

export async function POST(req: Request) {
  const auth = await autorizarApi(req, "admin");
  if (!auth.ok) return auth.resposta;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const nome = texto(body.nome, LIMITE_NOME);
  const login = typeof body.login === "string" ? body.login.trim().toLowerCase() : "";
  const cargo = texto(body.cargo, 120);
  const papel = papelValido(body.papel) ?? "usuario";
  const senha = typeof body.senhaTemporaria === "string" ? body.senhaTemporaria : "";

  if (!nome) return NextResponse.json({ erro: "Informe o nome completo." }, { status: 422 });
  if (!LOGIN_REGEX.test(login)) {
    return NextResponse.json(
      { erro: "Usuário inválido: use de 3 a 32 caracteres, apenas letras minúsculas, números, ponto, hífen ou sublinhado." },
      { status: 422 },
    );
  }
  if (senha.length < 8 || senha.length > 128) {
    return NextResponse.json({ erro: "A senha temporária precisa ter ao menos 8 caracteres." }, { status: 422 });
  }

  const [existe] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.login, login)).limit(1);
  if (existe) return NextResponse.json({ erro: `O usuário “${login}” já existe. Escolha outro.` }, { status: 409 });

  const validade = lerValidade(body.acessoAte);
  if (validade === false) return NextResponse.json({ erro: "Data de validade do acesso inválida." }, { status: 422 });
  if (validade && validade < hojeISO()) {
    return NextResponse.json({ erro: "A validade do acesso não pode ser uma data passada." }, { status: 422 });
  }
  const acessoAte = papel === "admin" ? null : validade;

  const permissoes = permissoesParaPapel(papel, body.permissoes);
  if (papel === "usuario" && permissoes.length === 0) {
    return NextResponse.json({ erro: "Selecione ao menos uma permissão ou um perfil de acesso." }, { status: 422 });
  }

  try {
    const [criado] = await db
      .insert(usuarios)
      .values({
        nome, login, cargo, papel, permissoes, acessoAte,
        senhaHash: await hashSenha(senha),
        deveTrocarSenha: true,
      })
      .returning({ id: usuarios.id });

    await registrarAuditoria({
      usuario: auth.usuario, acao: "usuario.criado", entidade: "usuario", entidadeId: criado.id,
      detalhes: `${nome} (@${login}) · ${papel === "admin" ? "Administrador" : permissoes.map(rotuloPermissao).join("; ")}${acessoAte ? ` · acesso até ${fmtData(acessoAte)}` : ""}`,
      req,
    });
    return NextResponse.json({ id: criado.id }, { status: 201 });
  } catch (erro) {
    console.error("Erro ao criar usuário:", erro);
    return NextResponse.json({ erro: "Não foi possível criar o usuário." }, { status: 500 });
  }
}
