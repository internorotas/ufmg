/**
 * Arquivo de funções utilitárias do projeto UFMG
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, lastDayOfMonth, parse, parseISO } from "date-fns";

/**
 * Mescla classes CSS usando clsx e tailwind-merge
 * @param inputs Classes CSS a serem mescladas
 * @returns String com as classes mescladas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Retorna o nome do mês correspondente ao número do mês
 * @param numeroMes Número do mês (1-12)
 * @returns Nome do mês em português
 */
export function getNomeMes(numeroMes: number) {
  return months[numeroMes - 1];
}

/**
 * Retorna a lista de nomes dos meses em português
 * @returns Array com os nomes dos meses
 */
export function getMeses() {
  return months;
}

/**
 * Formata uma data se ela existir
 * @param data Data a ser formatada
 * @param formato Formato desejado (padrão: "yyyy-MM-dd")
 * @returns String formatada ou undefined
 */
export function formatarDataSeExiste(data?: Date, formato?: string) {
  if (data) {
    try {
      return format(data, formato ?? "yyyy-MM-dd");
    } catch {
      throw new Error("Data inválida.");
    }
  }
}

/**
 * Formata uma string de data ISO para um formato específico
 * @param data String de data no formato ISO
 * @param formato Formato desejado (opcional)
 * @returns String de data formatada
 */
export function formatarDataString(data: string, formato?: string) {
  const dataISO = parseISO(data);
  return formatarDataSeExiste(dataISO, formato)!;
}

/**
 * Converte uma string para um objeto Date
 * @param data String de data
 * @param formato Formato da string de data (opcional)
 * @returns Objeto Date ou undefined
 */
export function converteStringToData(data?: string, formato?: string) {
  if (data && data.length > 0) {
    if (formato) {
      return parse(data, formato, new Date());
    }
    return parseISO(data);
  }
}

/**
 * Calcula o intervalo de datas de um mês específico
 * @param mes Mês no formato string ("01" a "12")
 * @param ano Ano no formato string (ex: "2025")
 * @returns Objeto contendo dataInicio e dataFim
 */
export function calcularIntervaloDeDatas(mes: string, ano: string) {
  if (!mes || !ano) return;
  const dataInicio = converteStringToData(`${ano}-${mes}-01T00:00`)!;
  const dataFim = lastDayOfMonth(dataInicio);
  return { dataInicio, dataFim };
}

/**
 * Formata uma data no formato dd/mm/yyyy hh:mm:ss para um formato simplificado
 * @param data String de data no formato dd/mm/yyyy hh:mm:ss
 * @returns Objeto com dia, mês abreviado e ano formatados
 */
export function formatarDataParaCard(data: string): {
  dia: string;
  mesAbreviado: string;
  ano: string;
} {
  if (!data) return { dia: "", mesAbreviado: "", ano: "" };

  try {
    let dia: string, mes: string, ano: string;

    if (data.includes("/")) {
      // Formato: "24/04/2025 09:22:12"
      const [dataParte] = data.split(" ");
      const partes = dataParte.split("/");

      if (partes.length !== 3) throw new Error("Formato DD/MM/YYYY inválido");

      [dia, mes, ano] = partes;
    } else {
      // Formato ISO: "2025-05-13T16:52:57.261Z"
      const dateObj = new Date(data);

      if (isNaN(dateObj.getTime())) throw new Error("Data ISO inválida");

      dia = String(dateObj.getDate());
      mes = String(dateObj.getMonth() + 1); // zero-based
      ano = String(dateObj.getFullYear());
    }

    if (!dia || !mes || !ano) throw new Error("Campos de data inválidos");
    if (isNaN(Number(dia)) || isNaN(Number(mes)) || isNaN(Number(ano))) {
      throw new Error("Valores não numéricos detectados");
    }

    return {
      dia: dia.padStart(2, "0"),
      mesAbreviado: getNomeMes(Number(mes))?.slice(0, 3).toUpperCase() || "",
      ano,
    };
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return { dia: "", mesAbreviado: "", ano: "" };
  }
}

/**
 * Formata "2025-05-12T00:00:00" ou "24/04/2025 09:32:54" para "abril 24, 2025"
 * @param data String de data
 * @returns Data formatada por extenso
 */
export function formatarDataParaPorExtenso(data: string): string {
  try {
    const meses = getMeses().map((mes) => mes.toLowerCase());

    let dia: string, mes: string, ano: string;

    if (data.includes("/")) {
      const [dataParte] = data.split(" ");
      [dia, mes, ano] = dataParte.split("/");
    } else {
      const dateObj = new Date(data);
      if (isNaN(dateObj.getTime())) throw new Error("Data inválida");

      dia = String(dateObj.getDate()).padStart(2, "0");
      mes = String(dateObj.getMonth() + 1).padStart(2, "0");
      ano = String(dateObj.getFullYear());
    }

    const nomeMes = meses[parseInt(mes, 10) - 1] || "";

    return `${nomeMes} ${dia}, ${ano}`;
  } catch (error) {
    console.error("Erro ao formatar data por extenso:", error);
    return "";
  }
}

/**
 * Normaliza uma string removendo acentos e caracteres especiais
 * @param str String a ser normalizada
 * @returns String normalizada
 */
export function normalizarString(str: string): string {
  if (!str) return str;

  return str
    .normalize("NFD") // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remover marcas de acentuação
    .replace(/Ç/g, "C") // Substituir Ç por C
    .replace(/ç/g, "c") // Substituir ç por c
    .toLowerCase(); // Ignorar case
}

/**
 * Normaliza um nome colocando a primeira letra em maiúscula e o resto em minúscula
 * @param nome Nome a ser normalizado
 * @returns Nome normalizado
 */
export function normalizarNome(nome: string) {
  if (!nome || nome.length <= 1) {
    return nome;
  }

  return nome[0].toUpperCase() + nome.substring(1, nome.length).toLowerCase();
}

/**
 * Normaliza um nome colocando a primeira letra em maiúscula e o resto em minúscula de cada nome
 * @param nome Nome a ser normalizado
 * @returns Nome normalizado
 */
export function normalizarNomeCompleto(nome: string) {
  return nome
    .trim()
    .split(" ")
    .map((n) => {
      if (n.length == 2 && n.toLowerCase().startsWith("d"))
        return n.toLowerCase();
      return normalizarNome(n);
    })
    .join(" ");
}

/**
 * Obtém as iniciais de um nome
 * @param name Nome completo
 * @returns Iniciais do nome (primeiras letras das duas primeiras palavras)
 */
export function getInitials(name?: string): string {
  if (!name) {
    return "";
  }
  const parts = name.trim().split(" ");
  const initials = parts.map((part) => part.charAt(0).toUpperCase());
  return initials.slice(0, 2).join("");
}

/**
 * Converte horário no formato "HH:MM" em minutos desde meia-noite
 * @param time Horário no formato "HH:MM"
 * @returns Número de minutos desde meia-noite
 */
export function timeToMinutes(time: string): number {
  // ⚡ Bolt: Otimização de performance (evita alocações de array do split e map)
  // Muito mais rápido para o processamento de milhares de horários nas listas
  if (!time) return NaN;
  const colonIndex = time.indexOf(":");
  if (colonIndex === -1) return NaN;

  const hours = Number(time.slice(0, colonIndex));
  const minutes = Number(time.slice(colonIndex + 1));

  return hours * 60 + minutes;
}

/**
 * Encontra o índice do próximo horário em um array de minutos ordenado (Busca Binária O(log N))
 * @param sortedMinutes Array de minutos ordenado
 * @param targetMinutes Minutos atuais
 * @returns O índice do próximo horário, ou -1 se não houver
 */
export function findScheduleIndex(
  sortedMinutes: number[],
  targetMinutes: number,
): number {
  let left = 0;
  let right = sortedMinutes.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedMinutes[mid] > targetMinutes) {
      result = mid;
      right = mid - 1; // Continuar buscando à esquerda por um horário mais cedo
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Converte minutos desde meia-noite de volta para formato "HH:MM"
 * @param minutes Número de minutos desde meia-noite
 * @returns Horário no formato "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Calcula o próximo e o anterior horário com base no horário atual
 * @param horarios Array de horários no formato "HH:MM"
 * @returns Objeto com nextSchedule e previousSchedule
 */
export function calculateNextAndPreviousSchedule(horarios: string[]) {
  if (!horarios || horarios.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const schedulesInMinutes = horarios
    .filter((time) => time && time.includes(":")) // Filtrar horários válidos
    .map(timeToMinutes)
    .sort((a, b) => a - b);

  if (schedulesInMinutes.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }

  let nextSchedule = "--:--";
  let previousSchedule = "--:--";

  // Encontrar próximo horário usando Busca Binária (O(log N))
  const nextIndex = findScheduleIndex(schedulesInMinutes, currentMinutes);

  if (nextIndex !== -1) {
    nextSchedule = minutesToTime(schedulesInMinutes[nextIndex]);

    // O horário anterior é o estritamente menor que currentMinutes
    let prevIndex = nextIndex - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }

    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    } else {
      // nextIndex == 0, ou seja, o próximo é o primeiro horário do dia.
      // Portanto, não há anterior hoje.
      previousSchedule = minutesToTime(
        schedulesInMinutes[schedulesInMinutes.length - 1],
      );
    }
  } else {
    // Se não há mais horários hoje, o próximo é o primeiro de amanhã
    nextSchedule = minutesToTime(schedulesInMinutes[0]);

    // O anterior deve ser o último horário que for estritamente menor que currentMinutes
    // Que geralmente é o último horário do array
    let prevIndex = schedulesInMinutes.length - 1;
    while (prevIndex >= 0 && schedulesInMinutes[prevIndex] >= currentMinutes) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      previousSchedule = minutesToTime(schedulesInMinutes[prevIndex]);
    } else {
      previousSchedule = minutesToTime(
        schedulesInMinutes[schedulesInMinutes.length - 1],
      );
    }
  }

  return { nextSchedule, previousSchedule };
}

// ⚡ Bolt: Cache module-level para evitar reconstrução O(N) do Map a cada busca
// Usando WeakMap para não impedir garbage collection caso o array original mude/suma
const paradasCache = new WeakMap<object, Map<string, unknown>>();

/**
 * Busca paradas do itinerário usando os IDs fornecidos
 * Utiliza um Map com cache (WeakMap) para otimizar a busca
 * Evita recriar o dicionário de O(N) quando a lista global de paradas não muda
 * @param itinerarioParadasIds Array de IDs de paradas
 * @param todasParadas Array com todas as paradas disponíveis
 * @returns Array de paradas encontradas
 */
export function buscarParadasPorIds<T extends { idParada: string }>(
  itinerarioParadasIds: string[],
  todasParadas: T[],
): T[] {
  let paradasMap = paradasCache.get(todasParadas) as Map<string, T> | undefined;

  if (!paradasMap) {
    paradasMap = new Map<string, T>();
    for (const parada of todasParadas) {
      paradasMap.set(parada.idParada, parada);
    }
    paradasCache.set(todasParadas, paradasMap);
  }

  return itinerarioParadasIds
    .map((idParada) => paradasMap!.get(idParada))
    .filter((p): p is T => p !== undefined);
}

/**
 * Formata um número para o formato monetário brasileiro (R$)
 * @param valor Valor numérico a ser formatado
 * @returns String formatada no padrão brasileiro
 */
export function formatarNumeroParaReais(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

/**
 * Realiza um console log apenas no ambiente de desenvolvimento
 * @param message Mensagem ou objeto a ser exibido no console
 */
export function devLog(...message: unknown[]): void {
  if (process.env.NODE_ENV === "development") {
    console.log(...message);
  }
}

/**
 * Copia um texto para a área de transferência (clipboard)
 * @param texto O texto a ser copiado
 * @returns Promise que resolve com true se a operação foi bem-sucedida ou rejeita com o erro
 */
export async function copiarParaClipboard(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    console.error("Erro ao copiar para o clipboard:", error);
    throw error;
  }
}

/**
 * Formata um CPF adicionando pontos e traço
 * @param cpf CPF a ser formatado
 * @returns CPF formatado
 */
export function formatarCpf(cpf: string) {
  cpf = cpf.replace(/\D/g, ""); // Remove qualquer caractere que não seja número

  return cpf
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Formata um CEP adicionando hífen
 * @param cep CEP a ser formatado
 * @returns CEP formatado
 */
export function formatarCep(cep: string) {
  cep = cep.replace(/\D/g, ""); // Remove qualquer caractere que não seja número

  return cep.slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

/**
 * Formata uma data adicionando barras
 * @param data Data em formato de string (DDMMAAAA)
 * @returns Data formatada (DD/MM/AAAA)
 */
export function formatarData(data: string): string {
  data = data.replace(/\D/g, ""); // Remove qualquer caractere que não seja número

  return data
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}

/**
 * Formata um CNPJ adicionando pontos, barra e hífen
 * @param cnpj CNPJ a ser formatado
 * @returns CNPJ formatado
 */
export function formatarCnpj(cnpj: string): string {
  cnpj = cnpj.replace(/\W/g, ""); // Remove tudo exceto letras e números

  return cnpj
    .slice(0, 14)
    .replace(/^(.{2})(.{3})(.{3})(.{4})(.{2}).*$/, "$1.$2.$3/$4-$5");
}

/**
 * Converte um objeto para uma query string
 * ⚡ Bolt: Otimizado usando URLSearchParams para evitar múltiplas alocações de array
 * (filter, flatMap, join). Nota: codifica espaços como '+' em vez de '%20'.
 * @param obj Objeto a ser convertido
 * @returns Query string formatada
 */
export function objectToQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        for (const v of value) {
          params.append(key, String(v));
        }
      } else {
        params.append(key, String(value));
      }
    }
  }
  return params.toString();
}

/**
 * Calcula a idade com base na data de nascimento
 * @param dataNascimento Data de nascimento
 * @returns Idade em anos
 */
export function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();

  if (
    mesAtual < dataNascimento.getMonth() ||
    (mesAtual === dataNascimento.getMonth() &&
      diaAtual < dataNascimento.getDate())
  ) {
    idade--;
  }

  return idade;
}

/**
 * Verifica se um valor é um array de números
 * @param value Valor a ser verificado
 * @returns True se for um array de números, false caso contrário
 */
export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((val) => !isNaN(Number(val)));
}

/**
 * Escapa caracteres HTML perigosos para prevenir ataques de Cross-Site Scripting (XSS)
 * @param texto Texto a ser escapado
 * @returns Texto com caracteres perigosos escapados
 */
export function escapeHtml(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Detecta e converte URLs em texto simples para links HTML de forma segura
 * @param texto Texto que pode conter URLs
 * @returns Texto seguro com URLs convertidas em tags <a>
 */
export function converterUrlsEmLinks(texto: string): string {
  if (!texto) return "";

  // Regex melhorada para detectar URLs começando com http://, https:// ou www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  // Divide o texto com base no regex, isolando as URLs para escapá-las individualmente
  const parts = texto.split(urlRegex);

  return parts
    .map((part) => {
      if (part && part.match(urlRegex)) {
        let urlStr = part;
        let suffix = "";

        // Remove pontuação final para não incluir no link
        if (urlStr.endsWith(",") || urlStr.endsWith(".")) {
          suffix = urlStr.slice(-1);
          urlStr = urlStr.slice(0, -1);
        }

        // Adiciona o protocolo http:// às URLs que começam com www.
        const href = urlStr.startsWith("www.") ? `http://${urlStr}` : urlStr;

        // Os atributos e o texto são construídos com segurança
        return `<a style='color:#2357b0; text-decoration:none;' href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" onmouseover="this.style.opacity=0.75;" onmouseout="this.style.opacity=1;">${escapeHtml(urlStr)}</a>${suffix}`;
      }
      // Para o texto normal, apenas escapamos para evitar injeção de HTML/XSS
      return escapeHtml(part);
    })
    .join("");
}

/**
 * Formata quebras de linha do texto original,
 * transformando quebras de linha em tags <br/> de forma segura (escapando HTML antes).
 * @param texto a ser convertido
 * @returns Texto substituindo as quebras de linha por tags <br/> com conteúdo escapado
 */
export function formatarTextoComQuebras(texto: string) {
  if (!texto) return "";
  // Proteção contra XSS: Escapamos o texto antes de injetar as tags <br/>
  return escapeHtml(texto).replace(/\n/g, "<br/>");
}

/**
 * ⚡ Bolt: Encontra o índice do primeiro horário que é estritamente maior que o valor alvo.
 * Usa busca binária O(log N) em vez de array.find() O(N).
 * O array de entrada DEVE estar ordenado.
 *
 * Suporta tanto arrays de primitivos quanto de objetos, através do segundo parâmetro opcional (getter).
 *
 * @param sortedArray Array ordenado
 * @param target Valor alvo
 * @param getVal Função opcional para extrair o valor numérico de um item do array
 * @returns Índice do primeiro elemento estritamente maior que o alvo, ou o tamanho do array se não houver
 */
export function findScheduleIndex<T>(
  sortedArray: T[],
  target: number,
  getVal: (item: T) => number = (item) => item as unknown as number,
): number {
  let left = 0;
  let right = sortedArray.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midVal = getVal(sortedArray[mid]);

    if (midVal > target) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}
