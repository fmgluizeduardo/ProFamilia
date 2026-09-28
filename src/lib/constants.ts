// Opções oficiais da Ficha de Atendimento — Serviço Especializado em Abordagem Social
// Instituto PróFamília · Prefeitura da Estância Turística de Barretos

export const ORGAO = {
  instituto: "INSTITUTO PRÓ FAMÍLIA",
  cnpj: "CNPJ 12.752.097/0001-78",
  endereco:
    "Avenida Loja Maçônica Fraternidade Paulista N.º 1.561 — Bairro: Santa Cecília",
  cep: "CEP: 14786-084 · Barretos/SP",
  contato: "(17) 9.9104-0590 · institutoprofamilia@hotmail.com",
  prefeitura: "PREFEITURA DA ESTÂNCIA TURÍSTICA DE BARRETOS — ESTADO DE SÃO PAULO",
  secretaria: "Secretaria Municipal de Assistência Social e Desenvolvimento Humano",
  ficha: "FICHA DE ATENDIMENTO",
  servico: "SERVIÇO ESPECIALIZADO EM ABORDAGEM SOCIAL",
};

export const SIM_NAO = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

export const SIM_NAO_PARCIAL = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "parcialmente", label: "Parcialmente" },
];

export const MOTIVOS = [
  "Busca Ativa",
  "Solicitação da Rede",
  "Denúncia",
  "Demanda Espontânea",
  "Monitoramento de Caso",
  "Outro",
];

// Registro autodeclarado: nunca inferir identidade pela aparência.
// "Outro" segue aceito para fichas antigas, mas novos registros usam "Outra identificação".
export const SEXOS = [
  "Feminino",
  "Masculino",
  "Mulher trans",
  "Homem trans",
  "Travesti",
  "Pessoa não binária",
  "Intersexo",
  "Outra identificação",
  "Prefere não informar",
  "Não foi possível perguntar",
];

export const SEXO_OUTRA_IDENTIFICACAO = "Outra identificação";

export const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "União Estável",
  "Separado(a)",
  "Viúvo(a)",
];

export const SITUACOES = [
  "Situação de Rua",
  "Migrante",
  "Pessoa em Trânsito",
  "Trabalhador Temporário",
  "Trabalho Infantil",
  "Criança/Adolescente Desacompanhado",
  "Mendicância",
  "Exploração Sexual",
  "Violência Doméstica",
  "Violação de Direitos",
  "Idoso em Situação de Abono/Risco",
  "Pessoa com Deficiência em Negligência",
  "Dependência Química",
  "Vulnerabilidade Social",
  "Outro",
];

export const DIRETRIZES_SERVICO = {
  conceito:
    "É um serviço da Proteção Social Especial de Média Complexidade, normalmente vinculado ao CREAS, destinado à identificação e atendimento de pessoas e famílias em situação de risco pessoal e social nos espaços públicos.",
  proatividade:
    "O serviço deve ser proativo, ou seja, não espera o usuário procurar ajuda. A equipe vai até onde a vulnerabilidade acontece.",
  publicoAlvo: [
    "Pessoas em situação de rua",
    "Migrantes",
    "Pessoas em trânsito",
    "Trabalhadores temporários",
    "Crianças e adolescentes em situação de trabalho infantil",
    "Crianças e adolescentes desacompanhados",
    "Pessoas vítimas de violência",
    "Idosos em situação de abandono",
    "Pessoas com deficiência em situação de negligência",
    "Usuários com vínculos familiares rompidos ou fragilizados",
    "Pessoas em uso abusivo de álcool e outras drogas",
    "Famílias em situação de extrema vulnerabilidade",
  ],
  destaqueBarretos:
    "No caso de Barretos, durante a Festa do Peão, há aumento significativo de migrantes, trabalhadores temporários e pessoas em situação de rua.",
  oQueNaoE: [
    "Retirada compulsória da rua",
    "Fiscalização",
    "Segurança pública",
    "Recolhimento forçado",
    "Controle social",
  ],
  regraDeOuro: "A adesão do usuário é voluntária.",
  principaisObjetivos: [
    {
      titulo: "Identificar situações de risco",
      exemplo: "Pessoa dormindo em praça pública, idoso abandonado, criança trabalhando em semáforo.",
    },
    {
      titulo: "Construir vínculo",
      exemplo:
        "Sem vínculo não existe intervenção. Muitas vezes o usuário só aceita ajuda após meses de contato.",
    },
    {
      titulo: "Garantir acesso a direitos",
      exemplo:
        "RG, CPF, Benefícios sociais, Saúde, Habitação, Trabalho, Acolhimento institucional.",
    },
  ],
  etapasAtendimento: [
    {
      numero: "1ª",
      nome: "Busca Ativa",
      descricao:
        "A equipe percorre os territórios. Mapeia: onde as pessoas ficam, horários e perfil do público.",
    },
    {
      numero: "2ª",
      nome: "Aproximação",
      descricao:
        "Primeiro contato. Escuta respeitosa, sem julgamentos e sem imposições.",
    },
    {
      numero: "3ª",
      nome: "Diagnóstico Inicial",
      descricao:
        "Levantar: nome, situação familiar, saúde, documentação, renda e rede de apoio.",
    },
    {
      numero: "4ª",
      nome: "Encaminhamento",
      descricao:
        "Dependendo da demanda: CREAS, CRAS, CAPS, UBS, Hospital, Defensoria, Acolhimento Institucional.",
    },
  ],
  oQueRegistrar: {
    fichaAbordagem: ["Data", "Local", "Situação encontrada", "Encaminhamento"],
    fichaAtendimento: ["Dados do usuário", "Demanda", "Providências"],
  },
};

export const RUA_TIPOS = [
  { value: "migrante", label: "Migrante", hint: "Muda de região em busca da sobrevivência" },
  { value: "itinerante", label: "Itinerante", hint: "Transita de um município para o outro" },
];

export const VINCULOS = [
  { value: "RBSV", label: "RBSV", hint: "Na rua de Barretos SEM vínculo familiar" },
  { value: "RBCV", label: "RBCV", hint: "Na rua de Barretos COM vínculo familiar" },
  { value: "RNB", label: "RNB", hint: "Não barretense, na cidade há mais de 6 meses" },
];

export const MORADIAS = [
  "Moradia Própria",
  "Alugada",
  "Cedida",
  "Acolhimento Institucional",
  "Situação de Rua",
  "Moradia Improvisada",
  "Outro",
];

export const USO_DROGAS = [
  { value: "nao_relata", label: "Não relata" },
  { value: "alcool", label: "Álcool" },
  { value: "ilicitas", label: "Drogas Ilícitas" },
  { value: "ambos", label: "Ambos" },
];

export const SUBSTANCIAS = ["Tabaco", "Maconha", "Crack", "Cocaína"];

export const ESCOLARIDADES = [
  "Não Alfabetizado",
  "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo",
  "Ensino Médio Incompleto",
  "Ensino Médio Completo",
  "Ensino Superior",
];

export const ORIGENS_RENDA = [
  "Trabalho Formal",
  "Trabalho Informal",
  "Benefício Social",
  "Aposentadoria",
  "Outro",
];

export const BENEFICIOS = [
  "Bolsa Família",
  "BPC",
  "Auxílio-doença",
  "Nenhum",
  "Outro",
];

export const DEMANDAS = [
  "Alimentação",
  "Higiene Pessoal",
  "Documentação",
  "Saúde",
  "Saúde Mental",
  "Dependência Química",
  "Trabalho e Renda",
  "Habitação",
  "Reintegração Familiar",
  "Acolhimento Institucional",
  "Benefícios Sociais",
  "Outro",
];

export const PROVIDENCIAS = [
  "Orientação Social",
  "Escuta Qualificada",
  "Entrega de Kit Emergencial",
  "Encaminhamento",
  "Acompanhamento",
  "Acionamento da Rede",
  "Outro",
];

export const PROCEDIMENTOS = [
  "AB · Abordagem",
  "AS · Assistência Social",
  "CREAS · Casos para CREAS",
  "PR · Passagem Rodoviária",
  "BO · Delegacia",
  "PT · Poupa-tempo",
  "SUS · Saúde",
  "CP · Casa de Passagem",
  "CT · Clínica de Tratamento",
  "INSS · Benefícios",
  "OU · Outros",
];

export const ENCAMINHAMENTOS = [
  "CRAS",
  "CREAS",
  "Cadastro Único",
  "Saúde",
  "CAPS",
  "CAPS AD",
  "UPA",
  "Hospital",
  "Conselho Tutelar",
  "Acolhimento Institucional",
  "Defensoria Pública",
  "Ministério Público",
  "Trabalho e Renda",
  "Outro",
];

export const VEICULO_PADRAO = "Kombi · DMN 4326";
