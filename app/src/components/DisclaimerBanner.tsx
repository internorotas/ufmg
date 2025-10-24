import { IoWarningOutline, IoMailOutline, IoCallOutline } from "react-icons/io5";

export function DisclaimerBanner() {
  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start gap-2">
        <IoWarningOutline 
          className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" 
          size={18} 
        />
        <div className="flex-1">
          <p className="text-xs text-yellow-900 dark:text-yellow-100 leading-relaxed mb-2">
            Informações extraídas do{" "}
            <a 
              href="https://ufmg.br/servicos/onibus" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold underline hover:no-underline"
            >
              site da UFMG
            </a>.
          </p>
          <p className="text-xs text-yellow-900 dark:text-yellow-100 leading-relaxed mb-2">
            Podem haver mudanças de itinerário e horários sem prévio aviso. Para informações, reclamações, dúvidas e sugestões, entre em contato com a{" "}
            <strong>Divisão de Transportes</strong>.
          </p>
          
          <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-yellow-900 dark:text-yellow-100">
              <IoCallOutline size={14} className="flex-shrink-0" />
              <span>
                Telefones:{" "}
                <a href="tel:3409-4601" className="font-semibold hover:underline">3409-4601</a>
                {" "}ou{" "}
                <a href="tel:3409-4606" className="font-semibold hover:underline">3409-4606</a>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-yellow-900 dark:text-yellow-100">
              <IoMailOutline size={14} className="flex-shrink-0" />
              <span>
                E-mail:{" "}
                <a 
                  href="mailto:sfrota@dsg.ufmg.br" 
                  className="font-semibold hover:underline"
                >
                  sfrota@dsg.ufmg.br
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
