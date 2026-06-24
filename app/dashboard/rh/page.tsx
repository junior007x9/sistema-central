import { db } from "../../../db";
import { centers, servidores, pontos } from "../../../db/schema";
import RHClient from "./RHClient";
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";

export default async function RHPage() {
  // 1. Verificação de Segurança (Apenas ADMIN pode acessar o RH)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try {
    session = await decrypt(sessionCookie);
  } catch (error) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard"); // Expulsa unidades de volta para o dashboard
  }

  // 2. Buscando todos os dados necessários
  const listaUnidades = await db.select().from(centers);
  const listaServidores = await db.select().from(servidores);
  const listaPontos = await db.select().from(pontos);

  // Ordenar os pontos do mais recente para o mais antigo
  listaPontos.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0f2a4a]">Recursos Humanos (RH)</h2>
        <p className="text-gray-600">
          Gestão de servidores e auditoria da folha de ponto eletrônico das unidades socioeducativas.
        </p>
      </div>

      <RHClient 
        unidades={listaUnidades} 
        servidores={listaServidores} 
        pontos={listaPontos} 
      />
    </div>
  );
}