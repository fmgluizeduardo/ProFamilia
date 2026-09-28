/**
 * Catálogo de permissões — módulo seguro para cliente e servidor
 * (não importa banco nem APIs de Node).
 *
 * Administradores têm todas as permissões implicitamente, além da gestão de
 * usuários e da auditoria, que são exclusivas do papel "admin".
 */

export const PERMISSOES = [
  "fichas.ver",
  "fichas.criar",
  "fichas.editar",
  "fichas.excluir",
  "evolucoes.criar",
  "evolucoes.excluir",
  "veiculos.ver",
  "veiculos.registrar",
  "veiculos.excluir",
  "gerencia.ver",
  "relatorios.exportar",
] as const;

export type Permissao = (typeof PERMISSOES)[number];
export type Papel = "admin" | "usuario";
export type RequisitoAcesso = Permissao | "admin";

export type SujeitoPermissao = { papel: string; permissoes: readonly string[] };

export const MODULOS: {
  id: string;
  titulo: string;
  descricao: string;
  acoes: { chave: Permissao; rotulo: string; detalhe: string; tipo: "ver" | "criar" | "editar" | "excluir" }[];
}[] = [
  {
    id: "fichas",
    titulo: "Fichas de atendimento",
    descricao: "Dados pessoais e sensíveis das pessoas atendidas.",
    acoes: [
      { chave: "fichas.ver", rotulo: "Visualizar", detalhe: "Consultar fichas, dados pessoais e imprimir", tipo: "ver" },
      { chave: "fichas.criar", rotulo: "Cadastrar", detalhe: "Registrar novas fichas em campo", tipo: "criar" },
      { chave: "fichas.editar", rotulo: "Editar", detalhe: "Corrigir fichas já registradas", tipo: "editar" },
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
    titulo: "Controle de veículo",
    descricao: "Saídas, chegadas e quilometragem.",
    acoes: [
      { chave: "veiculos.ver", rotulo: "Visualizar", detalhe: "Consultar o histórico de percursos", tipo: "ver" },
      { chave: "veiculos.registrar", rotulo: "Registrar", detalhe: "Lançar saídas e chegadas", tipo: "criar" },
      { chave: "veiculos.excluir", rotulo: "Excluir", detalhe: "Apagar lançamentos incorretos", tipo: "excluir" },
    ],
  },
  {
    id: "gerencia",
    titulo: "Gerência e relatórios",
    descricao: "Indicadores consolidados e documentos da coordenação.",
    acoes: [
      { chave: "gerencia.ver", rotulo: "Visualizar painel", detalhe: "Indicadores e gráficos do período", tipo: "ver" },
      { chave: "relatorios.exportar", rotulo: "Exportar", detalhe: "Gerar PDFs e planilha CSV", tipo: "criar" },
    ],
  },
];

/** Permissões que dependem de outras (ex.: editar exige visualizar). */
export const DEPENDENCIAS: Partial<Record<Permissao, Permissao[]>> = {
  "fichas.editar": ["fichas.ver"],
  "fichas.excluir": ["fichas.ver"],
  "evolucoes.criar": ["fichas.ver"],
  "evolucoes.excluir": ["fichas.ver"],
  "veiculos.registrar": ["veiculos.ver"],
  "veiculos.excluir": ["veiculos.ver"],
  "relatorios.exportar": ["gerencia.ver"],
};

export const PERFIS: { id: string; nome: string; descricao: string; permissoes: Permissao[] }[] = [
  {
    id: "campo",
    nome: "Equipe de campo",
    descricao: "Cadastra fichas, consulta e registra evoluções.",
    permissoes: ["fichas.ver", "fichas.criar", "evolucoes.criar", "veiculos.ver"],
  },
  {
    id: "coordenacao",
    nome: "Coordenação",
    descricao: "Acesso total aos dados e relatórios, sem gerir usuários.",
    permissoes: [...PERMISSOES],
  },
  {
    id: "motorista",
    nome: "Motorista",
    descricao: "Apenas controle de veículo.",
    permissoes: ["veiculos.ver", "veiculos.registrar"],
  },
  {
    id: "leitura",
    nome: "Somente leitura",
    descricao: "Consulta fichas, veículo e painel, sem alterar nada.",
    permissoes: ["fichas.ver", "veiculos.ver", "gerencia.ver"],
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
