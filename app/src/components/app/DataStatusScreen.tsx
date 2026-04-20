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

  return (
    <main
      className="flex h-screen min-h-dvh w-screen items-center justify-center bg-background-secondary px-4 text-text-primary"
      aria-labelledby="data-status-title"
      aria-describedby="data-status-description"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-card-border bg-card p-8 text-center shadow-xl"
        role={isWarning ? 'alert' : 'status'}
        aria-live={isWarning ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <h2
          id="data-status-title"
          className={`mb-2 text-2xl font-bold ${isWarning ? 'text-warning-text' : 'text-brand-primary'}`}
        >
          {title}
        </h2>
        <div id="data-status-description" className="text-text-secondary">
          {description}
        </div>
      </div>
    </main>
  );
}
