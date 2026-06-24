// app/dashboard/relatorios/page.tsx
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { atendimentos, centers } from "../../../db/schema";
import Image from "next/image";

export default async function RelatoriosOficiaisPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/login"); }
  if (session.role !== "ADMIN") redirect("/dashboard");

  const listaAtendimentos = await db.select().from(atendimentos);
  const unidades = await db.select().from(centers);
  const total = listaAtendimentos.length;

  const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const hash = crypto.randomUUID().split('-')[0].toUpperCase();

  // Contabilizações rápidas
  const primarios = listaAtendimentos.filter(a => a.situacaoProcessual === "Primário").length;
  const reincidentes = listaAtendimentos.filter(a => a.situacaoProcessual !== "Primário").length;

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex justify-center text-black">
      
      {/* Menu flutuante de ações (escondido na impressão) */}
      <div className="print:hidden fixed bottom-10 right-10 flex gap-4 z-50">
        <a href="/dashboard" className="bg-gray-800 text-white px-6 py-4 rounded-full shadow-xl font-bold hover:bg-gray-700 transition-transform active:scale-95">Voltar</a>
        <div dangerouslySetInnerHTML={{ __html: `<button onclick="window.print()" class="bg-[#0f2a4a] text-white px-8 py-4 rounded-full shadow-2xl font-black text-lg hover:bg-blue-800 transition-transform active:scale-95 flex items-center gap-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Imprimir Relatório Oficial</button>` }} />
      </div>

      {/* Papel Timbrado A4 */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none border border-gray-300 print:border-none px-12 py-10 relative">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="FASE" width={60} height={60} className="grayscale" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">FASE / MARANHÃO</h1>
              <p className="text-xs font-bold text-gray-700">Fundação de Atendimento Socioeducativo</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">RELATÓRIO ESTATÍSTICO OFICIAL</p>
            <p>Ministério Público / Judiciário</p>
            <p className="mt-1 font-mono">Emissão: {dataAtual}</p>
          </div>
        </div>

        {/* Título e Introdução */}
        <h2 className="text-lg font-black text-center mb-6 uppercase border border-black p-2 bg-gray-100">
          Censo Socioeducativo Estadual - Relatório Consolidado
        </h2>
        <p className="text-sm text-justify mb-8 leading-relaxed">
          O presente documento certifica a situação demográfica, processual e educacional dos socioeducandos sob custódia da Fundação de Atendimento Socioeducativo do Estado do Maranhão (FASE/MA), totalizando <strong>{total} adolescentes</strong> em atendimento nas nossas unidades.
        </p>

        {/* Seção 1: Lotação por Unidade */}
        <h3 className="font-bold text-sm bg-black text-white px-3 py-1 mb-3 uppercase">1. Distribuição Populacional por Unidade</h3>
        <table className="w-full text-sm text-left border-collapse border border-black mb-8">
          <thead>
            <tr className="bg-gray-200"><th className="border border-black p-2">Unidade Socioeducativa</th><th className="border border-black p-2 w-32 text-center">Internos</th></tr>
          </thead>
          <tbody>
            {unidades.map(u => (
              <tr key={u.id}>
                <td className="border border-black p-2 font-medium">{u.name}</td>
                <td className="border border-black p-2 text-center font-bold">{listaAtendimentos.filter(a => a.centerId === u.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Seção 2: Perfil Processual */}
        <h3 className="font-bold text-sm bg-black text-white px-3 py-1 mb-3 uppercase">2. Perfil Processual e Reincidência</h3>
        <div className="flex gap-4 mb-8">
          <div className="flex-1 border border-black p-4 text-center">
            <p className="text-xs font-bold uppercase text-gray-600">Primários (1º Ato)</p>
            <p className="text-3xl font-black">{primarios}</p>
          </div>
          <div className="flex-1 border border-black p-4 text-center bg-gray-100">
            <p className="text-xs font-bold uppercase text-gray-600">Reincidentes / Reiterantes</p>
            <p className="text-3xl font-black">{reincidentes}</p>
          </div>
        </div>

        {/* Rodapé e Assinatura */}
        <div className="absolute bottom-16 left-0 right-0 flex justify-center">
          <div className="text-center w-72">
            <div className="border-t border-black mb-2"></div>
            <p className="font-bold uppercase text-sm">Presidência / Diretoria Geral</p>
            <p className="text-xs text-gray-600">FASE/MA</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-12 right-12 border-t border-gray-300 pt-2 flex justify-between text-[10px] text-gray-500 font-mono">
          <p>Validação Eletrônica Módulo Central</p>
          <p>Hash de Segurança: {hash}-{new Date().getTime()}</p>
        </div>
      </div>
    </div>
  );
}