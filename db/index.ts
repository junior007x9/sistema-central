import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Verifica se as variáveis de ambiente existem para evitar erros
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("As variáveis TURSO_DATABASE_URL e TURSO_AUTH_TOKEN estão faltando.");
}

// Cria o cliente de conexão usando as credenciais do Turso
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Exporta o banco de dados (db) já tipado com o nosso schema
export const db = drizzle(client, { schema });