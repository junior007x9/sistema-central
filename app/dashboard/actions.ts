"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../../db";
import { atendimentos } from "../../db/schema";
import { decrypt } from "../../lib/session";

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function submitAtendimentoAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return { error: "Não autorizado." };

  const session = await decrypt(sessionCookie);

  if (session.role !== "UNIT" || !session.centerId) {
    return { error: "Apenas unidades podem registrar atendimentos." };
  }

  // Pegando os dados do adolescente
  const genero = formData.get("genero") as string;
  const racaCor = formData.get("racaCor") as string;
  const faixaEtaria = formData.get("faixaEtaria") as string;
  const situacaoProcessual = formData.get("situacaoProcessual") as string;
  const religiao = formData.get("religiao") as string;
  const orientacaoSexual = formData.get("orientacaoSexual") as string;
  const municipioMoradia = formData.get("municipioMoradia") as string;
  const municipioOcorrencia = formData.get("municipioOcorrencia") as string;
  
  const ultimoAnoEscolar = formData.get("ultimoAnoEscolar") as string;
  const situacaoEscolar = formData.get("situacaoEscolar") as string;
  const motivoNaoFrequenta = formData.get("motivoNaoFrequenta") as string;

  if (!genero || !racaCor || !municipioMoradia) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  // Salvando no banco
  await db.insert(atendimentos).values({
    id: crypto.randomUUID(),
    centerId: session.centerId,
    genero,
    racaCor,
    faixaEtaria,
    situacaoProcessual,
    religiao,
    orientacaoSexual,
    municipioMoradia,
    municipioOcorrencia,
    ultimoAnoEscolar,
    situacaoEscolar,
    motivoNaoFrequenta,
    createdAt: new Date(),
  });

  return { success: true };
}