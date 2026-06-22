import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Tabela que cadastra os Centros/Unidades
export const centers = sqliteTable('centers', {
  id: text('id').primaryKey(), // Usaremos UUIDs ou CUIDs gerados via código
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 2. Tabela de Usuários para o Login (Sistema Central e Unidades)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Será armazenado com hash (bcrypt)
  role: text('role', { enum: ['ADMIN', 'UNIT'] }).notNull().default('UNIT'),
  // Se for ADMIN, o centerId é nulo (vê tudo). Se for UNIT, é obrigatório pertencer a um centro.
  centerId: text('center_id').references(() => centers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// 3. Tabela para as informações que as unidades vão enviar
export const unitData = sqliteTable('unit_data', {
  id: text('id').primaryKey(),
  centerId: text('center_id').notNull().references(() => centers.id),
  // Aqui ficará o conteúdo que a unidade vai alimentar. 
  // Podemos adicionar mais colunas dependendo do que o sistema faz.
  content: text('content').notNull(), 
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});