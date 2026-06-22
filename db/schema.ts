import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Tabela de Centros/Unidades
export const centers = sqliteTable('centers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 2. Tabela de Usuários
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['ADMIN', 'UNIT'] }).notNull().default('UNIT'),
  centerId: text('center_id').references(() => centers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. Tabela de Cadastro Individual (Atendimento)
// 3. Tabela de Cadastro Individual (Atendimento)
export const atendimentos = sqliteTable('atendimentos', {
  id: text('id').primaryKey(),
  centerId: text('center_id').notNull().references(() => centers.id),
  genero: text('genero').notNull(),
  racaCor: text('raca_cor').notNull(),
  faixaEtaria: text('faixa_etaria').notNull(),
  situacaoProcessual: text('situacao_processual').notNull(),
  religiao: text('religiao').notNull(),
  orientacaoSexual: text('orientacao_sexual').notNull(),
  municipioMoradia: text('municipio_moradia').notNull(),
  municipioOcorrencia: text('municipio_ocorrencia').notNull(),
  
  // NOVAS COLUNAS DE ESCOLARIZAÇÃO
  ultimoAnoEscolar: text('ultimo_ano_escolar').notNull().default('Não Informado'),
  situacaoEscolar: text('situacao_escolar').notNull().default('Sem informação'),
  motivoNaoFrequenta: text('motivo_nao_frequenta').notNull().default('Sem informação'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 4. NOVA Tabela: Histórico de Auditoria (Guarda o "Por que" de cada alteração)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  entidade: text('entidade').notNull(), // Ex: 'USUARIO' ou 'UNIDADE'
  acao: text('acao').notNull(), // Ex: 'CRIAR', 'EDITAR', 'EXCLUIR'
  detalhe: text('detalhe').notNull(), // Ex: O nome da unidade ou email afetado
  observacao: text('observacao').notNull(), // A sua justificativa obrigatória
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});