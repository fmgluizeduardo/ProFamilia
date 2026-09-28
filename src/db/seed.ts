import "dotenv/config";
import { db } from "./index";
import { atendimentos, evolucoes, veiculoRegistros, veiculos } from "./schema";
import { rotuloVeiculo } from "../lib/frota";

// TRAVA DE SEGURANÇA: este seed APAGA todas as tabelas antes de inserir dados
// fictícios de demonstração. Só roda em banco local, a menos que a variável
// CONFIRM_SEED_DESTROY=EU-SEI-O-QUE-ESTOU-FAZENDO esteja definida.
const url = process.env.DATABASE_URL ?? "";
const isLocal = /localhost|127\.0\.0\.1/.test(url);
const confirmed = process.env.CONFIRM_SEED_DESTROY === "EU-SEI-O-QUE-ESTOU-FAZENDO";
if (!isLocal && !confirmed) {
  console.error(
    "BLOQUEADO: o seed apaga o banco e só pode rodar em localhost.\n" +
      "Para rodar em outro banco, defina CONFIRM_SEED_DESTROY=EU-SEI-O-QUE-ESTOU-FAZENDO.",
  );
  process.exit(1);
}

function iso(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await db.delete(evolucoes);
  await db.delete(veiculoRegistros);
  await db.delete(veiculos);
  const [kombi] = await db
    .insert(veiculos)
    .values({ modelo: "Kombi", marca: "Volkswagen", placa: "DMN4326", kmInicial: 48000, cor: "Branca" })
    .returning();
  await db.delete(atendimentos);

  const base = [
    {
      dataAtendimento: iso(2), horario: "21:35", localAbordagem: "Praça Francisco Barreto — Centro",
      pontoReferencia: "Próximo ao coreto", profissionalResponsavel: "Marina Duarte", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "José Carlos da Silva", nomeSocial: null,
      dataNascimento: "1983-04-12", idade: 42, nomeMae: "Aparecida da Silva", telefone: null,
      sexo: "Masculino", estadoCivil: "Solteiro(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: null, rg: null, possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Situação de Rua", "Mendicância"], tempoSituacao: "Cerca de 3 anos",
      ruaTipo: null, ruaMotivo: "Perda de emprego e rompimento familiar", ruaQuantoTempo: "3 anos",
      ruaOndePermanece: "Região central, praças e marquises",
      vinculoPreservado: "nao", vinculoFamiliar: "RBSV",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Relata dores crônicas nas pernas", usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "alcool", substancias: [],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "sim", origemRenda: "Trabalho Informal",
      valorRenda: "320", beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Alimentação", "Higiene Pessoal", "Documentação", "Acolhimento Institucional"],
      providencias: ["Escuta Qualificada", "Orientação Social", "Entrega de Kit Emergencial"],
      procedimentos: ["AB · Abordagem", "CP · Casa de Passagem"],
      encaminhamentos: ["Acolhimento Institucional", "Cadastro Único"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "Casa de Passagem — Centro",
      responsavelNome: "Marina Duarte", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(2), horario: "22:10", localAbordagem: "Terminal Rodoviário de Barretos",
      pontoReferencia: "Plataformas 3 e 4", profissionalResponsavel: "Marina Duarte", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Maria Fernanda Souza", nomeSocial: null,
      dataNascimento: "1995-09-02", idade: 30, nomeMae: "Rosa Souza Lima", telefone: "(17) 98811-2045",
      sexo: "Feminino", estadoCivil: "Separado(a)", naturalidade: "Colômbia/SP", municipioOrigem: "Colômbia/SP",
      cpf: "421.336.908-21", rg: "38.441.220-7", possuiDocumentacao: "sim",
      situacaoAtual: ["Pessoa em Trânsito"], tempoSituacao: "2 semanas",
      ruaTipo: "itinerante", ruaMotivo: "Chegou à cidade em busca de trabalho", ruaQuantoTempo: "2 semanas",
      ruaOndePermanece: "Rodoviária",
      vinculoPreservado: "sim", vinculoFamiliar: "RNB",
      refFamiliarNome: "Rosa Souza Lima (mãe)", refFamiliarTelefone: "(17) 99745-8890", refFamiliarMunicipio: "Colômbia/SP",
      condicaoMoradia: "Moradia Improvisada",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Médio Completo", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Bolsa Família"], numeroNis: "20458890123",
      demandas: ["Alimentação", "Trabalho e Renda"],
      providencias: ["Orientação Social", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "PR · Passagem Rodoviária"],
      encaminhamentos: ["CRAS", "Trabalho e Renda"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CRAS Centro",
      responsavelNome: "Paulo Henrique Reis", responsavelCargo: "Educador Social",
    },
    {
      dataAtendimento: iso(5), horario: "09:15", localAbordagem: "Av. 21 — semáforo do Bairro Santa Cecília",
      pontoReferencia: "Em frente ao supermercado", profissionalResponsavel: "Juliana Campos", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Denúncia", nomeCompleto: "Lucas Oliveira Santos", nomeSocial: null,
      dataNascimento: "2014-01-28", idade: 12, nomeMae: "Carla Santos Oliveira", telefone: null,
      sexo: "Masculino", estadoCivil: "Solteiro(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: null, rg: null, possuiDocumentacao: "nao",
      situacaoAtual: ["Trabalho Infantil", "Violação de Direitos"], tempoSituacao: "Meses",
      ruaTipo: null, ruaMotivo: null, ruaQuantoTempo: null, ruaOndePermanece: null,
      vinculoPreservado: "sim", vinculoFamiliar: null,
      refFamiliarNome: "Carla Santos Oliveira (mãe)", refFamiliarTelefone: "(17) 99621-3344", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Cedida",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Bolsa Família"], numeroNis: null,
      demandas: ["Documentação", "Benefícios Sociais"],
      providencias: ["Acionamento da Rede", "Acompanhamento"],
      procedimentos: ["AB · Abordagem", "CREAS · Casos para CREAS"],
      encaminhamentos: ["Conselho Tutelar", "CREAS"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CREAS — Sede",
      responsavelNome: "Juliana Campos", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(9), horario: "20:40", localAbordagem: "Praça Barão de Nova Friburgo",
      pontoReferencia: "Banco próximo à fonte", profissionalResponsavel: "Rafael Nogueira", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Monitoramento de Caso", nomeCompleto: "Antônio Ferreira Lima", nomeSocial: "Seu Antônio",
      dataNascimento: "1956-06-15", idade: 69, nomeMae: null, telefone: null,
      sexo: "Masculino", estadoCivil: "Viúvo(a)", naturalidade: "Ribeirão Preto/SP", municipioOrigem: "Ribeirão Preto/SP",
      cpf: null, rg: null, possuiDocumentacao: "nao",
      situacaoAtual: ["Situação de Rua", "Dependência Química"], tempoSituacao: "Mais de 10 anos",
      ruaTipo: null, ruaMotivo: "Dependência química", ruaQuantoTempo: "10+ anos",
      ruaOndePermanece: "Praças do centro",
      vinculoPreservado: "nao", vinculoFamiliar: "RBSV",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Hipertensão informada; ferida no pé direito", usoMedicacao: "sim", usoMedicacaoQual: "Losartana (uso irregular)",
      atendimentoImediato: "sim", usoDrogas: "ambos", substancias: ["Crack"],
      escolaridade: "Não Alfabetizado", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Saúde", "Dependência Química", "Alimentação", "Acolhimento Institucional"],
      providencias: ["Escuta Qualificada", "Encaminhamento", "Entrega de Kit Emergencial"],
      procedimentos: ["AB · Abordagem", "SUS · Saúde"],
      encaminhamentos: ["UPA", "CAPS AD"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CAPS AD — Barretos",
      responsavelNome: "Rafael Nogueira", responsavelCargo: "Psicólogo",
    },
    {
      dataAtendimento: iso(12), horario: "10:05", localAbordagem: "Rua 7 — Jardim Aeroporto",
      pontoReferencia: "Lote vago ao lado da escola", profissionalResponsavel: "Juliana Campos", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Solicitação da Rede", nomeCompleto: "Ana Beatriz Rocha", nomeSocial: null,
      dataNascimento: "1990-11-03", idade: 35, nomeMae: "Teresa Rocha", telefone: "(17) 99732-5561",
      sexo: "Feminino", estadoCivil: "União Estável", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: "387.221.540-09", rg: "34.902.118-3", possuiDocumentacao: "sim",
      situacaoAtual: ["Violência Doméstica", "Vulnerabilidade Social"], tempoSituacao: "Recorrente",
      ruaTipo: null, ruaMotivo: null, ruaQuantoTempo: null, ruaOndePermanece: null,
      vinculoPreservado: "parcialmente", vinculoFamiliar: null,
      refFamiliarNome: "Teresa Rocha (mãe)", refFamiliarTelefone: "(17) 3322-1180", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Alugada",
      saudeCondicao: "Escoriações; relata medo", usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Completo", possuiRenda: "sim", origemRenda: "Trabalho Informal", valorRenda: "700",
      beneficios: ["Bolsa Família"], numeroNis: "18733445512",
      demandas: ["Saúde", "Habitação", "Benefícios Sociais"],
      providencias: ["Escuta Qualificada", "Acionamento da Rede", "Acompanhamento"],
      procedimentos: ["AB · Abordagem", "BO · Delegacia"],
      encaminhamentos: ["CRAS", "Defensoria Pública", "Saúde"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CRAS Jardim Aeroporto",
      responsavelNome: "Juliana Campos", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(16), horario: "19:50", localAbordagem: "Praça da Matriz — Centro",
      pontoReferencia: "Escadaria da igreja", profissionalResponsavel: "Marina Duarte", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Demanda Espontânea", nomeCompleto: "Carlos Alberto Mendes", nomeSocial: null,
      dataNascimento: "1978-02-19", idade: 48, nomeMae: "Neusa Mendes", telefone: null,
      sexo: "Masculino", estadoCivil: "Separado(a)", naturalidade: "Guaíra/SP", municipioOrigem: "Guaíra/SP",
      cpf: null, rg: "22.118.334-0", possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Situação de Rua", "Migrante"], tempoSituacao: "8 meses",
      ruaTipo: "migrante", ruaMotivo: "Veio de Guaíra em busca de emprego na safra", ruaQuantoTempo: "8 meses",
      ruaOndePermanece: "Centro e arredores do Parque do Peão",
      vinculoPreservado: "nao", vinculoFamiliar: "RNB",
      refFamiliarNome: "Irmão — Roberto Mendes", refFamiliarTelefone: null, refFamiliarMunicipio: "Guaíra/SP",
      condicaoMoradia: "Moradia Improvisada",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "alcool", substancias: ["Tabaco"],
      escolaridade: "Ensino Fundamental Completo", possuiRenda: "sim", origemRenda: "Trabalho Informal", valorRenda: "450",
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Trabalho e Renda", "Documentação", "Alimentação"],
      providencias: ["Orientação Social", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "AS · Assistência Social"],
      encaminhamentos: ["Trabalho e Renda", "CRAS"],
      necessitaAcompanhamento: "nao", acompanhamentoLocal: null,
      responsavelNome: "Marina Duarte", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(23), horario: "21:25", localAbordagem: "Viaduto da Av. 43",
      pontoReferencia: "Embaixo do viaduto, lado sul", profissionalResponsavel: "Rafael Nogueira", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Ricardo Almeida Prado", nomeSocial: "Rica",
      dataNascimento: "1987-07-07", idade: 38, nomeMae: null, telefone: null,
      sexo: "Outro", estadoCivil: "Solteiro(a)", naturalidade: "São Paulo/SP", municipioOrigem: "São Paulo/SP",
      cpf: null, rg: null, possuiDocumentacao: "nao",
      situacaoAtual: ["Situação de Rua", "Dependência Química", "Exploração Sexual"], tempoSituacao: "2 anos",
      ruaTipo: null, ruaMotivo: "Fuga de violência intrafamiliar", ruaQuantoTempo: "2 anos",
      ruaOndePermanece: "Viadutos e rodoviária",
      vinculoPreservado: "nao", vinculoFamiliar: "RBSV",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Relata crises de ansiedade", usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "ambos", substancias: ["Maconha", "Crack"],
      escolaridade: "Ensino Médio Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Saúde", "Saúde Mental", "Dependência Química", "Acolhimento Institucional"],
      providencias: ["Escuta Qualificada", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "SUS · Saúde", "CP · Casa de Passagem"],
      encaminhamentos: ["CAPS AD", "Hospital"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CAPS AD",
      responsavelNome: "Rafael Nogueira", responsavelCargo: "Psicólogo",
    },
    {
      dataAtendimento: iso(30), horario: "08:40", localAbordagem: "Estacionamento do Parque do Peão",
      pontoReferencia: "Portão 2", profissionalResponsavel: "Juliana Campos", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Pedro Henrique Gomes", nomeSocial: null,
      dataNascimento: "1971-12-01", idade: 54, nomeMae: "Luzia Gomes", telefone: "(17) 98144-9023",
      sexo: "Masculino", estadoCivil: "Casado(a)", naturalidade: "Frutal/MG", municipioOrigem: "Frutal/MG",
      cpf: "512.884.097-60", rg: "M-4.556.221", possuiDocumentacao: "sim",
      situacaoAtual: ["Migrante", "Vulnerabilidade Social"], tempoSituacao: "1 mês",
      ruaTipo: "migrante", ruaMotivo: "Trabalho temporário em evento", ruaQuantoTempo: "1 mês",
      ruaOndePermanece: "Alojamento improvisado no parque",
      vinculoPreservado: "sim", vinculoFamiliar: "RNB",
      refFamiliarNome: "Esposa — Vera Gomes", refFamiliarTelefone: "(34) 99912-3345", refFamiliarMunicipio: "Frutal/MG",
      condicaoMoradia: "Moradia Improvisada",
      saudeCondicao: "Diabetes — controle irregular", usoMedicacao: "sim", usoMedicacaoQual: "Metformina",
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "sim", origemRenda: "Trabalho Informal", valorRenda: "900",
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Saúde", "Alimentação"],
      providencias: ["Orientação Social", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "SUS · Saúde"],
      encaminhamentos: ["Saúde"],
      necessitaAcompanhamento: "nao", acompanhamentoLocal: null,
      responsavelNome: "Juliana Campos", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(38), horario: "22:00", localAbordagem: "Praça Francisco Barreto — Centro",
      pontoReferencia: "Marquise da farmácia", profissionalResponsavel: "Marina Duarte", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Sebastiana Nunes Freitas", nomeSocial: "Dona Bastiana",
      dataNascimento: "1949-03-30", idade: 77, nomeMae: null, telefone: null,
      sexo: "Feminino", estadoCivil: "Viúvo(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: null, rg: null, possuiDocumentacao: "nao",
      situacaoAtual: ["Situação de Rua", "Mendicância"], tempoSituacao: "15 anos",
      ruaTipo: null, ruaMotivo: "Abandono familiar", ruaQuantoTempo: "15 anos",
      ruaOndePermanece: "Marquises do centro",
      vinculoPreservado: "parcialmente", vinculoFamiliar: "RBCV",
      refFamiliarNome: "Filha — Marcia Freitas", refFamiliarTelefone: "(17) 99122-0477", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Mobilidade reduzida; relata tonturas", usoMedicacao: "sim", usoMedicacaoQual: "Não sabe informar",
      atendimentoImediato: "sim", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Não Alfabetizado", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Saúde", "Benefícios Sociais", "Reintegração Familiar", "Acolhimento Institucional"],
      providencias: ["Escuta Qualificada", "Encaminhamento", "Acionamento da Rede"],
      procedimentos: ["AB · Abordagem", "SUS · Saúde", "INSS · Benefícios"],
      encaminhamentos: ["CREAS", "Hospital", "Acolhimento Institucional"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CREAS",
      responsavelNome: "Marina Duarte", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(45), horario: "18:30", localAbordagem: "Rua 24 de Maio — Vila Guilherme",
      pontoReferencia: "Ponto de ônibus", profissionalResponsavel: "Paulo Henrique Reis", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Solicitação da Rede", nomeCompleto: "Vanessa Cristina Lopes", nomeSocial: null,
      dataNascimento: "1998-05-21", idade: 27, nomeMae: "Sonia Lopes", telefone: "(17) 98870-1133",
      sexo: "Feminino", estadoCivil: "Solteiro(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: "466.909.118-44", rg: "41.223.980-1", possuiDocumentacao: "sim",
      situacaoAtual: ["Violência Doméstica"], tempoSituacao: "Episódio recente",
      ruaTipo: null, ruaMotivo: null, ruaQuantoTempo: null, ruaOndePermanece: null,
      vinculoPreservado: "sim", vinculoFamiliar: null,
      refFamiliarNome: "Sonia Lopes (mãe)", refFamiliarTelefone: "(17) 3323-8890", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Cedida",
      saudeCondicao: "Gestante — 5 meses", usoMedicacao: "sim", usoMedicacaoQual: "Pré-natal: complexo vitamínico",
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Médio Completo", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Bolsa Família"], numeroNis: "15566778821",
      demandas: ["Saúde", "Reintegração Familiar", "Benefícios Sociais"],
      providencias: ["Escuta Qualificada", "Acionamento da Rede", "Acompanhamento"],
      procedimentos: ["AB · Abordagem", "CREAS · Casos para CREAS"],
      encaminhamentos: ["CRAS", "Conselho Tutelar", "Saúde"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CRAS Vila Guilherme",
      responsavelNome: "Paulo Henrique Reis", responsavelCargo: "Educador Social",
    },
    {
      dataAtendimento: iso(52), horario: "20:15", localAbordagem: "Rodoviária — plataforma 1",
      pontoReferencia: "Bilheteria", profissionalResponsavel: "Rafael Nogueira", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Demanda Espontânea", nomeCompleto: "Marcos Vinícius Teles", nomeSocial: null,
      dataNascimento: "1984-10-11", idade: 41, nomeMae: "Irene Teles", telefone: null,
      sexo: "Masculino", estadoCivil: "Solteiro(a)", naturalidade: "Bebedouro/SP", municipioOrigem: "Bebedouro/SP",
      cpf: null, rg: null, possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Pessoa em Trânsito", "Dependência Química"], tempoSituacao: "3 semanas",
      ruaTipo: "itinerante", ruaMotivo: "Passa por municípios pedindo passagem", ruaQuantoTempo: "3 semanas em Barretos",
      ruaOndePermanece: "Rodoviária",
      vinculoPreservado: "nao", vinculoFamiliar: "RNB",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Moradia Improvisada",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "alcool", substancias: ["Tabaco"],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Alimentação", "Reintegração Familiar"],
      providencias: ["Orientação Social", "Entrega de Kit Emergencial", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "PR · Passagem Rodoviária"],
      encaminhamentos: ["CREAS"],
      necessitaAcompanhamento: "nao", acompanhamentoLocal: null,
      responsavelNome: "Rafael Nogueira", responsavelCargo: "Psicólogo",
    },
    {
      dataAtendimento: iso(63), horario: "09:50", localAbordagem: "Av. 23 — Jardim Zara",
      pontoReferencia: "Feira livre", profissionalResponsavel: "Juliana Campos", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Monitoramento de Caso", nomeCompleto: "Edson Pereira Ramos", nomeSocial: null,
      dataNascimento: "1969-08-08", idade: 56, nomeMae: "Olga Ramos", telefone: "(17) 98809-4412",
      sexo: "Masculino", estadoCivil: "União Estável", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: "298.447.611-92", rg: "27.665.442-9", possuiDocumentacao: "sim",
      situacaoAtual: ["Mendicância", "Vulnerabilidade Social"], tempoSituacao: "1 ano",
      ruaTipo: null, ruaMotivo: null, ruaQuantoTempo: null, ruaOndePermanece: null,
      vinculoPreservado: "sim", vinculoFamiliar: null,
      refFamiliarNome: "Companheira — Rosa Lima", refFamiliarTelefone: "(17) 99688-2200", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Alugada",
      saudeCondicao: "Sequelas de AVC; dificuldade de fala", usoMedicacao: "sim", usoMedicacaoQual: "AAS + sinvastatina",
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Auxílio-doença"], numeroNis: "10233445566",
      demandas: ["Benefícios Sociais", "Saúde", "Trabalho e Renda"],
      providencias: ["Acompanhamento", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "INSS · Benefícios", "PT · Poupa-tempo"],
      encaminhamentos: ["Cadastro Único", "Saúde"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CRAS Jardim Zara",
      responsavelNome: "Juliana Campos", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(77), horario: "21:40", localAbordagem: "Praça da Bandeira",
      pontoReferencia: "Ao lado da lanchonete", profissionalResponsavel: "Marina Duarte", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Jonathan Silva Camargo", nomeSocial: null,
      dataNascimento: "2003-01-17", idade: 23, nomeMae: "Eliane Camargo", telefone: "(17) 98133-7745",
      sexo: "Masculino", estadoCivil: "Solteiro(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: null, rg: null, possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Situação de Rua", "Dependência Química"], tempoSituacao: "6 meses",
      ruaTipo: null, ruaMotivo: "Conflito familiar após desemprego", ruaQuantoTempo: "6 meses",
      ruaOndePermanece: "Centro",
      vinculoPreservado: "parcialmente", vinculoFamiliar: "RBCV",
      refFamiliarNome: "Eliane Camargo (mãe)", refFamiliarTelefone: "(17) 3312-9045", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "ambos", substancias: ["Maconha", "Cocaína"],
      escolaridade: "Ensino Médio Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Dependência Química", "Reintegração Familiar", "Trabalho e Renda"],
      providencias: ["Escuta Qualificada", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "CT · Clínica de Tratamento"],
      encaminhamentos: ["CAPS AD", "Trabalho e Renda"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CAPS AD",
      responsavelNome: "Marina Duarte", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(90), horario: "19:05", localAbordagem: "Praça da Matriz — Centro",
      pontoReferencia: "Coreto", profissionalResponsavel: "Rafael Nogueira", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Helena Barbosa Monteiro", nomeSocial: null,
      dataNascimento: "1962-04-25", idade: 63, nomeMae: null, telefone: null,
      sexo: "Feminino", estadoCivil: "Separado(a)", naturalidade: "Olímpia/SP", municipioOrigem: "Olímpia/SP",
      cpf: null, rg: "19.882.340-2", possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Situação de Rua"], tempoSituacao: "4 anos",
      ruaTipo: null, ruaMotivo: "Perda do imóvel alugado", ruaQuantoTempo: "4 anos",
      ruaOndePermanece: "Centro",
      vinculoPreservado: "nao", vinculoFamiliar: "RBSV",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Artrose; dores articulares", usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Completo", possuiRenda: "sim", origemRenda: "Benefício Social", valorRenda: "0",
      beneficios: ["BPC"], numeroNis: "99887766554",
      demandas: ["Habitação", "Saúde", "Documentação"],
      providencias: ["Orientação Social", "Encaminhamento", "Acompanhamento"],
      procedimentos: ["AB · Abordagem", "AS · Assistência Social"],
      encaminhamentos: ["CRAS", "Acolhimento Institucional", "Saúde"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CRAS Centro",
      responsavelNome: "Rafael Nogueira", responsavelCargo: "Psicólogo",
    },
    {
      dataAtendimento: iso(110), horario: "10:30", localAbordagem: "Av. 29 — Vila Nova",
      pontoReferencia: "Praça do bairro", profissionalResponsavel: "Juliana Campos", equipe: "Equipe B — Matutino",
      motivoAbordagem: "Denúncia", nomeCompleto: "Felipe Augusto Neri", nomeSocial: null,
      dataNascimento: "2011-06-09", idade: 14, nomeMae: "Patrícia Neri", telefone: "(17) 99741-0088",
      sexo: "Masculino", estadoCivil: "Solteiro(a)", naturalidade: "Barretos/SP", municipioOrigem: "Barretos/SP",
      cpf: null, rg: null, possuiDocumentacao: "parcialmente",
      situacaoAtual: ["Exploração Sexual", "Violação de Direitos"], tempoSituacao: "Investigação",
      ruaTipo: null, ruaMotivo: null, ruaQuantoTempo: null, ruaOndePermanece: null,
      vinculoPreservado: "sim", vinculoFamiliar: null,
      refFamiliarNome: "Patrícia Neri (mãe)", refFamiliarTelefone: "(17) 99741-0088", refFamiliarMunicipio: "Barretos/SP",
      condicaoMoradia: "Moradia Própria",
      saudeCondicao: null, usoMedicacao: "nao", usoMedicacaoQual: null,
      atendimentoImediato: "nao", usoDrogas: "nao_relata", substancias: [],
      escolaridade: "Ensino Fundamental Incompleto", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Bolsa Família"], numeroNis: null,
      demandas: ["Saúde Mental", "Acompanhamento"],
      providencias: ["Escuta Qualificada", "Acionamento da Rede", "Acompanhamento"],
      procedimentos: ["CREAS · Casos para CREAS", "BO · Delegacia"],
      encaminhamentos: ["CREAS", "Ministério Público", "Conselho Tutelar"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "CREAS",
      responsavelNome: "Juliana Campos", responsavelCargo: "Assistente Social",
    },
    {
      dataAtendimento: iso(130), horario: "20:55", localAbordagem: "Terminal Urbano — Centro",
      pontoReferencia: "Plataformas", profissionalResponsavel: "Paulo Henrique Reis", equipe: "Equipe A — Vespertino",
      motivoAbordagem: "Busca Ativa", nomeCompleto: "Otávio César Braga", nomeSocial: null,
      dataNascimento: "1975-05-05", idade: 50, nomeMae: null, telefone: null,
      sexo: "Masculino", estadoCivil: "Viúvo(a)", naturalidade: "Campinas/SP", municipioOrigem: "Campinas/SP",
      cpf: null, rg: null, possuiDocumentacao: "nao",
      situacaoAtual: ["Situação de Rua"], tempoSituacao: "1 ano e meio",
      ruaTipo: null, ruaMotivo: "Luto e perda do emprego", ruaQuantoTempo: "1,5 ano",
      ruaOndePermanece: "Terminal urbano",
      vinculoPreservado: "nao", vinculoFamiliar: "RBSV",
      refFamiliarNome: null, refFamiliarTelefone: null, refFamiliarMunicipio: null,
      condicaoMoradia: "Situação de Rua",
      saudeCondicao: "Epilepsia informada", usoMedicacao: "sim", usoMedicacaoQual: "Fenitoína (sem medicamento há semanas)",
      atendimentoImediato: "nao", usoDrogas: "alcool", substancias: [],
      escolaridade: "Ensino Médio Completo", possuiRenda: "nao", origemRenda: null, valorRenda: null,
      beneficios: ["Nenhum"], numeroNis: null,
      demandas: ["Saúde", "Documentação", "Acolhimento Institucional"],
      providencias: ["Escuta Qualificada", "Encaminhamento"],
      procedimentos: ["AB · Abordagem", "SUS · Saúde"],
      encaminhamentos: ["UPA", "Acolhimento Institucional"],
      necessitaAcompanhamento: "sim", acompanhamentoLocal: "Casa de Passagem",
      responsavelNome: "Paulo Henrique Reis", responsavelCargo: "Educador Social",
    },
  ];

  // Remove chaves acidentais (segurança de tipagem do seed)
  const limpos = base.map((r) => {
    const o: Record<string, unknown> = { ...r };
    delete o["null"];
    delete o["undefined"];
    return o;
  });

  const inseridos = await db
    .insert(atendimentos)
    .values(limpos as (typeof atendimentos.$inferInsert)[])
    .returning({ id: atendimentos.id, data: atendimentos.dataAtendimento });

  const autor = {
    nome: "Marina Duarte",
    cargo: "Assistente Social",
  };

  const evs: (typeof evolucoes.$inferInsert)[] = [];
  if (inseridos[0]) {
    evs.push(
      { atendimentoId: inseridos[0].id, texto: "Retorno ao local: usuário aceitou pernoitar na Casa de Passagem. Encaminhado às 22h15 com kit emergencial. Agendada visita ao CRAS para CadÚnico.", autorNome: autor.nome, autorCargo: autor.cargo },
      { atendimentoId: inseridos[0].id, texto: "Contato com CRAS: vaga de CadÚnico agendada. Usuário manteve vínculo com a equipe e demonstrou boa adesão ao plano de atendimento.", autorNome: "Paulo Henrique Reis", autorCargo: "Educador Social" },
    );
  }
  if (inseridos[2]) {
    evs.push({
      atendimentoId: inseridos[2].id,
      texto: "Conselho Tutelar acionado e caso registrado. Família visitada: mãe relatou dificuldades financeiras; criança não frequenta a escola há 2 meses. Articulada reinserção escolar com a rede de educação.",
      autorNome: "Juliana Campos", autorCargo: "Assistente Social",
    });
  }
  if (inseridos[3]) {
    evs.push(
      { atendimentoId: inseridos[3].id, texto: "Ferida no pé avaliada na UPA: curativo realizado e receita de antibiótico. Usuário retornou à praça; mantida oferta de acolhimento.", autorNome: "Rafael Nogueira", autorCargo: "Psicólogo" },
      { atendimentoId: inseridos[3].id, texto: "Articulação com CAPS AD: primeiro atendimento agendado. Equipe acompanhará o deslocamento.", autorNome: "Rafael Nogueira", autorCargo: "Psicólogo" },
    );
  }
  if (inseridos.length > 0) await db.insert(evolucoes).values(evs);

  const motoristas = ["Carlos Eduardo Mota", "Sérgio Ramos", "Carlos Eduardo Mota", "Anderson Lopes", "Sérgio Ramos"];
  const locaisSaida = ["Centro — Praças e Rodoviária", "Jardim Aeroporto e Av. 21", "Região Central — Ronda noturna", "Jardim Zara e Vila Guilherme", "Parque do Peão e periferia norte"];
  let km = 48210;
  const registros: (typeof veiculoRegistros.$inferInsert)[] = [];
  for (let i = 34; i >= 0; i -= i > 20 ? 7 : 3) {
    const idx = (i / 7) % 5 | 0;
    const sKm = km;
    const rodados = 28 + ((i * 13) % 40);
    const cKm = sKm + rodados;
    km = cKm + 120;
    registros.push({
      data: iso(i),
      motorista: motoristas[idx],
      saidaHora: "19:00",
      saidaKm: sKm,
      saidaLocal: locaisSaida[idx],
      chegadaHora: i === 0 ? null : "23:40",
      chegadaKm: i === 0 ? null : cKm,
      chegadaLocal: i === 0 ? null : "Retorno à sede — Av. Loja Maçônica, 1.561",
    });
  }
  // Um registro em rota agora (sem chegada)
  registros.push({
    data: iso(0),
    motorista: "Carlos Eduardo Mota",
    saidaHora: "19:30",
    saidaKm: km,
    saidaLocal: "Centro — Rodoviária e Praças",
    chegadaHora: null,
    chegadaKm: null,
    chegadaLocal: null,
  });
  await db
    .insert(veiculoRegistros)
    .values(registros.map((r) => ({ ...r, veiculoId: kombi.id, veiculo: rotuloVeiculo(kombi) })));

  console.log(`Seed concluído: ${inseridos.length} atendimentos, ${evs.length} evoluções, ${registros.length} registros de veículo.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
