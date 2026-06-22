"use client";

import { useState } from "react";
import { submitAtendimentoAction } from "./actions";

export default function UnitForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await submitAtendimentoAction(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.success) {
      setMessage({ type: "success", text: "Atendimento registrado com sucesso! Os gráficos da central foram atualizados." });
      (event.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  // Componente reutilizável para caixas de seleção
  const SelectField = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <select 
        name={name} 
        required
        className="px-3 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f2a4a] focus:border-[#0f2a4a] text-sm"
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-xl text-[#0f2a4a] border-b border-gray-300 pb-3 mb-5">
          Cadastro Individual (Novo Atendimento)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField 
            label="Gênero" name="genero" 
            options={["Masculino", "Feminino", "Outros"]} 
          />
          <SelectField 
            label="Raça / Cor" name="racaCor" 
            options={["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não Informado"]} 
          />
          <SelectField 
            label="Faixa Etária" name="faixaEtaria" 
            options={["12 a 13 anos", "14 a 15 anos", "16 a 17 anos", "18 a 21 anos"]} 
          />
          <SelectField 
            label="Situação Processual (Reiteração)" name="situacaoProcessual" 
            options={["Primário", "Reincidente", "Reiterante"]} 
          />
          <SelectField 
            label="Religião" name="religiao" 
            options={["Católica", "Evangélica", "Matriz Africana", "Sem Religião", "Outras"]} 
          />
          <SelectField 
            label="Orientação Sexual" name="orientacaoSexual" 
            options={["Heterossexual", "Homossexual", "Bissexual", "Outros", "Não Informado"]} 
          />
          
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Município de Moradia</label>
            <input type="text" name="municipioMoradia" required placeholder="Ex: São Luís" className="px-3 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f2a4a]" />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">Município da Ocorrência Infracional</label>
            <input type="text" name="municipioOcorrencia" required placeholder="Ex: São José de Ribamar" className="px-3 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f2a4a]" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0f2a4a] hover:bg-[#1a3a6a] text-white px-8 py-3 rounded-lg font-bold shadow-md transition-colors disabled:bg-gray-400 text-lg w-full md:w-auto"
        >
          {loading ? "Registrando..." : "Registrar Adolescente"}
        </button>
      </div>
    </form>
  );
}