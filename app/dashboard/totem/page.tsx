"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registrarPontoAction } from "./actions";

// Em um ambiente real, pegaríamos o centerId via Server Component, 
// mas para o totem funcionar isolado e rápido no tablet, podemos passar isso via URL ou Sessão.
// Aqui vamos desenhar a interface bloqueada:

export default function TotemPage() {
  const router = useRouter();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "success" | "error", texto: string } | null>(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handlePonto(tipo: "ENTRADA" | "SAIDA") {
    setLoading(true);
    setFeedback(null);
    
    // Simulação temporária do ID da unidade (isso virá da sessão logada da Unidade)
    // No próximo passo vamos conectar a unidade real aqui.
    const fakeCenterId = "temporario"; 

    const result = await registrarPontoAction(cpf, tipo, fakeCenterId);

    if (result.error) {
      setFeedback({ tipo: "error", texto: result.error });
    } else if (result.success) {
      setFeedback({ tipo: "success", texto: `${result.servidorNome}: ${result.mensagem}` });
      setCpf(""); // Limpa o campo para o próximo funcionário
    }

    setLoading(false);
    
    // Oculta a mensagem depois de 5 segundos
    setTimeout(() => setFeedback(null), 5000);
  }

  return (
    <div className="min-h-screen bg-[#0f2a4a] flex flex-col items-center justify-center p-4 relative selection:bg-transparent">
      
      {/* Botão de Saída Segura (Oculto/Pequeno para os funcionários não clicarem) */}
      <button 
        onClick={() => router.push("/dashboard")}
        className="absolute top-6 right-6 text-white/30 hover:text-white/80 text-sm font-bold transition-colors"
      >
        Sair do Modo Totem &times;
      </button>

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-10 text-center">
        
        <Image src="/logo.png" alt="Logo FASE" width={100} height={100} className="mb-6 drop-shadow-md" />
        
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-1">Ponto Eletrônico</h1>
        <p className="text-gray-500 text-sm font-medium mb-8">Fundação de Atendimento Socioeducativo do Maranhão</p>

        {/* Relógio Digital Gigante */}
        <div className="bg-gray-50 border border-gray-200 w-full py-6 rounded-2xl mb-8 shadow-inner">
          <div className="text-6xl font-black text-[#0f2a4a] tabular-nums tracking-tight">
            {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-gray-500 font-semibold mt-2 uppercase text-sm tracking-wider">
            {horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Input de CPF (Simulando a Biometria/Teclado) */}
        <div className="w-full mb-8">
          <label className="block text-left text-sm font-bold text-gray-700 mb-2">Digite seu CPF ou aproxime a Biometria</label>
          <input 
            type="text" 
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Apenas números..."
            className="w-full px-4 py-4 text-center text-2xl tracking-widest font-bold bg-white text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            autoFocus
          />
        </div>

        {/* Feedback Visual (Sucesso ou Erro) */}
        {feedback && (
          <div className={`w-full p-4 mb-6 rounded-xl font-bold text-sm animate-pulse shadow-sm ${feedback.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
            {feedback.texto}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button 
            onClick={() => handlePonto("ENTRADA")}
            disabled={loading || !cpf}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            REGISTRAR ENTRADA
          </button>
          
          <button 
            onClick={() => handlePonto("SAIDA")}
            disabled={loading || !cpf}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            REGISTRAR SAÍDA
          </button>
        </div>

      </div>
      
      <p className="text-white/50 text-xs mt-8 font-medium tracking-wide text-center max-w-md">
        O registo de ponto é pessoal e intransmissível. O uso indevido constitui infração grave.
      </p>
    </div>
  );
}