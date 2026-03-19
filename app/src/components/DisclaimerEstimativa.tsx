import { Info } from "lucide-react";

export function DisclaimerEstimativa() {
  return (
    <div
      className="mt-2 rounded-lg border border-current/20 bg-current/5 p-2"
      style={{
        borderColor: "var(--info-border)",
        backgroundColor: "var(--info-bg)",
      }}
    >
      <div className="flex items-start gap-1.5">
        <Info
          className="mt-0.5 h-3 w-3 shrink-0"
          style={{ color: "var(--info-text)" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--info-text)" }}
            >
              Beta - Em Teste
            </p>
          </div>
          <p
            className="text-[10px] leading-tight mt-0.5"
            style={{ color: "var(--info-text)", opacity: 0.9 }}
          >
            Horarios sao estimativas baseadas no trajeto teorico. Podem variar
            por transito.
          </p>
        </div>
      </div>
    </div>
  );
}
