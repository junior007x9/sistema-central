"use server";

import { db } from "../../../db";
import { centers, users, auditLogs } from "../../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Função genérica para gravar o log de auditoria
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

// --- AÇÕES PARA UNIDADES ---

export async function salvarUnidadeAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const observacao = formData.get("observacao") as string;

  if (!name || !observacao) return { error: "Nome e Observação são obrigatórios." };

  if (id) {
    // Editar Unidade
    await db.update(centers).set({ name }).where(eq(centers.id, id));
    await registrarLog("UNIDADE", "EDITAR", name, observacao);
    return { success: "Unidade atualizada com sucesso!" };
  } else {
    // Criar Unidade
    await db.insert(centers).values({ id: crypto.randomUUID(), name, createdAt: new Date() });
    await registrarLog("UNIDADE", "CRIAR", name, observacao);
    return { success: "Nova unidade criada com sucesso!" };
  }
}

export async function excluirUnidadeAction(id: string, name: string, observacao: string) {
  if (!observacao) return { error: "A observação é obrigatória para exclusões." };
  try {
    await db.delete(centers).where(eq(centers.id, id));
    await registrarLog("UNIDADE", "EXCLUIR", name, observacao);
    return { success: "Unidade excluída." };
  } catch (error) {
    return { error: "Não é possível excluir uma unidade que já possui usuários ou atendimentos vinculados." };
  }
}

// --- AÇÕES PARA USUÁRIOS ---

export async function salvarUsuarioAction(formData: FormData) {
  const id = formData.get("id") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "UNIT";
  const centerId = formData.get("centerId") as string;
  const observacao = formData.get("observacao") as string;

  if (!email || !role || !observacao) return { error: "E-mail, Perfil e Observação são obrigatórios." };

  if (id) {
    // Editar Usuário (A senha só é atualizada se for preenchida)
    const updateData: any = { email, role, centerId: centerId || null };
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await db.update(users).set(updateData).where(eq(users.id, id));
    await registrarLog("USUARIO", "EDITAR", email, observacao);
    return { success: "Usuário atualizado com sucesso!" };
  } else {
    // Criar Usuário
    if (!password) return { error: "A senha é obrigatória para novos usuários." };
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      await db.insert(users).values({
        id: crypto.randomUUID(), email, password: hashedPassword, role, centerId: centerId || null, createdAt: new Date()
      });
      await registrarLog("USUARIO", "CRIAR", email, observacao);
      return { success: "Usuário criado com sucesso!" };
    } catch (error) {
      return { error: "Esse e-mail já está em uso." };
    }
  }
}

export async function excluirUsuarioAction(id: string, email: string, observacao: string) {
  if (!observacao) return { error: "A observação é obrigatória para exclusões." };
  await db.delete(users).where(eq(users.id, id));
  await registrarLog("USUARIO", "EXCLUIR", email, observacao);
  return { success: "Usuário excluído do sistema." };
}