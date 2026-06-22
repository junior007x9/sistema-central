"use client";

import { useState } from "react";
import { loginAction } from "./actions";
import Image from "next/image";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(null, formData);

    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Cabeçalho Institucional do Login com a Logo */}
        <div className="text-center flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Logomarca FASE/MA" 
            width={180} 
            height={180} 
            className="mb-2 drop-shadow-md"
            priority
          />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Sistema Central
          </h2>
          <p className="mt-2 text-sm font-semibold text-gray-700">
            FUNDAÇÃO DE ATENDIMENTO SOCIOEDUCATIVO DO MARANHÃO
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Faça login com as suas credenciais para aceder ao painel da sua unidade ou à gestão central.
          </p>
        </div>

        {/* Exibição de Erros */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">E-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm disabled:bg-gray-100"
                placeholder="E-mail institucional"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm disabled:bg-gray-100"
                placeholder="Senha de acesso"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#0f2a4a] hover:bg-[#1a3a6a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2a4a] transition-colors disabled:bg-gray-400"
            >
              {loading ? "A verificar dados..." : "Entrar no Sistema"}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}