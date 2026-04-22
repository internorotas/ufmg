/**
 * DataStatusScreen - Tela fullscreen para estados de carregamento e erro de dados
 */

interface DataStatusScreenProps {
  title: string;
  description: React.ReactNode;
  variant?: 'info' | 'warning';
}

export function DataStatusScreen({ title, description, variant = 'info' }: DataStatusScreenProps) {
  const isWarning = variant === 'warning';
  const icon = isWarning ? '⚠️' : '🚌';

  return (
    <main
      className="flex h-screen min-h-dvh w-screen items-center justify-center bg-background-secondary px-4 text-text-primary"
      aria-labelledby="data-status-title"
      aria-describedby="data-status-description"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 text-center shadow-xl sm:p-8"
        role={isWarning ? 'alert' : 'status'}
        aria-live={isWarning ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <span
          aria-hidden="true"
          className="mb-3 inline-flex size-12 items-center justify-center rounded-full border border-card-border bg-background-secondary text-2xl"
        >
          {icon}
        </span>
        <h2
          id="data-status-title"
          className={`mb-2 text-xl font-bold sm:text-2xl ${isWarning ? 'text-warning-text' : 'text-brand-primary'}`}
        >
          {title}
        </h2>
        <div id="data-status-description" className="text-sm text-text-secondary sm:text-base">
          {description}
        </div>
      </div>
    </main>
  );
}
