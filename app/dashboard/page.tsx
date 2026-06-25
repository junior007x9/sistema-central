import { cookies } from "next/headers";
import { decrypt } from "../../lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";
import Image from "next/image";
import UnitForm from "./UnitForm";
import UnitSelector from "./UnitSelector";
import { db } from "../../db";
import { atendimentos, centers, solicitacoesAbono } from "../../db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  searchParams: Promise<{ centerId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/login"); }

  const { centerId } = await searchParams;

  // Lógica de Notificações Inteligentes
  const atestadosPendentes = await db.select().from(solicitacoesAbono).where(eq(solicitacoesAbono.status, 'PENDENTE'));
  const totalPendenciasRH = session.role === "ADMIN" ? atestadosPendentes.length : 0;

  const estatisticas = {
    total: 0,
    genero: { Masculino: 0, Feminino: 0, Outros: 0 },
    racaCor: { Branca: 0, Preta: 0, Parda: 0, Amarela: 0, Indígena: 0, "Não Informado": 0 },
    faixaEtaria: { "12 a 13 anos": 0, "14 a 15 anos": 0, "16 a 17 anos": 0, "18 a 21 anos": 0 },
    situacao: { Primário: 0, Reincidente: 0, Reiterante: 0 },
    religiao: { Católica: 0, Evangélica: 0, "Matriz Africana": 0, "Sem Religião": 0, Outras: 0 },
    orientacao: { Heterossexual: 0, Homossexual: 0, Bissexual: 0, Outros: 0, "Não Informado": 0 },
    ultimoAno: { "6º E.F": 0, "7º E.F": 0, "8º E.F": 0, "9º E.F": 0, "1ª E.M": 0, "2ª E.M": 0, "3ª E.M": 0, "EJA E.F": 0, "EJA E.M": 0, "Não Informado": 0, Outros: 0 },
    sitEscolar: { "Está matriculado e frequentando": 0, "Está matriculado e não frequentando": 0, "Não está matriculado": 0, "Nunca foi matriculado": 0, "Sem informação": 0 },
    motivoEscola: { "Não se aplica (Frequenta a escola)": 0, "Envolvimento na prática infracional": 0, "Falta de interesse": 0, "Desacompanhamento familiar": 0, "Desestímulo escolar": 0, "Uso de substâncias": 0, Trabalho: 0, "Mudança de estado/município": 0, "Ameaça de facções": 0, "Sem informação": 0, Outros: 0 }
  };

  let todasUnidades: { id: string; name: string }[] = [];
  let tabelaUnidades: { nome: string; quantidade: number }[] = [];
  let nomeUnidadeSelecionada = "Consolidado Geral (Todo o Estado)";

  if (session.role === "ADMIN") {
    todasUnidades = await db.select().from(centers);
    const queryAtendimentos = db.select().from(atendimentos);
    if (centerId) {
      const unidadeFiltrada = todasUnidades.find(u => u.id === centerId);
      if (unidadeFiltrada) nomeUnidadeSelecionada = unidadeFiltrada.name;
    }
    const listaAtendimentos = await queryAtendimentos;
    const atendimentosFiltrados = centerId ? listaAtendimentos.filter(a => a.centerId === centerId) : listaAtendimentos;
    estatisticas.total = atendimentosFiltrados.length;

    atendimentosFiltrados.forEach((a) => {
      if (a.genero in estatisticas.genero) estatisticas.genero[a.genero as keyof typeof estatisticas.genero]++;
      if (a.racaCor in estatisticas.racaCor) estatisticas.racaCor[a.racaCor as keyof typeof estatisticas.racaCor]++;
      if (a.faixaEtaria in estatisticas.faixaEtaria) estatisticas.faixaEtaria[a.faixaEtaria as keyof typeof estatisticas.faixaEtaria]++;
      if (a.situacaoProcessual in estatisticas.situacao) estatisticas.situacao[a.situacaoProcessual as keyof typeof estatisticas.situacao]++;
      if (a.religiao in estatisticas.religiao) estatisticas.religiao[a.religiao as keyof typeof estatisticas.religiao]++;
      if (a.orientacaoSexual in estatisticas.orientacao) estatisticas.orientacao[a.orientacaoSexual as keyof typeof estatisticas.orientacao]++;
      if (a.ultimoAnoEscolar in estatisticas.ultimoAno) estatisticas.ultimoAno[a.ultimoAnoEscolar as keyof typeof estatisticas.ultimoAno]++;
      if (a.situacaoEscolar in estatisticas.sitEscolar) estatisticas.sitEscolar[a.situacaoEscolar as keyof typeof estatisticas.sitEscolar]++;
      if (a.motivoNaoFrequenta in estatisticas.motivoEscola) estatisticas.motivoEscola[a.motivoNaoFrequenta as keyof typeof estatisticas.motivoEscola]++;
    });
    tabelaUnidades = todasUnidades.map((u) => ({ nome: u.name, quantidade: listaAtendimentos.filter((a) => a.centerId === u.id).length }));
  }

  const ProgressBar = ({ label, valor, total }: { label: string; valor: number; total: number }) => {
    const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-gray-700"><span>{label}</span><span>{valor} ({porcentagem}%)</span></div>
        <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-[#0f2a4a] h-2 rounded-full transition-all duration-500" style={{ width: `${porcentagem}%` }}></div></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Logo FASE" width={50} height={50} className="drop-shadow-sm" />
          <div>
            <h1 className="text-xl font-bold text-[#0f2a4a]">Sistema Central</h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">FASE / MA</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          {/* SINO DE NOTIFICAÇÕES INTELIGENTE */}
          <div className="relative group cursor-pointer mr-2 flex items-center justify-center">
            <div className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors border border-gray-200">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              {totalPendenciasRH > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white animate-pulse">
                  {totalPendenciasRH}
                </span>
              )}
            </div>
            {/* Pop-up do Sino */}
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 hidden group-hover:block z-50 overflow-hidden">
              <div className="bg-[#0f2a4a] text-white p-3 font-bold text-sm">Central de Alertas</div>
              <div className="p-2 space-y-1">
                {totalPendenciasRH > 0 ? (
                  <a href="/dashboard/rh" className="block p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest block mb-1">Ação Requerida (RH)</span>
                    <span className="text-sm font-bold text-gray-800">Você tem {totalPendenciasRH} atestado(s) médico(s) pendente(s) de aprovação.</span>
                  </a>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">Nenhum alerta pendente.</div>
                )}
                {session.role === "UNIT" && (
                  <div className="p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                    <span className="text-blue-500 font-bold text-xs uppercase tracking-widest block mb-1">Lembrete PIA</span>
                    <span className="text-sm font-medium text-gray-600">Lembre-se de atualizar o prontuário dos adolescentes periodicamente.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <a href="/dashboard/pia" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm">Módulo PIA</a>
          
          {session.role === "UNIT" && (
            <a href="/dashboard/totem" className="text-sm font-bold text-[#0f2a4a] bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Abrir Totem
            </a>
          )}
          
          {session.role === "ADMIN" && (
            <>
              {/* BOTÃO DA CAIXA PRETA / AUDITORIA */}
              <a href="/dashboard/auditoria" className="text-sm font-bold text-white bg-black hover:bg-gray-800 px-4 py-1.5 rounded-lg transition-colors shadow-md border border-gray-700">
                Auditoria
              </a>
              <a href="/dashboard/relatorios" className="text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Relatórios
              </a>
              <a href="/dashboard/inteligencia" className="text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Inteligência
              </a>
              <a href="/dashboard/rh" className="text-sm font-bold text-white bg-green-700 hover:bg-green-800 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Gestão RH
              </a>
              <a href="/dashboard/gerenciamento" className="text-sm font-bold text-white bg-[#0f2a4a] hover:bg-[#1a3a6a] px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                Gerenciar
              </a>
            </>
          )}

          <form action={logoutAction}>
            <button type="submit" className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors ml-1 border-l pl-3 ml-2 border-gray-300">Sair</button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          
          {session.role === "ADMIN" ? (
            <div>
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#0f2a4a]">Painel do Administrador Central</h2>
                <p className="text-sm text-gray-500 mt-1">Exibindo dados de: <span className="font-bold text-[#1a3a6a]">{nomeUnidadeSelecionada}</span></p>
              </div>

              <UnitSelector units={todasUnidades} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#0f2a4a] text-white p-6 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-wider text-blue-200">Adolescentes Atendidos</h3>
                      <p className="text-xs text-blue-100 mt-0.5">Filtrado com base na seleção atual</p>
                    </div>
                    <span className="text-5xl font-extrabold tracking-tight">{estatisticas.total}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Gênero</h4>{Object.entries(estatisticas.genero).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Situação Processual</h4>{Object.entries(estatisticas.situacao).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Faixa Etária</h4>{Object.entries(estatisticas.faixaEtaria).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Raça / Cor</h4>{Object.entries(estatisticas.racaCor).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Religião</h4>{Object.entries(estatisticas.religiao).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Orientação Sexual</h4>{Object.entries(estatisticas.orientacao).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Último Ano Escolar</h4>{Object.entries(estatisticas.ultimoAno).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Situação Escolar</h4>{Object.entries(estatisticas.sitEscolar).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3 col-span-1 md:col-span-2"><h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Motivo de Não Frequência Escolar</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">{Object.entries(estatisticas.motivoEscola).map(([k, v]) => <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />)}</div></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#0f2a4a]">Internos por Unidade</h3>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                    {tabelaUnidades.map((u) => (
                      <div key={u.nome} className="px-4 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <span className="text-sm font-medium text-gray-900 pr-2">{u.nome}</span>
                        <span className="text-sm font-bold text-[#0f2a4a] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md shadow-inner">{u.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#0f2a4a] mb-2">Painel de Indicadores da Unidade</h2>
              <p className="text-gray-600 mb-8 border-b pb-4">Registre os dados abaixo referentes ao cadastro individual do adolescente na sua unidade.</p>
              <UnitForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}