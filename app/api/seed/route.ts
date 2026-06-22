import { NextResponse } from "next/server";
import { db } from "../../../db";
import { centers, users } from "../../../db/schema";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Criar um Centro de Teste
    const centerId = crypto.randomUUID();
    await db.insert(centers).values({
      id: centerId,
      name: "Centro Socioeducativo de Internação Provisória da Região dos Cocais",
      createdAt: new Date(),
    });

    // Criptografar as senhas antes de salvar no banco
    const adminPassword = await bcrypt.hash("funac@2026", 10);
    const unitPassword = await bcrypt.hash("fase@2026", 10);

    // 2. Criar Utilizador Administrador Central (centerId fica nulo)
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: "admin@dehouse.com",
      password: adminPassword,
      role: "ADMIN",
      centerId: null,
      createdAt: new Date(),
    });

    // 3. Criar Utilizador de Unidade vinculado ao Centro criado acima
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: "csrc@funac.ma.gov.br",
      password: unitPassword,
      role: "UNIT",
      centerId: centerId,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Utilizadores de teste criados com sucesso no Turso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}