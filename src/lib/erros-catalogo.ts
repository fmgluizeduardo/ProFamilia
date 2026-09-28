/**
 * Catálogo de códigos de erro do sistema — seguro para cliente e servidor.
 *
 * Formato ÁREA-NNN. O código aparece em todos os avisos de erro para que a
 * equipe informe exatamente o que aconteceu. Falhas do sistema também recebem
 * uma REFERÊNCIA única, que liga o aviso ao registro técnico completo em
 * Usuários › Erros do sistema.
 */
export const CATALOGO_ERROS = {
  "AUT-001": {
    area: "Acesso",
    titulo: "Sessão encerrada",
    orientacao: "Sua sessão terminou ou expirou. Entre novamente com seu usuário e senha — rascunhos de fichas continuam salvos neste aparelho.",
    status: 401,
  },
  "AUT-002": {
    area: "Acesso",
    titulo: "Troca de senha pendente",
    orientacao: "Defina sua senha pessoal na tela de troca de senha para continuar.",
    status: 403,
  },
  "AUT-003": {
    area: "Acesso",
    titulo: "Ação não permitida para o seu perfil",
    orientacao: "Se precisar desse acesso para o seu trabalho, peça ao administrador para ajustar suas permissões.",
    status: 403,
  },
  "AUT-004": {
    area: "Acesso",
    titulo: "Origem da requisição não reconhecida",
    orientacao: "Recarregue a página pelo endereço oficial do sistema e repita a ação.",
    status: 403,
  },
  "AUT-005": {
    area: "Acesso",
    titulo: "Acesso temporariamente bloqueado",
    orientacao: "Houve muitas tentativas seguidas. Aguarde o tempo indicado ou peça ao administrador para desbloquear o usuário.",
    status: 429,
  },
  "AUT-006": {
    area: "Acesso",
    titulo: "Usuário desativado ou com acesso expirado",
    orientacao: "Fale com o administrador para reativar ou renovar o seu acesso.",
    status: 403,
  },
  "AUT-007": {
    area: "Acesso",
    titulo: "Usuário ou senha inválidos",
    orientacao: "Confira o usuário e a senha (maiúsculas e minúsculas fazem diferença). Após 5 erros seguidos, o acesso é bloqueado por 15 minutos.",
    status: 401,
  },
  "VAL-001": {
    area: "Dados",
    titulo: "Confira os dados informados",
    orientacao: "Corrija o que foi indicado na mensagem e tente novamente.",
    status: 422,
  },
  "VAL-002": {
    area: "Dados",
    titulo: "Requisição inválida",
    orientacao: "Recarregue a página e repita a ação. Se persistir, informe o código ao administrador.",
    status: 400,
  },
  "REG-001": {
    area: "Registros",
    titulo: "Registro não encontrado",
    orientacao: "O registro pode ter sido excluído ou não estar disponível para o seu perfil. Atualize a página.",
    status: 404,
  },
  "REG-002": {
    area: "Registros",
    titulo: "Conflito com informações existentes",
    orientacao: "Já existe um registro igual ou a situação atual impede a ação (ex.: veículo em rota). Leia a mensagem e ajuste.",
    status: 409,
  },
  "BD-001": {
    area: "Banco de dados",
    titulo: "Banco de dados temporariamente indisponível",
    orientacao: "Aguarde cerca de 30 segundos e tente novamente. Se persistir, confira a internet e avise o administrador.",
    status: 503,
  },
  "BD-002": {
    area: "Banco de dados",
    titulo: "Falha ao gravar ou consultar informações",
    orientacao: "Tente novamente. Se persistir, envie o código e a referência ao administrador.",
    status: 500,
  },
  "BD-003": {
    area: "Banco de dados",
    titulo: "Estrutura do banco de dados desatualizada",
    orientacao: "O administrador deve aplicar as atualizações do banco (npx drizzle-kit migrate com a DATABASE_URL de produção) e publicar novamente.",
    status: 500,
  },
  "REL-001": {
    area: "Relatórios",
    titulo: "Falha ao gerar o relatório",
    orientacao: "Tente novamente. Se persistir, envie o código e a referência ao administrador — os detalhes ficam em Usuários › Erros do sistema.",
    status: 500,
  },
  "REL-002": {
    area: "Relatórios",
    titulo: "Relatório grande demais para gerar de uma vez",
    orientacao: "Reduza o período selecionado ou use a planilha CSV.",
    status: 413,
  },
  "REL-003": {
    area: "Relatórios",
    titulo: "Período do relatório inválido",
    orientacao: "Escolha datas válidas, com a data inicial igual ou anterior à final.",
    status: 400,
  },
  "REL-004": {
    area: "Relatórios",
    titulo: "Falha ao exportar a planilha",
    orientacao: "Tente novamente. Se persistir, envie o código e a referência ao administrador.",
    status: 500,
  },
  "SIS-001": {
    area: "Sistema",
    titulo: "Erro inesperado no sistema",
    orientacao: "Tente novamente. Se persistir, envie o código e a referência ao administrador.",
    status: 500,
  },
  "SIS-002": {
    area: "Sistema",
    titulo: "Sem conexão com o servidor",
    orientacao: "Verifique a internet do aparelho (Wi-Fi ou dados móveis) e tente novamente.",
    status: 0,
  },
  "SIS-003": {
    area: "Sistema",
    titulo: "Resposta inesperada do servidor",
    orientacao: "Tente novamente em instantes. Se persistir, envie o código e a referência ao administrador.",
    status: 502,
  },
  "SIS-004": {
    area: "Sistema",
    titulo: "A operação demorou demais",
    orientacao: "Tente novamente. Em relatórios, reduza o período selecionado.",
    status: 504,
  },
  "SIS-005": {
    area: "Sistema",
    titulo: "Erro ao exibir a página",
    orientacao: "Toque em “Tentar novamente”. Se persistir, envie o código e a referência ao administrador.",
    status: 500,
  },
} as const satisfies Record<string, { area: string; titulo: string; orientacao: string; status: number }>;

export type CodigoErro = keyof typeof CATALOGO_ERROS;

export const CODIGO_REGEX = /^[A-Z]{2,3}-\d{3}$/;

/** Corpo padrão de toda resposta de erro das APIs. */
export type CorpoErro = {
  erro: string;
  codigo: string;
  titulo?: string;
  referencia?: string;
  tecnico?: string;
  [extra: string]: unknown;
};

export function codigoValido(valor: unknown): valor is CodigoErro {
  return typeof valor === "string" && Object.prototype.hasOwnProperty.call(CATALOGO_ERROS, valor);
}

export function infoErro(codigo: string) {
  const c: CodigoErro = codigoValido(codigo) ? codigo : "SIS-001";
  return { codigo: c, ...CATALOGO_ERROS[c] };
}

/** Código padrão para respostas que não trouxeram um código específico. */
export function codigoPorStatus(status: number): CodigoErro {
  switch (status) {
    case 400: return "VAL-002";
    case 401: return "AUT-001";
    case 403: return "AUT-003";
    case 404: return "REG-001";
    case 409: return "REG-002";
    case 413: return "REL-002";
    case 422: return "VAL-001";
    case 429: return "AUT-005";
    case 503: return "BD-001";
    case 504: return "SIS-004";
    default: return status >= 500 ? "SIS-001" : "VAL-001";
  }
}

/** Falhas do sistema (e não do usuário): exibidas em vermelho e com referência. */
export function ehFalhaDoSistema(codigo: string): boolean {
  return /^(SIS|BD)-/.test(codigo) || codigo === "REL-001" || codigo === "REL-004";
}
