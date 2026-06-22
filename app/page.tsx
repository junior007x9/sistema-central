import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 p-4">
      <div className="max-w-3xl w-full text-center space-y-8 flex flex-col items-center">
        
        {/* Logomarca da FASE - Agora livre, sem o fundo branco, apenas com uma sombra elegante */}
        <div className="mb-2 relative">
          <Image
            src="/logo.png"
            alt="Logomarca FASE/MA"
            width={340} // Aumentei um pouco para dar mais destaque
            height={340}
            className="drop-shadow-2xl hover:scale-105 transition-transform duration-700 object-contain"
            priority
          />
        </div>

        {/* Textos Institucionais e Bandeira */}
        <div className="space-y-4 mt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f2a4a] tracking-tight drop-shadow-sm">
            Sistema Central de Gestão
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-gray-600 uppercase tracking-wider">
            Fundação de Atendimento Socioeducativo do Maranhão
          </h2>
          
          {/* Linha com a Bandeira e o Texto do Governo */}
          <div className="flex items-center justify-center space-x-3 pt-6 w-max mx-auto">
            {/* Imagem da Bandeira do Maranhão puxada direto do repositório oficial */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Bandeira_do_Maranh%C3%A3o.svg" 
              alt="Bandeira do Maranhão" 
              className="w-10 shadow-md border border-gray-300 rounded-sm"
            />
            <p className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-widest">
              Governo do Estado do Maranhão
            </p>
          </div>
        </div>

        {/* Botão de Acesso */}
        <div className="pt-10">
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-[#0f2a4a] hover:bg-[#1a3a6a] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 hover:shadow-2xl ring-4 ring-blue-900/10"
          >
            Acessar o Sistema
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
      </div>

      {/* Rodapé institucional */}
      <footer className="absolute bottom-6 text-xs font-medium text-gray-400">
        &copy; {new Date().getFullYear()} FASE/MA - Sistema desenvolvido para controle de unidades socioeducativas.
      </footer>
    </div>
  );
}