import { NextResponse } from "next/server";
import { carregarDadosRelatorio, resolverPeriodo, TIPOS_RELATORIO, type TipoRelatorio } from "@/lib/relatorios";
import { gerarRelatorioPdf } from "@/lib/gerar-relatorio-pdf";
import { autorizarApi, registrarAuditoria } from "@/lib/auth";

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
    return NextResponse.json(
      { erro: "Período inválido. Informe datas válidas e uma data inicial anterior à final." },
      { status: 400 },
    );
  }

  const tipoRaw = searchParams.get("tipo") || "completo";
  if (!Object.prototype.hasOwnProperty.call(TIPOS_RELATORIO, tipoRaw)) {
    return NextResponse.json(
      { erro: "Tipo de relatório inválido." },
      { status: 400 },
    );
  }
  const tipo = tipoRaw as TipoRelatorio;
  const baixar = searchParams.get("baixar") === "1";

  try {
    const dados = await carregarDadosRelatorio(periodo);

    // Relatórios nominais paginam por ficha: sem limite, um intervalo muito longo
    // prende o servidor. O CSV cobre volumes grandes sem custo proporcional.
    const LIMITE_FICHAS_PDF = 1500;
    if (tipo !== "indicadores" && dados.fichas.length > LIMITE_FICHAS_PDF) {
      return NextResponse.json(
        {
          erro: `O período selecionado tem ${dados.fichas.length.toLocaleString("pt-BR")} fichas e o PDF nominal ficaria muito lento. Reduza o intervalo ou exporte a planilha CSV.`,
        },
        { status: 413 },
      );
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
    console.error("Erro ao emitir relatório PDF:", error);
    return NextResponse.json(
      { erro: "Não foi possível gerar o relatório. Tente novamente." },
      { status: 500 },
    );
  }
}
