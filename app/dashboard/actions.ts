"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = await cookies();
  // Remove o cookie de sessão do navegador
  cookieStore.delete("session");
  // Redireciona o utilizador de volta para o login
  redirect("/login");
}