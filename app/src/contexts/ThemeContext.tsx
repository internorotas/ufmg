import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { ga4Analytics } from '../services/analytics';

type Theme = 'light' | 'dark';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Fornece um contexto de tema para seus filhos, permitindo que acessem e modifiquem o tema atual.
 *
 * @param {object} props - As propriedades do componente.
 * @param {ReactNode} props.children - Os componentes filhos a serem renderizados dentro do provedor.
 * @returns {JSX.Element} O componente provedor de tema renderizado.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Iniciar com dark mode como padrão, verificando localStorage
  const [theme, setTheme] = useState<Theme>(() => {
    // try/catch necessário: Safari em modo privado lança SecurityError ao acessar localStorage
    try {
      const savedTheme = localStorage.getItem('theme');
      // 🛡️ Sentinel: Validate input from localStorage to prevent unexpected values
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    // Aplicar a classe no elemento root
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // try/catch necessário: Safari em modo privado lança SecurityError ao gravar
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // Silencioso — tema funciona normalmente na sessão, apenas não persiste
    }

    // Definir user property no Google Analytics
    if (GA_MEASUREMENT_ID) {
      ga4Analytics.setUserProperty('user_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

/**
 * Um hook customizado que fornece acesso ao contexto do tema.
 *
 * @throws {Error} Se o hook for usado fora de um `ThemeProvider`.
 * @returns {ThemeContextType} O contexto do tema, contendo o tema atual e uma função para alterná-lo.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
