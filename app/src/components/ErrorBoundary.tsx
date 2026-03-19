import { Component, ReactNode, ErrorInfo } from "react";
import { useAnalytics } from "../hooks/useAnalytics";

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
    // Log o erro no console
    console.error("Error Boundary capturou um erro:", error, errorInfo);

    // Rastreia no Google Analytics se disponível
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (GA_MEASUREMENT_ID) {
      import("react-ga4").then((ReactGA) => {
        ReactGA.default.event({
          category: "Erro",
          action: "React Error Boundary",
          label: `${error.name}: ${error.message} - Component Stack: ${errorInfo.componentStack?.slice(0, 150)}`,
          value: 1, // 1 = erro fatal
        });
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-screen min-h-[100dvh] w-screen bg-gray-100 text-gray-800">
            <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                😔 Ops! Algo deu errado
              </h2>
              <p className="text-gray-600 mb-6">
                Encontramos um erro inesperado. Por favor, recarregue a página
                para tentar novamente.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg transition-colors"
              >
                Recarregar Página
              </button>
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalhes técnicos
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
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
    console.error(fatal ? "Erro Fatal:" : "Erro:", error);
    trackError(error, fatal);
  };

  return { handleError };
}
