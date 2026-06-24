"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../../db";
import { servidores } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt } from "../../lib/session";

export async function loginServidorAction(formData: FormData) {
  const cpf = formData.get("cpf") as string;
  const senha = formData.get("senha") as string;

  if (!cpf || !senha) return { error: "Preencha o CPF e a Senha." };

  const query = await db.select().from(servidores).where(and(eq(servidores.cpf, cpf), eq(servidores.senha, senha)));
  const servidor = query[0];

  if (!servidor) {
    return { error: "CPF ou senha incorretos. A senha inicial padrão é fase123" };
  }

  if (servidor.status !== "ATIVO") {
    return { error: "Sua matrícula está inativa. Procure o RH da sua unidade." };
  }

  // Cria um cookie exclusivo para o Servidor (não mistura com o Admin)
  const sessionData = { 
    id: servidor.id, 
    role: "SERVIDOR", 
    nome: servidor.nome, 
    centerId: servidor.centerId 
  };
  
  const encryptedSession = await encrypt(sessionData);
  const cookieStore = await cookies();
  
  cookieStore.set("session_servidor", encryptedSession, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // Fica logado por 1 semana
  });
  
  redirect("/servidor/dashboard");
}

export async function logoutServidorAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session_servidor");
  redirect("/servidor/login");
}