// app/dashboard/pia/page.tsx
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { atendimentos, evolucoesPia, centers } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

export default async function PiaDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/login"); }
  
  // Limita a visão: A Unidade só vê os seus adolescentes. O Admin vê todos.
  const listaAdolescentes = session.role === "UNIT" 
    ? await db.select().from(atendimentos).where(eq(atendimentos.centerId, session.centerId as string))
    : await db.select().from(atendimentos);

  const unidades = await db.select().from(centers);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="FASE" width={40} height={40} />
          <div>
            <h1 className="text-xl font-bold text-[#0f2a4a]">Gestão de PIA</h1>
            <p className="text-xs text-gray-500 font-bold uppercase">Plano Individual de Atendimento</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-[#0f2a4a] hover:underline">&larr; Voltar</Link>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-black text-[#0f2a4a] text-lg">Prontuários Ativos</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{listaAdolescentes.length} Adolescentes</span>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase">Gênero / Raça</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase">Idade / Situação</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase">Município (Ocorrência)</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase">Lotação</th>
                <th className="px-6 py-4 text-right font-bold text-gray-500 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listaAdolescentes.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum adolescente cadastrado.</td></tr>
              ) : (
                listaAdolescentes.map(a => {
                  const nomeUnidade = unidades.find(u => u.id === a.centerId)?.name || 'Desconhecida';
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-800">{a.genero} <span className="text-gray-400 font-normal">| {a.racaCor}</span></td>
                      <td className="px-6 py-4"><span className="bg-gray-100 border px-2 py-1 rounded text-xs font-medium mr-2">{a.faixaEtaria}</span> {a.situacaoProcessual}</td>
                      <td className="px-6 py-4 font-medium">{a.municipioOcorrencia}</td>
                      <td className="px-6 py-4 text-xs font-bold text-[#0f2a4a]">{nomeUnidade}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                          Ver Evoluções
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}