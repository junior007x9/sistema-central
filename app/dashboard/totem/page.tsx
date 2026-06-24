"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registrarPontoAction, sincronizarPontosOfflineAction } from "./actions";

export default function TotemPage() {
  const router = useRouter();
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "success" | "error" | "warning", texto: string } | null>(null);
  
  // Estados para o Modo Offline
  const [isOnline, setIsOnline] = useState(true);
  const [pendentesOffline, setPendentesOffline] = useState(0);

  // O ID da unidade simulado (em produção isso virá da sessão logada)
  const CURRENT_CENTER_ID = "temporario"; // Pode trocar para o ID real do banco se desejar testar com a unidade verdadeira.

  useEffect(() => {
    // 1. Relógio rodando a cada segundo
    const timer = setInterval(() => setHoraAtual(new Date()), 1000);
    
    // 2. Verificação do status de conexão da internet
    setIsOnline(navigator.onLine);
    
    function handleOnline() {
      setIsOnline(true);
      sincronizarDados();
    }
    
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    // 3. Atualizar contador de pendentes ao carregar a tela
    atualizarContadorPendentes();

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Conta quantos registros existem salvos na memória do tablet
  function atualizarContadorPendentes() {
    const salvos = JSON.parse(localStorage.getItem("pontos_offline_fase") || "[]");
    setPendentesOffline(salvos.length);
  }

  // Motor Principal: Decidir se salva na nuvem ou no tablet
  async function handlePonto(tipo: "ENTRADA" | "SAIDA") {
    setLoading(true);
    setFeedback(null);
    
    const dataHoraExata = new Date().toISOString(); // Congela o tempo exato do clique
    
    if (isOnline) {
      // TENTA SALVAR NA NUVEM DIRETO
      try {
        const result = await registrarPontoAction(cpf, tipo, CURRENT_CENTER_ID, dataHoraExata, false);
        if (result.error) {
          setFeedback({ tipo: "error", texto: result.error });
        } else if (result.success) {
          setFeedback({ tipo: "success", texto: `${result.servidorNome}: ${result.mensagem}` });
          setCpf(""); 
        }
      } catch (error) {
        // Se deu erro de rede mesmo estando "online", joga pro offline
        salvarNoDispositivo(cpf, tipo, CURRENT_CENTER_ID, dataHoraExata);
      }
    } else {
      // SEM INTERNET: SALVA NO TABLET IMEDIATAMENTE
      salvarNoDispositivo(cpf, tipo, CURRENT_CENTER_ID, dataHoraExata);
    }

    setLoading(false);
    setTimeout(() => setFeedback(null), 5000);
  }

  // Grava no LocalStorage (Memória do navegador do Tablet)
  function salvarNoDispositivo(cpfNum: string, tipo: string, centerId: string, dataHora: string) {
    const fila = JSON.parse(localStorage.getItem("pontos_offline_fase") || "[]");
    fila.push({ cpf: cpfNum, tipo, centerId, dataHora });
    localStorage.setItem("pontos_offline_fase", JSON.stringify(fila));
    
    setFeedback({ 
      tipo: "warning", 
      texto: "Sem internet! Ponto salvo na memória do tablet. Será enviado automaticamente." 
    });
    setCpf("");
    atualizarContadorPendentes();
  }

  // Descarrega tudo para o banco quando a internet voltar
  async function sincronizarDados() {
    const fila = JSON.parse(localStorage.getItem("pontos_offline_fase") || "[]");
    if (fila.length === 0) return;

    setFeedback({ tipo: "warning", texto: "Conexão restabelecida. Sincronizando pontos pendentes..." });
    
    const resultado = await sincronizarPontosOfflineAction(fila);
    
    if (resultado.success) {
      localStorage.removeItem("pontos_offline_fase"); // Limpa a fila
      atualizarContadorPendentes();
      setFeedback({ tipo: "success", texto: `${resultado.count} registro(s) sincronizado(s) com a Central!` });
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f2a4a] flex flex-col items-center justify-center p-4 relative selection:bg-transparent transition-colors duration-500">
      
      {/* Botão de Saída e Indicadores Superiores */}
      <div className="absolute top-6 w-full px-6 flex justify-between items-center max-w-5xl">
        <div className="flex gap-4 items-center">
          {/* Indicador Visual de Conexão */}
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-2 transition-colors ${isOnline ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500 text-white animate-pulse'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-white'}`}></div>
            {isOnline ? "Sistema Online" : "MODO OFFLINE ATIVADO"}
          </div>

          {/* Indicador de Fila */}
          {pendentesOffline > 0 && (
            <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendentesOffline} ponto(s) aguardando envio
            </div>
          )}
        </div>

        <button onClick={() => router.push("/dashboard")} className="text-white/40 hover:text-white/90 text-sm font-bold transition-colors">
          Fechar Totem &times;
        </button>
      </div>

      <div className={`w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-10 text-center border-4 transition-colors ${isOnline ? 'border-transparent' : 'border-red-500'}`}>
        
        <Image src="/logo.png" alt="Logo FASE" width={100} height={100} className="mb-6 drop-shadow-md" />
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-1">Ponto Eletrônico</h1>
        <p className="text-gray-500 text-sm font-medium mb-8">Fundação de Atendimento Socioeducativo do Maranhão</p>

        {/* Relógio Digital */}
        <div className="bg-gray-50 border border-gray-200 w-full py-6 rounded-2xl mb-8 shadow-inner relative">
          {!isOnline && (
            <div className="absolute top-2 left-0 w-full text-center text-[10px] font-black text-red-500 uppercase tracking-widest">Memória Local Ativa</div>
          )}
          <div className="text-6xl font-black text-[#0f2a4a] tabular-nums tracking-tight">
            {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-gray-500 font-semibold mt-2 uppercase text-sm tracking-wider">
            {horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="w-full mb-8">
          <label className="block text-left text-sm font-bold text-gray-700 mb-2">Digite seu CPF / Matrícula</label>
          <input 
            type="text" 
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Apenas números..."
            className="w-full px-4 py-4 text-center text-2xl tracking-widest font-bold bg-white text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
            autoFocus
          />
        </div>

        {feedback && (
          <div className={`w-full p-4 mb-6 rounded-xl font-bold text-sm shadow-sm ${feedback.tipo === 'success' ? 'bg-green-100 text-green-800 border-green-300' : feedback.tipo === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
            {feedback.texto}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full">
          <button onClick={() => handlePonto("ENTRADA")} disabled={loading || !cpf} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg active:scale-95 transition-all">
            ENTRADA
          </button>
          <button onClick={() => handlePonto("SAIDA")} disabled={loading || !cpf} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg active:scale-95 transition-all">
            SAÍDA
          </button>
        </div>
      </div>
      
      <p className="text-white/50 text-xs mt-8 font-medium tracking-wide text-center">
        O sistema atende à Portaria 671 MTE. {isOnline ? 'Sincronização em Tempo Real' : 'Armazenamento Offline Seguro'} garantido.
      </p>
    </div>
  );
}