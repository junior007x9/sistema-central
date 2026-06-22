import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const centers = sqliteTable('centers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['ADMIN', 'UNIT'] }).notNull().default('UNIT'),
  centerId: text('center_id').references(() => centers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. Tabela: Cadastro Individual do Adolescente (Atendimento)
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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});