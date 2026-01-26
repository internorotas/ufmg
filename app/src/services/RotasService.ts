/**
 * Repository Pattern - Camada de Serviço para dados de rotas.
 *
 * Este serviço desacopla a lógica de acesso a dados da camada de UI,
 * permitindo fácil substituição por APIs externas no futuro.
 */

import linhasData from "../data/linhas";
import paradasData from "../data/paradas";
import type {
  Linha,
  Parada,
  CategoriaLinhas,
  DadosLinhas,
} from "../types/data.types";

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
}

/**
 * Implementação concreta do serviço de rotas usando dados estáticos.
 * Pode ser substituída por uma implementação que busca dados de uma API.
 */
class RotasServiceImpl implements IRotasService {
  private readonly linhasCache: CategoriaLinhas;
  private readonly paradasCache: Parada[];
  private readonly linhasMap: Map<string, Linha>;
  private readonly paradasMap: Map<string, Parada>;

  constructor() {
    // Inicializa os caches
    this.linhasCache = linhasData;
    this.paradasCache = paradasData.paradas;

    // Cria mapas para acesso O(1) por ID
    this.linhasMap = new Map();
    this.paradasMap = new Map();

    // Popula o mapa de linhas
    this.linhasCache.categoriasDias.forEach((categoria) => {
      categoria.linhas.forEach((linha) => {
        this.linhasMap.set(linha.idRota, linha);
      });
    });

    // Popula o mapa de paradas
    this.paradasCache.forEach((parada) => {
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
}

// Exporta uma instância singleton do serviço
export const RotasService: IRotasService = new RotasServiceImpl();

// Também exporta a classe para permitir testes ou injeção de dependência
export { RotasServiceImpl };
