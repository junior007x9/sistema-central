"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // <- ADICIONADO PARA RESOLVER O REDIRECIONAMENTO
import { autenticarServidorAction } from "./actions";

export default function ServidorLoginPage() {
  const router = useRouter(); // <- INICIADO
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // Modal de Feedback

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const result = await autenticarServidorAction(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      // MAGIA AQUI: O botão sairá de "Autenticando..." e enviará o funcionário para a aba do Servidor!
      router.push("/servidor"); 
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 border border-gray-200">
        <div className="flex flex-col items-center text-center mb-8">
          <Image src="/logo.png" alt="FASE" width={70} height={70} className="mb-4" />
          <h2 className="text-2xl font-black text-[#0f2a4a]">Portal do Colaborador</h2>
          <p className="text-sm text-gray-500 font-medium">Acesso restrito para servidores da FASE/MA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200">{error}</div>}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">CPF ou E-mail Institucional</label>
            <input type="text" name="login" required placeholder="Ex: 123.456.789-00 ou email@fase.ma" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha de Acesso</label>
            <input type="password" name="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#0f2a4a] text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95 mt-4">
            {loading ? "Autenticando..." : "Entrar no Portal"}
          </button>
        </form>
        
        {/* BOTÃO DE SUPORTE E FEEDBACK */}
        <div className="mt-6 border-t border-gray-100 pt-6 text-center">
          <button onClick={() => setShowHelp(!showHelp)} className="text-sm font-bold text-blue-600 hover:underline">
            Problemas de acesso? Ajuda aqui.
          </button>
          
          {showHelp && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 text-left leading-relaxed">
              <p className="font-bold mb-2">Dicas de Acesso:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Se for o seu primeiro acesso, a senha padrão é <b>fase123</b>.</li>
                <li>Pode usar o seu <b>CPF</b> (apenas números) ou o seu <b>E-mail</b> registado no RH.</li>
                <li>Se esqueceu a senha ou o e-mail não estiver a funcionar, contacte o seu Diretor de Unidade ou o RH Central para pedir o <b>Reset de Acesso</b>.</li>
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}