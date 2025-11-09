import { IoInformationCircleOutline } from "react-icons/io5";

/**
 * Renderiza um banner informativo com uma mensagem pré-definida.
 *
 * @returns {JSX.Element} O componente de banner informativo renderizado.
 */
export function InfoBanner() {
  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
      <IoInformationCircleOutline 
        className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" 
        size={20} 
      />
      <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
        <strong>Informação:</strong> Todas as rotas iniciam e terminam próximas à Escola de Música.
      </p>
    </div>
  );
}
