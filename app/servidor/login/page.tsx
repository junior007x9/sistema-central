"use client";

import { useState } from "react";
import Image from "next/image";
import { loginServidorAction } from "../actions";

export default function ServidorLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginServidorAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
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
            <label className="block text-sm font-bold text-gray-700 mb-1">CPF (Sua Matrícula)</label>
            <input type="text" name="cpf" required placeholder="Apenas números" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha de Acesso</label>
            <input type="password" name="senha" required placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#0f2a4a] text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95 mt-4">
            {loading ? "Autenticando..." : "Entrar no Portal"}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-8 font-medium">
          Dica: Se for o seu primeiro acesso, a senha padrão é <span className="font-bold text-gray-600">fase123</span>
        </p>
      </div>
    </div>
  );
}