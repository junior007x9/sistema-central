import { cookies } from "next/headers";
import { decrypt } from "../../lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";
import Image from "next/image";
import UnitForm from "./UnitForm";
import UnitSelector from "./UnitSelector";
import { db } from "../../db";
import { atendimentos, centers } from "../../db/schema";

interface PageProps {
  searchParams: Promise<{ centerId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  let session;
  try {
    session = await decrypt(sessionCookie);
  } catch (error) {
    redirect("/login");
  }

  // Lendo os parâmetros de filtro da URL de forma assíncrona (Padrão Next.js 15+)
  const { centerId } = await searchParams;

  // Estrutura completa dos contadores estatísticos dos 6 tópicos obrigatórios
  const estatisticas = {
    total: 0,
    genero: { Masculino: 0, Feminino: 0, Outros: 0 },
    racaCor: { Branca: 0, Preta: 0, Parda: 0, Amarela: 0, Indígena: 0, "Não Informado": 0 },
    faixaEtaria: { "12 a 13 anos": 0, "14 a 15 anos": 0, "16 a 17 anos": 0, "18 a 21 anos": 0 },
    situacao: { Primário: 0, Reincidente: 0, Reiterante: 0 },
    religiao: { Católica: 0, Evangélica: 0, "Matriz Africana": 0, "Sem Religião": 0, Outras: 0 },
    orientacao: { Heterossexual: 0, Homossexual: 0, Bissexual: 0, Outros: 0, "Não Informado": 0 }
  };

  let todasUnidades: { id: string; name: string }[] = [];
  let tabelaUnidades: { nome: string; quantidade: number }[] = [];
  let nomeUnidadeSelecionada = "Consolidado Geral (Todo o Estado)";

  if (session.role === "ADMIN") {
    todasUnidades = await db.select().from(centers);
    
    // Busca os atendimentos aplicando o filtro caso um centro tenha sido selecionado no dropdown
    const queryAtendimentos = db.select().from(atendimentos);
    if (centerId) {
      const unidadeFiltrada = todasUnidades.find(u => u.id === centerId);
      if (unidadeFiltrada) nomeUnidadeSelecionada = unidadeFiltrada.name;
    }

    const listaAtendimentos = await queryAtendimentos;
    const atendimentosFiltrados = centerId 
      ? listaAtendimentos.filter(a => a.centerId === centerId)
      : listaAtendimentos;

    estatisticas.total = atendimentosFiltrados.length;

    // Faz a varredura e contabilização automática de cada ficha cadastrada pelas unidades
    atendimentosFiltrados.forEach((a) => {
      if (a.genero in estatisticas.genero) estatisticas.genero[a.genero as keyof typeof estatisticas.genero]++;
      if (a.racaCor in estatisticas.racaCor) estatisticas.racaCor[a.racaCor as keyof typeof estatisticas.racaCor]++;
      if (a.faixaEtaria in estatisticas.faixaEtaria) estatisticas.faixaEtaria[a.faixaEtaria as keyof typeof estatisticas.faixaEtaria]++;
      if (a.situacaoProcessual in estatisticas.situacao) estatisticas.situacao[a.situacaoProcessual as keyof typeof estatisticas.situacao]++;
      if (a.religiao in estatisticas.religiao) estatisticas.religiao[a.religiao as keyof typeof estatisticas.religiao]++;
      if (a.orientacaoSexual in estatisticas.orientacao) estatisticas.orientacao[a.orientacaoSexual as keyof typeof estatisticas.orientacao]++;
    });

    // Monta a listagem lateral de centros com a quantidade de internos de cada um
    tabelaUnidades = todasUnidades.map((u) => ({
      nome: u.name,
      quantidade: listaAtendimentos.filter((a) => a.centerId === u.id).length
    }));
  }

  // Helper simples para desenhar barras estatísticas horizontais com Tailwind
  const ProgressBar = ({ label, valor, total }: { label: string; valor: number; total: number }) => {
    const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-gray-700">
          <span>{label}</span>
          <span>{valor} ({porcentagem}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-[#0f2a4a] h-2 rounded-full transition-all duration-500" style={{ width: `${porcentagem}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra de Navegação Superior */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Logo FASE" width={50} height={50} className="drop-shadow-sm" />
          <div>
            <h1 className="text-xl font-bold text-[#0f2a4a]">Sistema Central</h1>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">FASE / MA</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-inner">
            Perfil: <span className="font-medium">{session.role}</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors">Sair</button>
          </form>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          
          {session.role === "ADMIN" ? (
            <div>
              <div className="border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#0f2a4a]">Painel do Administrador Central</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Exibindo dados de: <span className="font-bold text-[#1a3a6a]">{nomeUnidadeSelecionada}</span>
                </p>
              </div>

              {/* Filtro Dropdown */}
              <UnitSelector units={todasUnidades} />

              {/* Layout em Grid: Estatísticas à esquerda, Lista de Centros à direita */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Coluna de Indicadores Estatísticos (Ocupa 2 blocos) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Card de Destaque Numérico */}
                  <div className="bg-[#0f2a4a] text-white p-6 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium uppercase tracking-wider text-blue-200">Adolescentes Atendidos</h3>
                      <p className="text-xs text-blue-100 mt-0.5">Filtrado com base na seleção atual</p>
                    </div>
                    <span className="text-5xl font-extrabold tracking-tight">{estatisticas.total}</span>
                  </div>

                  {/* Grid de Blocos Temáticos dos 6 Indicadores Obrigatórios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Bloco 1: Gênero */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Gênero</h4>
                      {Object.entries(estatisticas.genero).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                    {/* Bloco 2: Situação Processual */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Situação Processual</h4>
                      {Object.entries(estatisticas.situacao).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                    {/* Bloco 3: Faixa Etária */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Faixa Etária</h4>
                      {Object.entries(estatisticas.faixaEtaria).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                    {/* Bloco 4: Raça / Cor */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Raça / Cor</h4>
                      {Object.entries(estatisticas.racaCor).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                    {/* Bloco 5: Religião */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Religião</h4>
                      {Object.entries(estatisticas.religiao).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                    {/* Bloco 6: Orientação Sexual */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3">
                      <h4 className="text-sm font-bold text-[#0f2a4a] uppercase border-b pb-1.5">Orientação Sexual</h4>
                      {Object.entries(estatisticas.orientacao).map(([k, v]) => (
                        <ProgressBar key={k} label={k} valor={v} total={estatisticas.total} />
                      ))}
                    </div>

                  </div>
                </div>

                {/* Coluna da Direita: Lista de Unidades e seus Totais Fixos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#0f2a4a]">Internos por Unidade</h3>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                    {tabelaUnidades.map((u) => (
                      <div key={u.nome} className="px-4 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <span className="text-sm font-medium text-gray-900 pr-2">{u.nome}</span>
                        <span className="text-sm font-bold text-[#0f2a4a] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md shadow-inner">
                          {u.quantidade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#0f2a4a] mb-2">Painel de Indicadores da Unidade</h2>
              <p className="text-gray-600 mb-8 border-b pb-4">
                Registre os dados abaixo referentes ao cadastro individual do adolescente na sua unidade.
              </p>
              <UnitForm />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}