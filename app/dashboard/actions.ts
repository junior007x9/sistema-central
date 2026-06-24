"use server";

import { db } from "../../../db";
import { servidores, pontos } from "../../../db/schema";
import { eq } from "drizzle-orm";

// Função aprimorada para aceitar datas retroativas (offline) e marcar a flag fiscal
export async function registrarPontoAction(
  cpf: string, 
  tipo: "ENTRADA" | "SAIDA", 
  centerId: string, 
  dataHoraStr?: string, 
  foiOffline: boolean = false
) {
  if (!cpf) return { error: "O CPF/Matrícula é obrigatório." };

  const servidorQuery = await db.select().from(servidores).where(eq(servidores.cpf, cpf));
  const servidor = servidorQuery[0];

  if (!servidor) return { error: "Servidor não encontrado na base de dados." };
  if (servidor.status !== "ATIVO") return { error: "Servidor inativo no sistema." };
  if (servidor.centerId !== centerId) return { error: "Este servidor pertence a outra unidade." };

  // Se veio do modo offline, usa a hora exata que estava no tablet; senão, usa a hora real do servidor
  const dataHoraRegistro = dataHoraStr ? new Date(dataHoraStr) : new Date();

  await db.insert(pontos).values({
    id: crypto.randomUUID(),
    servidorId: servidor.id,
    centerId: centerId,
    tipo: tipo,
    dataHora: dataHoraRegistro,
    modoOffline: foiOffline ? 1 : 0, // Flag fiscal da Portaria 671
    statusPonto: "NORMAL"
  });

  return { 
    success: true, 
    mensagem: `${tipo} registrada com sucesso!`, 
    servidorNome: servidor.nome 
  };
}

// Nova função para receber a carga do LocalStorage do Tablet
export async function sincronizarPontosOfflineAction(pontosPendentes: any[]) {
  let sincronizados = 0;
  
  for (const p of pontosPendentes) {
    try {
      const result = await registrarPontoAction(p.cpf, p.tipo, p.centerId, p.dataHora, true);
      if (result.success) sincronizados++;
    } catch (e) {
      console.error("Erro ao sincronizar ponto:", e);
    }
  }

  return { success: true, count: sincronizados };
}