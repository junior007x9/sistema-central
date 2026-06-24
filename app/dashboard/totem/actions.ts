"use server";

import { db } from "../../../db";
import { servidores, pontos } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function registrarPontoAction(cpf: string, tipo: "ENTRADA" | "SAIDA", centerId: string) {
  if (!cpf) return { error: "O CPF/Matrícula é obrigatório." };

  // 1. Buscar o servidor pelo CPF
  const servidorQuery = await db.select().from(servidores).where(eq(servidores.cpf, cpf));
  const servidor = servidorQuery[0];

  if (!servidor) {
    return { error: "Servidor não encontrado. Procure o RH." };
  }

  if (servidor.status !== "ATIVO") {
    return { error: "Servidor inativo no sistema." };
  }

  if (servidor.centerId !== centerId) {
    return { error: "Este servidor pertence a outra unidade." };
  }

  // 2. Registrar o ponto
  await db.insert(pontos).values({
    id: crypto.randomUUID(),
    servidorId: servidor.id,
    centerId: centerId,
    tipo: tipo,
    dataHora: new Date(),
  });

  return { 
    success: true, 
    mensagem: `${tipo} registrada com sucesso!`, 
    servidorNome: servidor.nome 
  };
}