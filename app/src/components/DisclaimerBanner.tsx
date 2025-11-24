import { IoWarningOutline, IoMailOutline, IoCallOutline } from "react-icons/io5";

export function DisclaimerBanner() {
  return (
    <div 
      className="mx-3 mb-3 p-3 rounded-lg border"
      style={{
        backgroundColor: 'var(--warning-bg)',
        borderColor: 'var(--warning-border)',
      }}
    >
      <div className="flex items-start gap-2">
        <IoWarningOutline 
          className="flex-shrink-0 mt-0.5" 
          size={18}
          style={{ color: 'var(--warning-icon)' }}
        />
        <div className="flex-1">
          <p 
            className="text-xs leading-relaxed mb-2"
            style={{ color: 'var(--warning-text)' }}
          >
            Informações extraídas do{" "}
            <a 
              href="https://www.ufmg.br/transporte/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold underline hover:no-underline"
              style={{ color: 'var(--warning-text)' }}
            >
              site da UFMG
            </a>.
          </p>
          <p 
            className="text-xs leading-relaxed mb-2"
            style={{ color: 'var(--warning-text)' }}
          >
            Podem haver mudanças de itinerário e horários sem prévio aviso. Para informações, reclamações, dúvidas e sugestões, entre em contato com a{" "}
            <strong>Divisão de Transportes</strong>.
          </p>
          
          <div 
            className="mt-2 pt-2 border-t grid grid-cols-2 gap-2"
            style={{ borderColor: 'var(--warning-border)' }}
          >
            <a
              href="tel:3409-4601"
              className="flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border transition-opacity hover:opacity-80"
              style={{
                color: 'var(--warning-text)',
                borderColor: 'var(--warning-border)',
                backgroundColor: 'var(--warning-bg)',
              }}
            >
              <IoCallOutline size={16} className="flex-shrink-0" />
              <span className="font-semibold">
                3409-4601 / 4606
              </span>
            </a>
            <a
              href="mailto:sfrota@dsg.ufmg.br"
              className="flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border transition-opacity hover:opacity-80"
              style={{
                color: 'var(--warning-text)',
                borderColor: 'var(--warning-border)',
                backgroundColor: 'var(--warning-bg)',
              }}
            >
              <IoMailOutline size={16} className="flex-shrink-0" />
              <span className="font-semibold">
                sfrota@dsg.ufmg.br
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
