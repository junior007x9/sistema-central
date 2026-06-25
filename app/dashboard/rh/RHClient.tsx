"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Importamos as ações de Escala e as novas ações de Atestados
import { 
  salvarServidorAction, tratarPontoAction, gerarArquivoAFDAction, 
  salvarPlantaoAction, listarEscalasAction,
  listarAtestadosAction, avaliarAtestadoAction
} from "./actions";

type Tab = "INDICADORES" | "SERVIDORES" | "ESPELHO" | "ESCALAS" | "ATESTADOS" | "FISCAL";

export default function RHClient({ unidades, servidores, pontos }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("INDICADORES");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filtroUnidade, setFiltroUnidade] = useState("");

  const [escalasCadastradas, setEscalasCadastradas] = useState<any[]>([]);
  // NOVO: Estado para guardar os atestados vindos do banco
  const [atestadosCadastrados, setAtestadosCadastrados] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // NOVO: Adicionado "VER_ATESTADO" aos tipos de Modal
  const [modalType, setModalType] = useState<"MANUTENCAO_SERVIDOR" | "TRATAR_PONTO" | "VER_ATESTADO" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    listarEscalasAction().then(setEscalasCadastradas);
    listarAtestadosAction().then(setAtestadosCadastrados); // Carrega a caixa de entrada
  }, []);

  function closeModal() {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setMessage(null);
  }

  async function handleServidorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await salvarServidorAction(formData);
    if (result?.error) setMessage({ type: "error", text: result.error });
    else { closeModal(); router.refresh(); }
    setLoading(false);
  }

  async function handleTratamentoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await tratarPontoAction(formData);
    if (result?.error) setMessage({ type: "error", text: result.error });
    else { closeModal(); router.refresh(); }
    setLoading(false);
  }

  async function handlePlantaoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await salvarPlantaoAction(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      const novasEscalas = await listarEscalasAction();
      setEscalasCadastradas(novasEscalas);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  // NOVO: Função para o RH Aprovar ou Rejeitar a foto do atestado
  async function handleAvaliarAtestado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await avaliarAtestadoAction(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      const novosAtestados = await listarAtestadosAction();
      setAtestadosCadastrados(novosAtestados);
      closeModal();
    }
    setLoading(false);
  }

  async function baixarArquivoAFD() {
    const result = await gerarArquivoAFDAction(filtroUnidade || undefined);
    if (result?.success && result.conteudo) {
      const blob = new Blob([result.conteudo], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Lógica de Indicadores
  const servs = servidores.filter((s:any) => !filtroUnidade || s.centerId === filtroUnidade);
  const pts = pontos.filter((p:any) => !filtroUnidade || p.centerId === filtroUnidade);
  // Filtro da Caixa de Entrada de Atestados
  const atestadosFiltrados = atestadosCadastrados.filter(a => !filtroUnidade || a.centerId === filtroUnidade);

  const totalAtivos = servs.filter((s:any) => s.status === 'ATIVO').length;
  const hojeStr = new Date().toDateString();
  const ptsHoje = pts.filter((p:any) => new Date(p.dataHora).toDateString() === hojeStr).length;

  const ptsNormais = pts.filter((p:any) => p.statusPonto === 'NORMAL').length;
  const ptsJustificados = pts.filter((p:any) => p.statusPonto === 'JUSTIFICADO').length;
  const ptsAbonos = pts.filter((p:any) => p.statusPonto === 'ABONO').length;
  const totalPts = pts.length;

  const contagemEscalas = servs.reduce((acc: any, s:any) => {
    acc[s.escala] = (acc[s.escala] || 0) + 1;
    return acc;
  }, {});

  const ProgressBar = ({ label, valor, total, color }: { label: string; valor: number; total: number, color: string }) => {
    const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-gray-700">
          <span>{label}</span>
          <span>{valor} ({porcentagem}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${porcentagem}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Abas e Barra de Filtro Unificado */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => setActiveTab("INDICADORES")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "INDICADORES" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Painel</button>
          <button onClick={() => setActiveTab("SERVIDORES")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "SERVIDORES" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Servidores</button>
          <button onClick={() => setActiveTab("ESPELHO")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "ESPELHO" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Espelho</button>
          <button onClick={() => setActiveTab("ESCALAS")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "ESCALAS" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Escalas</button>
          
          {/* NOVA ABA: Caixa de Atestados com Contador Vermelho */}
          <button onClick={() => setActiveTab("ATESTADOS")} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${activeTab === "ATESTADOS" ? "bg-green-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>
            Caixa de Atestados
            {atestadosCadastrados.filter(a => a.status === 'PENDENTE').length > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse shadow-sm">
                {atestadosCadastrados.filter(a => a.status === 'PENDENTE').length}
              </span>
            )}
          </button>
          
          <button onClick={() => setActiveTab("FISCAL")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "FISCAL" ? "bg-amber-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>MTE 671</button>
        </div>

        <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
          <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#0f2a4a] shadow-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Consolidado de Todas as Unidades</option>
            {unidades.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <Link href="/dashboard" className="text-sm font-bold text-[#0f2a4a] hover:underline whitespace-nowrap">&larr; Voltar</Link>
        </div>
      </div>

      <div className="p-6">
        
        {/* TAB 1: INDICADORES */}
        {activeTab === "INDICADORES" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0f2a4a] text-white p-5 rounded-xl shadow-md border border-gray-800">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Força de Trabalho</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black">{totalAtivos}</span><span className="text-sm font-medium text-blue-300 mb-1">Servidores Ativos</span></div>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Dinâmica de Hoje</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black text-blue-600">{ptsHoje}</span><span className="text-sm font-bold text-gray-500 mb-1">Marcações Diárias</span></div>
              </div>
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Tratamentos RH</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black text-amber-500">{ptsJustificados + ptsAbonos}</span><span className="text-sm font-bold text-gray-500 mb-1">Pontos Ajustados</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-[#0f2a4a] border-b border-gray-200 pb-2 mb-4">Análise de Ocorrências do Ponto</h3>
                <div className="space-y-4">
                  <ProgressBar label="Marcações Normais (Totem)" valor={ptsNormais} total={totalPts} color="bg-green-500" />
                  <ProgressBar label="Inconsistências Justificadas" valor={ptsJustificados} total={totalPts} color="bg-blue-500" />
                  <ProgressBar label="Índice de Absenteísmo (Atestados/Abonos)" valor={ptsAbonos} total={totalPts} color="bg-red-500" />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-[#0f2a4a] border-b border-gray-200 pb-2 mb-4">Distribuição de Escalas de Trabalho</h3>
                <div className="space-y-4">
                  {Object.keys(contagemEscalas).length === 0 ? <p className="text-sm text-gray-500 italic">Nenhum servidor cadastrado.</p> : Object.entries(contagemEscalas).map(([escala, quantidade]) => <ProgressBar key={escala} label={escala} valor={quantidade as number} total={servs.length} color="bg-[#0f2a4a]" />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVIDORES */}
        {activeTab === "SERVIDORES" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Quadro Corporativo FASE/MA</h3>
              <button onClick={() => { setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold">+ Cadastrar Servidor</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">CPF / PIS</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Cargo</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Ações</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {servs.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{s.nome}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">CPF: {s.cpf}<br/>PIS: {s.pis || 'Não cadastrado'}</td>
                      <td className="px-6 py-4 text-gray-900">{s.cargo}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => { setSelectedItem(s); setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="text-blue-600 hover:underline font-bold">Editar</button>
                        <a href={`/dashboard/rh/espelho?servidorId=${s.id}`} target="_blank" className="text-green-700 hover:underline font-bold">Espelho PDF</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ESPELHO */}
        {activeTab === "ESPELHO" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tratamento de Ponto Eletrônico Auditado</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Marcação Original</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Servidor</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Evento</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Status do Ponto</th><th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Ações</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pts.map((p: any) => {
                    const servidor = servidores.find((s:any) => s.id === p.servidorId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-bold text-[#0f2a4a]">{new Date(p.dataHora).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium">{servidor?.nome || 'Desconhecido'}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.tipo}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.statusPonto === 'NORMAL' ? 'bg-gray-100 text-gray-700' : p.statusPonto === 'ABONO' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{p.statusPonto}</span>
                          {p.justificativaRH && <p className="text-xs text-gray-500 mt-1 italic">Obs RH: {p.justificativaRH}</p>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setSelectedItem(p); setModalType("TRATAR_PONTO"); setIsModalOpen(true); }} className="text-amber-700 hover:underline font-bold">Ajustar / Abonar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ESCALAS */}
        {activeTab === "ESCALAS" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm h-fit">
              <h3 className="text-lg font-black text-[#0f2a4a] mb-4">Montar Nova Escala</h3>
              <form onSubmit={handlePlantaoSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Funcionário Plantonista</label><select name="servidorId" required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="">Selecione...</option>{servs.map((s:any) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Data</label><input type="date" name="dataPlantao" required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Turno</label><select name="turno" required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="DIA (07h-19h)">DIURNO</option><option value="NOITE (19h-07h)">NOTURNO</option><option value="EXPEDIENTE">EXPEDIENTE</option></select></div>
                <input type="hidden" name="centerId" value={filtroUnidade || (servs.length > 0 ? servs[0].centerId : "")} />
                <button type="submit" disabled={loading} className="w-full bg-[#0f2a4a] text-white font-bold py-3 rounded-lg shadow hover:bg-blue-900 active:scale-95 transition-transform">{loading ? "Salvando..." : "Lançar no Calendário"}</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-black text-[#0f2a4a] mb-4">Agenda Oficial</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {escalasCadastradas.filter(e => !filtroUnidade || e.centerId === filtroUnidade).map(escala => {
                  const servidor = servidores.find((s:any) => s.id === escala.servidorId);
                  const [ano, mes, dia] = escala.dataPlantao.split('-');
                  const turnoColor = escala.turno.includes("NOITE") ? "bg-purple-100 text-purple-800" : escala.turno.includes("EXPEDIENTE") ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
                  return (
                    <div key={escala.id} className="bg-white border p-4 rounded-xl shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg text-center border"><span className="block text-[10px] font-black uppercase">Data</span><span className="block font-black">{`${dia}/${mes}/${ano}`}</span></div>
                        <div><h4 className="font-bold text-gray-800 text-base">{servidor?.nome}</h4><p className="text-xs text-gray-500">{servidor?.cargo}</p></div>
                      </div>
                      <div><span className={`px-4 py-1.5 rounded-full text-xs font-black ${turnoColor}`}>{escala.turno}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* NOVA TAB 5: CAIXA DE ATESTADOS (INBOX) */}
        {activeTab === "ATESTADOS" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-[#0f2a4a] mb-2">Caixa de Entrada (Inbox RH)</h3>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">Avalie os atestados médicos e comprovantes enviados pelos servidores através do aplicativo.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atestadosFiltrados.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                  <p className="text-gray-500 font-bold text-lg">Tudo limpo por aqui! ✨</p>
                  <p className="text-gray-400 text-sm">Nenhuma solicitação de abono pendente na sua fila.</p>
                </div>
              ) : (
                atestadosFiltrados.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((atestado) => {
                  const servidor = servidores.find((s:any) => s.id === atestado.servidorId);
                  const dtEnvio = new Date(atestado.createdAt).toLocaleDateString('pt-BR');
                  // Força o fuso horário para evitar que a data volte um dia atrás
                  const [ano, mes, dia] = atestado.dataFalta.split('-');
                  const dtFalta = `${dia}/${mes}/${ano}`;
                  
                  return (
                    <div key={atestado.id} className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${atestado.status === 'PENDENTE' ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
                      {atestado.status === 'PENDENTE' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>}
                      
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${atestado.status === 'APROVADO' ? 'bg-green-100 text-green-800 border-green-200' : atestado.status === 'REJEITADO' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'}`}>
                          {atestado.status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enviado: {dtEnvio}</span>
                      </div>
                      
                      <h4 className="font-black text-gray-800 text-lg leading-tight mb-1">{servidor?.nome || "Servidor Desconhecido"}</h4>
                      <p className="text-xs font-medium text-gray-500 mb-4">{servidor?.cargo}</p>
                      
                      <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                        <div className="mb-1"><span className="font-bold text-[#0f2a4a] text-xs uppercase tracking-wider">Data da Falta:</span> <span className="font-mono bg-gray-100 px-1 rounded">{dtFalta}</span></div>
                        <div><span className="font-bold text-[#0f2a4a] text-xs uppercase tracking-wider">Motivo:</span> {atestado.motivo}</div>
                      </div>

                      <button onClick={() => { setSelectedItem(atestado); setModalType("VER_ATESTADO"); setIsModalOpen(true); }} className={`mt-5 w-full font-black py-3 rounded-xl shadow-sm transition-transform active:scale-95 flex justify-center items-center gap-2 ${atestado.status === 'PENDENTE' ? 'bg-[#0f2a4a] text-white hover:bg-blue-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        {atestado.status === 'PENDENTE' ? 'Analisar Documento' : 'Visualizar Anexo'}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 6: FISCALIZAÇÃO MTE */}
        {activeTab === "FISCAL" && (
          <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3"><div className="p-2 bg-amber-600 text-white rounded-lg font-bold">671</div><div><h3 className="font-bold text-amber-900 text-lg">Módulo Fiscal Trabalhista</h3><p className="text-sm text-amber-800">Em conformidade com a Portaria 671 MTE.</p></div></div>
            <div className="border-t border-amber-200 pt-4"><button onClick={baixarArquivoAFD} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow">Baixar Arquivo AFD (.TXT)</button></div>
          </div>
        )}
      </div>

      {/* MODAL GLOBAL: MANUTENÇÃO DE SERVIDORES */}
      {isModalOpen && modalType === "MANUTENCAO_SERVIDOR" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[#0f2a4a]">{selectedItem ? "Editar Matrícula de Servidor" : "Cadastrar Novo Servidor"}</h3>
              <button onClick={closeModal} className="text-gray-400 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleServidorSubmit} className="p-6 space-y-4">
              {message && <div className="bg-red-50 text-red-600 p-3 rounded-md text-xs">{message.text}</div>}
              {selectedItem && <input type="hidden" name="id" value={selectedItem.id} />}
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label><input type="text" name="nome" defaultValue={selectedItem?.nome} required className="w-full px-3 py-2 border rounded-md text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">CPF</label><input type="text" name="cpf" defaultValue={selectedItem?.cpf} required className="w-full px-3 py-2 border rounded-md font-mono text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">PIS</label><input type="text" name="pis" defaultValue={selectedItem?.pis} required className="w-full px-3 py-2 border rounded-md font-mono text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Cargo</label><input type="text" name="cargo" defaultValue={selectedItem?.cargo} required className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Escala</label><select name="escala" defaultValue={selectedItem?.escala || "5x2 - Administrativo"} className="w-full px-3 py-2 border rounded-md text-sm"><option value="5x2 - Administrativo">5x2 - Administrativo (8h)</option><option value="12x36 - Plantonista">12x36 - Plantonista</option></select></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Lotação</label><select name="centerId" defaultValue={selectedItem?.centerId || ""} required className="w-full px-3 py-2 border rounded-md text-sm"><option value="">Selecione...</option>{unidades.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              {selectedItem && (<div><label className="block text-xs font-bold text-gray-700 mb-1">Status</label><select name="status" defaultValue={selectedItem.status} className="w-full px-3 py-2 border rounded-md text-sm"><option value="ATIVO">ATIVO</option><option value="INATIVO">INATIVO</option></select></div>)}
              <div className="pt-2 border-t"><label className="block text-xs font-bold text-amber-700 mb-1">Justificativa da Alteração</label><textarea name="observacao" required rows={2} className="w-full px-3 py-2 bg-amber-50 border-amber-200 border rounded-md text-sm"></textarea></div>
              <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancelar</button><button type="submit" disabled={loading} className="px-5 py-2 bg-[#0f2a4a] text-white rounded-lg text-sm font-bold">{loading ? "Salvando..." : "Confirmar Matrícula"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: TRATAR PONTO */}
      {isModalOpen && modalType === "TRATAR_PONTO" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-[#0f2a4a]">Ajustar Marcação</h3><button onClick={closeModal} className="text-gray-400 font-bold text-xl">&times;</button></div>
            <form onSubmit={handleTratamentoSubmit} className="p-6 space-y-4">
              <input type="hidden" name="pontoId" value={selectedItem.id} />
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Alterar Status</label><select name="statusPonto" defaultValue={selectedItem.statusPonto} className="w-full px-3 py-2 border rounded-md text-sm"><option value="NORMAL">NORMAL</option><option value="JUSTIFICADO">JUSTIFICADO</option><option value="ABONO">ABONO</option></select></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Texto Espelho</label><input type="text" name="justificativaRH" required className="w-full px-3 py-2 border rounded-md text-sm" /></div>
              <div className="pt-2 border-t"><label className="block text-xs font-bold text-amber-700 mb-1">Motivação Interna Log</label><textarea name="observacaoAuditoria" required rows={2} className="w-full px-3 py-2 bg-amber-50 border-amber-200 border rounded-md text-sm"></textarea></div>
              <div className="flex justify-end space-x-3 pt-2"><button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancelar</button><button type="submit" disabled={loading} className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold">{loading ? "Processando..." : "Aplicar Ajuste"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: VISUALIZADOR DE ATESTADO (NOVO) */}
      {isModalOpen && modalType === "VER_ATESTADO" && selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-[#0f2a4a] text-lg">Análise de Documento Médico</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Motivo Relatado: {selectedItem.motivo}</p>
              </div>
              <button onClick={closeModal} className="text-gray-500 bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full font-bold flex justify-center items-center transition-colors hover:rotate-90 duration-300">&times;</button>
            </div>
            
            {/* Área de Visualização da Imagem/PDF */}
            <div className="p-6 overflow-auto bg-gray-100 flex-1 flex justify-center items-center min-h-[40vh]">
              {selectedItem.anexo.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedItem.anexo} alt="Atestado" className="max-w-full rounded-lg shadow-md border border-gray-300 object-contain max-h-[60vh]" />
              ) : (
                <iframe src={selectedItem.anexo} className="w-full h-[60vh] rounded-lg shadow-md border border-gray-300 bg-white" title="Documento PDF" />
              )}
            </div>

            {/* Painel de Aprovação/Rejeição */}
            <div className="p-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hidden sm:block">
                <span className="text-gray-500 font-medium">Situação da Análise:</span> <span className={`font-black uppercase tracking-wider ml-1 ${selectedItem.status === 'APROVADO' ? 'text-green-600' : selectedItem.status === 'REJEITADO' ? 'text-red-600' : 'text-amber-600'}`}>{selectedItem.status}</span>
              </div>
              
              <form onSubmit={handleAvaliarAtestado} className="flex w-full sm:w-auto gap-3">
                <input type="hidden" name="id" value={selectedItem.id} />
                
                <button type="submit" name="status" value="REJEITADO" className="flex-1 sm:flex-none bg-white hover:bg-red-50 border-2 border-red-200 text-red-600 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm focus:ring-4 focus:ring-red-100">
                  Rejeitar
                </button>
                
                <button type="submit" name="status" value="APROVADO" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 focus:ring-4 focus:ring-green-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  Aprovar Atestado
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}