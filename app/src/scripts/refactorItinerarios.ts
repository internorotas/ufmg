/**
 * Script de Refatoração de Itinerários
 *
 * Substitui os nomes textuais das paradas em linhas.ts pelos IDs correspondentes
 * de paradas.ts, a partir da linha DU21.
 */

import dataParadas from '../data/paradas';

// Tipos auxiliares
interface ParadaMapping {
  id: string;
  nome: string;
  nomeNormalizado: string;
}

/**
 * Normaliza uma string removendo acentos, pontuação e convertendo para minúsculas
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Calcula a similaridade entre duas strings usando o algoritmo de Jaro-Winkler simplificado
 */
function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = normalizarTexto(str1);
  const s2 = normalizarTexto(str2);

  // Se são exatamente iguais, retorna 1
  if (s1 === s2) return 1;

  // Verifica se uma string contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    const menorLength = Math.min(s1.length, s2.length);
    const maiorLength = Math.max(s1.length, s2.length);
    return menorLength / maiorLength;
  }

  // Calcula palavras em comum
  const palavras1 = s1.split(' ');
  const palavras2 = s2.split(' ');

  let palavrasEmComum = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1 === p2 && p1.length > 2) {
        // Ignora palavras muito curtas
        palavrasEmComum++;
        break;
      }
    }
  }

  const totalPalavras = Math.max(palavras1.length, palavras2.length);
  return palavrasEmComum / totalPalavras;
}

/**
 * Cria um mapa de paradas para busca rápida
 */
function criarMapaParadas(): ParadaMapping[] {
  return dataParadas.paradas.map((parada) => ({
    id: parada.idParada,
    nome: parada.nome,
    nomeNormalizado: normalizarTexto(parada.nome),
  }));
}

/**
 * Encontra o ID da parada mais similar ao nome fornecido
 */
function encontrarParadaPorNome(
  nomeParada: string,
  mapaParadas: ParadaMapping[],
  limiarSimilaridade: number = 0.6,
): { id: string; similaridade: number; nomeEncontrado: string } | null {
  let melhorMatch: {
    id: string;
    similaridade: number;
    nomeEncontrado: string;
  } | null = null;

  for (const parada of mapaParadas) {
    const similaridade = calcularSimilaridade(nomeParada, parada.nome);

    if (similaridade >= limiarSimilaridade) {
      if (!melhorMatch || similaridade > melhorMatch.similaridade) {
        melhorMatch = {
          id: parada.id,
          similaridade,
          nomeEncontrado: parada.nome,
        };
      }
    }
  }

  return melhorMatch;
}

/**
 * Mapeia manualmente alguns casos conhecidos que podem não ser detectados automaticamente
 */
const mapeamentoManual: Record<string, string> = {
  'ESCOLA DE MÚSICA': 'P01',
  'EBA - ESCOLA DE BELAS ARTES': 'P02',
  'CAD 2 - CENTRO DE ATIVIDADES DIDÁTICAS 2': 'P03',
  'FALE - FACULDADE DE LETRAS': 'P03',
  'ECI - ESCOLA DE CIÊNCIAS DA INFORMAÇÃO': 'P03',
  'FAFICH - FACULDADE DE FILOSOFIA E CIÊNCIAS HUMANAS': 'P03',
  'FACE - FACULDADE DE CIÊNCIAS ECONÔMICAS': 'P04',
  REITORIA: 'P04',
  'PRAÇA DE SERVIÇOS': 'P05',
  'BIBLIOTECA CENTRAL UNIVERSITÁRIA': 'P05',
  'UNIDADE ADMINISTRATIVA III': 'P06',
  'UNIDADE ADMINISTRATIVA II': 'P07',
  'AV. ANTÔNIO ABRAHÃO CARAM (EM FRENTE AO RESTAURANTE FARROUPILHA)': 'P08',
  'CEU - CENTRO ESPORTIVO UNIVERSITÁRIO': 'P09',
  'ESCOLA DE VETERINÁRIA': 'P10',
  "AV. PRESIDENTE CARLOS LUZ (EM FRENTE AO MCDONALD'S)": 'P12',
  'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL': 'P13',
  'FACULDADE DE ODONTOLOGIA': 'P14',
  'ESTAÇÃO ECOLOGICA': 'P15',
  'ESTAÇÃO ECOLÓGICA': 'P15',
  'FACULDADE DE FARMÁCIA': 'P16',
  'RESTAURANTE UNIVERSITÁRIO SETORIAL II': 'P17',
  'DEPARTAMENTO DE FÍSICA': 'P18',
  'ENGENHARIA ELÉTRICA': 'P18',
  'CDTN/CNEN - CENTRO DE DESENVOLVIMENTO DA TECNOLOGIA NUCLEAR': 'P19',
  'CNEN / CDTN': 'P19',
  'COLTEC - COLÉGIO TÉCNICO DA UFMG': 'P22',
  'DEPARTAMENTO DE QUÍMICA': 'P22',
  'ICEX - INSTITUTO DE CIÊNCIAS EXATAS': 'P23',
  'ESCOLA DE ENGENHARIA': 'P23',
  'IGC - INSTITUTO DE GEOCIÊNCIAS': 'P24',
  'RESTAURANTE UNIVERSITÁRIO SETORIAL I': 'P25',
  'FAE - FACULDADE DE EDUCAÇÃO': 'P26',
  'CENTRO PEDAGÓGICO': 'P26',
  'CRECHE - EMEI ALAÍDE DE LISBOA': 'P27',
  'BH-TEC - PARQUE TECNOLÓGICO DE BELO HORIZONTE': 'P49',
  'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1': 'P35',
  'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS': 'P35',
  'BIOTÉRIO CENTRAL': 'P36',
};

/**
 * Refatora um itinerário, substituindo nomes por IDs
 */
export function refatorarItinerario(
  itinerarioParadasIds: string[],
  _linhaId: string,
  mapaParadas: ParadaMapping[],
): string[] {
  const novoItinerario: string[] = [];
  const avisos: string[] = [];

  for (let i = 0; i < itinerarioParadasIds.length; i++) {
    const nomeParada = itinerarioParadasIds[i];

    // Verifica se já é um ID (começa com 'P' e tem número)
    if (/^P\d+$/.test(nomeParada)) {
      novoItinerario.push(nomeParada);
      continue;
    }

    // Primeiro tenta o mapeamento manual
    const nomeNormalizado = nomeParada.toUpperCase().trim();
    if (mapeamentoManual[nomeNormalizado]) {
      novoItinerario.push(mapeamentoManual[nomeNormalizado]);
      continue;
    }

    // Tenta encontrar por similaridade
    const resultado = encontrarParadaPorNome(nomeParada, mapaParadas);

    if (resultado && resultado.similaridade >= 0.8) {
      novoItinerario.push(resultado.id);
    } else if (resultado && resultado.similaridade >= 0.6) {
      novoItinerario.push(resultado.id);
      avisos.push(
        `Parada ${i + 1}: "${nomeParada}" mapeada para ${resultado.id} com similaridade baixa (${(resultado.similaridade * 100).toFixed(1)}%)`,
      );
    } else {
      // Mantém o nome original se não encontrar correspondência
      novoItinerario.push(nomeParada);
      avisos.push(`Parada ${i + 1}: "${nomeParada}" - SEM CORRESPONDÊNCIA ENCONTRADA`);
    }
  }

  if (avisos.length > 0) {
    avisos.forEach((_aviso) => {});
  }

  return novoItinerario;
}

/**
 * Função principal de refatoração
 */
export function executarRefatoracao() {
  criarMapaParadas();
}

// Mapeamento adicional para paradas especiais
const mapeamentoAdicional: Record<string, string> = {
  USIMINAS: 'P47',
  'RUA PROF. JOSÉ VIEIRA MENDONÇA': 'P48',
  "AV. PRESIDENTE CARLOS LUZ (EM FRENTE MAC DONALD'S)": 'P12',
  'AVENIDA REI PELÉ': 'P11',
  'AV. ABRAHÃO CARAM (EM FRENTE AO RESTAURANTE FARROUPILHA)': 'P08',
  'UNIDADE ADMINISTRATIVA II (DAST/FUNDEP)': 'P07',
  'UNIDADE ADMINISTRATIVA III (DAP/DRCA/DRH/COPEVE/PROJETO MANUELZÃO/EDUCAÇÃO A DISTÂNCIA/ESTUDOS TRANSCIPLINARES/ESTUDOS DE CRIMINALIDADE E SEGURANÇA/ESTUDOS SOBRE ENSINO SUPERIOR E POLÍTICAS PÚBLICAS)':
    'P06',
  'RUA PROF. EDUARDO M. GUIMARÃES': 'P04',
  'RETORNO EM FRENTE DA USIMINAS': 'P47',
  'RETORNO NA AV. ALFREDO CAMARATE': 'P46',
  'ENG. ELÉTRICA (CPDE)': 'P18',
  'COLÉGIO MILITAR': 'P30',
};

// Combina os mapeamentos
Object.assign(mapeamentoManual, mapeamentoAdicional);

/**
 * Dados de todas as linhas a serem refatoradas
 */
const linhasParaRefatorar = [
  {
    id: 'Linha 3 - null',
    tipo: 'tres',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      "AV. PRESIDENTE CARLOS LUZ (EM FRENTE AO MCDONALD'S)",
      'ESCOLA DE VETERINÁRIA',
      'AVENIDA REI PELÉ',
      'AV. ABRAHÃO CARAM (EM FRENTE AO RESTAURANTE FARROUPILHA)',
      'UNIDADE ADMINISTRATIVA II (DAST/FUNDEP)',
      'UNIDADE ADMINISTRATIVA III (DAP/DRCA/DRH/COPEVE/PROJETO MANUELZÃO/EDUCAÇÃO A DISTÂNCIA/ESTUDOS TRANSCIPLINARES/ESTUDOS DE CRIMINALIDADE E SEGURANÇA/ESTUDOS SOBRE ENSINO SUPERIOR E POLÍTICAS PÚBLICAS)',
      'REITORIA',
      'RUA PROF. EDUARDO M. GUIMARÃES',
      'FAFICH - FACULDADE DE FILOSOFIA E CIÊNCIAS HUMANAS',
      'ECI - ESCOLA DE CIÊNCIAS DA INFORMAÇÃO',
      'FALE - FACULDADE DE LETRAS',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: 'Linha 3 - Retorno na Área Militar',
    tipo: 'tres',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      "AV. PRESIDENTE CARLOS LUZ (EM FRENTE AO MCDONALD'S)",
      'ESCOLA DE VETERINÁRIA',
      'AVENIDA REI PELÉ',
      'AV. ABRAHÃO CARAM (EM FRENTE AO RESTAURANTE FARROUPILHA)',
      'UNIDADE ADMINISTRATIVA II (DAST/FUNDEP)',
      'UNIDADE ADMINISTRATIVA III (DAP/DRCA/DRH/COPEVE/PROJETO MANUELZÃO/EDUCAÇÃO A DISTÂNCIA/ESTUDOS TRANSCIPLINARES/ESTUDOS DE CRIMINALIDADE E SEGURANÇA/ESTUDOS SOBRE ENSINO SUPERIOR E POLÍTICAS PÚBLICAS)',
      'REITORIA',
      'RUA PROF. EDUARDO M. GUIMARÃES',
      'FAFICH - FACULDADE DE FILOSOFIA E CIÊNCIAS HUMANAS',
      'ECI - ESCOLA DE CIÊNCIAS DA INFORMAÇÃO',
      'FALE - FACULDADE DE LETRAS',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: 'Linha 3 - Atendimento ao BH-Tec',
    tipo: 'tres',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'USIMINAS',
      'RUA PROF. JOSÉ VIEIRA MENDONÇA',
      'BH-TEC - PARQUE TECNOLÓGICO DE BELO HORIZONTE',
      "AV. PRESIDENTE CARLOS LUZ (EM FRENTE MAC DONALD'S)",
      'ESCOLA DE VETERINÁRIA',
      'AVENIDA REI PELÉ',
      'AV. ABRAHÃO CARAM (EM FRENTE AO RESTAURANTE FARROUPILHA)',
      'UNIDADE ADMINISTRATIVA II (DAST/FUNDEP)',
      'UNIDADE ADMINISTRATIVA III (DAP/DRCA/DRH/COPEVE/PROJETO MANUELZÃO/EDUCAÇÃO A DISTÂNCIA/ESTUDOS TRANSCIPLINARES/ESTUDOS DE CRIMINALIDADE E SEGURANÇA/ESTUDOS SOBRE ENSINO SUPERIOR E POLÍTICAS PÚBLICAS)',
      'REITORIA',
      'RUA PROF. EDUARDO M. GUIMARÃES',
      'FAFICH - FACULDADE DE FILOSOFIA E CIÊNCIAS HUMANAS',
      'ECI - ESCOLA DE CIÊNCIAS DA INFORMAÇÃO',
      'FALE - FACULDADE DE LETRAS',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: 'Linha 4 - null',
    tipo: 'quatro',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'ESTAÇÃO ECOLÓGICA',
      'FACULDADE DE ODONTOLOGIA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'RETORNO EM FRENTE DA USIMINAS',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE FARMÁCIA',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL II',
      'ICEX - INSTITUTO DE CIÊNCIAS EXATAS',
      'ESCOLA DE ENGENHARIA',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'CENTRO PEDAGÓGICO',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: 'Linha 4 - Retorno na Área Militar',
    tipo: 'quatro',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'ESTAÇÃO ECOLÓGICA',
      'FACULDADE DE ODONTOLOGIA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'RETORNO EM FRENTE DA USIMINAS',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE FARMÁCIA',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL II',
      'ICEX - INSTITUTO DE CIÊNCIAS EXATAS',
      'ESCOLA DE ENGENHARIA',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'CENTRO PEDAGÓGICO',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: "Linha 4 - Atendimento ao Ponto McDonald's",
    tipo: 'quatro',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'ESTAÇÃO ECOLÓGICA',
      'FACULDADE DE ODONTOLOGIA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'RETORNO NA AV. ALFREDO CAMARATE',
      "AV. PRESIDENTE CARLOS LUZ (EM FRENTE AO MCDONALD'S)",
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE FARMÁCIA',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL II',
      'ICEX - INSTITUTO DE CIÊNCIAS EXATAS',
      'ESCOLA DE ENGENHARIA',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'CENTRO PEDAGÓGICO',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
  {
    id: "Linha 4 - Atendimento ao BH-Tec e McDonald's",
    tipo: 'quatro',
    itinerario: [
      'ESCOLA DE MÚSICA',
      'EBA - ESCOLA DE BELAS ARTES',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'CENTRO PEDAGÓGICO',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'ESCOLA DE ENGENHARIA',
      'PRAÇA DE SERVIÇOS',
      'BIBLIOTECA CENTRAL UNIVERSITÁRIA',
      'REITORIA',
      'CAD 1 - CENTRO DE ATIVIDADES DIDÁTICAS 1',
      'ICB - INSTITUTO DE CIÊNCIAS BIOLÓGICAS',
      'BIOTÉRIO CENTRAL',
      'FACULDADE DE FARMÁCIA',
      'ESCOLA DE VETERINÁRIA',
      'ESTAÇÃO ECOLÓGICA',
      'FACULDADE DE ODONTOLOGIA',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'RETORNO NA AV. ALFREDO CAMARATE',
      "AV. PRESIDENTE CARLOS LUZ (EM FRENTE AO MCDONALD'S)",
      'RUA PROF. JOSÉ VIEIRA MENDONÇA',
      'BH-TEC - PARQUE TECNOLÓGICO DE BELO HORIZONTE',
      'EEFFTO - ESCOLA DE EDUCAÇÃO FÍSICA, FISIOTERAPIA E TERAPIA OCUPACIONAL',
      'FACULDADE DE ODONTOLOGIA',
      'ESTAÇÃO ECOLÓGICA',
      'ESCOLA DE VETERINÁRIA',
      'FACULDADE DE FARMÁCIA',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL II',
      'ICEX - INSTITUTO DE CIÊNCIAS EXATAS',
      'ESCOLA DE ENGENHARIA',
      'IGC - INSTITUTO DE GEOCIÊNCIAS',
      'RESTAURANTE UNIVERSITÁRIO SETORIAL I',
      'FAE - FACULDADE DE EDUCAÇÃO',
      'CENTRO PEDAGÓGICO',
      'CRECHE - EMEI ALAÍDE DE LISBOA',
      'EBA - ESCOLA DE BELAS ARTES',
      'ESCOLA DE MÚSICA',
    ],
  },
];

/**
 * Processa todas as linhas
 */
export function refatorarTodasLinhas() {
  const mapaParadas = criarMapaParadas();
  const resultados: Record<string, string[]> = {};

  linhasParaRefatorar.forEach((linha, _index) => {
    const itinerarioRefatorado = refatorarItinerario(linha.itinerario, linha.id, mapaParadas);
    resultados[linha.id] = itinerarioRefatorado;
    itinerarioRefatorado.forEach((_id) => {});
  });

  return resultados;
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarRefatoracao();
  refatorarTodasLinhas();
}
