import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import type { Atendimento, Evolucao, VeiculoRegistro } from "@/db/schema";
import { ORGAO, RUA_TIPOS, USO_DROGAS, VINCULOS } from "@/lib/constants";
import { rotuloVeiculo } from "@/lib/frota";
import { fmtData, fmtDataHora, labelSN, moedaBR, numeroAtendimento } from "@/lib/format";
import {
  TIPOS_RELATORIO,
  resumirRelatorio,
  type DadosRelatorio,
  type Distribuicao,
  type ResumoRelatorio,
  type TipoRelatorio,
} from "@/lib/relatorios";

const PW = 595.28; // A4: 210 x 297 mm
const PH = 841.89;
const M = 44;
const CW = PW - M * 2;
const TOP = 94;
const BOTTOM = 777;
const C = {
  navy: "#14233A",
  dark: "#1F2E45",
  gray: "#52647B",
  muted: "#8593A4",
  line: "#DDE5ED",
  pale: "#F4F7FA",
  white: "#FFFFFF",
  blue: "#3B8FD4",
  bluePale: "#EFF7FD",
  green: "#679E3F",
  orange: "#E67E22",
  orangePale: "#FEF4EB",
  red: "#B5493D",
};

type Fonte = "body" | "medium" | "bold" | "display";
const FONTES: Record<Fonte, string> = {
  body: "DejaVuSans",
  medium: "DejaVuSans",
  bold: "DejaVuSansBold",
  display: "DejaVuSansBold",
};

function seguro(v: unknown): string {
  if (v === null || v === undefined || v === "") return "Não informado";
  return String(v).trim() || "Não informado";
}

function lista(v: string[]): string {
  return v.length ? v.join(" · ") : "Não informado";
}

function rotuloOutro(v: string | null, desc: string | null): string {
  return v === "Outro" || v === "Outra identificação"
    ? desc ? `${v}: ${desc}` : seguro(v)
    : seguro(v);
}

function rotuloSN(v: string | null): string {
  const label = labelSN(v);
  return label === "—" ? "Não informado" : label;
}

class RelatorioA4 {
  readonly doc: PDFKit.PDFDocument;
  y = TOP;
  capitulo = "VISÃO GERAL";
  private linhasAlternadas = 0;

  constructor(titulo: string) {
    this.doc = new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: false,
      bufferPages: true,
      compress: true,
      info: {
        Title: `${titulo} — Instituto PróFamília`,
        Author: "Instituto PróFamília",
        Subject: "Serviço Especializado em Abordagem Social — Barretos/SP",
        Keywords: "abordagem social, relatório técnico, Barretos",
      },
    });
    // Na Vercel, a pasta public/ vai para o CDN e NÃO acompanha a função
    // serverless — por isso as fontes vivem em assets/fonts (incluídas no
    // pacote via outputFileTracingIncludes no next.config.ts).
    const candidatos = [
      path.join(process.cwd(), "assets", "fonts"),
      path.join(process.cwd(), "public", "fonts"),
      path.join(__dirname, "..", "..", "..", "assets", "fonts"),
    ];
    const pasta = candidatos.find((dir) => {
      try {
        return (
          fs.existsSync(path.join(dir, "DejaVuSans-Regular.ttf")) &&
          fs.existsSync(path.join(dir, "DejaVuSans-Bold.ttf"))
        );
      } catch {
        return false;
      }
    });
    if (!pasta) {
      throw new Error(
        `Fontes do relatório não encontradas. Pastas verificadas: ${candidatos.join(" | ")}`,
      );
    }
    this.doc.registerFont(FONTES.body, path.join(pasta, "DejaVuSans-Regular.ttf"));
    this.doc.registerFont(FONTES.bold, path.join(pasta, "DejaVuSans-Bold.ttf"));
  }

  fonte(tipo: Fonte, tamanho: number, cor: string) {
    this.doc.font(FONTES[tipo]).fontSize(tamanho).fillColor(cor);
    return this.doc;
  }

  novaPagina(capitulo = this.capitulo) {
    this.capitulo = capitulo;
    this.doc.addPage({ size: "A4", margin: 0 });
    this.doc.rect(0, 0, PW, 7).fill(C.navy);
    this.doc.circle(M + 7, 39, 4.5).fill(C.green);
    this.doc.circle(M + 21, 39, 4.5).fill(C.blue);
    this.doc.circle(M + 14, 50, 3.4).fill(C.orange);
    this.fonte("display", 10.5, C.navy).text("Instituto PróFamília", M + 36, 33, {
      width: 220, lineBreak: false,
    });
    this.fonte("bold", 7.2, C.gray).text(capitulo.toUpperCase(), PW - M - 215, 37, {
      width: 215, align: "right", lineBreak: false, ellipsis: true,
    });
    this.doc.moveTo(M, 66).lineTo(PW - M, 66).lineWidth(0.75).strokeColor(C.line).stroke();
    this.y = TOP;
  }

  garantir(altura: number) {
    if (this.y + altura > BOTTOM) this.novaPagina();
  }

  capa(tipo: TipoRelatorio, periodo: DadosRelatorio["periodo"], resumo: ResumoRelatorio) {
    const doc = this.doc;
    doc.addPage({ size: "A4", margin: 0 });
    doc.rect(0, 0, PW, 335).fill(C.navy);
    doc.save().fillColor(C.blue).opacity(0.12).circle(520, 75, 145).fill().restore();
    doc.save().fillColor(C.green).opacity(0.12).circle(555, 212, 105).fill().restore();
    doc.save().fillColor(C.orange).opacity(0.12).circle(483, 313, 120).fill().restore();

    // Marca em vetor para impressão nítida.
    doc.circle(63, 59, 6.5).fill(C.green);
    doc.circle(91, 59, 6.5).fill(C.blue);
    doc.path("M 54 74 C 45 94, 55 119, 77 128").lineWidth(9).lineCap("round").strokeColor(C.green).stroke();
    doc.path("M 100 74 C 109 94, 99 119, 77 128").lineWidth(9).lineCap("round").strokeColor(C.blue).stroke();
    doc.circle(77, 103, 7).fill(C.orange);
    this.fonte("bold", 9, "#BFD1E2").text("INSTITUTO PRÓFAMÍLIA", 125, 57, { characterSpacing: 1.8 });
    this.fonte("medium", 8, "#A9BACD").text(ORGAO.servico, 125, 75, { width: 390 });

    doc.moveTo(M, 149).lineTo(PW - M, 149).lineWidth(1).strokeColor("#486078").stroke();
    this.fonte("bold", 9, "#FFC17E").text("RELATÓRIO TÉCNICO GERENCIAL", M, 174, {
      characterSpacing: 1.65,
    });
    this.fonte("display", 27, C.white).text(TIPOS_RELATORIO[tipo].titulo, M, 199, {
      width: 492, lineGap: 3,
    });
    this.fonte("medium", 10, "#CCD9E7").text(
      `Período de referência: ${fmtData(periodo.de)} a ${fmtData(periodo.ate)}`,
      M, 286, { width: 465 },
    );

    this.fonte("bold", 8, C.gray).text("PANORAMA DO PERÍODO", M, 371, {
      characterSpacing: 1.2,
    });
    const metr = tipo === "veiculos"
      ? [
          [resumo.saidas, "saídas registradas"],
          [resumo.concluidas, "rotas concluídas"],
          [resumo.kmRodados.toLocaleString("pt-BR"), "km percorridos"],
        ] as const
      : [
          [resumo.total, "atendimentos"],
          [resumo.unicos, "pessoas identificadas*"],
          [resumo.acompanhamento, "em acompanhamento"],
        ] as const;
    const gap = 10;
    const ww = (CW - gap * 2) / 3;
    metr.forEach(([valor, label], i) => {
      const x = M + i * (ww + gap);
      doc.roundedRect(x, 396, ww, 83, 7).fill(C.pale);
      this.fonte("display", 24, C.navy).text(String(valor), x + 14, 411, {
        width: ww - 28, lineBreak: false,
      });
      this.fonte("bold", 8, C.gray).text(label, x + 14, 447, {
        width: ww - 28,
      });
    });

    this.fonte("bold", 8, C.gray).text("NESTE DOCUMENTO", M, 513, {
      characterSpacing: 1.2,
    });
    const secoes = tipo === "completo"
      ? ["01  Indicadores e análise estatística", "02  Fichas completas e evoluções", "03  Controle detalhado de veículo"]
      : tipo === "indicadores"
        ? ["01  Indicadores e séries temporais", "02  Perfil das pessoas e situações", "03  Demandas, atuação e rede", "04  Operação do veículo"]
        : tipo === "fichas"
          ? ["01  Índice de atendimentos", "02  Registros individuais na íntegra", "03  Evoluções vinculadas aos casos"]
          : ["01  Indicadores de frota", "02  Saídas e chegadas por motorista", "03  Histórico detalhado dos percursos"];
    secoes.forEach((s, i) => {
      const y = 538 + i * 31;
      doc.moveTo(M, y + 23).lineTo(PW - M, y + 23).lineWidth(0.5).strokeColor(C.line).stroke();
      this.fonte("medium", 10, C.dark).text(s, M + 2, y, { width: CW - 4 });
    });

    doc.roundedRect(M, 696, CW, 68, 6).fill(C.orangePale);
    this.fonte("bold", 8, "#94521E").text("DOCUMENTO CONFIDENCIAL", M + 14, 709, { characterSpacing: 1 });
    this.fonte("medium", 8, C.dark).text(
      "Contém informações de assistência social e, nas versões nominais, dados pessoais e sensíveis. Compartilhamento restrito à equipe autorizada.",
      M + 14, 725, { width: CW - 28, lineGap: 1 },
    );
  }

  titulo(numero: string, titulo: string, descricao?: string) {
    this.garantir(78);
    this.doc.roundedRect(M, this.y + 1, 29, 25, 5).fill(C.bluePale);
    this.fonte("bold", 9, C.blue).text(numero, M, this.y + 7, {
      width: 29, align: "center", lineBreak: false,
    });
    this.fonte("display", 14.5, C.navy).text(titulo, M + 39, this.y + 2, {
      width: CW - 39,
    });
    this.y += 32;
    if (descricao) {
      this.fonte("body", 8.4, C.gray);
      const alto = this.doc.heightOfString(descricao, { width: CW, lineGap: 2 });
      this.doc.text(descricao, M, this.y, { width: CW, lineGap: 2 });
      this.y += alto + 5;
    }
    this.doc.moveTo(M, this.y).lineTo(PW - M, this.y).lineWidth(0.75).strokeColor(C.line).stroke();
    this.y += 18;
  }

  subtitulo(titulo: string, nota?: string) {
    this.garantir(53);
    this.y += 7;
    this.doc.rect(M, this.y + 2, 3, 16).fill(C.green);
    this.fonte("bold", 10.2, C.navy).text(titulo, M + 11, this.y + 2, {
      width: CW - 11,
    });
    this.y += 23;
    if (nota) {
      this.fonte("body", 7.6, C.muted).text(nota, M + 11, this.y, {
        width: CW - 11,
      });
      this.y += 18;
    }
  }

  anotacao(texto: string) {
    this.garantir(50);
    this.fonte("body", 7.8, C.gray);
    const h = this.doc.heightOfString(texto, { width: CW - 26, lineGap: 2 });
    this.doc.roundedRect(M, this.y, CW, h + 20, 5).fill(C.pale);
    this.doc.text(texto, M + 13, this.y + 10, {
      width: CW - 26, lineGap: 2,
    });
    this.y += h + 31;
  }

  metricas(metricas: { valor: number | string; rotulo: string }[]) {
    this.garantir(155);
    const colW = (CW - 12 * 3) / 4;
    metricas.forEach((m, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = M + col * (colW + 12);
      const y = this.y + row * 70;
      this.doc.roundedRect(x, y, colW, 60, 5).fill(row === 0 ? C.bluePale : C.pale);
      this.fonte("display", 19, C.navy).text(String(m.valor), x + 10, y + 8, {
        width: colW - 20, lineBreak: false, ellipsis: true,
      });
      this.fonte("medium", 7, C.gray).text(m.rotulo, x + 10, y + 35, {
        width: colW - 20, height: 23, ellipsis: true,
      });
    });
    this.y += Math.ceil(metricas.length / 4) * 70 + 10;
  }

  /** Quebra de linha própria: nunca deixa o PDFKit criar páginas sem cabeçalho. */
  private quebrar(texto: string, largura: number, tamanho: number, fonte: Fonte): string[] {
    this.doc.font(FONTES[fonte]).fontSize(tamanho);
    const saida: string[] = [];
    const paragrafos = texto.replace(/\r/g, "").split("\n");
    for (const paragrafo of paragrafos) {
      if (!paragrafo.trim()) {
        saida.push("");
        continue;
      }
      let linha = "";
      const palavras = paragrafo.trim().split(/\s+/);
      for (const palavra of palavras) {
        const tentativa = linha ? `${linha} ${palavra}` : palavra;
        if (this.doc.widthOfString(tentativa) <= largura) {
          linha = tentativa;
          continue;
        }
        if (linha) saida.push(linha);
        linha = palavra;
        // Proteção para palavras gigantes (URL, token ou dados não padronizados).
        while (this.doc.widthOfString(linha) > largura) {
          let tamanhoCorte = linha.length - 1;
          while (tamanhoCorte > 1 && this.doc.widthOfString(linha.slice(0, tamanhoCorte)) > largura) tamanhoCorte--;
          saida.push(linha.slice(0, tamanhoCorte));
          linha = linha.slice(tamanhoCorte);
        }
      }
      if (linha) saida.push(linha);
    }
    return saida.length ? saida : [""];
  }

  private escreverLinhas(linhas: string[], x: number, y: number, largura: number, tamanho: number, passo: number, fonte: Fonte, cor: string) {
    this.fonte(fonte, tamanho, cor);
    linhas.forEach((linha, i) => {
      if (linha) this.doc.text(linha, x, y + i * passo, {
        width: largura, lineBreak: false,
      });
    });
  }

  distribuicao(titulo: string, dados: Distribuicao[], total: number, selecaoMultipla = false) {
    this.subtitulo(titulo, selecaoMultipla
      ? "Seleção múltipla: percentuais calculados sobre o total de atendimentos no período."
      : undefined);
    if (!dados.length) {
      this.fonte("body", 8.5, C.muted).text("Sem ocorrências no período.", M + 11, this.y, { width: CW - 11 });
      this.y += 22;
      return;
    }
    const max = Math.max(...dados.map((d) => d.valor), 1);
    for (const [i, d] of dados.entries()) {
      const linhas = this.quebrar(d.label, 211, 8.3, "medium");
      const h = Math.max(26, linhas.length * 12 + 9);
      this.garantir(h + 2);
      const y = this.y;
      if (i % 2 === 0) this.doc.roundedRect(M, y, CW, h, 4).fill(C.pale);
      this.escreverLinhas(linhas, M + 10, y + 5, 211, 8.3, 12, "medium", C.dark);
      const barX = M + 238;
      const barW = 166;
      this.doc.roundedRect(barX, y + h / 2 - 3.5, barW, 7, 3.5).fill(C.line);
      if (d.valor > 0) {
        this.doc.roundedRect(barX, y + h / 2 - 3.5, Math.max(4, (d.valor / max) * barW), 7, 3.5)
          .fill(i % 3 === 0 ? C.blue : i % 3 === 1 ? C.green : C.orange);
      }
      const pct = total > 0 ? `${Math.round((d.valor / total) * 100)}%` : "—";
      this.fonte("bold", 8.1, C.navy).text(String(d.valor), M + 419, y + h / 2 - 5, {
        width: 31, align: "right", lineBreak: false,
      });
      this.fonte("medium", 7.5, C.gray).text(pct, M + 455, y + h / 2 - 5, {
        width: 43, align: "right", lineBreak: false,
      });
      this.y += h + 2;
    }
    this.y += 13;
  }

  /** Linha detalhada com quebra de conteúdo (inclusive textos de evolução longos). */
  detalhe(rotulo: string, valor: unknown) {
    const texto = Array.isArray(valor) ? lista(valor) : seguro(valor);
    const linhas = this.quebrar(texto, CW - 174, 8.35, "medium");
    let pos = 0;
    let primeiro = true;
    do {
      this.garantir(31);
      const disponivel = Math.max(1, Math.floor((BOTTOM - this.y - 12) / 13));
      const parte = linhas.slice(pos, pos + disponivel);
      const h = Math.max(25, parte.length * 13 + 10);
      if (this.y + h > BOTTOM) {
        this.novaPagina();
        continue;
      }
      if (this.linhasAlternadas % 2 === 0) {
        this.doc.rect(M, this.y, CW, h).fill(C.pale);
      }
      this.fonte("bold", 7.1, C.gray).text(
        primeiro ? rotulo.toUpperCase() : "CONTINUAÇÃO",
        M + 10, this.y + 7, { width: 143 },
      );
      this.escreverLinhas(parte, M + 164, this.y + 5, CW - 174, 8.35, 13, "medium", C.dark);
      this.y += h;
      pos += parte.length;
      primeiro = false;
      this.linhasAlternadas++;
    } while (pos < linhas.length);
  }

  grupoDetalhe(titulo: string) {
    this.garantir(47);
    this.y += 15;
    this.doc.rect(M, this.y, CW, 25).fill(C.navy);
    this.fonte("bold", 8, C.white).text(titulo.toUpperCase(), M + 10, this.y + 7, {
      width: CW - 20, characterSpacing: 0.75, lineBreak: false,
    });
    this.y += 25;
    this.linhasAlternadas = 0;
  }

  /** Tabela concisa do índice de fichas, cada ficha completa vem adiante. */
  indice(fichas: Atendimento[]) {
    this.novaPagina("ÍNDICE DAS FICHAS");
    this.titulo("02", "Índice dos atendimentos", "Todas as fichas do período. As informações integrais e evoluções constam nas páginas seguintes.");
    if (!fichas.length) {
      this.anotacao("Nenhum atendimento foi registrado no período selecionado.");
      return;
    }
    const cabecalho = () => {
      this.doc.rect(M, this.y, CW, 25).fill(C.navy);
      const t = (v: string, x: number, w: number) => this.fonte("bold", 7.2, C.white).text(v, x, this.y + 7, { width: w, lineBreak: false });
      t("Nº", M + 8, 42);
      t("DATA", M + 57, 67);
      t("PESSOA ATENDIDA", M + 132, 175);
      t("SITUAÇÃO", M + 312, 188);
      this.y += 25;
    };
    cabecalho();
    for (const [i, f] of fichas.entries()) {
      const situacoes = f.situacaoAtual.length ? f.situacaoAtual.join("; ") : "Não informado";
      const a = this.quebrar(f.nomeSocial ?? f.nomeCompleto, 171, 8, "medium");
      const b = this.quebrar(situacoes, 183, 7.6, "body");
      const linhas = Math.max(a.length, b.length);
      const alto = Math.max(28, 10 + linhas * 12);
      if (this.y + alto > BOTTOM) {
        this.novaPagina("ÍNDICE DAS FICHAS");
        cabecalho();
      }
      if (i % 2 === 0) this.doc.rect(M, this.y, CW, alto).fill(C.pale);
      this.fonte("bold", 8, C.blue).text(numeroAtendimento(f.numero), M + 8, this.y + 7, { width: 44 });
      this.fonte("medium", 8, C.dark).text(fmtData(f.dataAtendimento), M + 57, this.y + 7, { width: 68 });
      this.escreverLinhas(a, M + 132, this.y + 6, 171, 8, 12, "medium", C.dark);
      this.escreverLinhas(b, M + 312, this.y + 6, 183, 7.6, 12, "body", C.gray);
      this.y += alto;
    }
  }

  ficha(f: Atendimento, evolucoes: Evolucao[]) {
    this.novaPagina(`FICHA ${numeroAtendimento(f.numero)}`);
    this.titulo(numeroAtendimento(f.numero), f.nomeSocial || f.nomeCompleto,
      `Atendimento em ${fmtData(f.dataAtendimento)} às ${f.horario} · ${f.localAbordagem}`);
    if (f.nomeSocial) this.detalhe("Nome completo", f.nomeCompleto);

    this.grupoDetalhe("1 · Dados do atendimento");
    this.detalhe("Nº da ficha", numeroAtendimento(f.numero));
    this.detalhe("Data e hora", `${fmtData(f.dataAtendimento)} às ${f.horario}`);
    this.detalhe("Local da abordagem", f.localAbordagem);
    this.detalhe("Ponto de referência", f.pontoReferencia);
    this.detalhe("Profissional", f.profissionalResponsavel);
    this.detalhe("Equipe", f.equipe);
    this.detalhe("Motivo da abordagem", rotuloOutro(f.motivoAbordagem, f.motivoOutro));

    this.grupoDetalhe("2 · Identificação pessoal");
    this.detalhe("Nome completo", f.nomeCompleto);
    this.detalhe("Nome social", f.nomeSocial);
    this.detalhe("Data de nascimento", f.dataNascimento ? fmtData(f.dataNascimento) : null);
    this.detalhe("Idade informada", f.idade !== null ? `${f.idade} anos` : null);
    this.detalhe("Nome da mãe", f.nomeMae);
    this.detalhe("Nome do pai", f.nomePai);
    this.detalhe("Telefone", f.telefone);
    this.detalhe("Sexo / identidade", rotuloOutro(f.sexo, f.sexoOutro));
    this.detalhe("Estado civil", f.estadoCivil);
    this.detalhe("Naturalidade", f.naturalidade);
    this.detalhe("Município de origem", f.municipioOrigem);
    this.detalhe("CPF", f.cpf);
    this.detalhe("RG", f.rg);
    this.detalhe("Documentação", rotuloSN(f.possuiDocumentacao));

    this.grupoDetalhe("3 · Situação atual e de rua");
    this.detalhe("Situações identificadas", f.situacaoAtual);
    this.detalhe("Outra situação", f.situacaoAtualOutro);
    this.detalhe("Tempo na situação", f.tempoSituacao);
    this.detalhe("Tipo de situação de rua", RUA_TIPOS.find((r) => r.value === f.ruaTipo)?.label ?? f.ruaTipo);
    this.detalhe("Motivo (situação de rua)", f.ruaMotivo);
    this.detalhe("Quanto tempo na rua", f.ruaQuantoTempo);
    this.detalhe("Onde costuma permanecer", f.ruaOndePermanece);

    this.grupoDetalhe("4 · Família e moradia");
    this.detalhe("Vínculo preservado", rotuloSN(f.vinculoPreservado));
    this.detalhe("Vínculo familiar", VINCULOS.find((r) => r.value === f.vinculoFamiliar)?.hint ?? f.vinculoFamiliar);
    this.detalhe("Referência familiar", f.refFamiliarNome);
    this.detalhe("Telefone da referência", f.refFamiliarTelefone);
    this.detalhe("Município da família", f.refFamiliarMunicipio);
    this.detalhe("Condição de moradia", rotuloOutro(f.condicaoMoradia, f.condicaoMoradiaOutro));

    this.grupoDetalhe("5 · Saúde e escolaridade");
    this.detalhe("Condição de saúde", f.saudeCondicao);
    this.detalhe("Medicação contínua", rotuloSN(f.usoMedicacao));
    this.detalhe("Qual medicação", f.usoMedicacaoQual);
    this.detalhe("Saúde imediata", rotuloSN(f.atendimentoImediato));
    this.detalhe("Álcool e outras drogas", USO_DROGAS.find((r) => r.value === f.usoDrogas)?.label ?? f.usoDrogas);
    this.detalhe("Substâncias informadas", f.substancias);
    this.detalhe("Escolaridade", f.escolaridade);

    this.grupoDetalhe("6 · Renda e benefícios sociais");
    this.detalhe("Possui renda", rotuloSN(f.possuiRenda));
    this.detalhe("Origem da renda", rotuloOutro(f.origemRenda, f.origemRendaOutro));
    this.detalhe("Valor aproximado", f.valorRenda ? moedaBR(f.valorRenda) : null);
    this.detalhe("Benefícios sociais", f.beneficios);
    this.detalhe("Outro benefício", f.beneficiosOutro);
    this.detalhe("Número do NIS", f.numeroNis);

    this.grupoDetalhe("7 · Intervenções e rede");
    this.detalhe("Demandas identificadas", f.demandas);
    this.detalhe("Outra demanda", f.demandasOutro);
    this.detalhe("Providências adotadas", f.providencias);
    this.detalhe("Outra providência", f.providenciasOutro);
    this.detalhe("Procedimentos", f.procedimentos);
    this.detalhe("Encaminhamentos", f.encaminhamentos);
    this.detalhe("Outro encaminhamento", f.encaminhamentosOutro);
    this.detalhe("Necessita acompanhamento", rotuloSN(f.necessitaAcompanhamento));
    this.detalhe("Local do acompanhamento", f.acompanhamentoLocal);

    this.grupoDetalhe("8 · Registro e ciência");
    this.detalhe("Responsável pelo registro", f.responsavelNome);
    this.detalhe("Cargo", f.responsavelCargo);
    this.detalhe("Registrada em", fmtDataHora(f.createdAt));
    this.detalhe("Ciência do usuário", f.assinaturaUsuario ? "Assinatura coletada no atendimento" : "Não coletada");
    if (f.assinaturaUsuario?.startsWith("data:image/png;base64,")) {
      try {
        this.garantir(89);
        this.doc.rect(M, this.y + 8, 210, 62).lineWidth(0.6).strokeColor(C.line).stroke();
        this.doc.image(Buffer.from(f.assinaturaUsuario.split(",")[1], "base64"), M + 8, this.y + 13, {
          fit: [194, 52], align: "center", valign: "center",
        });
        this.y += 81;
      } catch {
        // Uma imagem inválida não impede a emissão do relatório.
      }
    }

    this.grupoDetalhe(`9 · Evoluções do caso (${evolucoes.length})`);
    if (!evolucoes.length) this.detalhe("Evoluções", "Nenhuma evolução registrada no período até a geração deste documento.");
    for (const evo of evolucoes) {
      this.detalhe(
        `${fmtDataHora(evo.createdAt)} · ${evo.autorNome}${evo.autorCargo ? ` (${evo.autorCargo})` : ""}`,
        evo.texto,
      );
    }
    this.y += 12;
  }

  frota(dados: DadosRelatorio, resumo: ResumoRelatorio, detalhar: boolean) {
    const { veiculos } = dados;
    this.novaPagina("CONTROLE DE VEÍCULO");
    this.titulo("03", "Controle operacional de veículo",
      `Saídas de ${fmtData(dados.periodo.de)} a ${fmtData(dados.periodo.ate)} · KM calculado somente para percursos concluídos.`);
    this.metricas([
      { valor: resumo.saidas, rotulo: "saídas registradas" },
      { valor: resumo.concluidas, rotulo: "percursos concluídos" },
      { valor: resumo.emRota, rotulo: "sem chegada registrada" },
      { valor: resumo.kmRodados.toLocaleString("pt-BR"), rotulo: "quilômetros rodados" },
    ]);
    this.distribuicao("Saídas por motorista", resumo.porMotorista, resumo.saidas);
    this.distribuicao("Saídas por veículo", resumo.porVeiculo, resumo.saidas);

    this.subtitulo("Frota cadastrada", "Veículos disponíveis para as rondas, independentemente do período.");
    if (!dados.frota.length) {
      this.anotacao("Nenhum veículo cadastrado na frota.");
    } else {
      this.linhasAlternadas = 0;
      for (const v of dados.frota) {
        this.detalhe(
          rotuloVeiculo(v),
          `${v.ativo ? "Ativo" : "Inativo"}${v.ano ? ` · Ano ${v.ano}` : ""}${v.cor ? ` · ${v.cor}` : ""} · KM inicial ${v.kmInicial.toLocaleString("pt-BR")}${v.observacoes ? ` · ${v.observacoes}` : ""}`,
        );
      }
      this.y += 6;
    }

    if (!detalhar) return;

    this.titulo("04", "Diário de deslocamentos",
      "Relação integral das saídas registradas no período. Trajetos em aberto são identificados separadamente.");
    if (!veiculos.length) {
      this.anotacao("Não há registros de saída de veículo para as datas selecionadas.");
      return;
    }
    for (const [index, r] of veiculos.entries()) {
      this.garantir(102);
      this.y += 5;
      this.doc.roundedRect(M, this.y, CW, 25, 4).fill(C.navy);
      this.fonte("bold", 8.4, C.white).text(
        `${String(index + 1).padStart(3, "0")}   ${fmtData(r.data)}   ·   ${r.veiculo}`,
        M + 10, this.y + 7, { width: CW - 150, lineBreak: false },
      );
      this.fonte("bold", 8, r.chegadaKm === null ? "#FFCB8A" : "#B7E2AE").text(
        r.chegadaKm === null ? "EM ROTA" : `${(r.chegadaKm - r.saidaKm).toLocaleString("pt-BR")} km rodados`,
        M + CW - 158, this.y + 7, { width: 145, align: "right", lineBreak: false },
      );
      this.y += 25;
      this.linhasAlternadas = 0;
      this.detalhe("Motorista", r.motorista);
      this.detalhe("Saída", `${r.saidaHora}  |  ${r.saidaKm.toLocaleString("pt-BR")} km  |  ${r.saidaLocal}`);
      this.detalhe("Chegada", r.chegadaHora
        ? `${r.chegadaHora}  |  ${r.chegadaKm?.toLocaleString("pt-BR")} km  |  ${r.chegadaLocal || "Local não informado"}`
        : "Não registrada (percurso em aberto)");
      this.y += 8;
    }
  }

  rodapes() {
    const { start, count } = this.doc.bufferedPageRange();
    for (let i = start; i < start + count; i++) {
      this.doc.switchToPage(i);
      this.doc.moveTo(M, 796).lineTo(PW - M, 796).lineWidth(0.6).strokeColor(C.line).stroke();
      this.fonte("bold", 6.7, C.gray).text("INSTITUTO PRÓFAMÍLIA  ·  BARRETOS / SP", M, 805, {
        width: 240, lineBreak: false,
      });
      this.fonte("medium", 6.5, C.muted).text("USO INTERNO · DOCUMENTO CONFIDENCIAL", M + 207, 805, {
        width: 210, align: "right", lineBreak: false,
      });
      this.fonte("bold", 7.3, C.navy).text(`${i - start + 1} / ${count}`, PW - M - 50, 804, {
        width: 50, align: "right", lineBreak: false,
      });
    }
  }
}

function indicadores(pdf: RelatorioA4, dados: DadosRelatorio, r: ResumoRelatorio) {
  pdf.novaPagina("INDICADORES E ANÁLISE");
  pdf.titulo("01", "Síntese executiva",
    `Indicadores consolidados dos atendimentos de ${fmtData(dados.periodo.de)} a ${fmtData(dados.periodo.ate)}. Os resultados descrevem registros, não estimativas populacionais.`);
  pdf.metricas([
    { valor: r.total, rotulo: "atendimentos" },
    { valor: r.unicos, rotulo: "pessoas identificadas*" },
    { valor: r.emRua, rotulo: "situação de rua" },
    { valor: r.acompanhamento, rotulo: "acompanhamento" },
    { valor: r.docsPendentes, rotulo: "documentação pendente" },
    { valor: r.saudeUrgente, rotulo: "saúde imediata" },
    { valor: r.criancas, rotulo: "menores de 18 anos" },
    { valor: r.idosos, rotulo: "pessoas com 60+ anos" },
  ]);
  pdf.anotacao("*Pessoas identificadas: aproximação por CPF quando informado; nos demais casos, por nome completo e data de nascimento. A ausência de identificação pode afetar a contagem. Respostas múltiplas são contadas uma vez por ficha e categoria. Campos sem resposta aparecem como “Não informado” nas distribuições de resposta única.");

  pdf.titulo("02", "Atendimentos no tempo e território");
  pdf.distribuicao("Atendimentos por mês (meses com registros)", r.porMes, r.total);
  pdf.distribuicao("Dia da semana", r.porDiaSemana, r.total);
  pdf.distribuicao("Período do dia", r.porTurno, r.total);
  pdf.distribuicao("Locais de abordagem", r.porLocal, r.total);
  pdf.distribuicao("Município de origem", r.porMunicipio, r.total);

  pdf.titulo("03", "Perfil e situação das pessoas atendidas");
  pdf.distribuicao("Sexo / identidade autodeclarada", r.porSexo, r.total);
  pdf.distribuicao("Faixa etária registrada", r.porFaixa, r.total);
  pdf.distribuicao("Estado civil", r.porEstadoCivil, r.total);
  pdf.distribuicao("Situações identificadas", r.porSituacao, r.total, true);
  pdf.distribuicao("Documentação pessoal", r.porDocumentacao, r.total);
  pdf.distribuicao("Condições de moradia", r.porMoradia, r.total);
  pdf.distribuicao("Vínculos familiares preservados", r.porVinculo, r.total);
  pdf.distribuicao("Classificação dos vínculos familiares", r.porVinculoFamiliar, r.total);

  pdf.titulo("04", "Saúde, escolaridade e proteção social");
  pdf.distribuicao("Atendimento de saúde imediato", r.porSaudeImediata, r.total);
  pdf.distribuicao("Uso contínuo de medicação", r.porMedicacao, r.total);
  pdf.distribuicao("Álcool e outras drogas (informação relatada)", r.porDrogas, r.total);
  pdf.distribuicao("Substâncias informadas", r.porSubstancias, r.total, true);
  pdf.distribuicao("Escolaridade", r.porEscolaridade, r.total);
  pdf.distribuicao("Possui renda", r.porRenda, r.total);
  pdf.distribuicao("Origem da renda", r.porOrigemRenda, r.total);
  pdf.distribuicao("Benefícios sociais", r.porBeneficios, r.total, true);

  pdf.titulo("05", "Atuação da equipe e rede de atendimento");
  pdf.distribuicao("Motivo da abordagem", r.porMotivo, r.total);
  pdf.distribuicao("Demandas identificadas", r.porDemandas, r.total, true);
  pdf.distribuicao("Providências adotadas", r.porProvidencias, r.total, true);
  pdf.distribuicao("Procedimentos", r.porProcedimentos, r.total, true);
  pdf.distribuicao("Encaminhamentos realizados", r.porEncaminhamentos, r.total, true);
  pdf.distribuicao("Necessidade de acompanhamento", r.porAcompanhamento, r.total);
  pdf.distribuicao("Por profissional responsável", r.porProfissional, r.total);
  pdf.distribuicao("Por equipe", r.porEquipe, r.total);
  pdf.anotacao(`${r.evolucoes} evoluções associadas aos atendimentos deste período. ${r.saidas} saídas de veículo; ${r.concluidas} percursos concluídos e ${r.kmRodados.toLocaleString("pt-BR")} km rodados. Não confundir encaminhamentos registrados com atendimentos efetivamente concluídos pela rede.`);

  pdf.frota(dados, r, false);
}

/** Gera um PDF nativo, com A4, fontes locais e paginação controlada. */
export async function gerarRelatorioPdf(dados: DadosRelatorio, tipo: TipoRelatorio): Promise<Buffer> {
  const resumo = resumirRelatorio(dados);
  const pdf = new RelatorioA4(TIPOS_RELATORIO[tipo].titulo);
  const doc = pdf.doc;
  const partes: Buffer[] = [];
  const completo = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => partes.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);
  });
  try {
    pdf.capa(tipo, dados.periodo, resumo);
    if (tipo === "completo" || tipo === "indicadores") indicadores(pdf, dados, resumo);
    if (tipo === "completo" || tipo === "fichas") {
      pdf.indice(dados.fichas);
      const porFicha = new Map<string, Evolucao[]>();
      for (const e of dados.evolucoes) {
        const grupo = porFicha.get(e.atendimentoId) ?? [];
        grupo.push(e);
        porFicha.set(e.atendimentoId, grupo);
      }
      for (const f of dados.fichas) pdf.ficha(f, porFicha.get(f.id) ?? []);
    }
    if (tipo === "completo" || tipo === "veiculos") pdf.frota(dados, resumo, true);
    pdf.rodapes();
    doc.end();
  } catch (error) {
    doc.destroy(error instanceof Error ? error : new Error("Erro ao compor PDF"));
    throw error;
  }
  return completo;
}

