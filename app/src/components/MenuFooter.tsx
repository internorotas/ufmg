import { IoWarningOutline, IoLogoGithub, IoHeart } from "react-icons/io5";

/**
 * Renderiza o menu de rodapé com links para reportar problemas, ver o projeto no GitHub e creditar o desenvolvedor.
 *
 * @returns {JSX.Element} O componente de menu de rodapé renderizado.
 */
export function MenuFooter() {
  return (
    <div className="flex-shrink-0 p-3 bg-background-secondary border-t border-card-border space-y-2">
      {/* Botão Reportar Problema */}
      <a
        href="https://github.com/internorotas/ufmg/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors"
      >
        <IoWarningOutline size={16} />
        Encontrou algum problema?
      </a>

      {/* Botão Sobre o Projeto */}
      <a
        href="https://github.com/internorotas/ufmg"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-internoRotas-azul-eletrico hover:bg-blue-700 text-white font-bold text-xs transition-colors"
      >
        <IoLogoGithub size={16} />
        Sobre o Projeto
      </a>

      {/* Botão Usar antiga versão */}
      <a
        href="https://ufmg-pi.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center py-2 px-3 rounded-lg bg-card hover:bg-card-hover text-text-secondary hover:text-text-primary border border-card-border font-semibold text-xs transition-colors"
      >
        Usar antiga versão
      </a>

      {/* Desenvolvido por */}
      <a
        href="https://github.com/igormartins44"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        Desenvolvido com <IoHeart size={14} className="text-blue-500" /> por
        Igor Martins
      </a>
    </div>
  );
}
