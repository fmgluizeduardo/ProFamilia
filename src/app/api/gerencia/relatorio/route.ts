import { NextResponse } from "next/server";
import { carregarDadosRelatorio, resolverPeriodo, TIPOS_RELATORIO, type TipoRelatorio } from "@/lib/relatorios";
import { gerarRelatorioPdf } from "@/lib/gerar-relatorio-pdf";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";
import { veTodasAsFichas } from "@/lib/escopo";
import { comRetentativa } from "@/lib/db-retry";
import { classificarFalha, respostaErro } from "@/lib/respostas-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// PDFs nominais podem ter muitas páginas; a Vercel encerra funções longas sem isso.
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = await autorizarApi(req, "relatorios.exportar");
  if (!auth.ok) return auth.resposta;
  const { searchParams } = new URL(req.url);
  const periodo = resolverPeriodo(searchParams.get("de"), searchParams.get("ate"));
  if (!periodo) {
    return respostaErro(req, 400, "Período inválido",
      "Informe datas válidas, com a data inicial anterior à final.", "PERIODO");
  }

  const tipoRaw = searchParams.get("tipo") || "completo";
  if (!Object.prototype.hasOwnProperty.call(TIPOS_RELATORIO, tipoRaw)) {
    return respostaErro(req, 400, "Tipo de relatório inválido",
      "Escolha um dos relatórios disponíveis na tela de Gerência.", "TIPO");
  }
  const tipo = tipoRaw as TipoRelatorio;
  // Relatórios com dados pessoais exigem acesso às fichas de toda a equipe.
  if ((tipo === "completo" || tipo === "fichas") && !veTodasAsFichas(auth.usuario)) {
    return respostaErro(req, 403, "Acesso restrito",
      "Relatórios com dados pessoais exigem permissão para ver as fichas de toda a equipe.", "PERMISSAO");
  }
  const baixar = searchParams.get("baixar") === "1";

  try {
    // Nova tentativa automática: o banco pode estar acordando da hibernação.
    const dados = await comRetentativa(() => carregarDadosRelatorio(periodo));

    // Relatórios nominais paginam por ficha: sem limite, um intervalo muito longo
    // prende o servidor. O CSV cobre volumes grandes sem custo proporcional.
    const LIMITE_FICHAS_PDF = 1500;
    if (tipo !== "indicadores" && dados.fichas.length > LIMITE_FICHAS_PDF) {
      return respostaErro(req, 413, "Período grande demais para este relatório",
        `São ${dados.fichas.length.toLocaleString("pt-BR")} fichas no intervalo. Reduza o período ou use a planilha CSV.`,
        "VOLUME");
    }

    const pdf = await gerarRelatorioPdf(dados, tipo);
    await registrarAuditoria({
      usuario: auth.usuario, acao: "relatorio.pdf",
      detalhes: `${TIPOS_RELATORIO[tipo].titulo} · ${dados.fichas.length} fichas · ${periodo.de} a ${periodo.ate}`, req,
    });
    const nome = `profamilia-${tipo}-${periodo.de}-a-${periodo.ate}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Log completo no servidor; para o usuário, a causa provável em português.
    console.error(`Erro ao emitir relatório PDF (tipo=${tipo}, ${periodo.de}..${periodo.ate}):`, error);
    const f = classificarFalha(error);
    return respostaErro(req, f.status, f.mensagem, f.detalhe, f.codigo);
  }
}
