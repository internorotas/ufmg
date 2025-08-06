import React from 'react';
// Importa o logo da pasta de assets
import logo from '../assets/logo-horizontal-transparente.svg';

interface HeaderMobileProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

export const HeaderMobile: React.FC<HeaderMobileProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    // O header é fixo no topo, com z-index alto e visível apenas em ecrãs pequenos (md:hidden)
    <header className="md:hidden fixed top-0 left-0 right-0 z-[1005] bg-interno-rotas-primaria h-14 flex items-center justify-between px-4 shadow-lg">
      <div className="h-8">
        <img src={logo} alt="Logo Interno Rotas" className="h-full" />
      </div>

      <button
        onClick={toggleMenu}
        className="p-2 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
      >
        {/* Usamos SVGs inline para os ícones de "hamburger" e "X" para simplicidade */}
        {isMenuOpen ? (
          // Ícone "X" (Fechar)
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Ícone "Hamburger" (Menu)
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>
    </header>
  );
};

