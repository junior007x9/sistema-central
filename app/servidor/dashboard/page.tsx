import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { pontos, servidores, centers, solicitacoesAbono } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import Image from "next/image";
import { logoutServidorAction } from "../actions";
import AtestadoForm from "./AtestadoForm"; // Importando o nosso novo formulário

export default async function ServidorDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_servidor")?.value;
  if (!sessionCookie) redirect("/servidor/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/servidor/login"); }

  const servidorQuery = await db.select().from(servidores).where(eq(servidores.id, session.id as string));
  const servidor = servidorQuery[0];
  if (!servidor) redirect("/servidor/login");

  const unidadeQuery = await db.select().from(centers).where(eq(centers.id, servidor.centerId));
  const unidade = unidadeQuery[0];

  const meusPontos = await db.select().from(pontos).where(eq(pontos.servidorId, servidor.id));
  meusPontos.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  // NOVO: Busca o histórico de atestados que este servidor já enviou
  const meusAtestados = await db.select().from(solicitacoesAbono).where(eq(solicitacoesAbono.servidorId, servidor.id)).orderBy(desc(solicitacoesAbono.createdAt));

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <header className="bg-[#0f2a4a] text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-full hidden sm:block">
              <Image src="/logo.png" alt="FASE" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide uppercase">Portal do Colaborador</h1>
              <p className="text-blue-200 text-sm font-medium">Olá, {servidor.nome.split(' ')[0]}!</p>
            </div>
          </div>
          <form action={logoutServidorAction}>
            <button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-all">Sair</button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: Dados e Envio de Atestados */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-black text-gray-800">{servidor.nome}</h2>
            <div className="flex flex-col gap-2 mt-3 text-sm font-medium text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded-md border w-fit">CPF: {servidor.cpf}</span>
              <span className="bg-gray-100 px-3 py-1 rounded-md border w-fit">Cargo: {servidor.cargo}</span>
              <span className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-md border w-fit">Lotação: {unidade.name}</span>
            </div>
            
            <a href={`/dashboard/rh/espelho?servidorId=${servidor.id}`} target="_blank" className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-black px-4 py-3 rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Imprimir Meu Espelho
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-lg font-black text-[#0f2a4a]">Enviar Atestado</h3>
            </div>
            <AtestadoForm />
          </div>
        </div>

        {/* COLUNA DIREITA: Tabela de Pontos e Status dos Atestados */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status dos Atestados Enviados */}
          {meusAtestados.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-black text-[#0f2a4a]">Meus Atestados e Solicitações</h3>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3">
                {meusAtestados.map(atestado => (
                  <div key={atestado.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-gray-800">Falta: {new Date(atestado.dataFalta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                      <p className="text-xs text-gray-500">{atestado.motivo}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${atestado.status === 'APROVADO' ? 'bg-green-100 text-green-700' : atestado.status === 'REJEITADO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {atestado.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de Frequência */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-black text-[#0f2a4a]">Histórico de Frequência (Totem)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider">Data / Hora</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider">Evento</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider">Status RH</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {meusPontos.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 font-bold">Nenhuma marcação no histórico.</td></tr>
                  ) : (
                    meusPontos.map((p) => {
                      const data = new Date(p.dataHora);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono font-bold text-gray-800">
                            {data.toLocaleDateString('pt-BR')} <span className="text-blue-600">{data.toLocaleTimeString('pt-BR')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${p.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.statusPonto === 'NORMAL' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                              {p.statusPonto}
                            </span>
                            {p.justificativaRH && <div className="text-[10px] text-amber-600 mt-1 uppercase italic">{p.justificativaRH}</div>}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}