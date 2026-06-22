"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { salvarUnidadeAction, excluirUnidadeAction, salvarUsuarioAction, excluirUsuarioAction } from "./actions";

type Tab = "UNIDADES" | "USUARIOS" | "AUDITORIA";

export default function GerenciamentoClient({ unidades, usuarios, auditoria }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("UNIDADES");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estados para os Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"UNIDADE" | "USUARIO" | "EXCLUIR_UNIDADE" | "EXCLUIR_USUARIO" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fecha o modal e limpa as mensagens
  function closeModal() {
    setIsModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setMessage(null);
  }

  // Ação genérica de submissão dos formulários (CRIAR / EDITAR)
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    let result;

    if (modalType === "UNIDADE") result = await salvarUnidadeAction(formData);
    if (modalType === "USUARIO") result = await salvarUsuarioAction(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      closeModal();
      router.refresh(); // Atualiza os dados na tela instantaneamente
    }
    setLoading(false);
  }

  // Ação genérica de Exclusão
  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const observacao = formData.get("observacao") as string;
    let result;

    if (modalType === "EXCLUIR_UNIDADE") result = await excluirUnidadeAction(selectedItem.id, selectedItem.name, observacao);
    if (modalType === "EXCLUIR_USUARIO") result = await excluirUsuarioAction(selectedItem.id, selectedItem.email, observacao);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      closeModal();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Cabeçalho e Abas de Navegação */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex space-x-2">
          <button onClick={() => setActiveTab("UNIDADES")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "UNIDADES" ? "bg-[#0f2a4a] text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>Unidades</button>
          <button onClick={() => setActiveTab("USUARIOS")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "USUARIOS" ? "bg-[#0f2a4a] text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>Usuários</button>
          <button onClick={() => setActiveTab("AUDITORIA")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "AUDITORIA" ? "bg-amber-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>Log de Auditoria</button>
        </div>
        
        <Link href="/dashboard" className="text-sm font-bold text-[#0f2a4a] hover:underline flex items-center">
          &larr; Voltar ao Painel Central
        </Link>
      </div>

      <div className="p-6">
        {/* ABA: UNIDADES */}
        {activeTab === "UNIDADES" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Unidades Socioeducativas</h3>
              <button onClick={() => { setModalType("UNIDADE"); setIsModalOpen(true); }} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1a3a6a] transition-colors">+ Nova Unidade</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Unidade</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unidades.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => { setSelectedItem(u); setModalType("UNIDADE"); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900">Editar</button>
                        <button onClick={() => { setSelectedItem(u); setModalType("EXCLUIR_UNIDADE"); setIsModalOpen(true); }} className="text-red-600 hover:text-red-900">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: USUÁRIOS */}
        {activeTab === "USUARIOS" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Usuários do Sistema</h3>
              <button onClick={() => { setModalType("USUARIO"); setIsModalOpen(true); }} className="bg-[#0f2a4a] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1a3a6a] transition-colors">+ Novo Usuário</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Unidade Vinculada</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unidades.find((c: any) => c.id === u.centerId)?.name || "Central (Sem vínculo)"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => { setSelectedItem(u); setModalType("USUARIO"); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900">Editar</button>
                        <button onClick={() => { setSelectedItem(u); setModalType("EXCLUIR_USUARIO"); setIsModalOpen(true); }} className="text-red-600 hover:text-red-900">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: AUDITORIA */}
        {activeTab === "AUDITORIA" && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Registro de Auditoria Institucional</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ação</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alvo Modificado</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Justificativa (Observação)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditoria.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.acao === 'CRIAR' ? 'bg-green-100 text-green-800' : log.acao === 'EDITAR' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                          {log.acao} {log.entidade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{log.detalhe}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-md truncate" title={log.observacao}>{log.observacao}</td>
                    </tr>
                  ))}
                  {auditoria.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Nenhum registro de auditoria encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL GLOBAL (CRIAR/EDITAR) */}
      {isModalOpen && (modalType === "UNIDADE" || modalType === "USUARIO") && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0f2a4a]">
                {selectedItem ? `Editar ${modalType === "UNIDADE" ? "Unidade" : "Usuário"}` : `Novo(a) ${modalType === "UNIDADE" ? "Unidade" : "Usuário"}`}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{message.text}</div>}
              
              {/* Se estiver editando, envia o ID oculto */}
              {selectedItem && <input type="hidden" name="id" value={selectedItem.id} />}

              {/* Campos para Unidade */}
              {modalType === "UNIDADE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Oficial da Unidade</label>
                  <input type="text" name="name" defaultValue={selectedItem?.name} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0f2a4a]" />
                </div>
              )}

              {/* Campos para Usuário */}
              {modalType === "USUARIO" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">E-mail Institucional</label>
                    <input type="email" name="email" defaultValue={selectedItem?.email} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0f2a4a]" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Senha {selectedItem && <span className="text-xs text-gray-400 font-normal">(Deixe em branco para não alterar)</span>}</label>
                    <input type="password" name="password" required={!selectedItem} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0f2a4a]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Perfil</label>
                      <select name="role" defaultValue={selectedItem?.role || "UNIT"} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0f2a4a]">
                        <option value="UNIT">Unidade</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Vincular à Unidade</label>
                      <select name="centerId" defaultValue={selectedItem?.centerId || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0f2a4a]">
                        <option value="">Nenhuma (Central)</option>
                        {unidades.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* CAMPO OBRIGATÓRIO DE AUDITORIA */}
              <div className="pt-2 border-t border-gray-200 mt-4">
                <label className="block text-sm font-bold text-amber-700 mb-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                  Justificativa / Observação Obrigatória
                </label>
                <textarea name="observacao" required rows={2} placeholder="Ex: Correção de nomeclatura, Atualização de dados da unidade..." className="w-full px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-md focus:ring-2 focus:ring-amber-500"></textarea>
                <p className="text-xs text-gray-500 mt-1">Este motivo ficará salvo no log permanente de auditoria governamental.</p>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0f2a4a] text-white hover:bg-[#1a3a6a] rounded-lg font-bold transition-colors shadow-md">{loading ? "Salvando..." : "Confirmar e Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {isModalOpen && (modalType === "EXCLUIR_UNIDADE" || modalType === "EXCLUIR_USUARIO") && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-red-600 flex items-center mb-4">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                Confirmar Exclusão
              </h3>
              <p className="text-gray-700 mb-2">Tem certeza que deseja excluir este registro permanentemente?</p>
              <p className="font-bold text-gray-900 bg-gray-100 p-2 rounded mb-6 text-center">{modalType === "EXCLUIR_UNIDADE" ? selectedItem.name : selectedItem.email}</p>
              
              <form onSubmit={handleDelete} className="space-y-4">
                {message && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{message.text}</div>}
                
                <div>
                  <label className="block text-sm font-bold text-amber-700 mb-1 flex items-center">
                    Justificativa Obrigatória para a Exclusão
                  </label>
                  <input type="text" name="observacao" required placeholder="Ex: Unidade desativada, Funcionário desligado..." className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 text-white hover:bg-red-800 rounded-lg font-bold transition-colors shadow-md">{loading ? "Processando..." : "Excluir Definitivamente"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}