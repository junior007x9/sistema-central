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

export const evolucoesPia = sqliteTable('evolucoes_pia', {
  id: text('id').primaryKey(),
  atendimentoId: text('atendimento_id').notNull().references(() => atendimentos.id),
  autor: text('autor').notNull(), 
  tipo: text('tipo', { enum: ['PSICOLOGIA', 'SERVIÇO SOCIAL', 'SAÚDE', 'PEDAGOGIA', 'JURÍDICO', 'SEGURANÇA'] }).notNull(),
  relato: text('relato').notNull(),
  dataRegistro: integer('data_registro', { mode: 'timestamp' }).notNull(),
});

// ==========================================
// MÓDULO: RH E SERVIDORES
// ==========================================

export const servidores = sqliteTable('servidores', {
  id: text('id').primaryKey(),
  cpf: text('cpf').notNull().unique(),
  senha: text('senha').notNull().default('fase123'),
  nome: text('nome').notNull(),
  cargo: text('cargo').notNull(),
  centerId: text('center_id').notNull().references(() => centers.id),
  escala: text('escala').notNull().default('5x2 - Administrativo'),
  pis: text('pis').notNull().default('00000000000'),
  status: text('status', { enum: ['ATIVO', 'INATIVO'] }).notNull().default('ATIVO'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

  nomeSocial: text('nome_social'),
  dataNascimento: text('data_nascimento'),
  tipoSanguineo: text('tipo_sanguineo'),
  grupoEtnico: text('grupo_etnico'),
  estadoCivil: text('estado_civil'),
  genero: text('genero'),
  orientacaoSexual: text('orientacao_sexual'),
  endereco: text('endereco'),
  email: text('email'),
  telefone: text('telefone'),
  contatoEmergencia: text('contato_emergencia'),
  rg: text('rg'),
  tituloEleitoral: text('titulo_eleitoral'),
  dependentes: text('dependentes'),
  banco: text('banco'),
  agencia: text('agencia'),
  conta: text('conta'),

  vinculo: text('vinculo'),
  dataAdmissao: text('data_admissao'),
  dataDesligamento: text('data_desligamento'),
  motivoDesligamento: text('motivo_desligamento'),
  processoDesligamento: text('processo_desligamento'),
});

export const pontos = sqliteTable('pontos', {
  id: text('id').primaryKey(),
  servidorId: text('servidor_id').notNull().references(() => servidores.id),
  centerId: text('center_id').notNull().references(() => centers.id),
  tipo: text('tipo', { enum: ['ENTRADA', 'SAIDA'] }).notNull(),
  dataHora: integer('data_hora', { mode: 'timestamp' }).notNull(),
  latitude: text('latitude'),
  longitude: text('longitude'),
  modoOffline: integer('modo_offline').notNull().default(0),
  statusPonto: text('status_ponto', { enum: ['NORMAL', 'JUSTIFICADO', 'ABONO'] }).notNull().default('NORMAL'),
  justificativaRH: text('justificativa_rh'),
  atestadoAnexo: text('atestado_anexo'),
  assinaturaDigitalComprovante: text('assinatura_digital_comprovante'),
});

export const escalasPlantao = sqliteTable('escalas_plantao', {
  id: text('id').primaryKey(),
  servidorId: text('servidor_id').notNull().references(() => servidores.id),
  centerId: text('center_id').notNull().references(() => centers.id),
  dataPlantao: text('data_plantao').notNull(), 
  turno: text('turno', { enum: ['DIA (07h-19h)', 'NOITE (19h-07h)', 'EXPEDIENTE'] }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  entidade: text('entidade').notNull(),
  acao: text('acao').notNull(),
  detalhe: text('detalhe').notNull(),
  observacao: text('observacao').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const solicitacoesAbono = sqliteTable('solicitacoes_abono', {
  id: text('id').primaryKey(),
  servidorId: text('servidor_id').notNull().references(() => servidores.id),
  centerId: text('center_id').notNull().references(() => centers.id),
  dataFalta: text('data_falta').notNull(),
  motivo: text('motivo').notNull(),
  anexo: text('anexo'),
  status: text('status', { enum: ['PENDENTE', 'APROVADO', 'REJEITADO'] }).notNull().default('PENDENTE'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const eventosAusencia = sqliteTable('eventos_ausencia', {
  id: text('id').primaryKey(),
  servidorId: text('servidor_id').notNull().references(() => servidores.id),
  tipo: text('tipo', { enum: ['FÉRIAS', 'LICENÇA MATERNIDADE/PATERNIDADE', 'LICENÇA SAÚDE', 'LICENÇA PRÊMIO', 'AFASTAMENTO'] }).notNull(),
  dataInicio: text('data_inicio').notNull(),
  dataFim: text('data_fim').notNull(),
  observacao: text('observacao'),
  status: text('status', { enum: ['PROGRAMADO', 'APROVADO', 'CANCELADO'] }).notNull().default('APROVADO'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ==========================================
// NOVO MÓDULO: RECRUTAMENTO E SELEÇÃO
// ==========================================
export const candidatos = sqliteTable('candidatos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  cpf: text('cpf').notNull().unique(),
  email: text('email').notNull(),
  telefone: text('telefone').notNull(),
  qualificacao: text('qualificacao').notNull(), // Local para observação do currículo / área de adaptação
  status: text('status', { enum: ['CADASTRO DE RESERVA', 'CONVOCADO', 'REJEITADO'] }).notNull().default('CADASTRO DE RESERVA'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
// ==========================================
// NOVO MÓDULO: CARGOS E FUNÇÕES
// ==========================================
export const cargos = sqliteTable('cargos', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});