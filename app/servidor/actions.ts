"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../../db";
import { servidores, solicitacoesAbono } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt } from "../../lib/session";
import { revalidatePath } from "next/cache";

export async function loginServidorAction(formData: FormData) {
  const cpf = formData.get("cpf") as string;
  const senha = formData.get("senha") as string;

  if (!cpf || !senha) return { error: "Preencha o CPF e a Senha." };

  const query = await db.select().from(servidores).where(and(eq(servidores.cpf, cpf), eq(servidores.senha, senha)));
  const servidor = query[0];

  if (!servidor) return { error: "CPF ou senha incorretos. A senha inicial padrão é fase123" };
  if (servidor.status !== "ATIVO") return { error: "Sua matrícula está inativa. Procure o RH da sua unidade." };

  const sessionData = { id: servidor.id, role: "SERVIDOR", nome: servidor.nome, centerId: servidor.centerId };
  const encryptedSession = await encrypt(sessionData);
  const cookieStore = await cookies();
  
  cookieStore.set("session_servidor", encryptedSession, { 
    httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 
  });
  
  redirect("/servidor/dashboard");
}

export async function logoutServidorAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session_servidor");
  redirect("/servidor/login");
}

// NOVO: Ação de envio do Atestado
export async function enviarAtestadoAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_servidor")?.value;
  if (!sessionCookie) return { error: "Não autorizado." };
  
  const session = await decrypt(sessionCookie);
  
  const dataFalta = formData.get("dataFalta") as string;
  const motivo = formData.get("motivo") as string;
  const file = formData.get("anexo") as File;

  if (!dataFalta || !motivo || !file || file.size === 0) {
    return { error: "Preencha todos os campos e anexe a foto do atestado." };
  }

  // Converte a imagem para Base64 para armazenar direto no SQLite
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;

  await db.insert(solicitacoesAbono).values({
    id: crypto.randomUUID(),
    servidorId: session.id as string,
    centerId: session.centerId as string,
    dataFalta,
    motivo,
    anexo: base64String,
    status: "PENDENTE",
    createdAt: new Date()
  });

  revalidatePath("/servidor/dashboard");
  return { success: true };
}