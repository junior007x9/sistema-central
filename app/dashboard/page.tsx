import { cookies } from "next/headers";
import { decrypt } from "../../lib/session";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra de Navegação Superior (Atualizada com a marca FASE/MA) */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Sistema Central
          </h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            FASE/MA
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            Perfil: <span className="font-medium">{session.role}</span>
          </span>
          
          <form action={logoutAction}>
            <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          
          {session.role === "ADMIN" ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Painel do Administrador Central</h2>
              <p className="text-gray-600 mb-6">
                Bem-vindo à gestão central da FASE/MA. Aqui você poderá selecionar e visualizar as informações enviadas por todas as unidades socioeducativas.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Painel da Unidade</h2>
              <p className="text-gray-600 mb-6">
                Bem-vindo ao painel da sua unidade socioeducativa. Utilize este espaço para preencher e enviar os dados diários para a central.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}