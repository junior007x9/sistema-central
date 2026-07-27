"use server";

import { db } from "../../../db";
import { servidores } from "../../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "../../../lib/session";
import { cookies } from "next/headers";

export async function autenticarServidorAction(formData: FormData) {
  const cpfBruto = formData.get("cpf") as string;
  const password = formData.get("password") as string;

  // Limpa a máscara (remove pontos e traços) para consultar o banco de dados corretamente
  const cleanCpf = cpfBruto ? cpfBruto.replace(/\D/g, "") : "";

  if (!cleanCpf || !password) {
    return { error: "Preencha todos os campos." };
  }

  try {
    // 1. Busca no Banco de Dados
    const servidorList = await db.select().from(servidores).where(eq(servidores.cpf, cleanCpf));
    const servidor = servidorList[0];

    // ==========================================
    // BLINDAGEM 1: Defesa contra Enumeração e Timing Attacks
    // ==========================================
    if (!servidor) {
      // Cálculo de hash falso para confundir robôs de ataque
      await bcrypt.hash(password, 10);
      return { error: "Credenciais inválidas. Verifique o CPF e a senha." };
    }

    // ==========================================
    // TRAVA DE RH: Bloqueia acesso de ex-funcionários
    // ==========================================
    if (servidor.status === "INATIVO") {
      return { error: "Acesso bloqueado. O seu perfil encontra-se inativo. Contacte o RH." };
    }

    // ==========================================
    // BLINDAGEM 2: Comparação Segura (Bcrypt)
    // ==========================================
    const passwordMatch = await bcrypt.compare(password, servidor.senha);

    if (!passwordMatch) {
      return { error: "Credenciais inválidas. Verifique o CPF e a senha." };
    }

    // ==========================================
    // BLINDAGEM 3: Geração do Cookie de Sessão
    // ==========================================
    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000); // Duração de 10 horas
    
    const sessionPayload = {
      userId: servidor.id,
      role: "SERVIDOR", // Diferencia este utilizador de um Diretor/RH
      centerId: servidor.centerId,
      expires
    };

    const session = await encrypt(sessionPayload);
    const cookieStore = await cookies();

    // ==========================================
    // BLINDAGEM 4: Trancamento do Cookie no Navegador
    // ==========================================
    cookieStore.set("session", session, {
      httpOnly: true, // Bloqueia roubo de cookies por extensões (XSS)
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