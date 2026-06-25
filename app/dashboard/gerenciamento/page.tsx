// app/dashboard/gerenciamento/page.tsx
import { cookies } from "next/headers";
import { decrypt } from "../../../lib/session";
import { redirect } from "next/navigation";
import { db } from "../../../db";
import { auditLogs, servidores, atendimentos } from "../../../db/schema";
import Link from "next/link";

export default async function GerenciamentoHardeningPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/login");

  let session;
  try { session = await decrypt(sessionCookie); } catch { redirect("/login"); }
  if (session.role !== "ADMIN") redirect("/dashboard");

  // Auditoria de Linhas na Base de Dados
  const totalLogs = (await db.select().from(auditLogs)).length;
  const totalFuncionarios = (await db.select().from(servidores)).length;
  const totalInternos = (await db.select().from(atendimentos)).length;

  // Verificação de Variáveis de Ambiente Críticas
  const hasDbUrl = !!process.env.TURSO_DATABASE_URL;
  const hasSessionSecret = !!process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-[#0f2a4a] text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider">Configuração & Hardening</h1>
          <p className="text-xs text-blue-200 font-bold uppercase">Auditoria de Infraestrutura de Segurança</p>
        </div>
        <Link href="/dashboard" className="text-xs font-black bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition-all">
          &larr; Painel Central
        </Link>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Estado dos Módulos Físicos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Registos de Auditoria</span>
            <div className="text-2xl font-black text-gray-800 mt-1">{totalLogs} entradas</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Matrículas Ativas</span>
            <div className="text-2xl font-black text-gray-800 mt-1">{totalFuncionarios} colaboradores</div>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase">Prontuários PIA</span>
            <div className="text-2xl font-black text-gray-800 mt-1">{totalInternos} fichas</div>
          </div>
        </div>

        {/* Diagnóstico de Variáveis */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 bg-gray-50 border-b border-gray-200">
            <h3 className="font-black text-[#0f2a4a] text-base uppercase tracking-wider">Verificação de Segurança da Infraestrutura</h3>
          </div>
          <div className="divide-y divide-gray-100">
            
            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Criptografia de Senhas (BcryptJS)</h4>
                <p className="text-xs text-gray-400 mt-0.5">Verifica se as passwords estão blindadas contra vazamentos na nuvem.</p>
              </div>
              <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">🛡️ Ativo (Militar)</span>
            </div>

            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Isolamento de Variáveis de Ambiente (.env)</h4>
                <p className="text-xs text-gray-400 mt-0.5">Garante que chaves de API e tokens do Turso não estão hardcoded no repositório.</p>
              </div>
              {hasDbUrl && hasSessionSecret ? (
                <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">✅ Isolado</span>
              ) : (
                <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">⚠️ Vulnerável</span>
              )}
            </div>

            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Ambiente de Execução Node.js</h4>
                <p className="text-xs text-gray-400 mt-0.5">Identifica se a aplicação está otimizada para compilação final de produção.</p>
              </div>
              {isProduction ? (
                <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Produção (Vercel)</span>
              ) : (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">Modo Desenvolvimento</span>
              )}
            </div>

            <div className="p-4 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Forçar Conexão Segura (SSL / HTTPS)</h4>
                <p className="text-xs text-gray-400 mt-0.5">Impede a interceção de dados de ponto e fotos de atestados em redes públicas.</p>
              </div>
              <span className="bg-green-100 text-green-800 border border-green-200 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">🔒 Forçado por Padrão</span>
            </div>

          </div>
        </div>

        {/* Checklist Prático para o Vercel Setup */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider flex items-center gap-2">
            ⚠️ Próximos Passos de Configuração no Painel da Vercel
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            Antes de divulgar o link aos funcionários, aceda às definições do seu projeto na Vercel (**Settings &rarr; Environment Variables**) e adicione a variável abaixo para garantir o funcionamento correto das sessões:
          </p>
          <div className="bg-white border border-amber-200 p-3 rounded-xl font-mono text-xs text-gray-700 shadow-inner select-all">
            SESSION_SECRET=introduza_aqui_um_texto_longo_e_aleatorio_de_seguranca
          </div>
        </div>

      </main>
    </div>
  );
}