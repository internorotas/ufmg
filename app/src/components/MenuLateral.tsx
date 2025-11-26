import { useState, useEffect } from "react";
import ReactGA from "react-ga4";
import { useDebounce } from "use-debounce";
import { LinhaDetalhesModal } from "./LinhaDetalhesModal";
import { ThemeToggle } from "./ThemeToggle";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { MenuFooter } from "./MenuFooter";
import { Linha, CategoriaLinhas, Parada } from "../types/data.types";
import logo from "../assets/logo-horizontal-transparente.svg";
import { IoSearch, IoMenu, IoClose } from "react-icons/io5";
import { LineCard } from "./LineCard";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

interface MenuLateralProps {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  onLinhaSelect: (linha: Linha) => void;
  onParadaClick: (parada: Parada) => void;
  linhaSelecionada: Linha | null;
}

/**
 * Renderiza o menu lateral, que exibe uma lista de linhas de ônibus, uma barra de pesquisa e abas de categorias.
 *
 * @param {object} props - As propriedades do componente.
 * @param {CategoriaLinhas} props.linhasData - Um objeto contendo os dados das linhas de ônibus, categorizados por tipo de dia.
 * @param {Parada[]} props.todasParadas - Um array com todas as paradas de ônibus disponíveis.
 * @param {(linha: Linha) => void} props.onLinhaSelect - Uma função para lidar com a seleção de uma linha de ônibus.
 * @param {(parada: Parada) => void} props.onParadaClick - Uma função para lidar com cliques em uma parada de ônibus.
 * @param {Linha | null} props.linhaSelecionada - A linha de ônibus atualmente selecionada, ou nulo se nenhuma estiver selecionada.
 * @returns {JSX.Element} O componente de menu lateral renderizado.
 */
export function MenuLateral({
  linhasData,
  todasParadas,
  onLinhaSelect,
  onParadaClick,
  linhaSelecionada,
}: MenuLateralProps) {
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 1500);
  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(
    null,
  );

  useEffect(() => {
    if (GA_MEASUREMENT_ID && debouncedSearchTerm) {
      ReactGA.event({
        category: "Busca",
        action: "Termo Pesquisado",
        label: debouncedSearchTerm,
      });
    }
  }, [debouncedSearchTerm]);

  const handleCardClick = (linha: Linha) => {
    // Clique no card: seleciona a linha e mostra no mapa
    onLinhaSelect(linha);
    // Não fecha o menu no desktop, apenas no mobile
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  const handleDetailsClick = (linha: Linha) => {
    // Clique no botão: abre o modal de detalhes
    setLinhaDetalhesAberta(linha);
  };

  const handleParadaClickWrapper = (parada: Parada) => {
    // Chama a função original de clique na parada
    onParadaClick(parada);
    // Fecha o menu no mobile
    if (window.innerWidth < 768) {
      setMenuVisible(false);
    }
  };

  // Obter linhas da categoria ativa
  const categoriaAtual = linhasData.categoriasDias[categoriaAtiva];
  const linhasFiltradas =
    categoriaAtual?.linhas.filter(
      (linha) =>
        linha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (linha.sublinha &&
          linha.sublinha.toLowerCase().includes(searchTerm.toLowerCase())) ||
        linha.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  useEffect(() => {
    if (searchTerm && linhasFiltradas.length === 0) {
      if (GA_MEASUREMENT_ID) {
        ReactGA.event({
          category: "Busca",
          action: "Busca Sem Resultados",
          label: searchTerm,
        });
      }
    }
  }, [searchTerm, linhasFiltradas.length]);

  const handleCategoriaClick = (index: number) => {
    const categoria = linhasData.categoriasDias[index];
    if (GA_MEASUREMENT_ID && categoria) {
      ReactGA.event({
        category: "Navegação Principal",
        action: "Selecionar Categoria Dia",
        label: categoria.displayName,
      });
    }
    setCategoriaAtiva(index);
  };

  return (
    <>
      {/* Botão Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1001]">
        <button
          onClick={() => setMenuVisible(true)}
          className="bg-brand-primary text-white py-3 px-6 rounded-full shadow-lg flex items-center gap-3 font-bold hover:bg-blue-700 transition-colors cursor-pointer active:scale-95"
        >
          <IoMenu size={24} />
          Ver Linhas
        </button>
      </div>

      {/* Backdrop Mobile */}
      {isMenuVisible && (
        <div
          onClick={() => setMenuVisible(false)}
          className="md:hidden fixed inset-0 bg-backdrop z-[1002] animate-fade-in backdrop-blur-sm"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 w-[85vw] max-w-md md:w-1/2 bg-sidebar text-text-primary z-[1003] transform transition-transform duration-300 ${
          isMenuVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col border-r border-card-border shadow-2xl md:shadow-none`}
      >
        {/* Header */}
        <header className="bg-brand-primary p-2 flex justify-between items-center flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-center flex-1">
            <img src={logo} alt="Logo Interno Rotas" className="h-6" />
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Tema */}

            <ThemeToggle />

            {/* Botão Fechar Mobile */}
            <button
              onClick={() => setMenuVisible(false)}
              className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <IoClose size={24} />
            </button>
          </div>
        </header>

        {/* Barra de Pesquisa */}
        <div className="p-4 bg-background-secondary flex-shrink-0 border-b border-card-border">
          <div className="relative">
            <IoSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              size={20}
            />
            <input
              type="text"
              placeholder="Pesquisar linha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-input border border-input-border text-text-primary rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Tabs de Categoria */}
        <div className="flex gap-2 px-4 py-3 bg-background flex-shrink-0 border-b border-card-border md:border-none">
          {linhasData.categoriasDias.map((categoria, index) => (
            <button
              key={categoria.id}
              onClick={() => handleCategoriaClick(index)}
              className={`flex-1 py-2.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                categoriaAtiva === index
                  ? "bg-brand-primary text-white shadow-sm"
                  : "bg-card text-text-secondary hover:bg-card-hover hover:text-text-primary border border-transparent hover:border-card-border"
              }`}
            >
              {categoria.displayName}
            </button>
          ))}
        </div>

        {/* Lista de Linhas */}
        <nav
          className="p-4 overflow-y-auto flex-1 bg-background"
          aria-label="Lista de Linhas"
        >
          {linhasFiltradas.length > 0 ? (
            linhasFiltradas.map((linha: Linha) => (
              <LineCard
                key={linha.idRota}
                linha={linha}
                onClick={() => handleCardClick(linha)}
                onDetailsClick={() => handleDetailsClick(linha)}
                isSelected={linhaSelecionada?.idRota === linha.idRota}
              />
            ))
          ) : (
            <div className="text-center py-12 text-text-secondary flex flex-col items-center justify-center h-full">
              <IoSearch
                size={48}
                className="text-text-tertiary mb-4 opacity-20"
              />
              <p className="text-lg font-medium">Nenhuma linha encontrada</p>
              <p className="text-sm mt-2 text-text-tertiary">
                Tente ajustar sua pesquisa
              </p>
            </div>
          )}

          {/* Banner de Aviso */}
          <DisclaimerBanner />
        </nav>

        {/* Footer */}
        <MenuFooter />
      </aside>

      {/* Modal de Detalhes da Linha */}
      {linhaDetalhesAberta && (
        <LinhaDetalhesModal
          isOpen={true}
          onClose={() => setLinhaDetalhesAberta(null)}
          linha={linhaDetalhesAberta}
          todasParadas={todasParadas}
          onParadaClick={handleParadaClickWrapper}
        />
      )}
    </>
  );
}
