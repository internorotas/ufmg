import Linha from "../Linha/Linha";

export default function Sidebar() {
  return (
    <div className="fixed top-4 left-4 h-[calc(100%-2rem)] w-[25%] bg-internoRotas-preto-carvao text-white shadow-lg z-50 rounded-lg flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-center bg-internoRotas-azul-eletrico rounded-l-lg rounded-r-lg">
        <img
          src="src/assets/logo-horizontal-transparente.svg"
          alt="Logo do Interno Rotas"
          width={150}
          height={60}
        />
      </header>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <Linha />
      </nav>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-700 text-center">
        <a
          href="https://github.com/igormartins4"
          target="_blank"
          rel="noopener noreferrer"
          className="text-internoRotas-bege-areia"
        >
          <p className="text-sm font-[600] text-internoRotas-bege-areia">
            Desenvolvido com 💙 por Igor Martins
          </p>
        </a>
      </footer>
    </div>
  );
}
