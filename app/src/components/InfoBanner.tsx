import { IoInformationCircleOutline } from "react-icons/io5";

export function InfoBanner() {
  return (
    <div 
      className="mx-3 mb-3 p-3 rounded-lg border flex items-start gap-3"
      style={{
        backgroundColor: 'var(--info-bg)',
        borderColor: 'var(--info-border)',
      }}
    >
      <IoInformationCircleOutline 
        className="flex-shrink-0 mt-0.5" 
        size={20}
        style={{ color: 'var(--info-icon)' }}
      />
      <p 
        className="text-sm leading-relaxed"
        style={{ color: 'var(--info-text)' }}
      >
        <strong>Informação:</strong> Todas as rotas iniciam e terminam próximas à Escola de Música.
      </p>
    </div>
  );
}
