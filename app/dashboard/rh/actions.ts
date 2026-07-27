"use server";

import { db } from "../../../db";
import { servidores, pontos, auditLogs, escalasPlantao, solicitacoesAbono, centers, eventosAusencia, candidatos, cargos } from "../../../db/schema";
import { eq, desc, like } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function registrarLog(entidade: string, acao: string, detalhe: string, observacao: string) {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(), entidade, acao, detalhe, observacao, createdAt: new Date(),
  });
}

// ==========================================
// MÓDULO: RECUPERAÇÃO DE ACESSO (NOVO)
// ==========================================
export async function resetarAcessoServidorAction(formData: FormData) {
  const id = formData.get("id") as string;
  const email = formData.get("email") as string;
  const novaSenha = formData.get("senha") as string;

  if (!id || !novaSenha) return { error: "A nova senha provisória é obrigatória." };

  try {
    const custoSalt = 10;
    const senhaCriptografada = await bcrypt.hash(novaSenha, custoSalt);
    
    // Atualiza a senha e o e-mail (se fornecido)
    const updateData: any = { senha: senhaCriptografada };
    if (email) updateData.email = email;

    await db.update(servidores).set(updateData).where(eq(servidores.id, id));
    
    await registrarLog("SEGURANÇA", "RESET_ACESSO", `ID_SERVIDOR:${id}`, `Senha redefinida pelo RH. Acesso recuperado.`);
    return { success: "Acesso redefinido com sucesso! O servidor já pode fazer login." };
  } catch (e: any) {
    console.error(e);
    return { error: `Erro no BD ao redefinir acesso: ${e.message}` };
  }
}

// ==========================================
// MÓDULO: CARGOS
// ==========================================
export async function salvarCargoAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  if (!nome) return { error: "O nome do cargo é obrigatório." };

  try {
    await db.insert(cargos).values({ id: crypto.randomUUID(), nome: nome.toUpperCase().trim(), createdAt: new Date() });
    await registrarLog("CONFIGURAÇÕES", "CRIAR_CARGO", `Cargo: ${nome}`, "Novo cargo adicionado à estrutura.");
    return { success: "Cargo cadastrado com sucesso!" };
  } catch (e: any) {
    return { error: "Este cargo já existe na base de dados." };
  }
}

export async function listarCargosAction() {
  return await db.select().from(cargos);
}

// ==========================================
// MÓDULO: RECRUTAMENTO
// ==========================================
export async function salvarCandidatoAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const qualificacao = formData.get("qualificacao") as string;
  const status = formData.get("status") as any;

  const rawCpf = formData.get("cpf") as string;
  const cleanCpf = rawCpf ? rawCpf.replace(/\D/g, "") : "";
  const rawTelefone = formData.get("telefone") as string;
  const cleanTelefone = rawTelefone ? rawTelefone.replace(/\D/g, "") : "";

  if (!nome || !cleanCpf || !email || !cleanTelefone || !qualificacao) {
    return { error: "Preencha todos os campos obrigatórios do candidato." };
  }

  if (cleanCpf) {
    const cpfExistente = await db.select().from(candidatos).where(eq(candidatos.cpf, cleanCpf));
    if (cpfExistente.length > 0 && cpfExistente[0].id !== id) {
      return { error: `⚠️ Bloqueado: O CPF já está registado no Banco de Talentos.` };
    }
  }

  const dadosCandidato = { nome, cpf: cleanCpf, email, telefone: cleanTelefone, qualificacao, status: status || "CADASTRO DE RESERVA" };

  if (id) {
    await db.update(candidatos).set(dadosCandidato).where(eq(candidatos.id, id));
    await registrarLog("RECRUTAMENTO", "EDITAR", `${nome}`, `Status alterado para: ${dadosCandidato.status}`);
    return { success: "Ficha do candidato atualizada com sucesso!" };
  } else {
    await db.insert(candidatos).values({ id: crypto.randomUUID(), ...dadosCandidato, createdAt: new Date() });
    await registrarLog("RECRUTAMENTO", "CADASTRAR", `${nome}`, `Adicionado ao Cadastro de Reserva.`);
    return { success: "Candidato inserido no Banco de Talentos!" };
  }
}

export async function listarCandidatosAction() {
  return await db.select().from(candidatos);
}

// ==========================================
// MÓDULO: SERVIDORES 
// ==========================================
export async function salvarServidorAction(formData: FormData) {
  const id = formData.get("id") as string;
  const centerId = formData.get("centerId") as string;
  const status = formData.get("status") as "ATIVO" | "INATIVO";
  const observacao = formData.get("observacao") as string;
  const cargo = formData.get("cargo") as string;
  const nome = formData.get("nome") as string;

  const rawCpf = formData.get("cpf") as string;
  const cleanCpf = rawCpf ? rawCpf.replace(/\D/g, "") : "";
  const rawRg = formData.get("rg") as string;
  const cleanRg = rawRg ? rawRg.replace(/\D/g, "") : "";
  const rawTelefone = formData.get("telefone") as string;
  const cleanTelefone = rawTelefone ? rawTelefone.replace(/\D/g, "") : "";
  const rawPis = formData.get("pis") as string;
  const cleanPis = rawPis ? rawPis.replace(/\D/g, "") : "";
  const email = formData.get("email") as string;

  if (cleanCpf) {
    const cpfExistente = await db.select().from(servidores).where(eq(servidores.cpf, cleanCpf));
    if (cpfExistente.length > 0 && cpfExistente[0].id !== id) {
      return { error: `⚠️ Bloqueado: O CPF ${rawCpf} já está cadastrado no sistema em nome de ${cpfExistente[0].nome}.` };
    }
  }

  const dadosServidor = {
    nome, nomeSocial: formData.get("nomeSocial") as string, dataNascimento: formData.get("dataNascimento") as string,
    tipoSanguineo: formData.get("tipoSanguineo") as string, grupoEtnico: formData.get("grupoEtnico") as string,
    estadoCivil: formData.get("estadoCivil") as string, genero: formData.get("genero") as string,
    orientacaoSexual: formData.get("orientacaoSexual") as string, endereco: formData.get("endereco") as string,
    email, telefone: cleanTelefone, contatoEmergencia: formData.get("contatoEmergencia") as string,
    cpf: cleanCpf, rg: cleanRg, tituloEleitoral: formData.get("tituloEleitoral") as string,
    pis: cleanPis, dependentes: formData.get("dependentes") as string, banco: formData.get("banco") as string,
    agencia: formData.get("agencia") as string, conta: formData.get("conta") as string,
    cargo: cargo.toUpperCase().trim(),
    escala: formData.get("escala") as string, centerId, status,
    vinculo: formData.get("vinculo") as string, dataAdmissao: formData.get("dataAdmissao") as string,
    dataDesligamento: formData.get("dataDesligamento") as string, motivoDesligamento: formData.get("motivoDesligamento") as string,
  };

  if (!dadosServidor.nome || !dadosServidor.cpf || !dadosServidor.cargo || !centerId || !observacao) {
    return { error: "Preencha os campos obrigatórios (*)." };
  }

  if (id) {
    try {
      const oldServer = await db.select().from(servidores).where(eq(servidores.id, id));
      if (oldServer.length > 0) {
        const isCargoChanged = oldServer[0].cargo !== cargo;
        const isCenterChanged = oldServer[0].centerId !== centerId;
        if (isCargoChanged || isCenterChanged) {
          const unidades = await db.select().from(centers);
          const oldCenterName = unidades.find(u => u.id === oldServer[0].centerId)?.name || "Desconhecida";
          const newCenterName = unidades.find(u => u.id === centerId)?.name || "Desconhecida";
          const mudanca = `Alteração Registrada: ${isCargoChanged ? `[Cargo: de ${oldServer[0].cargo} para ${cargo}] ` : ''}${isCenterChanged ? `[Lotação: de ${oldCenterName} para ${newCenterName}]` : ''}`;
          await registrarLog("FICHA_FUNCIONAL", "MUDANCA_CARGO_LOTACAO", `ID_SERVIDOR:${id}`, mudanca);
        }
      }

      await db.update(servidores).set(dadosServidor).where(eq(servidores.id, id));
      await registrarLog("SERVIDOR", "EDITAR", `${dadosServidor.nome}`, observacao);
      return { success: "Ficha do servidor atualizada!" };
    } catch (e: any) {
      return { error: `Erro no BD (Update): ${e.message}` };
    }
  } else {
    try {
      const custoSalt = 10;
      const senhaCriptografada = await bcrypt.hash("fase123", custoSalt);
      const novoId = crypto.randomUUID();
      await db.insert(servidores).values({ 
        id: novoId, 
        ...dadosServidor,
        senha: senhaCriptografada,
        createdAt: new Date() 
      });
      
      const unidades = await db.select().from(centers);
      const centerName = unidades.find(u => u.id === centerId)?.name || "Desconhecida";
      await registrarLog("FICHA_FUNCIONAL", "ADMISSAO", `ID_SERVIDOR:${novoId}`, `Admitido no cargo de ${cargo} com lotação em ${centerName}.`);
      await registrarLog("SERVIDOR", "CRIAR", `${dadosServidor.nome}`, observacao);
      
      return { success: "Servidor cadastrado com sucesso!" };
    } catch (e: any) { 
      return { error: `Erro no Banco de Dados: ${e.message}` }; 
    }
  }
}

// ------------------------------------------------------------------
export async function salvarEventoAusenciaAction(formData: FormData) {
  const servidorId = formData.get("servidorId") as string;
  const tipo = formData.get("tipo") as any;
  const dataInicio = formData.get("dataInicio") as string;
  const dataFim = formData.get("dataFim") as string;
  const observacao = formData.get("observacao") as string;

  if (!servidorId || !tipo || !dataInicio || !dataFim) return { error: "Preencha todos os campos obrigatórios." };
  
  await db.insert(eventosAusencia).values({
    id: crypto.randomUUID(), servidorId, tipo, dataInicio, dataFim, observacao, status: "APROVADO", createdAt: new Date()
  });

  await registrarLog("FICHA_FUNCIONAL", "REGISTRO_AUSENCIA", `ID_SERVIDOR:${servidorId}`, `Lançamento de ${tipo}: de ${dataInicio} a ${dataFim}. Obs: ${observacao}`);
  return { success: "Evento agendado com sucesso!" };
}

export async function listarEventosAusenciaAction() { return await db.select().from(eventosAusencia); }

export async function listarHistoricoFuncionalAction(servidorId: string) {
  return await db.select().from(auditLogs).where(like(auditLogs.detalhe, `%ID_SERVIDOR:${servidorId}%`)).orderBy(desc(auditLogs.createdAt));
}

// ------------------------------------------------------------------
export async function tratarPontoAction(formData: FormData) {
  const pontoId = formData.get("pontoId") as string;
  const statusPonto = formData.get("statusPonto") as any;
  const justificativaRH = formData.get("justificativaRH") as string;
  const observacaoAuditoria = formData.get("observacaoAuditoria") as string;

  if (!pontoId || !statusPonto || !justificativaRH || !observacaoAuditoria) return { error: "Preencha tudo." };
  await db.update(pontos).set({ statusPonto, justificativaRH }).where(eq(pontos.id, pontoId));
  await registrarLog("PONTO_ELETRONICO", "AJUSTE", `Ponto: ${pontoId}`, observacaoAuditoria);
  return { success: "Ponto tratado!" };
}

export async function gerarArquivoAFDAction(centerId?: string) {
  const listaPontos = await db.select().from(pontos);
  const listaServidores = await db.select().from(servidores);
  let nsr = 1;
  let conteudoAFD = "000000000112345678901234FUNDO ATEND SOCIOEDUCATIVO MA\r\n"; 

  listaPontos.forEach((p) => {
    if (centerId && p.centerId !== centerId) return;
    const servidor = listaServidores.find(s => s.id === p.servidorId);
    if (!servidor) return;
    const dataF = new Date(p.dataHora).toLocaleDateString('pt-BR').replace(/\//g, '');
    const horaF = new Date(p.dataHora).toLocaleTimeString('pt-BR').replace(/:/g, '');
    const nsrS = String(nsr).padStart(9, '0');
    const pisS = String(servidor.pis || "00000000000").padStart(11, '0');
    const evento = p.tipo === "ENTRADA" ? "1" : "2";
    conteudoAFD += `${nsrS}3${dataF}${horaF}${pisS}${evento}0000000000000\r\n`;
    nsr++;
  });
  return { success: true, conteudo: conteudoAFD, fileName: `AFD_FASE_MA.txt` };
}

export async function salvarPlantaoAction(formData: FormData) {
  const servidorId = formData.get("servidorId") as string;
  const centerId = formData.get("centerId") as string;
  const dataPlantao = formData.get("dataPlantao") as string;
  const turno = formData.get("turno") as any;

  if (!servidorId || !dataPlantao || !turno || !centerId) return { error: "Preencha todos os campos obrigatórios." };
  await db.insert(escalasPlantao).values({ id: crypto.randomUUID(), servidorId, centerId, dataPlantao, turno });
  return { success: "Turno escalado com sucesso!" };
}

export async function listarEscalasAction() { return await db.select().from(escalasPlantao); }
export async function listarAtestadosAction() { return await db.select().from(solicitacoesAbono); }

export async function avaliarAtestadoAction(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as "APROVADO" | "REJEITADO";

  if (!id || !status) return { error: "Dados inválidos." };
  await db.update(solicitacoesAbono).set({ status }).where(eq(solicitacoesAbono.id, id));
  await registrarLog("ATESTADOS", status, `ID: ${id}`, `RH marcou atestado como ${status}.`);
  return { success: `Atestado ${status.toLowerCase()} com sucesso!` };
}

export async function gerarFolhaPagamentoAction(centerIdFiltro?: string) {
  const listaServidores = await db.select().from(servidores);
  const listaPontos = await db.select().from(pontos);
  const listaEscalas = await db.select().from(escalasPlantao);
  const atestados = await db.select().from(solicitacoesAbono);
  const listaUnidades = await db.select().from(centers);

  let csv = "NOME;CPF;CARGO;LOTAÇÃO;ESCALA REGRADA;PLANTÕES AGENDADOS;DIAS TRABALHADOS (PONTO);ATESTADOS APROVADOS;STATUS DA FOLHA\n";

  listaServidores.forEach(serv => {
    if (centerIdFiltro && serv.centerId !== centerIdFiltro) return;
    const unidade = listaUnidades.find(u => u.id === serv.centerId)?.name || "Desconhecida";
    const plantoesAgendados = listaEscalas.filter(e => e.servidorId === serv.id).length;
    const pontosServidor = listaPontos.filter(p => p.servidorId === serv.id && p.statusPonto === 'NORMAL');
    const diasPresentes = new Set(pontosServidor.map(p => new Date(p.dataHora).toLocaleDateString('pt-BR'))).size;
    const atestadosAprovados = atestados.filter(a => a.servidorId === serv.id && a.status === 'APROVADO').length;

    let statusFolha = "OK - FECHAMENTO REDONDO";
    if (plantoesAgendados > 0 && plantoesAgendados > (diasPresentes + atestadosAprovados)) {
      statusFolha = "⚠️ FALTAS INJUSTIFICADAS / DESCONTAR EM FOLHA";
    } else if (diasPresentes > plantoesAgendados && plantoesAgendados > 0) {
      statusFolha = "💰 HORAS EXTRAS DETECTADAS";
    } else if (plantoesAgendados === 0 && diasPresentes === 0) {
      statusFolha = "SEM DADOS NO MÊS";
    }
    csv += `${serv.nome};${serv.cpf};${serv.cargo};${unidade};${serv.escala};${plantoesAgendados};${diasPresentes};${atestadosAprovados};${statusFolha}\n`;
  });

  return { success: true, conteudo: csv, fileName: `Folha_Pagamento_FASE.csv` };
}