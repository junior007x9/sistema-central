"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { salvarServidorAction, tratarPontoAction, gerarArquivoAFDAction } from "./actions";

type Tab = "INDICADORES" | "SERVIDORES" | "ESPELHO" | "ESCALAS" | "FISCAL";

export default function RHClient({ unidades, servidores, pontos }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("INDICADORES"); // Agora a aba padrão é o Dashboard
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filtroUnidade, setFiltroUnidade] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"MANUTENCAO_SERVIDOR" | "TRATAR_PONTO" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  // ==========================================
  // LÓGICA DO DASHBOARD DE INDICADORES DO RH
  // ==========================================
  
  // 1. Aplica o filtro de unidade nos dados
  const servs = servidores.filter((s:any) => !filtroUnidade || s.centerId === filtroUnidade);
  const pts = pontos.filter((p:any) => !filtroUnidade || p.centerId === filtroUnidade);

  // 2. Cálculos Numéricos
  const totalAtivos = servs.filter((s:any) => s.status === 'ATIVO').length;
  const hojeStr = new Date().toDateString();
  const ptsHoje = pts.filter((p:any) => new Date(p.dataHora).toDateString() === hojeStr).length;

  const ptsNormais = pts.filter((p:any) => p.statusPonto === 'NORMAL').length;
  const ptsJustificados = pts.filter((p:any) => p.statusPonto === 'JUSTIFICADO').length;
  const ptsAbonos = pts.filter((p:any) => p.statusPonto === 'ABONO').length;
  const totalPts = pts.length;

  // 3. Agrupamento de Escalas de Trabalho
  const contagemEscalas = servs.reduce((acc: any, s:any) => {
    acc[s.escala] = (acc[s.escala] || 0) + 1;
    return acc;
  }, {});

  // Componente Visual de Barra de Progresso do RH
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
          <button onClick={() => setActiveTab("INDICADORES")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "INDICADORES" ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Indicadores e Painel</button>
          <button onClick={() => setActiveTab("SERVIDORES")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "SERVIDORES" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Quadro de Servidores</button>
          <button onClick={() => setActiveTab("ESPELHO")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "ESPELHO" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Espelho de Ponto</button>
          <button onClick={() => setActiveTab("ESCALAS")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "ESCALAS" ? "bg-[#0f2a4a] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Cálculos e Escalas</button>
          <button onClick={() => setActiveTab("FISCAL")} className={`px-4 py-2 text-sm font-bold rounded-lg ${activeTab === "FISCAL" ? "bg-amber-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>Módulo MTE 671</button>
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
        
        {/* NOVA TAB: DASHBOARD E INDICADORES ANALÍTICOS */}
        {activeTab === "INDICADORES" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Linha 1: Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0f2a4a] text-white p-5 rounded-xl shadow-md border border-gray-800">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Força de Trabalho</div>
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-black">{totalAtivos}</span>
                  <span className="text-sm font-medium text-blue-300 mb-1">Servidores Ativos</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Dinâmica de Hoje</div>
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-black text-blue-600">{ptsHoje}</span>
                  <span className="text-sm font-bold text-gray-500 mb-1">Marcações Diárias</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Tratamentos RH</div>
                <div className="flex justify-between items-end">
                  <span className="text-5xl font-black text-amber-500">{ptsJustificados + ptsAbonos}</span>
                  <span className="text-sm font-bold text-gray-500 mb-1">Pontos Ajustados</span>
                </div>
              </div>
            </div>

            {/* Linha 2: Gráficos de Barras */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Gráfico de Absenteísmo e Ocorrências */}
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-[#0f2a4a] border-b border-gray-200 pb-2 mb-4">Análise de Ocorrências do Ponto</h3>
                <div className="space-y-4">
                  <ProgressBar label="Marcações Normais (Totem)" valor={ptsNormais} total={totalPts} color="bg-green-500" />
                  <ProgressBar label="Inconsistências Justificadas" valor={ptsJustificados} total={totalPts} color="bg-blue-500" />
                  <ProgressBar label="Índice de Absenteísmo (Atestados/Abonos)" valor={ptsAbonos} total={totalPts} color="bg-red-500" />
                </div>
              </div>

              {/* Gráfico de Escalas */}
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-[#0f2a4a] border-b border-gray-200 pb-2 mb-4">Distribuição de Escalas de Trabalho</h3>
                <div className="space-y-4">
                  {Object.keys(contagemEscalas).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Nenhum servidor cadastrado na seleção atual.</p>
                  ) : (
                    Object.entries(contagemEscalas).map(([escala, quantidade]) => (
                      <ProgressBar key={escala} label={escala} valor={quantidade as number} total={servs.length} color="bg-[#0f2a4a]" />
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 1: QUADRO DE SERVIDORES */}
        {activeTab === "SERVIDORES" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Quadro Corporativo FASE/MA</h3>
              <button onClick={() => { setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1a3a6a]">+ Cadastrar Servidor</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">CPF / PIS</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Cargo</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Escala Regular</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {servs.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{s.nome}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">CPF: {s.cpf}<br/>PIS: {s.pis || 'Não cadastrado'}</td>
                      <td className="px-6 py-4 text-gray-900">{s.cargo}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{s.escala}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span></td>
                      <td className="px-6 py-4 text-right space-x-4">
                        <button onClick={() => { setSelectedItem(s); setModalType("MANUTENCAO_SERVIDOR"); setIsModalOpen(true); }} className="text-blue-600 hover:underline font-bold">Editar</button>
                        <a href={`/dashboard/rh/espelho?servidorId=${s.id}`} target="_blank" className="text-green-700 hover:text-green-900 hover:underline font-bold inline-flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          Espelho PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ESPELHO DE PONTO (TRATAMENTO DE INCONSISTÊNCIAS) */}
        {activeTab === "ESPELHO" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tratamento de Ponto Eletrônico Auditado</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Marcação Original</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Servidor</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Evento</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Geolocalização / Segurança</th>
                    <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase">Status do Ponto</th>
                    <th className="px-6 py-3 text-right font-bold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pts.map((p: any) => {
                    const servidor = servidores.find((s:any) => s.id === p.servidorId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-bold text-[#0f2a4a]">{new Date(p.dataHora).toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium">{servidor?.nome || 'Desconhecido'}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.tipo}</span></td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {p.latitude ? `Lat: ${p.latitude}, Long: ${p.longitude}` : "Dispositivo Fixo (Tablet)"}
                          {p.modoOffline === 1 && <span className="block text-amber-600 font-bold">⚠️ Sincronizado Offline</span>}
                        </td>
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

        {/* TAB 3: AUTOMATIZAÇÃO E ESCALAS DE JORNADA */}
        {activeTab === "ESCALAS" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-800">Parametrização de Escalas e Banco de Horas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-sm text-[#0f2a4a] mb-2">Escala Socioeducativa 12x36h</h4>
                <p className="text-xs text-gray-500 mb-4">Aplicada rotineiramente a Monitores e Plantonistas das Unidades de Internação da FASE.</p>
                <span className="text-xs font-bold text-green-700 bg-green-50 border px-2.5 py-1 rounded-md">Adicional Noturno Automatizado</span>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-sm text-[#0f2a4a] mb-2">Escala 5x2 (Administrativo)</h4>
                <p className="text-xs text-gray-500 mb-4">Jornada padrão de 8 horas diárias de segunda a sexta para equipes técnicas, psicólogos e diretores.</p>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border px-2.5 py-1 rounded-md">Banco de Horas Ativo</span>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#0f2a4a] mb-1">Integração Folha de Pagamento</h4>
                  <p className="text-xs text-gray-500">Mapeamento direto pronto para fechamento e exportação livre de erros manuais.</p>
                </div>
                <button disabled className="mt-4 w-full bg-gray-400 text-white text-xs font-bold py-2 rounded-lg cursor-not-allowed">Exportar p/ Sistema de Folha</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FISCALIZAÇÃO - PORTARIA 671 MTE */}
        {activeTab === "FISCAL" && (
          <div className="max-w-2xl bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-600 text-white rounded-lg font-bold">671</div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Módulo Fiscal de Auditoria Trabalhista</h3>
                <p className="text-sm text-amber-800">Em conformidade estrita com as exigências técnicas da Portaria 671 do Ministério do Trabalho e Emprego para sistemas de ponto REP-P em nuvem.</p>
              </div>
            </div>
            <div className="border-t border-amber-200 pt-4 space-y-3">
              <p className="text-xs text-gray-600 font-medium">O arquivo gerado abaixo contém o histórico imutável das marcações eletrônicas com o NSR (Número Seqüencial de Registro).</p>
              <button onClick={baixarArquivoAFD} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow shadow-amber-700/20">
                Gerar e Baixar Arquivo AFD (.TXT)
              </button>
            </div>
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
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo do Funcionário</label>
                <input type="text" name="nome" defaultValue={selectedItem?.nome} required className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CPF (Apenas Números)</label>
                  <input type="text" name="cpf" defaultValue={selectedItem?.cpf} required className="w-full px-3 py-2 border rounded-md font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">PIS / PASEP (Obrigatório 671)</label>
                  <input type="text" name="pis" defaultValue={selectedItem?.pis} required className="w-full px-3 py-2 border rounded-md font-mono text-sm" placeholder="Ex: 12345678901" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cargo Institucional</label>
                  <input type="text" name="cargo" defaultValue={selectedItem?.cargo} required className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ex: Monitor Socioeducativo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Escala de Trabalho</label>
                  <select name="escala" defaultValue={selectedItem?.escala || "5x2 - Administrativo"} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="5x2 - Administrativo">5x2 - Administrativo (8h)</option>
                    <option value="12x36 - Plantonista">12x36 - Plantonista Socioeducativo</option>
                    <option value="6x1 - Apoio Operacional">6x1 - Apoio Operacional</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lotação (Centro Socioeducativo)</label>
                <select name="centerId" defaultValue={selectedItem?.centerId || ""} required className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="">Selecione a unidade de destino...</option>
                  {unidades.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              {selectedItem && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Funcional</label>
                  <select name="status" defaultValue={selectedItem.status} className="w-full px-3 py-2 border rounded-md text-sm">
                    <option value="ATIVO">ATIVO (Permite batimento no Totem)</option>
                    <option value="INATIVO">INATIVO (Acesso bloqueado)</option>
                  </select>
                </div>
              )}
              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-amber-700 mb-1">Justificativa da Alteração (Auditoria de DP)</label>
                <textarea name="observacao" required rows={2} className="w-full px-3 py-2 bg-amber-50 border-amber-200 border rounded-md text-sm" placeholder="Escreva o motivo legal da criação/alteração desta matrícula corporativa..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-[#0f2a4a] text-white rounded-lg text-sm font-bold">{loading ? "Salvando..." : "Confirmar Matrícula"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: TRATAMENTO DE PONTO */}
      {isModalOpen && modalType === "TRATAR_PONTO" && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-[#0f2a4a]">Ajustar Marcação Eletrônica</h3>
              <button onClick={closeModal} className="text-gray-400 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleTratamentoSubmit} className="p-6 space-y-4">
              <input type="hidden" name="pontoId" value={selectedItem.id} />
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alterar Status Legal do Ponto</label>
                <select name="statusPonto" defaultValue={selectedItem.statusPonto} className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="NORMAL">NORMAL (Batimento via Leitor)</option>
                  <option value="JUSTIFICADO">JUSTIFICADO (Inconsistência justificada)</option>
                  <option value="ABONO">ABONO (Atestado Médico / Dispensa)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Texto de Impressão no Espelho de Ponto</label>
                <input type="text" name="justificativaRH" required className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Ex: Apresentou atestado CID-10, Esqueceu de bater entrada..." />
              </div>
              <div className="pt-2 border-t">
                <label className="block text-xs font-bold text-amber-700 mb-1">Motivação Interna (Log de Auditoria Geral)</label>
                <textarea name="observacaoAuditoria" required rows={2} className="w-full px-3 py-2 bg-amber-50 border-amber-200 border rounded-md text-sm" placeholder="Por que o RH está realizando esta alteração manual de ponto?..."></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold">{loading ? "Processando..." : "Aplicar Ajuste Fiscamente"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}