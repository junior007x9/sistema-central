"use server";

import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "../../lib/session";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Preencha todos os campos." };
  }

  // 1. Busca o usuário no banco de dados pelo e-mail
  const userResult = await db.select().from(users).where(eq(users.email, email));
  const user = userResult[0];

  if (!user) {
    return { error: "E-mail ou senha incorretos." };
  }

  // 2. Verifica se a senha está correta
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "E-mail ou senha incorretos." };
  }

  // 3. Se tudo estiver certo, cria a sessão (cookie)
  await createSession(user.id, user.role, user.centerId);

  // 4. Redireciona o usuário para o painel principal (que ainda vamos criar)
  redirect("/dashboard");
}