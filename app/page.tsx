import { cookies } from "next/headers";
import { decrypt } from "../lib/session";
import Link from "next/link";
import Image from "next/image";

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const session = await decrypt(sessionCookie);
      if (session) {
        isAuthenticated = true;
      }
    } catch (error) {
      isAuthenticated = false;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2a4a] via-[#15355a] to-[#08182b] flex flex-col justify-between p-6 text-white relative overflow-hidden">
      
      {/* Elementos Visuais de Fundo (Grafismo de Segurança) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
      </div>

      {/* Cabeçalho Institucional */}
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center z-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-md">
            <Image src="/logo.png" alt="Logo FASE/MA" width={45} height={45} className="object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wider uppercase">FASE / MA</h2>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Governo do Maranhão</p>
          </div>
        </div>
        <div className="text-xs font-mono text-white/40 font-bold tracking-widest">
          v2.1.0 - REP-P COMPLIANT
        </div>
      </header>

      {/* Bloco Central - Apresentação do Ecossistema */}
      <main className="w-full max-w-5xl mx-auto flex flex-col items-center text-center my-auto z-10 space-y-8 py-12">
        <div className="space-y-3 max-w-2xl">
          <span className="px-4 py-1.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest animate-pulse">
            Plataforma Unificada de Governança
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Sistema Integrado de Gestão Socioeducativa e RH
          </h1>
          <p className="text-gray-300 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Controle biométrico de assiduidade homologado à Portaria 671 MTE e prontuário estatístico centralizado das unidades de internação.
          </p>
        </div>

        {/* Cards de Recursos do Sistema */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left backdrop-blur-sm shadow-sm hover:bg-white/10 transition-colors">
            <div className="text-blue-400 font-bold text-sm mb-1 uppercase tracking-wide">01. Prontuário</div>
            <p className="text-xs text-gray-300 leading-relaxed">Mapeamento censitário de escolarização, gênero, raça e situação processual.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left backdrop-blur-sm shadow-sm hover:bg-white/10 transition-colors">
            <div className="text-green-400 font-bold text-sm mb-1 uppercase tracking-wide">02. Ponto REP-P</div>
            <p className="text-xs text-gray-300 leading-relaxed">Registro eletrônico em nuvem com arquitetura de contingência offline em lote.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-left backdrop-blur-sm shadow-sm hover:bg-white/10 transition-colors">
            <div className="text-amber-400 font-bold text-sm mb-1 uppercase tracking-wide">03. Auditoria</div>
            <p className="text-xs text-gray-300 leading-relaxed">Log imutável de governança com justificativa obrigatória para segurança jurídica.</p>
          </div>
        </div>

        {/* NOVOS BOTÕES DE ACESSO DIRETO */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pt-6">
          
          <Link href="/servidor/login" className="w-full sm:w-auto bg-white hover:bg-gray-100 text-[#0f2a4a] px-8 py-4 rounded-xl font-black transition-transform active:scale-95 shadow-xl flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Portal do Servidor
          </Link>
          
          <Link href="/dashboard/totem" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 px-8 py-4 rounded-xl font-black transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Modo Totem (Tablet)
          </Link>

          {isAuthenticated ? (
            <Link href="/dashboard" className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-black transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
              Painel Central
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-black transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Acesso Gestores
            </Link>
          )}

        </div>
      </main>

      {/* Rodapé e Declaração de Conformidade */}
      <footer className="w-full max-w-5xl mx-auto border-t border-white/10 pt-4 pb-2 flex flex-col md:flex-row justify-between items-center gap-4 z-10 text-xs text-gray-400 font-medium">
        <p>&copy; {new Date().getFullYear()} FASE/MA. Todos os direitos reservados.</p>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2.5 py-0.5 border border-green-500/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            Criptografia de Dados Ativa
          </span>
          <p>Fundação de Atendimento Socioeducativo do Maranhão</p>
        </div>
      </footer>

    </div>
  );
}