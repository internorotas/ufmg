import { IoHeart } from "react-icons/io5";
import { useExternalLinkTracking } from "../hooks/useAnalytics";

/**
 * Renderiza o menu de rodapé com links para reportar problemas, ver o projeto no GitHub e creditar o desenvolvedor.
 *
 * @returns {JSX.Element} O componente de menu de rodapé renderizado.
 */
export function MenuFooter() {
  const { trackExternalLink } = useExternalLinkTracking();

  const handleLinkClick = (label: string, url: string) => {
    trackExternalLink(url, label);
  };

  return (
    <div className="flex-shrink-0 p-2 bg-background-secondary border-t border-card-border space-y-2">
      <div className="flex flex-row gap-2">
        {/* Botão Reportar Problema */}
        <a
          href="https://forms.gle/5e9MHq9pp1p8T5Px5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick("Fale Conosco", "https://forms.gle/5e9MHq9pp1p8T5Px5")
          }
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors"
        >
          Fale Conosco
        </a>

        {/* Botão Sobre o Projeto */}
        <a
          href="https://github.com/internorotas/ufmg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick(
              "Sobre o Projeto",
              "https://github.com/internorotas/ufmg"
            )
          }
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-internoRotas-azul-eletrico hover:bg-blue-700 text-white font-bold text-xs transition-colors"
        >
          Sobre o Projeto
        </a>
      </div>

      {/* Botão Usar antiga versão */}
      <a
        href="https://ufmg-pi.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          handleLinkClick("Usar antiga versão", "https://ufmg-pi.vercel.app/")
        }
        className="w-full flex items-center justify-center py-2 px-3 rounded-lg bg-card hover:bg-card-hover text-text-secondary hover:text-text-primary border border-card-border font-semibold text-xs transition-colors"
      >
        Usar antiga versão
      </a>

      {/* Desenvolvido por */}
      <a
        href="https://github.com/igormartins44"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          handleLinkClick("Dev Profile", "https://github.com/igormartins44")
        }
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        Desenvolvido com <IoHeart size={14} className="text-blue-500" /> por
        Igor Martins
      </a>
    </div>
  );
}
