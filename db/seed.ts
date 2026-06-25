// db/seed.ts
import { db } from "./index";
import { centers, servidores, atendimentos, pontos, escalasPlantao } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("⏳ A iniciar a população do banco de dados (Seeding)...");

  // 1. Gerar o hash seguro da password "fase123" que os servidores vão utilizar
  const salt = await bcrypt.genSalt(10);
  const senhaPadrao = await bcrypt.hash("fase123", salt);

  // 2. Inserir Centros Socioeducativos Oficiais da FUNAC/MA
  console.log("🏢 A criar Estrutura Oficial de Centros Socioeducativos (FUNAC/MA)...");
  
  const idCanaa = crypto.randomUUID();
  const idCocais = crypto.randomUUID();
  const idTocantina = crypto.randomUUID();
  const idFlorescer = crypto.randomUUID();
  const idTimon = crypto.randomUUID();
  
  await db.insert(centers).values([
    { id: idCanaa, name: "Centro Socioeducativo de Internação Provisória - Canaã (São Luís)", createdAt: new Date() },
    { id: idCocais, name: "Centro Socioeducativo de Internação Provisória da Região dos Cocais", createdAt: new Date() },
    { id: idTocantina, name: "Centro Socioeducativo de Internação Provisória da Região Tocantina", createdAt: new Date() },
    { id: idFlorescer, name: "Centro Socioeducativo Florescer (Feminino)", createdAt: new Date() },
    { id: crypto.randomUUID(), name: "Centro Socioeducativo de Internação do Vinhais", createdAt: new Date() },
    { id: crypto.randomUUID(), name: "Centro Socioeducativo de Internação de São José de Ribamar", createdAt: new Date() },
    { id: crypto.randomUUID(), name: "Centro Socioeducativo Semear", createdAt: new Date() },
    { id: crypto.randomUUID(), name: "Casa de Semiliberdade Cidadã", createdAt: new Date() },
    { id: idTimon, name: "Casa de Semiliberdade de Timon", createdAt: new Date() }
  ]);

  // 3. Inserir Força de Trabalho (Servidores) com as senhas protegidas
  console.log("👨‍✈️ A registar Corpo Funcional Corporativo...");
  const idServidor1 = crypto.randomUUID();
  const idServidor2 = crypto.randomUUID();
  const idServidor3 = crypto.randomUUID();

  await db.insert(servidores).values([
    {
      id: idServidor1,
      cpf: "11122233344",
      pis: "12034958112",
      nome: "Carlos Alberto Silva",
      cargo: "Monitor Socioeducativo",
      centerId: idTimon, // Vinculado a Timon
      escala: "12x36 - Plantonista",
      status: "ATIVO",
      senha: senhaPadrao,
      createdAt: new Date()
    },
    {
      id: idServidor2,
      cpf: "55566677788",
      pis: "13045968223",
      nome: "Dra. Maria Fernanda Souza",
      cargo: "Assistente Social",
      centerId: idFlorescer, // Vinculado ao Florescer (Feminino)
      escala: "5x2 - Administrativo",
      status: "ATIVO",
      senha: senhaPadrao,
      createdAt: new Date()
    },
    {
      id: idServidor3,
      cpf: "99988877766",
      pis: "14056978334",
      nome: "Roberto Medeiros",
      cargo: "Enfermeiro",
      centerId: idTocantina, // Vinculado à Região Tocantina (Imperatriz)
      escala: "12x36 - Plantonista",
      status: "ATIVO",
      senha: senhaPadrao,
      createdAt: new Date()
    }
  ]);

  // 4. Inserir Prontuários (Atendimentos) para alimentar a Inteligência Estratégica do Governo
  console.log("📊 A processar prontuários massivos de socioeducandos (PIA)...");
  await db.insert(atendimentos).values([
    {
      id: crypto.randomUUID(),
      centerId: idTimon,
      genero: "Masculino",
      racaCor: "Parda",
      faixaEtaria: "16 a 17 anos",
      situacaoProcessual: "Reincidente",
      religiao: "Católica",
      orientacaoSexual: "Heterossexual",
      municipioMoradia: "Timon",
      municipioOcorrencia: "Timon",
      ultimoAnoEscolar: "8º E.F",
      situacaoEscolar: "Está matriculado e não frequentando",
      motivoNaoFrequenta: "Ameaça de facções",
      createdAt: new Date()
    },
    {
      id: crypto.randomUUID(),
      centerId: idCanaa,
      genero: "Masculino",
      racaCor: "Preta",
      faixaEtaria: "14 a 15 anos",
      situacaoProcessual: "Primário",
      religiao: "Sem Religião",
      orientacaoSexual: "Heterossexual",
      municipioMoradia: "São Luís",
      municipioOcorrencia: "São José de Ribamar",
      ultimoAnoEscolar: "7º E.F",
      situacaoEscolar: "Não está matriculado",
      motivoNaoFrequenta: "Envolvimento na prática infracional",
      createdAt: new Date()
    },
    {
      id: crypto.randomUUID(),
      centerId: idFlorescer,
      genero: "Feminino",
      racaCor: "Branca",
      faixaEtaria: "16 a 17 anos",
      situacaoProcessual: "Reiterante",
      religiao: "Evangélica",
      orientacaoSexual: "Bissexual",
      municipioMoradia: "São Luís",
      municipioOcorrencia: "São Luís",
      ultimoAnoEscolar: "1ª E.M",
      situacaoEscolar: "Está matriculado e não frequentando",
      motivoNaoFrequenta: "Uso de substâncias",
      createdAt: new Date()
    }
  ]);

  // 5. Inserir Agendamentos de Plantão (Escalas MTE 671)
  console.log("📅 A lançar escalas de cobertura operacional do RH...");
  const dataHoje = new Date().toISOString().split('T')[0]; // Dia atual
  await db.insert(escalasPlantao).values([
    { id: crypto.randomUUID(), servidorId: idServidor1, centerId: idTimon, dataPlantao: dataHoje, turno: "DIA (07h-19h)" },
    { id: crypto.randomUUID(), servidorId: idServidor2, centerId: idFlorescer, dataPlantao: dataHoje, turno: "EXPEDIENTE" }
  ]);

  // 6. Inserir Histórico de Frequência (Pontos Eletrónicos)
  console.log("⏱️ A computar registos históricos de batimento de ponto no Totem...");
  const dataEntrada = new Date();
  dataEntrada.setHours(7, 4, 0); // Ponto registado às 07:04 da manhã

  await db.insert(pontos).values([
    {
      id: crypto.randomUUID(),
      servidorId: idServidor1,
      centerId: idTimon,
      tipo: "ENTRADA",
      dataHora: new Date(dataEntrada),
      latitude: "-5.0892", // Coordenadas aproximadas de Timon/MA
      longitude: "-42.8016",
      modoOffline: 0,
      statusPonto: "NORMAL"
    }
  ]);

  console.log("✅ Banco de dados oficial do Maranhão populado com sucesso absoluto!");
}

main().catch((err) => {
  console.error("❌ Erro fatal durante a execução do seed:", err);
  process.exit(1);
});