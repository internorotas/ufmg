/**
 * DataStatusScreen - Tela fullscreen para estados de carregamento e erro de dados
 */

interface DataStatusScreenProps {
  title: string;
  description: React.ReactNode;
  variant?: 'info' | 'warning';
}

export function DataStatusScreen({ title, description, variant = 'info' }: DataStatusScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-background-secondary text-text-primary">
      <div
        className="text-center p-8 bg-card rounded-lg shadow-xl"
        role={variant === 'warning' ? 'alert' : undefined}
        aria-live={variant === 'warning' ? 'assertive' : undefined}
      >
        <h2
          className={`text-2xl font-bold mb-2 ${variant === 'warning' ? 'text-warning-text' : 'text-brand-primary'}`}
        >
          {title}
        </h2>
        <div className="text-text-secondary">{description}</div>
      </div>
    </div>
  );
}
