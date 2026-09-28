/**
 * Catálogo de permissões — módulo seguro para cliente e servidor
 * (não importa banco nem APIs de Node).
 *
 * Administradores têm todas as permissões implicitamente, além da gestão de
 * usuários, sessões e auditoria, que são exclusivas do papel "admin".
 */

export const PERMISSOES = [
  "fichas.ver",
  "fichas.ver_todas",
  "fichas.criar",
  "fichas.editar",
  "fichas.excluir",
  "evolucoes.criar",
  "evolucoes.excluir",
  "veiculos.ver",
  "veiculos.registrar",
  "veiculos.editar",
  "veiculos.excluir",
  "frota.cadastrar",
  "frota.editar",
  "gerencia.ver",
  "relatorios.exportar",
] as const;

export type Permissao = (typeof PERMISSOES)[number];
export type Papel = "admin" | "usuario";
export type RequisitoAcesso = Permissao | "admin";

export type SujeitoPermissao = { papel: string; permissoes: readonly string[] };

export type TipoAcao = "ver" | "escopo" | "criar" | "editar" | "excluir";

export const MODULOS: {
  id: string;
  titulo: string;
  descricao: string;
  acoes: { chave: Permissao; rotulo: string; detalhe: string; tipo: TipoAcao }[];
}[] = [
  {
    id: "fichas",
    titulo: "Fichas de atendimento",
    descricao: "Dados pessoais e sensíveis das pessoas atendidas.",
    acoes: [
      { chave: "fichas.ver", rotulo: "Visualizar", detalhe: "Consultar e imprimir fichas (somente as que cadastrou)", tipo: "ver" },
      { chave: "fichas.ver_todas", rotulo: "Toda a equipe", detalhe: "Ampliar o acesso às fichas de todos os profissionais", tipo: "escopo" },
      { chave: "fichas.criar", rotulo: "Cadastrar", detalhe: "Registrar novas fichas em campo", tipo: "criar" },
      { chave: "fichas.editar", rotulo: "Editar", detalhe: "Corrigir fichas às quais tem acesso", tipo: "editar" },
      { chave: "fichas.excluir", rotulo: "Excluir", detalhe: "Apagar fichas e suas evoluções", tipo: "excluir" },
    ],
  },
  {
    id: "evolucoes",
    titulo: "Evoluções do caso",
    descricao: "Histórico de acompanhamento de cada ficha.",
    acoes: [
      { chave: "evolucoes.criar", rotulo: "Registrar", detalhe: "Adicionar evoluções às fichas", tipo: "criar" },
      { chave: "evolucoes.excluir", rotulo: "Excluir", detalhe: "Apagar evoluções registradas", tipo: "excluir" },
    ],
  },
  {
    id: "veiculos",
    titulo: "Percursos de veículo",
    descricao: "Saídas, chegadas e quilometragem do dia a dia.",
    acoes: [
      { chave: "veiculos.ver", rotulo: "Visualizar", detalhe: "Consultar percursos e a frota", tipo: "ver" },
      { chave: "veiculos.registrar", rotulo: "Registrar", detalhe: "Lançar saídas e chegadas", tipo: "criar" },
      { chave: "veiculos.editar", rotulo: "Corrigir", detalhe: "Alterar horários, KM e locais de percursos", tipo: "editar" },
      { chave: "veiculos.excluir", rotulo: "Excluir", detalhe: "Apagar lançamentos incorretos", tipo: "excluir" },
    ],
  },
  {
    id: "frota",
    titulo: "Frota (cadastro de veículos)",
    descricao: "Veículos disponíveis para as rondas.",
    acoes: [
      { chave: "frota.cadastrar", rotulo: "Cadastrar", detalhe: "Incluir novos veículos na frota", tipo: "criar" },
      { chave: "frota.editar", rotulo: "Editar", detalhe: "Alterar dados, ativar e desativar veículos", tipo: "editar" },
    ],
  },
  {
    id: "gerencia",
    titulo: "Gerência e relatórios",
    descricao: "Indicadores consolidados e documentos da coordenação.",
    acoes: [
      { chave: "gerencia.ver", rotulo: "Visualizar painel", detalhe: "Indicadores e gráficos do período", tipo: "ver" },
      { chave: "relatorios.exportar", rotulo: "Exportar", detalhe: "PDFs e CSV (nominais exigem acesso a toda a equipe)", tipo: "criar" },
    ],
  },
];

/** Permissões que dependem de outras (ex.: editar exige visualizar). */
export const DEPENDENCIAS: Partial<Record<Permissao, Permissao[]>> = {
  "fichas.ver_todas": ["fichas.ver"],
  "fichas.editar": ["fichas.ver"],
  "fichas.excluir": ["fichas.ver"],
  "evolucoes.criar": ["fichas.ver"],
  "evolucoes.excluir": ["fichas.ver"],
  "veiculos.registrar": ["veiculos.ver"],
  "veiculos.editar": ["veiculos.ver"],
  "veiculos.excluir": ["veiculos.ver"],
  "frota.cadastrar": ["veiculos.ver"],
  "frota.editar": ["veiculos.ver"],
  "relatorios.exportar": ["gerencia.ver"],
};

export const PERFIS: {
  id: string;
  nome: string;
  descricao: string;
  permissoes: Permissao[];
  sugerirValidade?: boolean;
}[] = [
  {
    id: "campo",
    nome: "Equipe de campo",
    descricao: "Cadastra fichas e evoluções; consulta os casos de toda a equipe.",
    permissoes: ["fichas.ver", "fichas.ver_todas", "fichas.criar", "evolucoes.criar", "veiculos.ver"],
  },
  {
    id: "temporario",
    nome: "Apoio temporário",
    descricao: "Reforço sazonal (ex.: Festa do Peão): vê só as próprias fichas. Defina a validade.",
    permissoes: ["fichas.ver", "fichas.criar", "evolucoes.criar"],
    sugerirValidade: true,
  },
  {
    id: "motorista",
    nome: "Motorista",
    descricao: "Lança saídas e chegadas dos veículos.",
    permissoes: ["veiculos.ver", "veiculos.registrar"],
  },
  {
    id: "frota",
    nome: "Gestor de frota",
    descricao: "Cadastra veículos e corrige percursos.",
    permissoes: ["veiculos.ver", "veiculos.registrar", "veiculos.editar", "veiculos.excluir", "frota.cadastrar", "frota.editar"],
  },
  {
    id: "coordenacao",
    nome: "Coordenação",
    descricao: "Acesso total a dados e relatórios, sem gerir usuários.",
    permissoes: [...PERMISSOES],
  },
  {
    id: "leitura",
    nome: "Somente leitura",
    descricao: "Consulta fichas, veículos e painel, sem alterar nada.",
    permissoes: ["fichas.ver", "fichas.ver_todas", "veiculos.ver", "gerencia.ver"],
  },
];

/** Remove chaves desconhecidas e adiciona dependências obrigatórias. */
export function normalizarPermissoes(lista: unknown): Permissao[] {
  if (!Array.isArray(lista)) return [];
  const validas = new Set<Permissao>();
  for (const item of lista) {
    if (typeof item === "string" && (PERMISSOES as readonly string[]).includes(item)) {
      validas.add(item as Permissao);
    }
  }
  for (const p of [...validas]) {
    for (const dep of DEPENDENCIAS[p] ?? []) validas.add(dep);
  }
  return PERMISSOES.filter((p) => validas.has(p));
}

export function temPermissao(sujeito: SujeitoPermissao | null | undefined, requisito: RequisitoAcesso): boolean {
  if (!sujeito) return false;
  if (sujeito.papel === "admin") return true;
  if (requisito === "admin") return false;
  return sujeito.permissoes.includes(requisito);
}

/** Nome do perfil pronto que corresponde exatamente às permissões, se houver. */
export function perfilCorrespondente(papel: string, permissoes: readonly string[]): string | null {
  if (papel === "admin") return "Administrador";
  const lista = normalizarPermissoes([...permissoes]);
  const perfil = PERFIS.find((p) => {
    const alvo = normalizarPermissoes(p.permissoes);
    return alvo.length === lista.length && alvo.every((x) => lista.includes(x));
  });
  return perfil?.nome ?? null;
}

export function rotuloPermissao(chave: string): string {
  for (const m of MODULOS) {
    const a = m.acoes.find((x) => x.chave === chave);
    if (a) return `${m.titulo}: ${a.rotulo}`;
  }
  return chave;
}

// ——— Política de senha (usada no cliente para feedback e no servidor para validar) ———
export function regrasSenha(senha: string, login = "") {
  return [
    { ok: senha.length >= 8, texto: "Pelo menos 8 caracteres" },
    { ok: /[A-Za-zÀ-ÿ]/.test(senha) && /\d/.test(senha), texto: "Letras e números" },
    {
      ok: senha.toLowerCase() !== "admin" && (!login || senha.toLowerCase() !== login.toLowerCase()),
      texto: "Diferente do usuário e de “admin”",
    },
  ];
}

export function senhaForte(senha: string, login = ""): boolean {
  return senha.length <= 128 && regrasSenha(senha, login).every((r) => r.ok);
}

export const LOGIN_REGEX = /^[a-z0-9._-]{3,32}$/;
