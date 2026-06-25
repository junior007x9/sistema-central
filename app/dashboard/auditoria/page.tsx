// app/dashboard/auditoria/page.tsx
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { auditLogs } from "../../../db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

export default async function AuditoriaPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/login"); }
  
  // Apenas a Diretoria/ADMIN tem acesso à Caixa Preta
  if (session.role !== "ADMIN") redirect("/dashboard");

  // Busca todos os registos ordenados do mais recente para o mais antigo
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col font-sans">
      <header className="bg-black border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-red-900/30 p-2 rounded-lg border border-red-500/30">
            <Image src="/logo.png" alt="FASE" width={40} height={40} className="grayscale brightness-200" />
          </div>
          <div>
            <h1 className="text-xl font-black text-red-500 uppercase tracking-widest">Caixa Preta</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Auditoria e Segurança Jurídica</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors">
          &larr; Voltar
        </Link>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-white">Registo de Atividades Fiscais</h2>
            <p className="text-xs text-gray-400 mt-1">Este registo é imutável e destina-se a fins de auditoria interna e Ministério Público.</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-red-500">{logs.length}</span>
            <span className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Ações Registadas</span>
          </div>
        </div>

        <div className="bg-black rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900/80 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-xs">Data / Hora</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-xs">Módulo (Entidade)</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-xs">Ação Executada</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-xs">Alvo / Detalhe</th>
                  <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-xs">Motivação Gravada (Justificativa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-600 font-medium italic">Nenhuma ação fiscal registada.</td></tr>
                ) : (
                  logs.map((log) => {
                    const data = new Date(log.createdAt);
                    return (
                      <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-300 font-mono font-bold">{data.toLocaleDateString('pt-BR')}</span>
                          <span className="block text-red-400 font-mono text-xs mt-0.5">{data.toLocaleTimeString('pt-BR')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                            {log.entidade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                            log.acao.includes('EDITAR') || log.acao.includes('AJUSTE') ? 'text-amber-500' :
                            log.acao.includes('CRIAR') || log.acao.includes('APROVADO') ? 'text-green-500' :
                            log.acao.includes('REJEITADO') ? 'text-red-500' : 'text-blue-500'
                          }`}>
                            {log.acao}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-200">{log.detalhe}</td>
                        <td className="px-6 py-4 text-gray-400 text-xs italic max-w-xs truncate" title={log.observacao}>
                          &quot;{log.observacao}&quot;
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}