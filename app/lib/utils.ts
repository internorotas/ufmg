import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, lastDayOfMonth, parse, parseISO } from 'date-fns';
import { htmlToText } from 'html-to-text';
import { CustomThrowObject } from './CustomThrowObject';
import sanitizeHtml from 'sanitize-html';

/**
 * Mescla classes CSS usando clsx e tailwind-merge
 * @param inputs Classes CSS a serem mescladas
 * @returns String com as classes mescladas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// export const regexCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
export const regexCnpj =
  /^(([A-Za-z0-9]{2})\.([A-Za-z0-9]{3})\.([A-Za-z0-9]{3})\/([A-Za-z0-9]{4})-([0-9]{2}))$/;
export const regexCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
export const regexPassaporte = /^[A-Z0-9]+$/i;
export const regexEmail = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
export const regexTelefoneInternacional = /\d{8,15}/;
export const regexDataSimples = /^\d{2}\/\d{2}\/\d{4}$/;
export const regexCep = /^\d{5}-?\d{3}$/;
export const regexInstituicaoEstadual = /^\d{2,14}$/;

/**
 * Retorna o nome do mês correspondente ao número do mês
 * @param numeroMes Número do mês (1-12)
 * @returns Nome do mês em português
 */
export function getNomeMes(numeroMes: number) {
  return months[numeroMes - 1];
}

/**
 * Normaliza uma string removendo acentos e caracteres especiais
 * @param str String a ser normalizada
 * @returns String normalizada
 */
export function normalizarString(str: string): string {
  if (!str) return str;

  return str
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas de acentuação
    .replace(/Ç/g, 'C') // Substituir Ç por C
    .replace(/ç/g, 'c') // Substituir ç por c
    .toLowerCase(); // Ignorar case
}

/**
 * Extrai informações formatadas de um nome completo
 * @param nomeCompleto Nome completo a ser processado
 * @returns Objeto com partes do nome processadas
 */
export function extrairDadosNomeCompleto(nomeCompleto: string) {
  const nomes = nomeCompleto.trim().split(' ');
  const primeiroNome = normalizarNome(nomes[0]);
  const ultimoNome = normalizarNome(nomes[nomes.length - 1]);

  let primeiroUltimoNome = primeiroNome;
  let primeiroSegundoNome = primeiroNome;
  let sigla = primeiroNome[0];
  if (nomes.length > 1) {
    primeiroUltimoNome += ` ${normalizarNome(nomes[nomes.length - 1])}`;
    primeiroSegundoNome += ` ${normalizarNome(nomes[1])}`;
    sigla += ultimoNome[0];
  }

  return {
    primeiroNome,
    primeiroUltimoNome,
    primeiroSegundoNome,
    ultimoNome,
    sigla,
  };
}

/**
 * Retorna a lista de nomes dos meses em português
 * @returns Array com os nomes dos meses
 */
export function getMeses() {
  return months;
}

/**
 * Gera um caminho para a página de erro com a mensagem codificada
 * @param message Mensagem de erro a ser exibida
 * @returns Caminho para a página de erro
 */
export function getPathError(message: string) {
  return `/erro?mensagem=${encodeURIComponent(message)}`;
}

/**
 * Cria um atributo data-testid para testes automatizados
 * @param domain Domínio do componente
 * @param component Nome do componente
 * @param action Ação do componente (opcional)
 * @param id Identificador do componente (opcional)
 * @returns Objeto com atributo data-testid formatado
 */
export const createTestId = (
  domain: string,
  component: string,
  action?: string,
  id?: string,
) => {
  return {
    'data-testid': [domain, component, action, id].filter(Boolean).join('-'),
  };
};

/**
 * Extrai parâmetros de uma query string
 * @param values Query string completa
 * @param parameterName Nome do parâmetro a ser extraído
 * @returns Valor do parâmetro decodificado ou null
 */
export function findGetParameter(values: string, parameterName: string) {
  let result: string | null = null;
  let tmp: string[] = [];

  values
    .substring(1)
    .split('&')
    .forEach(function (item) {
      tmp = item.split('=');
      if (tmp[0] === parameterName) {
        result = decodeURIComponent(tmp[1]);
      }
    });

  return result;
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
      return format(data, formato ?? 'yyyy-MM-dd');
    } catch {
      throw new Error('Data inválida.');
    }
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
    throw new Error('Erro ao copiar para o clipboard:', {
      cause: error as Error,
    });
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
 * Verifica se um valor é um array de números
 * @param value Valor a ser verificado
 * @returns True se for um array de números, false caso contrário
 */
export function isNumberArray(value: any) {
  return Array.isArray(value) && value.every((val) => !isNaN(Number(val)));
}

/**
 * Obtém a URL completa da aplicação de extensão
 * @param aditionalPath Caminho adicional (opcional)
 * @returns URL completa
 */
export function getUrlExtensao(aditionalPath?: string) {
  if (aditionalPath && !aditionalPath.startsWith('/'))
    aditionalPath = '/' + aditionalPath;
  return process.env.NEXT_PUBLIC_EXTENSAO_APP + (aditionalPath ?? '');
}

/**
 * Gera uma URL de redirecionamento com base no `href` fornecido.
 * Se o `href` for uma URL absoluta (começando com "http://" ou "https://"),
 * ele processa a URL usando `getUrlExtensao`. Caso contrário, codifica o `href`
 * e o adiciona como um parâmetro de consulta ao endpoint `/redirect`.
 *
 * @param href - A URL ou caminho a ser redirecionado.
 * @returns A URL de redirecionamento processada.
 */
export function getRedirectUrl(href: string): string {
  const baseUrl = getUrlExtensao().toLowerCase();
  if (href.length == 0 || href == '#') return '#';

  if (href.toLowerCase().startsWith(baseUrl)) {
    const regexBaseUrl = new RegExp(`^${baseUrl}`, 'i');
    href = href.replace(regexBaseUrl, '');
    return getUrlExtensao('redirect' + href);
  }
  return href;
}

export function getStrapiImage(imagePath: string) {
  if (!imagePath) return '';

  const ARQUIVOS_URL = `${process.env.NEXT_PUBLIC_BASEURL_UPLOADS}`;

  return imagePath.replace(/^\/uploads/, ARQUIVOS_URL);
}

/**
 * Converte uma string JSON para um array de números ou retorna um valor padrão
 * @param value String JSON a ser convertida
 * @param defaultValue Valor padrão caso a conversão falhe
 * @returns Array de números ou o valor padrão
 */
export function jsonParseNumberArrayOrDefault(
  value: string | null,
  defaultValue: number[],
) {
  let returnValue = defaultValue;
  try {
    if (value && value.length > 0) {
      const nValue = JSON.parse(value);

      if (isNumberArray(nValue)) returnValue = nValue as number[];
      if (!/\D/.test(value)) returnValue = [nValue as number];
    }
  } catch (e) {
    //finally sempre executa independentemente se deu erro ou não
    //blocos try...catch...finally essa a ordem de execução:
    //1. try
    //2. catch (se houver erro)
    //3. finally
    if (e) {
      throw new Error('Erro ao converter para array de números:', {
        cause: e as Error,
      });
    }
    return returnValue;
  }
}

/**
 * Calcula a idade com base na data de nascimento
 * @param dataNascimento Data de nascimento no formato ISO ou "dd/MM/yyyy"
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
 * Converte uma string para número ou retorna um valor padrão
 * @param value String a ser convertida
 * @param defaultValue Valor padrão caso a conversão falhe
 * @returns Número ou o valor padrão
 */
export function jsonParseNumberOrDefault(
  value: string | null,
  defaultValue: number,
) {
  if (!value || value.length == 0 || /[\D]/.test(value)) return defaultValue;
  return parseInt(value);
}

/**
 * Converte uma string para número ou retorna undefined
 * @param value String a ser convertida
 * @returns Número ou undefined
 */
export function jsonParseNumberOrUndefined(value: string | null) {
  if (!value || value.length == 0 || /[\D]/.test(value)) return;
  return parseInt(value);
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
 * Gera um link para um arquivo no servidor
 * @param guid GUID do arquivo
 * @returns URL completa para o arquivo
 */
export function getComumArquivoLink(guid: string) {
  return `${process.env.NEXT_PUBLIC_EXTENSAO_API}/comum/arquivo/${guid}`;
}

/**
 * Obtém as iniciais de um nome
 * @param name Nome completo
 * @returns Iniciais do nome (primeiras letras das duas primeiras palavras)
 */
export function getInitials(name?: string): string {
  if (!name) {
    return '';
  }
  const parts = name.trim().split(' ');
  const initials = parts.map((part) => part.charAt(0).toUpperCase());
  return initials.slice(0, 2).join('');
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
    .split(' ')
    .map((n) => {
      if (n.length == 2 && n.toLowerCase().startsWith('d'))
        return n.toLowerCase();
      return normalizarNome(n);
    })
    .join(' ');
}

/**
 * Formata um CPF adicionando pontos e traço
 * @param cpf CPF a ser formatado
 * @returns CPF formatado
 */
export function formatarCpf(cpf: string) {
  cpf = cpf.replace(/\D/g, ''); // Remove qualquer caractere que não seja número

  return cpf
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata um CEP adicionando hífen
 * @param cep CEP a ser formatado
 * @returns CEP formatado
 */
export function formatarCep(cep: string) {
  cep = cep.replace(/\D/g, ''); // Remove qualquer caractere que não seja número

  return cep.slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata uma data adicionando barras
 * @param data Data em formato de string (DDMMAAAA)
 * @returns Data formatada (DD/MM/AAAA)
 */
export function formatarData(data: string): string {
  data = data.replace(/\D/g, ''); // Remove qualquer caractere que não seja número

  return data
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

/**
 * Formata um CNPJ adicionando pontos, barra e hífen
 * @param cnpj CNPJ a ser formatado
 * @returns CNPJ formatado
 */
export function formatarCnpj(cnpj: string): string {
  /*cnpj = cnpj.replace(/\D/g, ''); // Remove qualquer caractere não numérico*/
  cnpj = cnpj.replace(/\W/g, ''); // Remove tudo exceto letras e números

  return cnpj
    .slice(0, 14)
    .replace(/^(.{2})(.{3})(.{3})(.{4})(.{2}).*$/, '$1.$2.$3/$4-$5');
  /*.replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');*/
}

/**
 * Converte um objeto para uma query string
 * @param obj Objeto a ser convertido
 * @returns Query string formatada
 */
export function objectToQueryString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(
          (v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`,
        );
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
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
  if (!data) return { dia: '', mesAbreviado: '', ano: '' };

  try {
    let dia: string, mes: string, ano: string;

    if (data.includes('/')) {
      // Formato: "24/04/2025 09:22:12"
      const [dataParte] = data.split(' ');
      const partes = dataParte.split('/');

      if (partes.length !== 3) throw new Error('Formato DD/MM/YYYY inválido');

      [dia, mes, ano] = partes;
    } else {
      // Formato ISO: "2025-05-13T16:52:57.261Z"
      const dateObj = new Date(data);

      if (isNaN(dateObj.getTime())) throw new Error('Data ISO inválida');

      dia = String(dateObj.getDate());
      mes = String(dateObj.getMonth() + 1); // zero-based
      ano = String(dateObj.getFullYear());
    }

    if (!dia || !mes || !ano) throw new Error('Campos de data inválidos');
    if (isNaN(Number(dia)) || isNaN(Number(mes)) || isNaN(Number(ano))) {
      throw new Error('Valores não numéricos detectados');
    }

    return {
      dia: dia.padStart(2, '0'),
      mesAbreviado: getNomeMes(Number(mes))?.slice(0, 3).toUpperCase() || '',
      ano,
    };
  } catch (error) {
    throw new Error(
      `Erro ao formatar data: ${{ cause: error as Error }} - ${{ dia: '', mesAbreviado: '', ano: '' }}`,
    );
  }
}

// Formata "2025-05-12T00:00:00" ou "24/04/2025 09:32:54" para "abril 24, 2025"
export function formatarDataParaPorExtenso(data: string): string {
  try {
    const meses = getMeses().map((mes) => mes.toLowerCase());

    let dia: string, mes: string, ano: string;

    if (data.includes('/')) {
      const [dataParte] = data.split(' ');
      [dia, mes, ano] = dataParte.split('/');
    } else {
      const dateObj = new Date(data);
      if (isNaN(dateObj.getTime())) throw new Error('Data inválida');

      dia = String(dateObj.getDate()).padStart(2, '0');
      mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      ano = String(dateObj.getFullYear());
    }

    const nomeMes = meses[parseInt(mes, 10) - 1] || '';

    return `${nomeMes} ${dia}, ${ano}`;
  } catch (error) {
    throw new Error('Erro ao formatar data por extenso:', {
      cause: error as Error,
    });
  }
}

/**
 * Converte HTML para texto simples
 * @param html String HTML a ser convertida
 * @param forceLinks
 * @returns Texto simples sem marcações HTML
 */
export function formatarHtmlParaTexto(html: string, forceLinks?: boolean) {
  let htmlRetorno = htmlToText(html, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      {
        selector: 'a',
        format: 'inline',
        options: {
          linkBrackets: ['', ''],
          ignoreHref: !forceLinks,
        },
      },
      { selector: 'img', format: 'skip' },
    ],
  });
  if (forceLinks) htmlRetorno = converterUrlsEmLinks(htmlRetorno);

  return htmlRetorno;
}

/**
 * formatar quebras de linha do texto original
 * transformar quebras de linha em tags <br/>
 * para garantir que a exibição mantenha a formatação esperada
 * @param texto a ser convertido
 * @returns Texto substituindo as quebras de linha por tags <br/>
 */
export function formatarTextoComQuebras(texto: string) {
  if (!texto) return '';
  return texto.replace(/\n/g, '<br/>');
}

/**
 * Detecta e converte URLs em texto simples para links HTML
 * @param texto Texto que pode conter URLs
 * @returns Texto com URLs convertidas em tags <a>
 */
export function converterUrlsEmLinks(texto: string): string {
  // Regex melhorada para detectar URLs começando com http://, https:// ou www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  // Substitui URLs encontradas por tags <a>
  return texto.replace(urlRegex, (url) => {
    // Adiciona o protocolo http:// às URLs que começam com www.
    let href = url.startsWith('www.') ? `http://${url}` : url;
    if (href.endsWith(',') || href.endsWith('.'))
      href = href.substring(0, href.length - 1);
    return `<a style='color:#2357b0; text-decoration:none;' href="${href}" target="_blank" rel="noopener noreferrer" onmouseover="this.style.opacity=0.75;" onmouseout="this.style.opacity=1;">${url}</a>`;
  });
}

/**
 * Formata um número para o formato monetário brasileiro (R$)
 * @param valor Valor numérico a ser formatado
 * @returns String formatada no padrão brasileiro
 */
export function formatarNumeroParaReais(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

/**
 * Realiza um console log apenas no ambiente de desenvolvimento
 * @param message Mensagem ou objeto a ser exibido no console
 */
export function devLog(...message: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
}

/**
 * Verifica se o path fornecido é igual ao path atual, incluindo a query string,
 * ignorando case, normalizando o host e removendo trailing slashes.
 * @param path Path a ser comparado
 * @returns True se o path for igual ao path atual, false caso contrário
 */
export function isCurrentPath(path: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const currentUrl = new URL(window.location.href);
    let providedUrl: URL;
    try {
      providedUrl = new URL(path, currentUrl.origin);
    } catch {
      // If `path` is not a valid URL, treat it as a relative path
      providedUrl = new URL(currentUrl.origin + path);
    }

    // Normaliza os paths removendo trailing slashes e ignorando case
    const normalizePath = (url: URL) =>
      url.pathname.replace(/\/+$/, '').toLowerCase() + url.search.toLowerCase();

    return (
      currentUrl.host === providedUrl.host &&
      normalizePath(currentUrl) === normalizePath(providedUrl)
    );
  } catch (error) {
    throw new Error('Erro ao comparar paths:', { cause: error as Error });
  }
}

/**
 * Baixa um arquivo a partir de uma URL autenticada e limpa da memória após 15 segundos
 * @param data Objeto com parâmetros para o download
 * @param data.url URL da API backend que retorna o arquivo
 * @param data.bearerToken Token de autenticação (Bearer)
 * @returns Promise que resolve quando o download é iniciado ou rejeita em caso de erro
 */
export async function baixarArquivoApiAutenticada(data: {
  url: string;
  bearerToken: string;
}) {
  return new Promise(async (resolve, reject) => {
    const { url, bearerToken } = data;

    try {
      // Configura os headers com o token de autenticação, se fornecido
      const headers: HeadersInit = {
        'Cache-Control': 'no-cache',
        Authorization: bearerToken ? `Bearer ${bearerToken}` : '',
      };

      // Realiza a requisição para a API autenticada
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new CustomThrowObject({
          statusCode: response.status,
          publicMessage: 'Ocorreu um erro ao tentar baixar um arquivo.',
          privateMessage: response.statusText,
        });
      }

      // Obtém o blob do arquivo
      const blob = await response.blob();

      // Cria uma URL temporária para o blob
      const blobUrl = URL.createObjectURL(blob);

      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      resolve(true);
      // Limpa a URL temporária após 30 segundos
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 30000); // 30 segundos
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculates the date range (start and end dates) for a specific month and year.
 * The start date is the first day of the month, and the end date is the last day of the month.
 *
 * @param mes - Month in string format (values from "01" to "12").
 * @param ano - Year in string format (e.g., "2025").
 * @returns An object containing the start and end dates of the month in "YYYY-MM-DD" format,
 *          or `undefined` if the parameters are invalid.
 */
export function calcularIntervaloDeDatas(mes: string, ano: string) {
  if (!mes || !ano) return;
  const dataInicio = converteStringToData(`${ano}-${mes}-01T00:00`)!;

  const dataFim = lastDayOfMonth(dataInicio);

  return { dataInicio, dataFim };
}

/**
 * Sanitiza o HTML de entrada, removendo estilos inline, atributos visuais e tags não permitidas.
 * Também remove elementos como <img>, conforme configurado.
 *
 * @param input HTML bruto vindo da API
 * @returns HTML limpo e seguro para renderização com ReactMarkdown
 */

export function cleanHtmlForMarkdown(input: string) {
  if (!input) return '';
  const withStrongTags = input.replace(
    /<span[^>]*style=["'][^"']*font-weight\s*:\s*bold[^"']*["'][^>]*>(.*?)<\/span>/gi,
    '<strong>$1</strong>',
  );

  return sanitizeHtml(withStrongTags, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe']),
    allowedAttributes: {
      '*': ['href', 'src', 'alt', 'width', 'height', 'title', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      '*': (tagName, attribs) => {
        // Remove apenas atributos relacionados a estilo
        //atributos indesejados como style, class, align, bgcolor, color, face, size, etc.
        const {
          style,
          class: className,
          align,
          bgcolor,
          color,
          face,
          size,
          ...cleanedAttribs
        } = attribs;
        return {
          tagName,
          attribs: cleanedAttribs,
        };
      },
    },
  });
}
