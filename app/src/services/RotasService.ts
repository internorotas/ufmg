/**
 * Repository Pattern - Camada de Serviço para dados de rotas.
 *
 * Este serviço desacopla a lógica de acesso a dados da camada de UI,
 * permitindo fácil substituição por APIs externas no futuro.
 */

import { normalizarNomeLinha } from '../lib/utils';
import type { CategoriaLinhas, DadosLinhas, Linha, Parada } from '../types/data.types';

const DATA_BUILD_ID = import.meta.env.VITE_BUILD_ID;

interface ParadasPayload {
  paradas: Parada[];
}

/**
 * Interface que define o contrato do serviço de rotas.
 * Permite implementações alternativas (mock, API, etc.)
 */
export interface IRotasService {
  getTodasLinhas(): CategoriaLinhas;
  getLinhasPorCategoria(categoriaId: number): DadosLinhas | null;
  getLinhaById(idRota: string): Linha | null;
  getTodasParadas(): Parada[];
  getParadaById(idParada: string): Parada | null;
  getCategorias(): DadosLinhas[];
  getLinhasPorNomeNormalizado(nomeNormalizado: string): Linha[];
}

/**
 * Implementação concreta do serviço de rotas usando dados estáticos.
 * Pode ser substituída por uma implementação que busca dados de uma API.
 */
class RotasServiceImpl implements IRotasService {
  private linhasCache: CategoriaLinhas;
  private paradasCache: Parada[];
  private linhasMap: Map<string, Linha>;
  private paradasMap: Map<string, Parada>;
  private linhasPorNomeNormalizadoMap: Map<string, Linha[]>;

  constructor() {
    this.linhasCache = { categoriasDias: [] };
    this.paradasCache = [];

    // Cria mapas para acesso O(1) por ID e Nome Normalizado
    this.linhasMap = new Map();
    this.paradasMap = new Map();
    this.linhasPorNomeNormalizadoMap = new Map();
  }

  static fromData(linhasData: CategoriaLinhas, paradasData: ParadasPayload): RotasServiceImpl {
    const service = new RotasServiceImpl();
    service.hydrate(linhasData, paradasData.paradas);
    return service;
  }

  private hydrate(linhasData: CategoriaLinhas, paradas: Parada[]): void {
    this.linhasCache = linhasData;
    this.paradasCache = paradas;

    // Recria os mapas para acesso O(1) por ID e Nome Normalizado
    this.linhasMap = new Map();
    this.paradasMap = new Map();
    this.linhasPorNomeNormalizadoMap = new Map();

    // Popula o mapa de linhas
    linhasData.categoriasDias.forEach((categoria) => {
      categoria.linhas.forEach((linha) => {
        this.linhasMap.set(linha.idRota, linha);

        // Popula mapa O(1) por nome normalizado
        const chaveNormalizada = normalizarNomeLinha(linha.nome);
        const linhasNormalizadas = this.linhasPorNomeNormalizadoMap.get(chaveNormalizada) ?? [];
        linhasNormalizadas.push(linha);
        this.linhasPorNomeNormalizadoMap.set(chaveNormalizada, linhasNormalizadas);
      });
    });

    // Popula o mapa de paradas
    paradas.forEach((parada) => {
      this.paradasMap.set(parada.idParada, parada);
    });
  }

  /**
   * Retorna todas as categorias de linhas.
   */
  getTodasLinhas(): CategoriaLinhas {
    return this.linhasCache;
  }

  /**
   * Retorna as linhas de uma categoria específica pelo ID.
   * @param categoriaId - O ID da categoria (0 = Dias Úteis, 1 = Sábados, etc.)
   */
  getLinhasPorCategoria(categoriaId: number): DadosLinhas | null {
    const categoria = this.linhasCache.categoriasDias[categoriaId];
    return categoria ?? null;
  }

  /**
   * Retorna uma linha específica pelo seu ID de rota.
   * @param idRota - O identificador único da rota (ex: "DU10")
   */
  getLinhaById(idRota: string): Linha | null {
    return this.linhasMap.get(idRota) ?? null;
  }

  /**
   * Retorna todas as categorias disponíveis.
   */
  getCategorias(): DadosLinhas[] {
    return this.linhasCache.categoriasDias;
  }

  /**
   * Retorna todas as paradas disponíveis.
   */
  getTodasParadas(): Parada[] {
    return this.paradasCache;
  }

  /**
   * Retorna uma parada específica pelo seu ID.
   * @param idParada - O identificador único da parada (ex: "P01")
   */
  getParadaById(idParada: string): Parada | null {
    return this.paradasMap.get(idParada) ?? null;
  }

  /**
   * Retorna uma lista de linhas pelo nome normalizado
   * @param nomeNormalizado - O nome da linha em letras minúsculas e sem acentos
   */
  getLinhasPorNomeNormalizado(nomeNormalizado: string): Linha[] {
    return this.linhasPorNomeNormalizadoMap.get(nomeNormalizado) ?? [];
  }
}

async function loadFromPublic(): Promise<{ linhas: CategoriaLinhas; paradas: ParadasPayload }> {
  const publicBaseUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin);
  const linhasUrl = new URL('data/linhas.json', publicBaseUrl);
  const paradasUrl = new URL('data/paradas.json', publicBaseUrl);

  linhasUrl.searchParams.set('v', DATA_BUILD_ID);
  paradasUrl.searchParams.set('v', DATA_BUILD_ID);

  const [linhasResponse, paradasResponse] = await Promise.all([
    fetch(linhasUrl, { cache: 'no-store' }),
    fetch(paradasUrl, { cache: 'no-store' }),
  ]);

  if (!linhasResponse.ok || !paradasResponse.ok) {
    throw new Error('Falha ao carregar dados de rotas em /public/data');
  }

  const [linhas, paradas] = await Promise.all([
    linhasResponse.json() as Promise<CategoriaLinhas>,
    paradasResponse.json() as Promise<ParadasPayload>,
  ]);

  return { linhas, paradas };
}

async function loadFromSourceFallback(): Promise<{
  linhas: CategoriaLinhas;
  paradas: ParadasPayload;
}> {
  const [linhasModule, paradasModule] = await Promise.all([
    import('../data/linhas'),
    import('../data/paradas'),
  ]);

  return {
    linhas: linhasModule.default,
    paradas: paradasModule.default,
  };
}

let cachedService: IRotasService | null = null;
let loadingServicePromise: Promise<IRotasService> | null = null;

export async function loadRotasService(): Promise<IRotasService> {
  if (cachedService) {
    return cachedService;
  }

  if (loadingServicePromise) {
    return loadingServicePromise;
  }

  loadingServicePromise = (async () => {
    try {
      const { linhas, paradas } = await loadFromPublic();
      cachedService = RotasServiceImpl.fromData(linhas, paradas);
      return cachedService;
    } catch {
      if (import.meta.env.DEV) {
        // Fallback para os módulos TypeScript quando /public/data ainda não foi gerado.
        const { linhas, paradas } = await loadFromSourceFallback();
        cachedService = RotasServiceImpl.fromData(linhas, paradas);
        return cachedService;
      }
      throw new Error('Falha ao carregar dados de rotas em /public/data');
    }
  })();

  try {
    return await loadingServicePromise;
  } finally {
    loadingServicePromise = null;
  }
}

// Instância vazia para evitar null checks durante bootstrap.
export const RotasService: IRotasService = new RotasServiceImpl();

// Também exporta a classe para permitir testes ou injeção de dependência
export { RotasServiceImpl };
