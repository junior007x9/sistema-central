"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function UnitSelector({ units }: { units: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCenterId = searchParams?.get("centerId") || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (id) {
      router.push(`/dashboard?centerId=${id}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8">
      <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
        Selecionar Unidade para Visualização:
      </label>
      <select
        value={currentCenterId}
        onChange={handleChange}
        className="w-full sm:w-80 px-3 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2a4a] text-sm font-semibold shadow-sm"
      >
        <option value="">Todos os Centros (Consolidado Geral)</option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>
    </div>
  );
}