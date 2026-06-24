// app/dashboard/pia/[id]/page.tsx
import { db } from "../../../../../db";
import { atendimentos, evolucoesPia } from "../../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function EvolucaoPiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const atendimentoQuery = await db.select().from(atendimentos).where(eq(atendimentos.id, id));
  const atendimento = atendimentoQuery[0];
  if (!atendimento) redirect("/dashboard/pia");

  const evolucoes = await db.select().from(evolucoesPia).where(eq(evolucoesPia.atendimentoId, id)).orderBy(desc(evolucoesPia.dataRegistro));

  // Ação de Servidor Integrada (Salvar Relatório)
  async function salvarEvolucao(formData: FormData) {
    "use server";
    const autor = formData.get("autor") as string;
    const tipo = formData.get("tipo") as any;
    const relato = formData.get("relato") as string;

    await db.insert(evolucoesPia).values({
      id: crypto.randomUUID(),
      atendimentoId: id,
      autor,
      tipo,
      relato,
      dataRegistro: new Date()
    });

    revalidatePath(`/dashboard/pia/${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="FASE" width={40} height={40} />
          <div>
            <h1 className="text-xl font-bold text-[#0f2a4a]">Prontuário Digital (PIA)</h1>
            <p className="text-xs text-gray-500 font-bold uppercase">ID: {atendimento.id.substring(0, 8)}</p>
          </div>
        </div>
        <Link href="/dashboard/pia" className="text-sm font-bold text-[#0f2a4a] hover:underline">&larr; Voltar à Lista</Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Formulário de Registro Técnico */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-black text-gray-800 text-lg mb-4">Adicionar Evolução</h2>
            <form action={salvarEvolucao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Profissional</label>
                <input type="text" name="autor" required placeholder="Ex: Dr. Silva" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Área Técnica</label>
                <select name="tipo" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white">
                  <option value="PSICOLOGIA">Psicologia</option>
                  <option value="SERVIÇO SOCIAL">Serviço Social</option>
                  <option value="SAÚDE">Enfermagem / Medicina</option>
                  <option value="PEDAGOGIA">Pedagogia / Escola</option>
                  <option value="JURÍDICO">Acompanhamento Jurídico</option>
                  <option value="SEGURANÇA">Monitoria / Segurança</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Relato do Atendimento</label>
                <textarea name="relato" required rows={5} placeholder="Descreva o comportamento ou atendimento realizado..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white"></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md active:scale-95 transition-transform">
                Gravar no Prontuário
              </button>
            </form>
          </div>
        </div>

        {/* Linha do Tempo de Evoluções */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="font-black text-gray-800 text-lg mb-1">Linha do Tempo Multidisciplinar</h2>
            <p className="text-sm text-gray-500 mb-6">Histórico imutável de acompanhamentos deste adolescente.</p>
            
            <div className="space-y-6 border-l-2 border-gray-200 ml-3 pl-6 relative">
              {evolucoes.length === 0 ? (
                <p className="text-sm text-gray-400 font-medium italic">Nenhum atendimento registrado ainda.</p>
              ) : (
                evolucoes.map(ev => {
                  const dataFormatada = new Date(ev.dataRegistro).toLocaleString('pt-BR');
                  // Define as cores por área técnica
                  let cor = "bg-gray-500";
                  if (ev.tipo === 'PSICOLOGIA') cor = "bg-purple-500";
                  if (ev.tipo === 'SERVIÇO SOCIAL') cor = "bg-green-500";
                  if (ev.tipo === 'SAÚDE') cor = "bg-red-500";
                  if (ev.tipo === 'PEDAGOGIA') cor = "bg-blue-500";
                  if (ev.tipo === 'JURÍDICO') cor = "bg-amber-600";
                  
                  return (
                    <div key={ev.id} className="relative">
                      {/* Ponto na linha do tempo */}
                      <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm ${cor}`}></div>
                      
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] font-black tracking-widest text-white px-2 py-0.5 rounded-sm uppercase ${cor}`}>
                              {ev.tipo}
                            </span>
                            <h4 className="font-bold text-gray-800 mt-1">{ev.autor}</h4>
                          </div>
                          <span className="text-xs font-mono text-gray-400 font-bold">{dataFormatada}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ev.relato}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}