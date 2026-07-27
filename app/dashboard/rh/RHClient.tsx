"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  salvarServidorAction, tratarPontoAction, gerarArquivoAFDAction, 
  salvarPlantaoAction, listarEscalasAction,
  listarAtestadosAction, avaliarAtestadoAction,
  gerarFolhaPagamentoAction, salvarEventoAusenciaAction,
  listarEventosAusenciaAction, listarHistoricoFuncionalAction,
  salvarCandidatoAction, listarCandidatosAction,
  salvarCargoAction, listarCargosAction
} from "./actions";

type Tab = "INDICADORES" | "SERVIDORES" | "RECRUTAMENTO" | "RELATORIOS" | "ESPELHO" | "ESCALAS" | "ATESTADOS" | "FISCAL";

// ==========================================
// FUNÇÕES UTILITÁRIAS DE MÁSCARA AUTOMÁTICA
// ==========================================
const handleMaskCPF_RG = (e: React.ChangeEvent<HTMLInputElement>) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = v;
};

const handleMaskTelefone = (e: React.ChangeEvent<HTMLInputElement>) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  e.target.value = v;
};

const handleMaskCEP = (e: React.ChangeEvent<HTMLInputElement>) => {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  v = v.replace(/^(\d{5})(\d)/, "$1-$2");
  e.target.value = v;
};

const formatCPF_RG_OnLoad = (cpf: string) => {
  if (!cpf) return "";
  const v = cpf.replace(/\D/g, "");
  if (v.length === 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return v;
};

const formatTelefone_OnLoad = (tel: string) => {
  if (!tel) return "";
  const v = tel.replace(/\D/g, "");
  if (v.length === 11) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (v.length === 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v;
};

const calcularTempoServico = (dataAdmissao: string) => {
  if (!dataAdmissao) return "Data não informada";
  const inicio = new Date(dataAdmissao);
  const hoje = new Date();
  let anos = hoje.getFullYear() - inicio.getFullYear();
  let meses = hoje.getMonth() - inicio.getMonth();
  if (meses < 0 || (meses === 0 && hoje.getDate() < inicio.getDate())) {
    anos--;
    meses += 12;
  }
  if (anos < 0) return "Admissão Futura";
  return `${anos} ano(s) e ${meses} mês(es)`;
};

export default function RHClient({ unidades, servidores, pontos }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("INDICADORES");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filtroUnidade, setFiltroUnidade] = useState("");

  const [escalasCadastradas, setEscalasCadastradas] = useState<any[]>([]);
  const [atestadosCadastrados, setAtestadosCadastrados] = useState<any[]>([]);
  const [eventosCadastrados, setEventosCadastrados] = useState<any[]>([]);
  const [historicoFuncional, setHistoricoFuncional] = useState<any[]>([]);
  const [candidatosCadastrados, setCandidatosCadastrados] = useState<any[]>([]);
  const [cargosCadastrados, setCargosCadastrados] = useState<any[]>([]);
  const [tempoServicoLive, setTempoServicoLive] = useState<string>("Preencha a data...");

  // Estados dos Relatórios
  const [tipoRelatorio, setTipoRelatorio] = useState<"QUANTITATIVO" | "CADASTRAL" | "FERIAS" | "ANIVERSARIANTES">("QUANTITATIVO");
  const [mesAniversario, setMesAniversario] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"MANUTENCAO_SERVIDOR" | "TRATAR_PONTO" | "VER_ATESTADO" | "FICHA_FUNCIONAL" | "MANUTENCAO_CANDIDATO" | "GERENCIAR_CARGOS" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [loadingCep, setLoadingCep] = useState(false);
  const enderecoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarEscalasAction().then(setEscalasCadastradas);
    listarAtestadosAction().then(setAtestadosCadastrados);
    listarEventosAusenciaAction().then(setEventosCadastrados);
    listarCandidatosAction().then(setCandidatosCadastrados);
    listarCargosAction().then(setCargosCadastrados);
  }, []);

  function closeModal() {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setMessage(null);
    setTempoServicoLive("Preencha a data...");
  }

  async function openFichaFuncional(servidor: any) {
    setSelectedItem(servidor);
    setModalType("FICHA_FUNCIONAL");
    setIsModalOpen(true);
    const logs = await listarHistoricoFuncionalAction(servidor.id);
    setHistoricoFuncional(logs);
  }

  async function buscarCEP(cepStr: string) {
    const cepClean = cepStr.replace(/\D/g, "");
    if (cepClean.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await res.json();
        if (!data.erro && enderecoRef.current) {
          enderecoRef.current.value = `${data.logradouro}, Nº , ${data.bairro}, ${data.localidade} - ${data.uf}`;
          enderecoRef.current.focus(); 
        }
      } catch (e) {
        console.error("Erro ao buscar CEP", e);
      }
      setLoadingCep(false);
    }
  }

  // GESTÃO DE CARGOS
  async function handleCargoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await salvarCargoAction(formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      const novosCargos = await listarCargosAction();
      setCargosCadastrados(novosCargos);
      (event.target as HTMLFormElement).reset();
      setMessage({ type: "success", text: result.success as string });
    }
    setLoading(false);
  }

  // GESTÃO DE RECRUTAMENTO
  async function handleCandidatoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await salvarCandidatoAction(formData);
    if (result?.error) setMessage({ type: "error", text: result.error });
    else {
      const novosCandidatos = await listarCandidatosAction();
      setCandidatosCadastrados(novosCandidatos);
      closeModal();
    }
    setLoading(false);
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

  async function handleEventoAusenciaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await salvarEventoAusenciaAction(formData);
    if (result?.error) {
      alert(result.error);
    } else {
      const novosEventos = await listarEventosAusenciaAction();
      setEventosCadastrados(novosEventos);
      const logs = await listarHistoricoFuncionalAction(selectedItem.id);
      setHistoricoFuncional(logs);
      (event.target as HTMLFormElement).reset();
    }
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
    if (result?.error) alert(result.error);
    else {
      const novasEscalas = await listarEscalasAction();
      setEscalasCadastradas(novasEscalas);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  async function handleAvaliarAtestado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await avaliarAtestadoAction(formData);
    if (result?.error) alert(result.error);
    else {
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

  async function baixarFolhaPagamento() {
    setLoading(true);
    const result = await gerarFolhaPagamentoAction(filtroUnidade || undefined);
    if (result?.success && result.conteudo) {
      const blob = new Blob(["\uFEFF" + result.conteudo], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setLoading(false);
  }

  function exportarRelatorioCSV(colunas: string[], linhas: string[][], nomeArquivo: string) {
    let csv = colunas.join(";") + "\n";
    linhas.forEach(linha => { csv += linha.join(";") + "\n"; });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${nomeArquivo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================
  // PROCESSAMENTO DE DADOS
  // ==========================================
  const hojeStr = new Date().toDateString();
  const dataHojeObj = new Date();
  
  const servs = servidores.filter((s:any) => !filtroUnidade || s.centerId === filtroUnidade);
  const ativos = servs.filter((s:any) => s.status === 'ATIVO');
  
  const pts = pontos.filter((p:any) => !filtroUnidade || p.centerId === filtroUnidade);
  const atestadosFiltrados = atestadosCadastrados.filter(a => !filtroUnidade || a.centerId === filtroUnidade);
  
  const ptsHoje = pts.filter((p:any) => new Date(p.dataHora).toDateString() === hojeStr).length;
  const ptsNormais = pts.filter((p:any) => p.statusPonto === 'NORMAL').length;
  const ptsJustificados = pts.filter((p:any) => p.statusPonto === 'JUSTIFICADO').length;
  const ptsAbonos = pts.filter((p:any) => p.statusPonto === 'ABONO').length;
  const totalPts = pts.length;
  const atestadosPendentes = atestadosFiltrados.filter(a => a.status === 'PENDENTE').length;

  // Calculando quem está de férias/licença HOJE
  const emFeriasOuLicencaHoje = eventosCadastrados.filter(e => {
    if (e.status !== 'APROVADO') return false;
    const sId = e.servidorId;
    const pertenceAUnidade = servs.some((s:any) => s.id === sId);
    if (!pertenceAUnidade) return false;
    
    const dInicio = new Date(e.dataInicio);
    const dFim = new Date(e.dataFim);
    return dataHojeObj >= dInicio && dataHojeObj <= dFim;
  }).length;

  // Distribuições para Gráficos e Relatórios
  const contagemEscalas = ativos.reduce((acc: any, s:any) => { acc[s.escala] = (acc[s.escala] || 0) + 1; return acc; }, {});
  const contagemVinculos = ativos.reduce((acc: any, s:any) => { acc[s.vinculo || 'Não Informado'] = (acc[s.vinculo || 'Não Informado'] || 0) + 1; return acc; }, {});
  const contagemGenero = ativos.reduce((acc: any, s:any) => { acc[s.genero || 'Não Informado'] = (acc[s.genero || 'Não Informado'] || 0) + 1; return acc; }, {});
  const contagemRaca = ativos.reduce((acc: any, s:any) => { acc[s.grupoEtnico || 'Não Informado'] = (acc[s.grupoEtnico || 'Não Informado'] || 0) + 1; return acc; }, {});
  const contagemCargos = servs.reduce((acc: any, s:any) => { acc[s.cargo] = (acc[s.cargo] || 0) + 1; return acc; }, {});
  const contagemLotacoes = servs.reduce((acc: any, s:any) => {
    const nomeUnidade = unidades.find((u:any) => u.id === s.centerId)?.name || 'Desconhecida';
    acc[nomeUnidade] = (acc[nomeUnidade] || 0) + 1; return acc;
  }, {});

  const aniversariantesMes = servs.filter((s:any) => {
    if (!s.dataNascimento) return false;
    const mes = s.dataNascimento.split('-')[1];
    return mes === mesAniversario;
  });

  const feriasAgendadas = eventosCadastrados.filter(e => e.tipo === 'FÉRIAS').filter(e => {
    const serv = servidores.find((s:any) => s.id === e.servidorId);
    return !filtroUnidade || serv?.centerId === filtroUnidade;
  });

  const ProgressBar = ({ label, valor, total, color, showValue = true }: { label: string; valor: number; total: number, color: string, showValue?: boolean }) => {
    const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-gray-700">
          <span className="uppercase tracking-wider">{label}</span>
          {showValue && <span>{valor} <span className="text-gray-400 font-medium">({porcentagem}%)</span></span>}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 shadow-inner overflow-hidden">
          <div className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out relative`} style={{ width: `${porcentagem}%` }}>
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-screen">
      
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col xl:flex-row justify-between items-center gap-4">
        
        <div className="flex overflow-x-auto w-full xl:w-auto gap-2 scrollbar-hide snap-x pb-1">
          <button onClick={() => setActiveTab("INDICADORES")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "INDICADORES" ? "bg-blue-600 text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Painel Geral</button>
          <button onClick={() => setActiveTab("SERVIDORES")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "SERVIDORES" ? "bg-[#0f2a4a] text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Servidores</button>
          <button onClick={() => setActiveTab("RECRUTAMENTO")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "RECRUTAMENTO" ? "bg-teal-600 text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Recrutamento</button>
          <button onClick={() => setActiveTab("RELATORIOS")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "RELATORIOS" ? "bg-purple-600 text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Relatórios</button>
          <button onClick={() => setActiveTab("ESPELHO")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "ESPELHO" ? "bg-[#0f2a4a] text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Espelho</button>
          <button onClick={() => setActiveTab("ESCALAS")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "ESCALAS" ? "bg-[#0f2a4a] text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>Escalas e Folha</button>
          <button onClick={() => setActiveTab("ATESTADOS")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === "ATESTADOS" ? "bg-green-600 text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>
            Atestados {atestadosPendentes > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse shadow-sm">{atestadosPendentes}</span>}
          </button>
          <button onClick={() => setActiveTab("FISCAL")} className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "FISCAL" ? "bg-amber-600 text-white shadow-md scale-105" : "text-gray-600 bg-transparent hover:bg-gray-200"}`}>MTE 671</button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-end border-t border-gray-200 xl:border-0 pt-3 xl:pt-0">
          <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)} className="w-full sm:w-auto px-4 py-2 bg-white border-2 border-[#0f2a4a]/20 rounded-lg text-sm font-black text-[#0f2a4a] shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all hover:border-[#0f2a4a]/40">
            <option value="">Consolidado de Todas as Unidades</option>
            {unidades.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <Link href="/dashboard" className="w-full sm:w-auto text-center text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors whitespace-nowrap">&larr; Voltar</Link>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gray-50/50">
        
        {/* ======================================================================= */}
        {/* TAB 1: PAINEL GERAL (DASHBOARD RH CORPORATIVO)                          */}
        {/* ======================================================================= */}
        {activeTab === "INDICADORES" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            {/* LINHA 1: KPIS (Top Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1a3a6a] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>
                </div>
                <div className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span> Força de Trabalho
                </div>
                <div className="flex justify-between items-end relative z-10">
                  <span className="text-5xl font-black">{ativos.length}</span>
                  <span className="text-xs font-medium text-blue-200 mb-1">Servidores Ativos</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-purple-300 transition-colors">
                <div className="text-purple-600 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">Férias & Licenças</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black text-gray-800">{emFeriasOuLicencaHoje}</span><span className="text-xs font-bold text-gray-400 mb-1">Afastados Hoje</span></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-red-300 transition-colors">
                <div className="text-red-600 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">Caixa de Atestados</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black text-gray-800">{atestadosPendentes}</span><span className="text-xs font-bold text-gray-400 mb-1">Pendentes de RH</span></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-green-300 transition-colors">
                <div className="text-green-600 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">Dinâmica de Marcações</div>
                <div className="flex justify-between items-end"><span className="text-5xl font-black text-gray-800">{ptsHoje}</span><span className="text-xs font-bold text-gray-400 mb-1">Pontos Batidos Hoje</span></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>
            </div>

            {/* LINHA 2: GRÁFICOS DEMOGRÁFICOS E CONTRATUAIS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5"><h3 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider">Mapa de Vínculos Empregatícios</h3></div>
                <div className="space-y-5">
                  {Object.keys(contagemVinculos).length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">Nenhum vínculo registrado.</p> : 
                    Object.entries(contagemVinculos).sort(([,a], [,b]) => (b as number) - (a as number)).map(([vinculo, qtde], index) => {
                        const colors = ["bg-blue-600", "bg-indigo-500", "bg-purple-500", "bg-teal-500"];
                        return <ProgressBar key={vinculo} label={vinculo} valor={qtde as number} total={ativos.length} color={colors[index % colors.length]} />;
                      })
                  }
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5"><h3 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider">Perfil e Diversidade da Unidade</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Distribuição por Gênero</h5>
                    <div className="space-y-4">
                      {Object.keys(contagemGenero).length === 0 ? <p className="text-xs text-gray-400 italic">Sem dados</p> : 
                        Object.entries(contagemGenero).map(([gen, qtde]) => (<ProgressBar key={gen} label={gen} valor={qtde as number} total={ativos.length} color={gen === 'Masculino' ? 'bg-blue-400' : gen === 'Feminino' ? 'bg-pink-400' : 'bg-purple-400'} />))
                      }
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Grupo Étnico Racial</h5>
                    <div className="space-y-4">
                      {Object.keys(contagemRaca).length === 0 ? <p className="text-xs text-gray-400 italic">Sem dados</p> : 
                        Object.entries(contagemRaca).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 4).map(([raca, qtde]) => (<ProgressBar key={raca} label={raca} valor={qtde as number} total={ativos.length} color="bg-amber-500" />))
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LINHA 3: OPERACIONAL E ESCALAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5"><h3 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider">Auditoria de Ocorrências (Espelho)</h3></div>
                <div className="space-y-5">
                  <ProgressBar label="Marcações Normais Válidas" valor={ptsNormais} total={totalPts} color="bg-emerald-500" />
                  <ProgressBar label="Ajustes RH (Esquecimento/Erros)" valor={ptsJustificados} total={totalPts} color="bg-amber-400" />
                  <ProgressBar label="Faltas Abonadas via Atestado" valor={ptsAbonos} total={totalPts} color="bg-red-400" />
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5"><h3 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider">Distribuição de Escalas de Trabalho</h3></div>
                <div className="space-y-5">
                  {Object.keys(contagemEscalas).length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">Nenhum servidor cadastrado.</p> : 
                    Object.entries(contagemEscalas).map(([escala, quantidade]) => (<ProgressBar key={escala} label={escala} valor={quantidade as number} total={ativos.length} color="bg-[#0f2a4a]" />))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: SERVIDORES (COM O NOVO BOTÃO DE CARGOS)                          */}
        {/* ======================================================================= */}
        {activeTab === "SERVIDORES" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-gray-800">Quadro Corporativo FASE/MA</h3>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => { setModalType("GERENCIAR_CARGOS"); setIsModalOpen(true); }} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none">
                  ⚙️ Cargos
                </button>
                <button onClick={() => { setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1a3a6a] shadow-sm flex-1 md:flex-none">+ Cadastrar Servidor</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Cargo</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Vínculo</th><th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Ações</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {servs.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><div className="font-bold text-gray-900">{s.nome}</div><div className="text-xs text-gray-500 font-mono mt-0.5">{formatCPF_RG_OnLoad(s.cpf)}</div></td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{s.cargo}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{s.vinculo || 'Não Informado'}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${s.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => { setSelectedItem(s); setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="text-blue-600 hover:underline font-bold text-xs bg-blue-50 px-2 py-1 rounded">Editar Info</button>
                        <button onClick={() => openFichaFuncional(s)} className="text-purple-600 hover:underline font-bold text-xs bg-purple-50 px-2 py-1 rounded">Ficha / Férias</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: RECRUTAMENTO                                                     */}
        {/* ======================================================================= */}
        {activeTab === "RECRUTAMENTO" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div><h3 className="text-lg font-bold text-teal-900">Banco de Talentos (Reserva)</h3><p className="text-sm text-teal-700">Registe currículos de candidatos para futuras convocações.</p></div>
              <button onClick={() => { setModalType("MANUTENCAO_CANDIDATO"); setIsModalOpen(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm">+ Adicionar Currículo</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidatosCadastrados.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/30">
                  <p className="text-teal-700 font-bold text-lg">Nenhum candidato registado.</p><p className="text-teal-600/70 text-sm">O Cadastro de Reserva está vazio no momento.</p>
                </div>
              ) : (
                candidatosCadastrados.map((cand) => (
                  <div key={cand.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${cand.status === 'CONVOCADO' ? 'bg-green-100 text-green-800 border-green-200' : cand.status === 'REJEITADO' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-teal-100 text-teal-800 border-teal-200'}`}>{cand.status}</span>
                      <button onClick={() => { setSelectedItem(cand); setModalType("MANUTENCAO_CANDIDATO"); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-600 text-xs font-bold underline">Editar</button>
                    </div>
                    <h4 className="font-black text-gray-800 text-lg leading-tight mb-1">{cand.nome}</h4>
                    <div className="text-xs text-gray-600 space-y-1 mt-3 mb-4">
                      <p><strong>CPF:</strong> <span className="font-mono">{formatCPF_RG_OnLoad(cand.cpf)}</span></p><p><strong>E-mail:</strong> {cand.email}</p><p><strong>Telefone:</strong> <span className="font-mono">{formatTelefone_OnLoad(cand.telefone)}</span></p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-[10px] font-black text-teal-800 uppercase tracking-wider mb-1">Qualificação / Adaptação</span>
                      <p className="text-xs text-gray-700 leading-relaxed italic">&quot;{cand.qualificacao}&quot;</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: RELATÓRIOS GERENCIAIS                                            */}
        {/* ======================================================================= */}
        {activeTab === "RELATORIOS" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-wrap gap-3 mb-8 bg-purple-50 p-3 rounded-xl border border-purple-100">
              <button onClick={() => setTipoRelatorio("QUANTITATIVO")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tipoRelatorio === "QUANTITATIVO" ? "bg-purple-600 text-white shadow-md" : "bg-white text-purple-700 hover:bg-purple-100"}`}>📊 Quantitativo e Lotação</button>
              <button onClick={() => setTipoRelatorio("CADASTRAL")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tipoRelatorio === "CADASTRAL" ? "bg-purple-600 text-white shadow-md" : "bg-white text-purple-700 hover:bg-purple-100"}`}>📋 Filtro Cadastral</button>
              <button onClick={() => setTipoRelatorio("FERIAS")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tipoRelatorio === "FERIAS" ? "bg-purple-600 text-white shadow-md" : "bg-white text-purple-700 hover:bg-purple-100"}`}>🏖️ Controle de Férias</button>
              <button onClick={() => setTipoRelatorio("ANIVERSARIANTES")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tipoRelatorio === "ANIVERSARIANTES" ? "bg-purple-600 text-white shadow-md" : "bg-white text-purple-700 hover:bg-purple-100"}`}>🎂 Lista Aniversariantes</button>
            </div>

            {tipoRelatorio === "QUANTITATIVO" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                  <div><h3 className="text-lg font-black text-gray-800">Relatório de Quantitativo Físico</h3></div>
                  <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-xl font-black shadow-sm">Total: {servs.length}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-[#0f2a4a] border-b border-gray-100 pb-2 mb-4">Quantitativo por Cargo</h4>
                    <div className="space-y-4">
                      {Object.keys(contagemCargos).length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : 
                        Object.entries(contagemCargos).sort((a:any, b:any) => b[1] - a[1]).map(([cargo, qtd]) => (<ProgressBar key={cargo} label={cargo} valor={qtd as number} total={servs.length} color="bg-blue-500" />))}
                    </div>
                  </div>
                  {!filtroUnidade && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h4 className="font-bold text-[#0f2a4a] border-b border-gray-100 pb-2 mb-4">Quantitativo por Lotação (Unidade)</h4>
                      <div className="space-y-4">
                        {Object.keys(contagemLotacoes).length === 0 ? <p className="text-sm text-gray-500">Nenhum dado.</p> : 
                          Object.entries(contagemLotacoes).sort((a:any, b:any) => b[1] - a[1]).map(([lotacao, qtd]) => (<ProgressBar key={lotacao} label={lotacao} valor={qtd as number} total={servs.length} color="bg-purple-500" />))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tipoRelatorio === "CADASTRAL" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h3 className="text-lg font-black text-gray-800">Filtro de Informações Pessoais</h3>
                  <button onClick={() => exportarRelatorioCSV(["Nome", "CPF", "RG", "Cargo", "Unidade", "Vínculo", "Admissão", "Desligamento", "Status"], servs.map((s:any) => [s.nome, s.cpf, s.rg || 'Não Info', s.cargo, unidades.find((u:any) => u.id === s.centerId)?.name || '', s.vinculo || 'Não Info', s.dataAdmissao || '', s.dataDesligamento || '', s.status]), "Relatorio_Cadastral")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">⬇️ Exportar CSV</button>
                </div>
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Servidor</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Documentação</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Lotação / Cargo</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Ciclo Contratual</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Status</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {servs.map((s:any) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-800">{s.nome}</td>
                          <td className="px-4 py-3 text-gray-600"><div>CPF: {formatCPF_RG_OnLoad(s.cpf)}</div><div>RG: {s.rg ? formatCPF_RG_OnLoad(s.rg) : 'Não Info'}</div></td>
                          <td className="px-4 py-3 text-gray-600"><div>{s.cargo}</div><div className="text-[10px] uppercase font-bold text-gray-400">{unidades.find((u:any) => u.id === s.centerId)?.name}</div></td>
                          <td className="px-4 py-3 text-gray-600"><div>Adm: {s.dataAdmissao ? new Date(s.dataAdmissao).toLocaleDateString('pt-BR') : 'N/A'}</div>{s.dataDesligamento && <div className="text-red-600">Deslig: {new Date(s.dataDesligamento).toLocaleDateString('pt-BR')}</div>}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tipoRelatorio === "FERIAS" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <h3 className="text-lg font-black text-gray-800">Relatório de Férias por Período Aquisitivo</h3>
                  <button onClick={() => exportarRelatorioCSV(["Servidor", "Unidade", "Data Início", "Data Retorno", "Status", "Portaria/Observacao"], feriasAgendadas.map((f:any) => { const serv = servidores.find((s:any) => s.id === f.servidorId); return [serv?.nome || '', unidades.find((u:any) => u.id === serv?.centerId)?.name || '', f.dataInicio, f.dataFim, f.status, f.observacao || '']; }), "Relatorio_Ferias")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">⬇️ Exportar CSV</button>
                </div>
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Servidor</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Lotação</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Período de Gozo</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Doc / Portaria</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Status</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feriasAgendadas.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">Nenhum registo de férias encontrado.</td></tr> : feriasAgendadas.map((ferias:any) => {
                        const servidor = servidores.find((s:any) => s.id === ferias.servidorId);
                        return (
                          <tr key={ferias.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-bold text-gray-800">{servidor?.nome}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{unidades.find((u:any) => u.id === servidor?.centerId)?.name}</td>
                            <td className="px-4 py-3 font-mono text-xs text-blue-700 bg-blue-50 rounded px-2">{new Date(ferias.dataInicio).toLocaleDateString('pt-BR')} até {new Date(ferias.dataFim).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{ferias.observacao || 'Sem observação'}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800">{ferias.status}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tipoRelatorio === "ANIVERSARIANTES" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <h3 className="text-lg font-black text-gray-800">Lista de Aniversariantes do Mês</h3>
                  <div className="flex gap-3">
                    <select value={mesAniversario} onChange={(e) => setMesAniversario(e.target.value)} className="px-4 py-2 border border-purple-300 rounded-lg text-sm font-bold text-purple-900 bg-purple-50 shadow-sm focus:ring-2 focus:ring-purple-500">
                      <option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option>
                    </select>
                    <button onClick={() => exportarRelatorioCSV(["Nome", "Dia e Mes", "Cargo", "Lotação"], aniversariantesMes.map((s:any) => { const [, m, d] = s.dataNascimento.split('-'); return [s.nome, `${d}/${m}`, s.cargo, unidades.find((u:any) => u.id === s.centerId)?.name || '']; }), `Aniversariantes_${mesAniversario}`)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">⬇️ Exportar</button>
                  </div>
                </div>
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase w-20">Dia</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Aniversariante</th><th className="px-4 py-3 text-left font-bold text-gray-500 uppercase">Cargo e Lotação</th></tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aniversariantesMes.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">Nenhum aniversariante neste mês.</td></tr> : 
                        aniversariantesMes.sort((a:any, b:any) => Number(a.dataNascimento.split('-')[2]) - Number(b.dataNascimento.split('-')[2])).map((s:any) => {
                          const [, , dia] = s.dataNascimento.split('-');
                          return (
                            <tr key={s.id} className="hover:bg-purple-50 transition-colors">
                              <td className="px-4 py-3 font-black text-xl text-purple-600 text-center bg-purple-50/50">{dia}</td>
                              <td className="px-4 py-3 font-bold text-gray-800 text-base">🎁 {s.nome}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs"><div>{s.cargo}</div><div className="font-bold uppercase text-gray-400 mt-0.5">{unidades.find((u:any) => u.id === s.centerId)?.name}</div></td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TABS RESTANTES (ESPELHO, ESCALAS, ATESTADOS, FISCAL)                    */}
        {/* ======================================================================= */}
        
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
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.statusPonto === 'NORMAL' ? 'bg-gray-100' : p.statusPonto === 'ABONO' ? 'bg-blue-100' : 'bg-amber-100'}`}>{p.statusPonto}</span>
                          {p.justificativaRH && <p className="text-xs text-gray-500 mt-1 italic">Obs: {p.justificativaRH}</p>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setSelectedItem(p); setModalType("TRATAR_PONTO"); setIsModalOpen(true); }} className="text-amber-700 font-bold hover:underline">Ajustar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-lg font-black text-[#0f2a4a]">Agenda Oficial</h3>
                <button onClick={baixarFolhaPagamento} disabled={loading} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex justify-center items-center gap-2 transition-colors disabled:opacity-50 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  {loading ? "Calculando..." : "Fechar Folha (Excel)"}
                </button>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {escalasCadastradas.filter(e => !filtroUnidade || e.centerId === filtroUnidade).length === 0 ? (
                  <div className="text-center py-10 text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-xl">Nenhum plantão escalado.</div>
                ) : (
                  escalasCadastradas.filter(e => !filtroUnidade || e.centerId === filtroUnidade).map(escala => {
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
                }))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ATESTADOS" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-[#0f2a4a] mb-2">Caixa de Entrada (Inbox RH)</h3>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">Avalie os atestados médicos e comprovantes enviados pelos servidores através do aplicativo.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {atestadosFiltrados.length === 0 ? (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                  <p className="text-gray-500 font-bold text-lg">Tudo limpo por aqui! ✨</p><p className="text-gray-400 text-sm">Nenhuma solicitação de abono pendente na sua fila.</p>
                </div>
              ) : (
                atestadosFiltrados.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((atestado) => {
                  const servidor = servidores.find((s:any) => s.id === atestado.servidorId);
                  const dtEnvio = new Date(atestado.createdAt).toLocaleDateString('pt-BR');
                  const [ano, mes, dia] = atestado.dataFalta.split('-');
                  return (
                    <div key={atestado.id} className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${atestado.status === 'PENDENTE' ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
                      {atestado.status === 'PENDENTE' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>}
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${atestado.status === 'APROVADO' ? 'bg-green-100 text-green-800 border-green-200' : atestado.status === 'REJEITADO' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'}`}>{atestado.status}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enviado: {dtEnvio}</span>
                      </div>
                      <h4 className="font-black text-gray-800 text-lg leading-tight mb-1">{servidor?.nome || "Servidor Desconhecido"}</h4>
                      <p className="text-xs font-medium text-gray-500 mb-4">{servidor?.cargo}</p>
                      <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-inner">
                        <div className="mb-1"><span className="font-bold text-[#0f2a4a] text-xs uppercase tracking-wider">Data da Falta:</span> <span className="font-mono bg-gray-100 px-1 rounded">{`${dia}/${mes}/${ano}`}</span></div>
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

        {activeTab === "FISCAL" && (
          <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3"><div className="p-2 bg-amber-600 text-white rounded-lg font-bold">671</div><div><h3 className="font-bold text-amber-900 text-lg">Módulo Fiscal Trabalhista</h3><p className="text-sm text-amber-800">Em conformidade com a Portaria 671 MTE.</p></div></div>
            <div className="border-t border-amber-200 pt-4"><button onClick={baixarArquivoAFD} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-3 rounded-xl shadow transition-transform active:scale-95">Baixar Arquivo AFD (.TXT)</button></div>
          </div>
        )}

      </div>

      {/* ========================================================================================================= */}
      {/* MODAIS GLOBAIS                                                                                            */}
      {/* ========================================================================================================= */}
      
      {/* MODAL: GERENCIAR CARGOS (NOVO) */}
      {isModalOpen && modalType === "GERENCIAR_CARGOS" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#0f2a4a] text-lg flex items-center gap-2">Gestão de Cargos e Funções</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
            </div>
            <div className="p-6 bg-white overflow-y-auto">
              {message && <div className={`p-3 mb-4 rounded-lg text-sm font-bold border ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>{message.text}</div>}
              <form onSubmit={handleCargoSubmit} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Novo Cargo</label>
                <div className="flex gap-2">
                  <input type="text" name="nome" required placeholder="Ex: MONITOR SOCIOEDUCATIVO" className="w-full px-3 py-2 border rounded-md text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="submit" disabled={loading} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 shadow-sm shrink-0">Adicionar</button>
                </div>
              </form>
              <h4 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-3 border-b pb-2">Cargos Registados ({cargosCadastrados.length})</h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {cargosCadastrados.length === 0 ? <p className="text-sm text-gray-500 italic text-center py-4">Nenhum cargo no sistema.</p> : 
                  cargosCadastrados.map(c => (
                    <div key={c.id} className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors">
                      <span className="font-bold text-gray-800 text-sm">{c.nome}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUTENÇÃO DE CANDIDATO (RECRUTAMENTO) */}
      {isModalOpen && modalType === "MANUTENCAO_CANDIDATO" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-teal-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-teal-900 text-lg">{selectedItem ? "Atualizar Ficha do Candidato" : "Registar Novo Currículo"}</h3>
              <button onClick={closeModal} className="text-teal-700 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
            </div>
            <form id="formCandidato" onSubmit={handleCandidatoSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
              {message && <div className={`p-4 rounded-lg text-sm font-bold border flex items-start gap-3 shadow-sm ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}><span>{message.text}</span></div>}
              {selectedItem && <input type="hidden" name="id" value={selectedItem.id} />}
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo *</label><input type="text" name="nome" defaultValue={selectedItem?.nome} required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">CPF *</label><input type="text" name="cpf" defaultValue={formatCPF_RG_OnLoad(selectedItem?.cpf)} onChange={handleMaskCPF_RG} placeholder="000.000.000-00" maxLength={14} required className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp *</label><input type="tel" name="telefone" defaultValue={formatTelefone_OnLoad(selectedItem?.telefone)} onChange={handleMaskTelefone} placeholder="(00) 00000-0000" maxLength={15} required className="w-full px-3 py-2 border rounded-md text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500" /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Endereço de E-mail *</label><input type="email" name="email" defaultValue={selectedItem?.email} required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Qualificação / Área de Adaptação *</label><textarea name="qualificacao" defaultValue={selectedItem?.qualificacao} required rows={3} placeholder="Resumo das habilidades..." className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500"></textarea></div>
              {selectedItem && (
                <div className="pt-2 border-t border-gray-100"><label className="block text-xs font-bold text-teal-800 mb-1">Status no Processo Seletivo</label><select name="status" defaultValue={selectedItem.status} className="w-full px-3 py-2 border border-teal-300 rounded-md text-sm bg-white font-bold text-teal-900"><option value="CADASTRO DE RESERVA">MANTIDO NO CADASTRO DE RESERVA</option><option value="CONVOCADO">CANDIDATO CONVOCADO (APROVADO)</option><option value="REJEITADO">CANDIDATO REJEITADO (INAPTO)</option></select></div>
              )}
            </form>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3 shrink-0"><button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">Cancelar</button><button type="submit" form="formCandidato" disabled={loading} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-md">{loading ? "Processando..." : (selectedItem ? "Salvar Alterações" : "Registar no Banco")}</button></div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: MANUTENÇÃO DE SERVIDORES (COM DATALIST DE CARGOS) */}
      {isModalOpen && modalType === "MANUTENCAO_SERVIDOR" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-[#0f2a4a] text-lg">{selectedItem ? "Editar Ficha do Servidor" : "Cadastrar Novo Servidor"}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
            </div>
            
            <form id="formServidor" onSubmit={handleServidorSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/50">
              {message && (
                <div className={`p-4 rounded-lg text-sm font-bold border flex items-start gap-3 shadow-sm ${message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <span>{message.text}</span>
                </div>
              )}
              
              {selectedItem && <input type="hidden" name="id" value={selectedItem.id} />}
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* COLUNA ESQUERDA (DADOS PESSOAIS) */}
                <div className="space-y-8">
                  {/* 1. IDENTIFICAÇÃO PESSOAL */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider border-b pb-2">1. Identificação Pessoal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Nome Civil Completo *</label><input type="text" name="nome" defaultValue={selectedItem?.nome} required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white" /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Nome Social</label><input type="text" name="nomeSocial" defaultValue={selectedItem?.nomeSocial} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white" /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Data de Nascimento</label><input type="date" name="dataNascimento" defaultValue={selectedItem?.dataNascimento} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 focus:bg-white" /></div>
                    </div>
                  </div>

                  {/* 2. DIVERSIDADE E INCLUSÃO */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider border-b pb-2">2. Perfil Sociodemográfico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Grupo Étnico</label><select name="grupoEtnico" defaultValue={selectedItem?.grupoEtnico} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="">Selecione...</option><option value="Branca">Branca</option><option value="Preta">Preta</option><option value="Parda">Parda</option><option value="Amarela">Amarela</option><option value="Indígena">Indígena</option><option value="Não Informado">Não Informado</option></select></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Estado Civil</label><select name="estadoCivil" defaultValue={selectedItem?.estadoCivil} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="">Selecione...</option><option value="Solteiro(a)">Solteiro(a)</option><option value="Casado(a)">Casado(a)</option><option value="Divorciado(a)">Divorciado(a)</option><option value="Viúvo(a)">Viúvo(a)</option><option value="União Estável">União Estável</option></select></div>
                    </div>
                  </div>

                  {/* 3. DOCUMENTAÇÃO */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider border-b pb-2">3. Documentação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">CPF *</label><input type="text" name="cpf" defaultValue={formatCPF_RG_OnLoad(selectedItem?.cpf)} onChange={handleMaskCPF_RG} placeholder="000.000.000-00" maxLength={14} required className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" /></div>
                      <div>
                        <div className="flex justify-between items-end"><label className="block text-xs font-bold text-gray-700 mb-1">RG / Identidade</label><span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mb-1">Padrão CIN</span></div>
                        <input type="text" name="rg" defaultValue={formatCPF_RG_OnLoad(selectedItem?.rg)} onChange={handleMaskCPF_RG} placeholder="000.000.000-00" maxLength={14} className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" />
                      </div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">PIS/PASEP</label><input type="text" name="pis" defaultValue={selectedItem?.pis} className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Título Eleitoral</label><input type="text" name="tituloEleitoral" defaultValue={selectedItem?.tituloEleitoral} className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50" /></div>
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA (DADOS INSTITUCIONAIS) */}
                <div className="space-y-8">
                  {/* 4. INFORMAÇÕES CONTRATUAIS */}
                  <div className="bg-[#0f2a4a]/5 p-5 rounded-xl border border-[#0f2a4a]/20 shadow-sm space-y-4">
                    <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider border-b border-[#0f2a4a]/20 pb-2">4. Informações Contratuais (Vínculo)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2"><label className="block text-xs font-bold text-[#0f2a4a] mb-1">Natureza do Vínculo</label><select name="vinculo" defaultValue={selectedItem?.vinculo || ""} className="w-full px-3 py-2 border border-[#0f2a4a]/30 rounded-md text-sm bg-white"><option value="">Selecione...</option><option value="Efetivo / Concursado">Efetivo / Concursado</option><option value="Contratado (Processo Seletivo)">Contratado (Processo Seletivo)</option><option value="Cargo Comissionado">Cargo Comissionado</option><option value="Estagiário">Estagiário</option></select></div>
                      
                      <div>
                        <label className="block text-xs font-bold text-[#0f2a4a] mb-1">Data de Admissão</label>
                        <input type="date" name="dataAdmissao" defaultValue={selectedItem?.dataAdmissao} onChange={(e) => setTempoServicoLive(calcularTempoServico(e.target.value))} className="w-full px-3 py-2 border border-[#0f2a4a]/30 rounded-md text-sm bg-white" />
                        <div className="mt-1.5 text-xs text-gray-500 font-bold bg-white px-2 py-1 rounded border border-gray-200">
                          Tempo: <span className="text-[#0f2a4a]">{selectedItem?.dataAdmissao && tempoServicoLive === "Preencha a data..." ? calcularTempoServico(selectedItem.dataAdmissao) : tempoServicoLive}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
                        <div><label className="block text-xs font-bold text-red-800 mb-1">Data de Desligamento</label><input type="date" name="dataDesligamento" defaultValue={selectedItem?.dataDesligamento} className="w-full px-3 py-1.5 border-red-300 rounded-md text-sm bg-white" /></div>
                        <div><label className="block text-xs font-bold text-red-800 mb-1">Motivo / Processo de Saída</label><input type="text" name="motivoDesligamento" defaultValue={selectedItem?.motivoDesligamento} placeholder="Ex: Exoneração a pedido (Proc. 123/24)" className="w-full px-3 py-1.5 border-red-300 rounded-md text-sm bg-white" /></div>
                      </div>
                    </div>
                  </div>

                  {/* 5. CARGO E LOTAÇÃO */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider border-b border-gray-200 pb-2">5. Cargo e Lotação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* NOVO CAMPO INTELIGENTE DE CARGOS COM DATALIST */}
                      <div className="md:col-span-2 relative">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Cargo Atual *</label>
                        <input type="text" name="cargo" list="lista-cargos" defaultValue={selectedItem?.cargo} required placeholder="Digite ou selecione o cargo..." className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 focus:bg-white uppercase outline-none focus:ring-2 focus:ring-blue-500" />
                        <datalist id="lista-cargos">
                          {cargosCadastrados.map(c => <option key={c.id} value={c.nome} />)}
                        </datalist>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Lotação Atual (Unidade) *</label>
                        <select name="centerId" defaultValue={selectedItem?.centerId || ""} required className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="">Selecione a Unidade...</option>{unidades.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                      </div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Escala Padrão *</label><select name="escala" defaultValue={selectedItem?.escala || "5x2 - Administrativo"} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"><option value="5x2 - Administrativo">5x2 - Administrativo (8h)</option><option value="12x36 - Plantonista">12x36 - Plantonista</option></select></div>
                      {selectedItem && (<div><label className="block text-xs font-bold text-gray-700 mb-1">Status na Plataforma *</label><select name="status" defaultValue={selectedItem.status} className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 text-red-600 font-bold"><option value="ATIVO">SISTEMA LIBERADO (ATIVO)</option><option value="INATIVO">SISTEMA BLOQUEADO (INATIVO)</option></select></div>)}
                    </div>
                  </div>

                  {/* JUSTIFICATIVA DE AUDITORIA */}
                  <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
                    <label className="block text-xs font-black text-amber-900 mb-1 uppercase tracking-wider">Justificativa da Ação (Auditoria) *</label>
                    <textarea name="observacao" required rows={2} placeholder="Ex: Cadastro inicial..." className="w-full px-3 py-2 border-amber-300 rounded-md text-sm bg-white focus:ring-amber-500"></textarea>
                  </div>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" form="formServidor" disabled={loading} className="px-6 py-2.5 bg-[#0f2a4a] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors shadow-md">
                {loading ? "Processando..." : (selectedItem ? "Salvar Alterações" : "Efetivar Matrícula")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: FICHA FUNCIONAL E FÉRIAS */}
      {isModalOpen && modalType === "FICHA_FUNCIONAL" && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-[#0f2a4a] text-lg">Ficha Funcional Eletrónica</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedItem.nome} - {selectedItem.cargo}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* COLUNA ESQUERDA: FÉRIAS E AFASTAMENTOS */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 border-b pb-2">Programar Férias ou Licença</h4>
                    <form onSubmit={handleEventoAusenciaSubmit} className="space-y-3">
                      <input type="hidden" name="servidorId" value={selectedItem.id} />
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Evento</label><select name="tipo" required className="w-full px-3 py-2 border rounded-md text-sm"><option value="">Selecione...</option><option value="FÉRIAS">Férias Regulamentares</option><option value="LICENÇA MATERNIDADE/PATERNIDADE">Licença Maternidade/Paternidade</option><option value="LICENÇA SAÚDE">Licença Saúde (Superior 15 dias)</option><option value="LICENÇA PRÊMIO">Licença Prêmio</option><option value="AFASTAMENTO">Afastamento Diversos</option></select></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Data Início</label><input type="date" name="dataInicio" required className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Data Retorno</label><input type="date" name="dataFim" required className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                      </div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Portaria / Observação</label><input type="text" name="observacao" placeholder="Ex: Portaria nº 45/2024" className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:bg-blue-700 mt-2">Lançar no Sistema</button>
                    </form>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 border-b pb-2">Histórico de Ausências</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {eventosCadastrados.filter(e => e.servidorId === selectedItem.id).length === 0 ? (
                        <p className="text-xs text-gray-500 italic text-center py-4">Nenhum evento registrado.</p>
                      ) : (
                        eventosCadastrados.filter(e => e.servidorId === selectedItem.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(evento => {
                          const dtInicio = new Date(evento.dataInicio).toLocaleDateString('pt-BR');
                          const dtFim = new Date(evento.dataFim).toLocaleDateString('pt-BR');
                          return (
                            <div key={evento.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 border-l-4 border-l-blue-500">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-[10px] uppercase text-blue-700">{evento.tipo}</span>
                                <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded">{evento.status}</span>
                              </div>
                              <p className="text-xs font-bold text-gray-800">{dtInicio} a {dtFim}</p>
                              {evento.observacao && <p className="text-xs text-gray-500 mt-1 font-medium">{evento.observacao}</p>}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: LINHA DO TEMPO (AUDIT) */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-black text-[#0f2a4a] text-sm uppercase tracking-wider mb-4 border-b pb-2">Linha do Tempo Funcional</h4>
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 max-h-[500px] overflow-y-auto py-2">
                    {historicoFuncional.length === 0 ? (
                      <p className="text-xs text-gray-500 italic ml-4">Sem registos no histórico.</p>
                    ) : (
                      historicoFuncional.map(log => {
                        const dataLog = new Date(log.createdAt).toLocaleString('pt-BR');
                        const isAdmissao = log.acao === "ADMISSAO";
                        const isMudanca = log.acao === "MUDANCA_CARGO_LOTACAO";
                        return (
                          <div key={log.id} className="relative pl-6">
                            <div className={`absolute -left-2 top-0.5 w-4 h-4 rounded-full border-2 border-white ${isAdmissao ? 'bg-green-500' : isMudanca ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                            <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg shadow-sm">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{dataLog}</span>
                              <h5 className={`text-xs font-black uppercase ${isAdmissao ? 'text-green-700' : isMudanca ? 'text-purple-700' : 'text-[#0f2a4a]'}`}>{log.acao.replace(/_/g, ' ')}</h5>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{log.observacao}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRATAR PONTO */}
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

      {/* MODAL: VER ATESTADO */}
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
            
            <div className="p-6 overflow-auto bg-gray-100 flex-1 flex justify-center items-center min-h-[40vh]">
              {selectedItem.anexo.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedItem.anexo} alt="Atestado" className="max-w-full rounded-lg shadow-md border border-gray-300 object-contain max-h-[60vh]" />
              ) : (
                <iframe src={selectedItem.anexo} className="w-full h-[60vh] rounded-lg shadow-md border border-gray-300 bg-white" title="Documento PDF" />
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 hidden sm:block">
                <span className="text-gray-500 font-medium">Situação da Análise:</span> <span className={`font-black uppercase tracking-wider ml-1 ${selectedItem.status === 'APROVADO' ? 'text-green-600' : selectedItem.status === 'REJEITADO' ? 'text-red-600' : 'text-amber-600'}`}>{selectedItem.status}</span>
              </div>
              
              <form onSubmit={handleAvaliarAtestado} className="flex w-full sm:w-auto gap-3">
                <input type="hidden" name="id" value={selectedItem.id} />
                <button type="submit" name="status" value="REJEITADO" className="flex-1 sm:flex-none bg-white hover:bg-red-50 border-2 border-red-200 text-red-600 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm focus:ring-4 focus:ring-red-100">Rejeitar</button>
                <button type="submit" name="status" value="APROVADO" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 focus:ring-4 focus:ring-green-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>Aprovar Atestado</button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}