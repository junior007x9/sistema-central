import { cookies } from "next/headers";
import { decrypt } from "../../lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";
import Image from "next/image";
import UnitForm from "./UnitForm";
import { db } from "../../db";
import { atendimentos, centers } from "../../db/schema";

export default async function DashboardPage() {
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

  // Variáveis para armazenar os dados caso seja um ADMIN
  let totalAtendimentos = 0;
  const dadosAgrupados = {
    masculino: 0,
    feminino: 0,
    primario: 0,
    reincidente: 0,
    reiterante: 0,
  };
  let unidadesComContagem: { nome: string; quantidade: number }[] = [];

  // Se o usuário for ADMIN, fazemos as buscas no banco de dados
  if (session.role === "ADMIN") {
    const todosAtendimentos = await db.select().from(atendimentos);
    const todasUnidades = await db.select().from(centers);

    totalAtendimentos = todosAtendimentos.length;

    // Calculando totais de gênero e situação processual
    todosAtendimentos.forEach((atendimento) => {
      if (atendimento.genero === "Masculino") dadosAgrupados.masculino++;
      if (atendimento.genero === "Feminino") dadosAgrupados.feminino++;
      
      if (atendimento.situacaoProcessual === "Primário") dadosAgrupados.primario++;
      if (atendimento.situacaoProcessual === "Reincidente") dadosAgrupados.reincidente++;
      if (atendimento.situacaoProcessual === "Reiterante") dadosAgrupados.reiterante++;
    });

    // Agrupando atendimentos por Unidade
    unidadesComContagem = todasUnidades.map((unidade) => {
      const quantidade = todosAtendimentos.filter((a) => a.centerId === unidade.id).length;
      return { nome: unidade.name, quantidade };
    });
  }

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

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          
          {session.role === "ADMIN" ? (
            <div>
              <h2 className="text-2xl font-bold text-[#0f2a4a] mb-2">Painel do Administrador Central</h2>
              <p className="text-gray-600 mb-8 border-b pb-4">
                Visão geral consolidada de todas as unidades socioeducativas do estado.
              </p>

              {/* Grid de Cards Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card Total */}
                <div className="bg-[#0f2a4a] text-white p-6 rounded-xl shadow-md flex flex-col justify-center items-center">
                  <span className="text-sm font-medium uppercase tracking-wider text-blue-200 mb-1">Total de Internos</span>
                  <span className="text-5xl font-extrabold">{totalAtendimentos}</span>
                </div>

                {/* Card Gênero */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Distribuição por Gênero</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-gray-700">Masculino</span>
                      <span className="font-bold text-[#0f2a4a]">{dadosAgrupados.masculino}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-700">Feminino</span>
                      <span className="font-bold text-[#0f2a4a]">{dadosAgrupados.feminino}</span>
                    </div>
                  </div>
                </div>

                {/* Card Processual */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Situação Processual</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-gray-700">Primários</span>
                      <span className="font-bold text-green-600">{dadosAgrupados.primario}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1 pt-1">
                      <span className="text-gray-700">Reincidentes</span>
                      <span className="font-bold text-orange-600">{dadosAgrupados.reincidente}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-700">Reiterantes</span>
                      <span className="font-bold text-red-600">{dadosAgrupados.reiterante}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Unidades */}
              <div>
                <h3 className="text-lg font-bold text-[#0f2a4a] mb-4">Adolescentes por Unidade</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade Socioeducativa</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total de Internos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {unidadesComContagem.map((unidade) => (
                        <tr key={unidade.nome} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unidade.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0f2a4a] text-right">{unidade.quantidade}</td>
                        </tr>
                      ))}
                      {unidadesComContagem.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Nenhuma unidade cadastrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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