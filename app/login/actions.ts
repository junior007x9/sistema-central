"use server";

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encrypt } from "../../lib/session";
import { cookies } from "next/headers";

export async function autenticarGestorAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha todos os campos." };
  }

  try {
    // 1. Busca no Banco de Dados
    const userList = await db.select().from(users).where(eq(users.email, email));
    const user = userList[0];

    // ==========================================
    // BLINDAGEM 1: Defesa contra Enumeração e Timing Attacks
    // ==========================================
    if (!user) {
      // Se o e-mail não existir, o sistema não avisa o erro de imediato.
      // Ele faz um cálculo falso de criptografia para gastar o mesmo tempo 
      // de processamento de um login real. Isso confunde os robôs de ataque.
      await bcrypt.hash(password, 10);
      
      // Mensagem genérica: O hacker não vai saber se errou o e-mail ou a senha.
      return { error: "Credenciais inválidas. Verifique o e-mail e a senha." };
    }

    // ==========================================
    // BLINDAGEM 2: Comparação Segura (Bcrypt)
    // ==========================================
    // O sistema compara a senha digitada com o Hash do banco. 
    // NUNCA compara textos limpos (Ex: password === user.password).
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: "Credenciais inválidas. Verifique o e-mail e a senha." };
    }

    // ==========================================
    // BLINDAGEM 3: Geração do Cookie de Sessão
    // ==========================================
    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000); // Sessão dura 10 horas (1 plantão)
    
    // Guardamos apenas o essencial no crachá (Nunca guardar a senha aqui)
    const sessionPayload = {
      userId: user.id,
      role: user.role,
      centerId: user.centerId,
      expires
    };

    const session = await encrypt(sessionPayload);
    const cookieStore = await cookies();

    // ==========================================
    // BLINDAGEM 4: Trancamento do Cookie no Navegador
    // ==========================================
    cookieStore.set("session", session, {
      httpOnly: true, // Impede que extensões maliciosas ou JavaScript (XSS) roubem o cookie.
      secure: process.env.NODE_ENV === "production", // Se estiver online (Vercel), força o tráfego apenas em HTTPS.
      sameSite: "lax", // Bloqueia requisições forjadas de outros sites (CSRF).
      expires: expires,
      path: "/",
    });

    return { success: true };

  } catch (error) {
    console.error("Erro no login:", error);
    return { error: "Erro interno no servidor. Contacte o suporte." };
  }
}