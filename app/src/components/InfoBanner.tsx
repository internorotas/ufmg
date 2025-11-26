import { IoInformationCircleOutline } from "react-icons/io5";

/**
 * Renderiza um banner informativo com uma mensagem sobre a saída dos ônibus.
 *
 * @returns {JSX.Element} O componente de banner informativo renderizado.
 */
export function InfoBanner() {
  return (
    <div
      className="mb-3 p-3 rounded-lg border flex items-start gap-2"
      style={{
        backgroundColor: "var(--info-bg)",
        borderColor: "var(--info-border)",
      }}
    >
      <IoInformationCircleOutline
        className="flex-shrink-0 mt-0.5"
        size={20}
        style={{ color: "var(--info-text)" }}
      />
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--info-text)" }}
      >
        <strong>Atenção:</strong> Todas as rotas iniciam e terminam próximas à{" "}
        <strong>Escola de Música da UFMG</strong>. Os horários indicam a saída dos
        ônibus deste ponto.
      </p>
    </div>
  );
}
