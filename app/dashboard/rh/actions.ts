"use server";

import { db } from "../../../db";
import { servidores, pontos, auditLogs } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

async function registrarLog(entidade: string, acao: string, detalhe: string, observacao: string) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    entidade,
    acao,
    detalhe,
    observacao,
    createdAt: new Date(),
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

  if (!nome || !cpf || !pis || !cargo || !centerId || !observacao) {
    return { error: "Todos os campos estruturais e a observação são obrigatórios." };
  }

  if (id) {
    await db.update(servidores).set({ nome, cpf, pis, cargo, escala, centerId, status }).where(eq(servidores.id, id));
    await registrarLog("SERVIDOR", "EDITAR", `${nome} (CPF: ${cpf})`, observacao);
    return { success: "Servidor atualizado!" };
  } else {
    try {
      await db.insert(servidores).values({
        id: crypto.randomUUID(), nome, cpf, pis, cargo, escala, centerId, status: "ATIVO", createdAt: new Date()
      });
      await registrarLog("SERVIDOR", "CRIAR", `${nome} (CPF: ${cpf})`, observacao);
      return { success: "Servidor cadastrado!" };
    } catch (e) {
      return { error: "CPF ou PIS já cadastrado." };
    }
  }
}

// Tratamento de Ponto Automatizado pelo RH (Abonos e Justificativas de Inconsistência)
export async function tratarPontoAction(formData: FormData) {
  const pontoId = formData.get("pontoId") as string;
  const statusPonto = formData.get("statusPonto") as "NORMAL" | "JUSTIFICADO" | "ABONO";
  const justificativaRH = formData.get("justificativaRH") as string;
  const observacaoAuditoria = formData.get("observacaoAuditoria") as string;

  if (!pontoId || !statusPonto || !justificativaRH || !observacaoAuditoria) {
    return { error: "Preencha toda a fundamentação do ajuste de ponto." };
  }

  await db.update(pontos).set({
    statusPonto,
    justificativaRH
  }).where(eq(pontos.id, pontoId));

  await registrarLog("PONTO_ELETRONICO", "AJUSTE", `Ponto ID: ${pontoId} alterado para ${statusPonto}`, observacaoAuditoria);
  return { success: "Ponto tratado e registrado na auditoria com sucesso!" };
}

// Geração do Arquivo de Fiscalização Trabalhista AFD (Portaria 671 MTE)
export async function gerarArquivoAFDAction(centerId?: string) {
  const listaPontos = await db.select().from(pontos);
  const listaServidores = await db.select().from(servidores);

  let nsr = 1;
  let conteudoAFD = "000000000112345678901234FUNDO ATEND SOCIOEDUCATIVO MA\r\n"; // Cabeçalho do arquivo

  listaPontos.forEach((p) => {
    if (centerId && p.centerId !== centerId) return;
    
    const servidor = listaServidores.find(s => s.id === p.servidorId);
    if (!servidor) return;

    const dataFormatada = new Date(p.dataHora).toLocaleDateString('pt-BR').replace(/\//g, '');
    const horaFormatada = new Date(p.dataHora).toLocaleTimeString('pt-BR').replace(/:/g, '');
    const nsrString = String(nsr).padStart(9, '0');
    const pisString = String(servidor.pis).padStart(11, '0');
    const tipoEvento = p.tipo === "ENTRADA" ? "1" : "2";

    // Estrutura padrão de linha de registro de ponto da Portaria 671
    conteudoAFD += `${nsrString}3${dataFormatada}${horaFormatada}${pisString}${tipoEvento}0000000000000\r\n`;
    nsr++;
  });

  return { 
    success: true, 
    conteudo: conteudoAFD,
    fileName: `AFD_FASE_MA_${new Date().toISOString().slice(0,10)}.txt`
  };
}