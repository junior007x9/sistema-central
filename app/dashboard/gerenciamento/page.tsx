import { db } from "../../../db";
import { centers, users, auditLogs } from "../../../db/schema";
import GerenciamentoClient from "./GerenciamentoClient";
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";

export default async function GerenciamentoPage() {
  // 1. Verificação de Segurança (Apenas ADMIN pode acessar essa página)
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
    redirect("/dashboard"); // Expulsa unidades curiosas de volta para o dashboard delas
  }

  // 2. Buscando todos os dados do banco para enviar à interface
  const listaUnidades = await db.select().from(centers);
  const listaUsuarios = await db.select().from(users);
  const historicoAuditoria = await db.select().from(auditLogs).orderBy(auditLogs.createdAt);

  // Inverte o histórico para mostrar as últimas alterações primeiro
  historicoAuditoria.reverse();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0f2a4a]">Painel de Gerenciamento</h2>
        <p className="text-gray-600">
          Controle de acesso, unidades e registro de auditoria institucional. Toda alteração requer justificativa.
        </p>
      </div>

      {/* O componente visual do cliente onde a interação acontece */}
      <GerenciamentoClient 
        unidades={listaUnidades} 
        usuarios={listaUsuarios} 
        auditoria={historicoAuditoria} 
      />
    </div>
  );
}