import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { ga4Analytics } from '../services/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros React e rastreá-los no Google Analytics
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ga4Analytics.trackEvent({
      category: 'engagement',
      action: 'react_error_boundary',
      label: `${error.name}: ${error.message} - Component Stack: ${errorInfo.componentStack?.slice(0, 150)}`,
      value: 1,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-screen min-h-dvh w-screen bg-background-secondary text-text-primary">
            <div className="text-center p-8 bg-card rounded-lg shadow-xl max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-warning-text">😔 Ops! Algo deu errado</h2>
              <p className="text-text-secondary mb-6">
                Encontramos um erro inesperado. Por favor, recarregue a página para tentar
                novamente.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 text-text-inverse font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Hook wrapper para usar o Error Boundary com hooks
 */
export function useErrorHandler() {
  const { trackError } = useAnalytics();

  const handleError = (error: Error, fatal: boolean = false) => {
    trackError(error, fatal);
  };

  return { handleError };
}
