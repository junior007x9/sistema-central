"use server";

import { db } from "../../../db";
import { servidores, pontos, auditLogs, escalasPlantao } from "../../../db/schema";
import { eq } from "drizzle-orm";

async function registrarLog(entidade: string, acao: string, detalhe: string, observacao: string) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(), entidade, acao, detalhe, observacao, createdAt: new Date(),
  });
}

export async function salvarServidorAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = formData.get("nome") as string;
  const cpf = formData.get("cpf") as string;
  const pis = formData.get("pis") as string;
  const cargo = formData.get("cargo") as string;
  const escala = formData.get("escala") as string;
  const centerId = formData.get("centerId") as string;
  const status = formData.get("status") as "ATIVO" | "INATIVO";
  const observacao = formData.get("observacao") as string;

  if (!nome || !cpf || !pis || !cargo || !centerId || !observacao) return { error: "Preencha tudo." };

  if (id) {
    await db.update(servidores).set({ nome, cpf, pis, cargo, escala, centerId, status }).where(eq(servidores.id, id));
    await registrarLog("SERVIDOR", "EDITAR", `${nome}`, observacao);
    return { success: "Atualizado!" };
  } else {
    try {
      await db.insert(servidores).values({ id: crypto.randomUUID(), nome, cpf, pis, cargo, escala, centerId, status: "ATIVO", createdAt: new Date() });
      await registrarLog("SERVIDOR", "CRIAR", `${nome}`, observacao);
      return { success: "Cadastrado!" };
    } catch { return { error: "CPF já cadastrado." }; }
  }
}

export async function tratarPontoAction(formData: FormData) {
  const pontoId = formData.get("pontoId") as string;
  const statusPonto = formData.get("statusPonto") as any;
  const justificativaRH = formData.get("justificativaRH") as string;
  const observacaoAuditoria = formData.get("observacaoAuditoria") as string;

  if (!pontoId || !statusPonto || !justificativaRH || !observacaoAuditoria) return { error: "Preencha tudo." };
  await db.update(pontos).set({ statusPonto, justificativaRH }).where(eq(pontos.id, pontoId));
  await registrarLog("PONTO_ELETRONICO", "AJUSTE", `Ponto: ${pontoId}`, observacaoAuditoria);
  return { success: "Ponto tratado!" };
}

export async function gerarArquivoAFDAction(centerId?: string) {
  const listaPontos = await db.select().from(pontos);
  const listaServidores = await db.select().from(servidores);
  let nsr = 1;
  let conteudoAFD = "000000000112345678901234FUNDO ATEND SOCIOEDUCATIVO MA\r\n"; 

  listaPontos.forEach((p) => {
    if (centerId && p.centerId !== centerId) return;
    const servidor = listaServidores.find(s => s.id === p.servidorId);
    if (!servidor) return;
    const dataF = new Date(p.dataHora).toLocaleDateString('pt-BR').replace(/\//g, '');
    const horaF = new Date(p.dataHora).toLocaleTimeString('pt-BR').replace(/:/g, '');
    const nsrS = String(nsr).padStart(9, '0');
    const pisS = String(servidor.pis).padStart(11, '0');
    const evento = p.tipo === "ENTRADA" ? "1" : "2";
    conteudoAFD += `${nsrS}3${dataF}${horaF}${pisS}${evento}0000000000000\r\n`;
    nsr++;
  });
  return { success: true, conteudo: conteudoAFD, fileName: `AFD_FASE_MA.txt` };
}

// =====================================
// NOVO: Ação de Gerenciamento de Escalas
// =====================================
export async function salvarPlantaoAction(formData: FormData) {
  const servidorId = formData.get("servidorId") as string;
  const centerId = formData.get("centerId") as string;
  const dataPlantao = formData.get("dataPlantao") as string;
  const turno = formData.get("turno") as any;

  if (!servidorId || !dataPlantao || !turno || !centerId) return { error: "Preencha todos os campos obrigatórios." };

  await db.insert(escalasPlantao).values({
    id: crypto.randomUUID(),
    servidorId,
    centerId,
    dataPlantao,
    turno
  });

  return { success: "Turno escalado com sucesso!" };
}

export async function listarEscalasAction() {
  return await db.select().from(escalasPlantao);
}