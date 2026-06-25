"use client";

import { useState } from "react";
import { enviarAtestadoAction } from "../actions";

export default function AtestadoForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await enviarAtestadoAction(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Atestado enviado com sucesso! O RH já foi notificado." });
      (e.target as HTMLFormElement).reset(); // Limpa o formulário após enviar
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}
      
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Data da Falta / Afastamento</label>
        <input type="date" name="dataFalta" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Motivo (CID ou Justificativa)</label>
        <input type="text" name="motivo" placeholder="Ex: Consulta médica, Atestado de 2 dias..." required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center bg-gray-50">
        <label className="cursor-pointer flex flex-col items-center">
          <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span className="text-sm font-bold text-gray-700">Tirar Foto ou Anexar Arquivo</span>
          <span className="text-xs text-gray-400 mt-1">Formatos suportados: JPG, PNG, PDF</span>
          <input type="file" name="anexo" accept="image/*,application/pdf" required className="mt-4 text-xs w-full" />
        </label>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-[#0f2a4a] text-white font-bold py-3 rounded-lg shadow mt-2 hover:bg-blue-900 active:scale-95 transition-transform disabled:opacity-50">
        {loading ? "Enviando arquivo..." : "Enviar para o RH"}
      </button>
    </form>
  );
}