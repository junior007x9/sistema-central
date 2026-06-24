import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ==========================================
// MÓDULO: GESTÃO SOCIOEDUCATIVA E UNIDADES
// ==========================================

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
  ultimoAnoEscolar: text('ultimo_ano_escolar').notNull().default('Não Informado'),
  situacaoEscolar: text('situacao_escolar').notNull().default('Sem informação'),
  motivoNaoFrequenta: text('motivo_nao_frequenta').notNull().default('Sem informação'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  entidade: text('entidade').notNull(),
  acao: text('acao').notNull(),
  detalhe: text('detalhe').notNull(),
  observacao: text('observacao').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ==========================================
// NOVO MÓDULO: RECURSOS HUMANOS E PONTO
// ==========================================

// Tabela de Cadastro de Funcionários
export const servidores = sqliteTable('servidores', {
  id: text('id').primaryKey(),
  cpf: text('cpf').notNull().unique(), // O CPF será a matrícula principal
  nome: text('nome').notNull(),
  cargo: text('cargo').notNull(), // Ex: Monitor, Assistente Social, Psicólogo
  centerId: text('center_id').notNull().references(() => centers.id), // Onde ele trabalha
  biometriaHash: text('biometria_hash'), // Campo preparado para receber o código do leitor biométrico
  status: text('status', { enum: ['ATIVO', 'INATIVO'] }).notNull().default('ATIVO'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Tabela do Relógio de Ponto Eletrônico
export const pontos = sqliteTable('pontos', {
  id: text('id').primaryKey(),
  servidorId: text('servidor_id').notNull().references(() => servidores.id),
  centerId: text('center_id').notNull().references(() => centers.id), // Registra onde o ponto foi batido
  tipo: text('tipo', { enum: ['ENTRADA', 'SAIDA'] }).notNull(),
  dataHora: integer('data_hora', { mode: 'timestamp' }).notNull(), // O momento exato (milissegundos)
  fotoSnapshot: text('foto_snapshot'), // Opcional: Se quisermos usar a câmera do tablet para tirar foto na hora do ponto
});