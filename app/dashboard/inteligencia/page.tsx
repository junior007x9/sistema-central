import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { atendimentos } from "../../../db/schema";
import Link from "next/link";
import Image from "next/image";

export default async function InteligenciaPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) redirect("/login");

  let session;
  try {
    session = await decrypt(sessionCookie);
  } catch (error) {
    redirect("/login");
  }

  // Apenas ADMIN tem acesso à Inteligência Estratégica
  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Buscar todos os atendimentos para processamento massivo de dados
  const listaAtendimentos = await db.select().from(atendimentos);
  const total = listaAtendimentos.length;

  // 1. Agrupamento Geográfico: Município de Ocorrência
  const ocorrencias = listaAtendimentos.reduce((acc: any, curr) => {
    acc[curr.municipioOcorrencia] = (acc[curr.municipioOcorrencia] || 0) + 1;
    return acc;
  }, {});
  const rankingOcorrencias = Object.entries(ocorrencias)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5); // Top 5

  // 2. Agrupamento Geográfico: Município de Moradia
  const moradias = listaAtendimentos.reduce((acc: any, curr) => {
    acc[curr.municipioMoradia] = (acc[curr.municipioMoradia] || 0) + 1;
    return acc;
  }, {});
  const rankingMoradias = Object.entries(moradias)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5); // Top 5

  // 3. Termômetro de Situação Processual (Reincidência)
  const primarios = listaAtendimentos.filter(a => a.situacaoProcessual === "Primário").length;
  const reincidentes = listaAtendimentos.filter(a => a.situacaoProcessual === "Reincidente").length;
  const reiterantes = listaAtendimentos.filter(a => a.situacaoProcessual === "Reiterante").length;
  
  const taxaReincidencia = total > 0 ? Math.round(((reincidentes + reiterantes) / total) * 100) : 0;

  // 4. Mapeamento de Risco (Evasão Escolar Crítica)
  const faccoes = listaAtendimentos.filter(a => a.motivoNaoFrequenta === "Ameaça de facções").length;
  const drogas = listaAtendimentos.filter(a => a.motivoNaoFrequenta === "Uso de substâncias").length;
  const infracao = listaAtendimentos.filter(a => a.motivoNaoFrequenta === "Envolvimento na prática infracional").length;

  return (
    <div className="min-h-screen bg-[#0a1128] text-gray-100 flex flex-col font-sans selection:bg-purple-500/30">
      
      {/* Cabeçalho Estratégico (Dark Theme) */}
      <header className="bg-[#050814] border-b border-gray-800 px-8 py-5 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-2 rounded-lg">
            <Image src="/logo.png" alt="FASE" width={40} height={40} className="drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest">Inteligência de Dados</h1>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Painel Estratégico FASE/MA</p>
          </div>
        </div>
        <Link href="/dashboard" className="text-sm font-bold text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-lg border border-white/10">
          &larr; Voltar ao Dashboard
        </Link>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Linha 1: Métricas Críticas (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-6 rounded-2xl border border-blue-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg></div>
            <h3 className="text-blue-300 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Volume de Dados Processados</h3>
            <div className="text-5xl font-black text-white relative z-10">{total}</div>
            <p className="text-xs text-blue-200 mt-2 font-medium relative z-10">Prontuários analisados em tempo real</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-950 p-6 rounded-2xl border border-purple-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg></div>
            <h3 className="text-purple-300 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Índice de Reincidência Global</h3>
            <div className="text-5xl font-black text-white relative z-10">{taxaReincidencia}%</div>
            <p className="text-xs text-purple-200 mt-2 font-medium relative z-10">Jovens com passagem anterior no sistema</p>
          </div>

          <div className="bg-gradient-to-br from-red-900 to-red-950 p-6 rounded-2xl border border-red-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20"><svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
            <h3 className="text-red-300 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Alerta: Impacto de Facções na Educação</h3>
            <div className="text-5xl font-black text-white relative z-10">{faccoes}</div>
            <p className="text-xs text-red-200 mt-2 font-medium relative z-10">Jovens fora da escola devido a ameaças diretas</p>
          </div>
        </div>

        {/* Linha 2: Mapeamento Geográfico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-[#111936] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-1">Zonas Críticas de Ocorrência</h3>
            <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">Top 5 Municípios de Apreensão</p>
            <div className="space-y-4">
              {rankingOcorrencias.length === 0 ? <p className="text-sm text-gray-500">Sem dados suficientes.</p> : rankingOcorrencias.map(([cidade, qtd]: any, index) => (
                <div key={cidade} className="relative">
                  <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
                    <span>{index + 1}. {cidade}</span>
                    <span className="text-white bg-blue-600/30 px-2 py-0.5 rounded border border-blue-500/50">{qtd} casos</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.round((qtd / total) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111936] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-1">Origem Populacional (Moradia)</h3>
            <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">Top 5 Municípios de Residência Originais</p>
            <div className="space-y-4">
              {rankingMoradias.length === 0 ? <p className="text-sm text-gray-500">Sem dados suficientes.</p> : rankingMoradias.map(([cidade, qtd]: any, index) => (
                <div key={cidade} className="relative">
                  <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
                    <span>{index + 1}. {cidade}</span>
                    <span className="text-white bg-purple-600/30 px-2 py-0.5 rounded border border-purple-500/50">{qtd} jovens</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.round((qtd / total) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linha 3: Análise Sociológica Profunda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Gráfico de Situação Processual */}
          <div className="bg-[#111936] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
            <h3 className="text-lg font-black text-white mb-1">Termômetro de Situação Processual</h3>
            <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">Proporção Primários vs. Sistema Rotativo</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 text-right text-xs font-bold text-gray-400 uppercase">Primário</div>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${total > 0 ? (primarios / total) * 100 : 0}%` }}></div>
                </div>
                <div className="w-12 text-left text-sm font-black text-white">{primarios}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right text-xs font-bold text-gray-400 uppercase">Reincid.</div>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${total > 0 ? (reincidentes / total) * 100 : 0}%` }}></div>
                </div>
                <div className="w-12 text-left text-sm font-black text-white">{reincidentes}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-right text-xs font-bold text-gray-400 uppercase">Reiter.</div>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: `${total > 0 ? (reiterantes / total) * 100 : 0}%` }}></div>
                </div>
                <div className="w-12 text-left text-sm font-black text-white">{reiterantes}</div>
              </div>
            </div>
          </div>

          {/* Gráfico de Motivação de Evasão */}
          <div className="bg-[#111936] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-white mb-1">Fatores Críticos de Evasão Escolar</h3>
            <p className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">Causas Sociais Afastando Jovens da Sala de Aula</p>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/20 p-2 rounded-lg"><span className="text-red-400 font-bold text-xl">⚠️</span></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ameaça de Facções</h4>
                    <p className="text-[10px] text-gray-400 uppercase">Conflito territorial</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{faccoes}</div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 p-2 rounded-lg"><span className="text-amber-400 font-bold text-xl">💊</span></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Uso de Substâncias</h4>
                    <p className="text-[10px] text-gray-400 uppercase">Dependência química</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{drogas}</div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/20 p-2 rounded-lg"><span className="text-purple-400 font-bold text-xl">🔗</span></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Envolvimento Infracional</h4>
                    <p className="text-[10px] text-gray-400 uppercase">Tráfico / Infrações</p>
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{infracao}</div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}