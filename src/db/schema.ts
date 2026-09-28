import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Usuários do sistema. Nunca são excluídos (apenas desativados) para
 * preservar a trilha de auditoria de quem registrou cada informação.
 */
export const usuarios = pgTable("usuarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  login: text("login").notNull().unique(), // sempre minúsculo
  cargo: text("cargo"),
  senhaHash: text("senha_hash").notNull(), // scrypt com sal individual
  papel: text("papel").notNull().default("usuario"), // admin | usuario
  permissoes: text("permissoes").array().notNull().default([]),
  ativo: boolean("ativo").notNull().default(true),
  /** Acesso temporário (ex.: equipe reforço da Festa do Peão): vale até o fim deste dia. */
  acessoAte: date("acesso_ate"),
  deveTrocarSenha: boolean("deve_trocar_senha").notNull().default(true),
  tentativasFalhas: integer("tentativas_falhas").notNull().default(0),
  bloqueadoAte: timestamp("bloqueado_ate", { withTimezone: true }),
  ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }),
  senhaAlteradaEm: timestamp("senha_alterada_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Sessões ativas. O cookie guarda o token; o banco guarda só o hash SHA-256. */
export const sessoes = pgTable("sessoes", {
  id: uuid("id").defaultRandom().primaryKey(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("sessoes_usuario_idx").on(t.usuarioId)]);

/** Trilha de auditoria: quem fez o quê e quando. */
export const auditoria = pgTable("auditoria", {
  id: uuid("id").defaultRandom().primaryKey(),
  usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  usuarioNome: text("usuario_nome"), // cópia do nome no momento da ação
  acao: text("acao").notNull(),
  entidade: text("entidade"),
  entidadeId: text("entidade_id"),
  detalhes: text("detalhes"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("auditoria_data_idx").on(t.createdAt),
  index("auditoria_usuario_idx").on(t.usuarioId),
]);

/**
 * Ficha de Atendimento — Serviço Especializado em Abordagem Social
 * Instituto PróFamília / Prefeitura de Barretos
 */
export const atendimentos = pgTable("atendimentos", {
  id: uuid("id").defaultRandom().primaryKey(),
  numero: serial("numero").notNull().unique(),

  // ——— Dados do atendimento ———
  dataAtendimento: date("data_atendimento").notNull(),
  horario: text("horario").notNull(),
  localAbordagem: text("local_abordagem").notNull(),
  pontoReferencia: text("ponto_referencia"),
  profissionalResponsavel: text("profissional_responsavel").notNull(),
  equipe: text("equipe"),
  motivoAbordagem: text("motivo_abordagem").notNull(),
  motivoOutro: text("motivo_outro"),

  // ——— Identificação pessoal ———
  nomeCompleto: text("nome_completo").notNull(),
  nomeSocial: text("nome_social"),
  dataNascimento: date("data_nascimento"),
  nomeMae: text("nome_mae"),
  nomePai: text("nome_pai"),
  idade: integer("idade"),
  telefone: text("telefone"),
  sexo: text("sexo"),
  sexoOutro: text("sexo_outro"), // descrição autodeclarada, apenas quando "Outra identificação"
  estadoCivil: text("estado_civil"),
  naturalidade: text("naturalidade"),
  municipioOrigem: text("municipio_origem"),
  cpf: text("cpf"),
  rg: text("rg"),
  possuiDocumentacao: text("possui_documentacao"), // sim | nao | parcialmente

  // ——— Situação atual ———
  situacaoAtual: text("situacao_atual").array().notNull().default([]),
  situacaoAtualOutro: text("situacao_atual_outro"),
  tempoSituacao: text("tempo_situacao"),

  // ——— Situação de rua ———
  ruaTipo: text("rua_tipo"), // migrante | itinerante
  ruaMotivo: text("rua_motivo"),
  ruaQuantoTempo: text("rua_quanto_tempo"),
  ruaOndePermanece: text("rua_onde_permanece"),

  // ——— Composição familiar ———
  vinculoPreservado: text("vinculo_preservado"), // sim | nao | parcialmente
  vinculoFamiliar: text("vinculo_familiar"), // RBSV | RBCV | RNB
  refFamiliarNome: text("ref_familiar_nome"),
  refFamiliarTelefone: text("ref_familiar_telefone"),
  refFamiliarMunicipio: text("ref_familiar_municipio"),

  // ——— Condições de moradia ———
  condicaoMoradia: text("condicao_moradia"),
  condicaoMoradiaOutro: text("condicao_moradia_outro"),

  // ——— Saúde ———
  saudeCondicao: text("saude_condicao"),
  usoMedicacao: text("uso_medicacao"), // sim | nao
  usoMedicacaoQual: text("uso_medicacao_qual"),
  atendimentoImediato: text("atendimento_imediato"), // sim | nao
  usoDrogas: text("uso_drogas"), // nao_relata | alcool | ilicitas | ambos
  substancias: text("substancias").array().notNull().default([]),

  // ——— Escolaridade ———
  escolaridade: text("escolaridade"),

  // ——— Renda ———
  possuiRenda: text("possui_renda"), // sim | nao
  origemRenda: text("origem_renda"),
  origemRendaOutro: text("origem_renda_outro"),
  valorRenda: numeric("valor_renda"),

  // ——— Benefícios sociais ———
  beneficios: text("beneficios").array().notNull().default([]),
  beneficiosOutro: text("beneficios_outro"),
  numeroNis: text("numero_nis"),

  // ——— Demandas / providências / procedimentos / encaminhamentos ———
  demandas: text("demandas").array().notNull().default([]),
  demandasOutro: text("demandas_outro"),
  providencias: text("providencias").array().notNull().default([]),
  providenciasOutro: text("providencias_outro"),
  procedimentos: text("procedimentos").array().notNull().default([]),
  encaminhamentos: text("encaminhamentos").array().notNull().default([]),
  encaminhamentosOutro: text("encaminhamentos_outro"),

  // ——— Acompanhamento ———
  necessitaAcompanhamento: text("necessita_acompanhamento"), // sim | nao
  acompanhamentoLocal: text("acompanhamento_local"),

  // ——— Responsável pelo registro / ciência do usuário ———
  responsavelNome: text("responsavel_nome"),
  responsavelCargo: text("responsavel_cargo"),
  assinaturaUsuario: text("assinatura_usuario"), // data URL (PNG) coletada em campo

  // ——— Rastreabilidade ———
  criadoPorId: uuid("criado_por_id").references(() => usuarios.id, { onDelete: "set null" }),
  atualizadoPorId: uuid("atualizado_por_id").references(() => usuarios.id, { onDelete: "set null" }),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (tabela) => [
  // Filtros por período usados na gerência, fichas, CSV e relatórios em PDF.
  index("atendimentos_data_idx").on(tabela.dataAtendimento),
]);

/** Evolução do caso — registro contínuo com data/hora e responsável */
export const evolucoes = pgTable("evolucoes", {
  id: uuid("id").defaultRandom().primaryKey(),
  atendimentoId: uuid("atendimento_id")
    .notNull()
    .references(() => atendimentos.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  autorNome: text("autor_nome").notNull(),
  autorCargo: text("autor_cargo"),
  autorId: uuid("autor_id").references(() => usuarios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (tabela) => [
  // PostgreSQL não cria índice automaticamente para chaves estrangeiras.
  index("evolucoes_atendimento_idx").on(tabela.atendimentoId),
]);

/** Frota de veículos do Instituto. Nunca excluídos, apenas desativados (histórico). */
export const veiculos = pgTable("veiculos", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelo: text("modelo").notNull(),
  marca: text("marca"),
  placa: text("placa").notNull().unique(), // normalizada: maiúsculas, sem separadores
  ano: integer("ano"),
  cor: text("cor"),
  kmInicial: integer("km_inicial").notNull().default(0),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").notNull().default(true),
  criadoPorId: uuid("criado_por_id").references(() => usuarios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Controle diário de saída de veículos */
export const veiculoRegistros = pgTable("veiculo_registros", {
  id: uuid("id").defaultRandom().primaryKey(),
  data: date("data").notNull(),
  veiculoId: uuid("veiculo_id").references(() => veiculos.id, { onDelete: "restrict" }),
  /** Rótulo do veículo (modelo · placa), mantido para relatórios e histórico. */
  veiculo: text("veiculo").notNull().default("Kombi · DMN-4326"),
  motorista: text("motorista").notNull(),
  saidaHora: text("saida_hora").notNull(),
  saidaKm: integer("saida_km").notNull(),
  saidaLocal: text("saida_local").notNull(),
  chegadaHora: text("chegada_hora"),
  chegadaKm: integer("chegada_km"),
  chegadaLocal: text("chegada_local"),
  registradoPorId: uuid("registrado_por_id").references(() => usuarios.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (tabela) => [
  index("veiculo_registros_data_idx").on(tabela.data),
  index("veiculo_registros_veiculo_idx").on(tabela.veiculoId),
]);

/**
 * Registro de falhas do sistema. A `referencia` é exibida ao usuário no aviso
 * de erro; aqui ficam os detalhes técnicos para o administrador diagnosticar.
 */
export const errosSistema = pgTable("erros_sistema", {
  id: uuid("id").defaultRandom().primaryKey(),
  referencia: text("referencia").notNull(),
  codigo: text("codigo").notNull(),
  mensagem: text("mensagem"),
  tecnico: text("tecnico"),
  pilha: text("pilha"),
  rota: text("rota"),
  metodo: text("metodo"),
  usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  usuarioNome: text("usuario_nome"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("erros_sistema_data_idx").on(t.createdAt),
  index("erros_sistema_referencia_idx").on(t.referencia),
]);

export type Atendimento = typeof atendimentos.$inferSelect;
export type ErroSistema = typeof errosSistema.$inferSelect;
export type NovoAtendimento = typeof atendimentos.$inferInsert;
export type Evolucao = typeof evolucoes.$inferSelect;
export type VeiculoRegistro = typeof veiculoRegistros.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
export type Veiculo = typeof veiculos.$inferSelect;
export type RegistroAuditoria = typeof auditoria.$inferSelect;
