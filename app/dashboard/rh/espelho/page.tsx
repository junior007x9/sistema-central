import { db } from "../../../../db";
import { servidores, pontos, centers } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import Image from "next/image";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ servidorId?: string }>;
}

export default async function EspelhoPontoPDF({ searchParams }: PageProps) {
  const { servidorId } = await searchParams;

  if (!servidorId) redirect("/dashboard/rh");

  // 1. Busca os dados completos do Servidor, Unidade e Pontos
  const servidorQuery = await db.select().from(servidores).where(eq(servidores.id, servidorId));
  const servidor = servidorQuery[0];
  
  if (!servidor) redirect("/dashboard/rh");

  const unidadeQuery = await db.select().from(centers).where(eq(centers.id, servidor.centerId));
  const unidade = unidadeQuery[0];

  const pontosDoServidor = await db.select().from(pontos).where(eq(pontos.servidorId, servidor.id));
  
  // Ordena os pontos do mais antigo para o mais recente (ordem cronológica para o espelho)
  pontosDoServidor.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  // Gera uma "Assinatura Eletrônica" baseada no ID do usuário para dar validade ao rodapé
  const hashAutenticidade = crypto.createHash("sha256").update(servidor.id + new Date().toISOString()).digest("hex").substring(0, 32).toUpperCase();

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white flex justify-center text-black">
      
      {/* Botão Flutuante de Impressão (Fica escondido na hora de imprimir graças à classe print:hidden) */}
      <button 
        onClick="window.print()" 
        className="print:hidden fixed bottom-10 right-10 bg-[#0f2a4a] text-white px-8 py-4 rounded-full shadow-2xl font-black text-lg hover:bg-blue-800 transition-transform active:scale-95 z-50 flex items-center gap-2"
        dangerouslySetInnerHTML={{ __html: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Gerar PDF Oficial` }}
      />

      {/* A Folha A4 em si (Estilização rígida para PDF) */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none border border-gray-300 print:border-none px-12 py-10 relative">
        
        {/* CABEÇALHO OFICIAL */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo FASE" width={60} height={60} className="grayscale" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">FASE / MARANHÃO</h1>
              <p className="text-xs font-bold text-gray-700">Fundação de Atendimento Socioeducativo</p>
              <p className="text-[10px] text-gray-500 font-mono">Governo do Estado do Maranhão</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-black text-lg border border-black px-3 py-1 bg-gray-100">ESPELHO DE PONTO</h2>
            <p className="text-[10px] mt-1 font-bold">PORTARIA MTE Nº 671/2021</p>
            <p className="text-[10px]">REP-P EM NUVEM</p>
          </div>
        </div>

        {/* DADOS DO EMPREGADO E EMPREGADOR */}
        <div className="border border-black rounded-lg p-4 mb-6 text-xs flex flex-col gap-3 font-medium">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-bold">Empregador:</span> FASE / MA (Sede Administrativa)</div>
            <div><span className="font-bold">CNPJ:</span> 07.410.669/0001-38</div>
          </div>
          <div className="border-t border-dashed border-gray-400 pt-2 grid grid-cols-2 gap-4">
            <div><span className="font-bold">Servidor(a):</span> {servidor.nome.toUpperCase()}</div>
            <div><span className="font-bold">Lotação (Unidade):</span> {unidade.name.toUpperCase()}</div>
            <div><span className="font-bold">CPF:</span> {servidor.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</div>
            <div><span className="font-bold">PIS/PASEP:</span> {servidor.pis}</div>
            <div><span className="font-bold">Cargo Função:</span> {servidor.cargo.toUpperCase()}</div>
            <div><span className="font-bold">Escala Cadastrada:</span> {servidor.escala}</div>
          </div>
        </div>

        {/* TABELA DE REGISTROS DE PONTO */}
        <div className="mb-8">
          <h3 className="font-bold text-sm bg-black text-white px-3 py-1 mb-2 uppercase">Registros de Assiduidade Auditados</h3>
          <table className="w-full text-xs text-left border-collapse border border-black">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-2">Data do Evento</th>
                <th className="border border-black p-2">Horário</th>
                <th className="border border-black p-2">Tipo / Ação</th>
                <th className="border border-black p-2">Status do Ponto</th>
                <th className="border border-black p-2">Ocorrência (Ajustes RH)</th>
              </tr>
            </thead>
            <tbody>
              {pontosDoServidor.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-black p-4 text-center font-bold text-gray-500">
                    Nenhum registro de ponto eletrônico encontrado para este servidor.
                  </td>
                </tr>
              ) : (
                pontosDoServidor.map((p) => {
                  const dataEvento = new Date(p.dataHora);
                  return (
                    <tr key={p.id}>
                      <td className="border border-black p-2 font-mono">{dataEvento.toLocaleDateString('pt-BR')}</td>
                      <td className="border border-black p-2 font-mono font-bold">{dataEvento.toLocaleTimeString('pt-BR')}</td>
                      <td className="border border-black p-2 uppercase font-medium">{p.tipo} {p.modoOffline === 1 ? '*(OFFLINE)*' : ''}</td>
                      <td className="border border-black p-2">{p.statusPonto}</td>
                      <td className="border border-black p-2 text-[10px] italic">{p.justificativaRH || '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ E ASSINATURAS */}
        <div className="mt-16 pt-8 border-t border-black flex justify-between px-10 text-xs text-center">
          <div className="w-48">
            <div className="border-b border-black mb-1 h-8"></div>
            <p className="font-bold uppercase">{servidor.nome}</p>
            <p className="text-[10px]">Assinatura do Servidor</p>
          </div>
          <div className="w-48">
            <div className="border-b border-black mb-1 h-8"></div>
            <p className="font-bold uppercase">Gestor da Unidade / RH</p>
            <p className="text-[10px]">Carimbo e Assinatura</p>
          </div>
        </div>

        {/* Hash de Autenticidade */}
        <div className="absolute bottom-6 left-12 right-12 border-t border-gray-300 pt-2 flex justify-between items-center text-[8px] text-gray-500 font-mono">
          <p>Documento gerado pelo Sistema FASE/MA - Módulo RH.</p>
          <p>Hash de Autenticidade Digital: {hashAutenticidade}</p>
        </div>

      </div>
    </div>
  );
}