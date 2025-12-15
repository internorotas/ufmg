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
      <div className="flex flex-row gap-1.5">
        {/* Botão Reportar Problema */}
        <a
          href="https://forms.gle/5e9MHq9pp1p8T5Px5"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick(
              "Contato",
              "https://forms.gle/5e9MHq9pp1p8T5Px5",
            )
          }
          className="w-full flex items-center justify-center py-1.5 px-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-semibold text-[10px] transition-colors"
        >
          Contato
        </a>

        {/* Botão Sobre o Projeto */}
        <a
          href="https://github.com/internorotas/ufmg"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick(
              "Sobre o Projeto",
              "https://github.com/internorotas/ufmg",
            )
          }
          className="w-full flex items-center justify-center py-1.5 px-2 rounded-md bg-internoRotas-azul-eletrico hover:bg-blue-700 text-white font-semibold text-[10px] transition-colors"
        >
          Sobre
        </a>

        {/* Botão Versão Antiga */}
        <a
          href="https://ufmg-pi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            handleLinkClick("Versão Antiga", "https://ufmg-pi.vercel.app/")
          }
          className="w-full flex items-center justify-center py-1.5 px-2 rounded-md bg-card hover:bg-card-hover text-text-secondary hover:text-text-primary border border-card-border font-semibold text-[10px] transition-colors"
        >
          Versão Antiga
        </a>
      </div>

      {/* Desenvolvido por */}
      <a
        href="https://github.com/igormartins4"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          handleLinkClick("Dev Profile", "https://github.com/igormartins4")
        }
        className="font-bold w-full flex items-center justify-center gap-1.5 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        Desenvolvido com{" "}
        <IoHeart size={14} className="text-internoRotas-azul-eletrico" /> por
        Igor Martins
      </a>
    </div>
  );
}
