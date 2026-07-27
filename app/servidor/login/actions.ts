"use server";

import { db } from "../../../db";
import { servidores } from "../../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "../../../lib/session";
import { cookies } from "next/headers";

export async function autenticarServidorAction(formData: FormData) {
  // Agora o campo chama-se "login" (pode ser e-mail ou cpf)
  const loginField = formData.get("login") as string;
  const password = formData.get("password") as string;

  if (!loginField || !password) {
    return { error: "Preencha todos os campos." };
  }

  // INTELIGÊNCIA: Verifica se o utilizador digitou um e-mail (tem @) ou um CPF
  const isEmail = loginField.includes("@");
  const cleanCpf = !isEmail ? loginField.replace(/\D/g, "") : "";

  try {
    let servidorList;
    
    // Procura na base de dados pela coluna correta
    if (isEmail) {
      servidorList = await db.select().from(servidores).where(eq(servidores.email, loginField.trim()));
    } else {
      servidorList = await db.select().from(servidores).where(eq(servidores.cpf, cleanCpf));
    }

    const servidor = servidorList[0];

    // ==========================================
    // BLINDAGEM 1: Defesa contra Enumeração
    // ==========================================
    if (!servidor) {
      await bcrypt.hash(password, 10);
      return { error: "Credenciais inválidas. Verifique o seu CPF/E-mail e a senha." };
    }

    if (servidor.status === "INATIVO") {
      return { error: "Acesso bloqueado. O seu perfil encontra-se inativo. Contacte o RH." };
    }

    // ==========================================
    // BLINDAGEM 2: Comparação Bcrypt
    // ==========================================
    const passwordMatch = await bcrypt.compare(password, servidor.senha);

    if (!passwordMatch) {
      return { error: "Credenciais inválidas. Verifique o seu CPF/E-mail e a senha." };
    }

    // ==========================================
    // BLINDAGEM 3: Geração de Sessão
    // ==========================================
    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000); 
    
    const sessionPayload = {
      userId: servidor.id,
      role: "SERVIDOR", 
      centerId: servidor.centerId,
      expires
    };

    const session = await encrypt(sessionPayload);
    const cookieStore = await cookies();

    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expires,
      path: "/",
    });

    return { success: true };

  } catch (error) {
    console.error("Erro no login do servidor:", error);
    return { error: "Erro interno no servidor. Contacte o suporte técnico." };
  }
}