import { useState } from "react";
import { LinhaDetalhesModal } from "./LinhaDetalhesModal";
import { ThemeToggle } from "./ThemeToggle";
import { Linha, CategoriaLinhas, Parada } from "../types/data.types";
import logo from "../assets/logo-horizontal-transparente.svg";
import { IoSearch, IoMenu, IoClose } from "react-icons/io5";
import { LineCard } from "./LineCard";

interface MenuLateralProps {
  linhasData: CategoriaLinhas;
  todasParadas: Parada[];
  onLinhaSelect: (linha: Linha) => void;
  onParadaClick: (parada: Parada) => void;
  linhaSelecionada: Linha | null;
}

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
  const [linhaDetalhesAberta, setLinhaDetalhesAberta] = useState<Linha | null>(
    null
  );

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

  // Obter linhas da categoria ativa
  const categoriaAtual = linhasData.categoriasDias[categoriaAtiva];
  const linhasFiltradas =
    categoriaAtual?.linhas.filter(
      (linha) =>
        linha.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (linha.sublinha &&
          linha.sublinha.toLowerCase().includes(searchTerm.toLowerCase())) ||
        linha.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <>
      {/* Botão Mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1001]">
        <button
          onClick={() => setMenuVisible(true)}
          className="bg-internoRotas-azul-eletrico text-white py-3 px-6 rounded-full shadow-lg flex items-center gap-3 font-bold hover:bg-blue-700 transition-colors"
        >
          <IoMenu size={24} />
          Ver Linhas
        </button>
      </div>

      {/* Backdrop Mobile */}
      {isMenuVisible && (
        <div
          onClick={() => setMenuVisible(false)}
          className="md:hidden fixed inset-0 bg-black/70 z-[1002] animate-fade-in"
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-full w-full max-w-md md:w-1/2 bg-background text-text-primary z-[1003] transform transition-transform duration-300 ${
          isMenuVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 flex flex-col border-r border-card-border`}
      >
        {/* Header */}
        <header className="bg-internoRotas-azul-eletrico p-2 flex justify-between items-center flex-shrink-0">

            <div className="flex items-center justify-center flex-1">
            <img src={logo} alt="Logo Interno Rotas" className="h-6" />
            </div>

          <div className="flex items-center gap-2">
            {/* Toggle de Tema */}

            <ThemeToggle />

            {/* Botão Fechar Mobile */}
            <button
              onClick={() => setMenuVisible(false)}
              className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition-colors"
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
              className="w-full bg-input border border-card-border text-text-primary rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-internoRotas-azul-eletrico focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabs de Categoria */}
        <div className="flex gap-2 px-2 py-2 bg-background-secondary flex-shrink-0 border-b border-card-border">
          {linhasData.categoriasDias.map((categoria, index) => (
            <button
              key={categoria.id}
              onClick={() => setCategoriaAtiva(index)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                categoriaAtiva === index
                  ? "bg-internoRotas-azul-eletrico text-white shadow-md"
                  : "bg-card text-text-secondary hover:bg-card-hover hover:text-text-primary border border-card-border"
              }`}
            >
              {categoria.displayName}
            </button>
          ))}
        </div>

        {/* Lista de Linhas */}
        <main className="p-4 overflow-y-auto flex-1 bg-background">
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
            <div className="text-center py-12 text-text-secondary">
              <p className="text-lg font-medium">Nenhuma linha encontrada</p>
              <p className="text-sm mt-2">Tente ajustar sua pesquisa</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Detalhes da Linha */}
      {linhaDetalhesAberta && (
        <LinhaDetalhesModal
          isOpen={true}
          onClose={() => setLinhaDetalhesAberta(null)}
          linha={linhaDetalhesAberta}
          todasParadas={todasParadas}
          onParadaClick={onParadaClick}
        />
      )}
    </>
  );
}
