import { IoInformationCircleOutline } from "react-icons/io5";

/**
 * Renderiza um banner informativo com uma mensagem sobre a saída dos ônibus.
 *
 * @returns {JSX.Element} O componente de banner informativo renderizado.
 */
export function InfoBanner() {
  return (
    <div
      className="mb-1.5 md:mb-2 p-2 md:p-2.5 rounded-lg border flex items-start gap-1.5 md:gap-2"
      style={{
        backgroundColor: "var(--info-bg)",
        borderColor: "var(--info-border)",
      }}
    >
      <IoInformationCircleOutline
        className="flex-shrink-0 mt-0.5"
        size={14}
      />
      <IoInformationCircleOutline
        className="hidden md:block flex-shrink-0 mt-0.5"
        size={16}
        style={{ color: "var(--info-text)" }}
      />
      <p
        className="text-[10px] md:text-[11px] leading-relaxed"
        style={{ color: "var(--info-text)" }}
      >
        <strong>Atenção:</strong> Todas as rotas iniciam e terminam próximas à{" "}
        <strong>Escola de Música</strong>. Os horários indicam a saída dos
        ônibus deste ponto.
      </p>
    </div>
  );
}
