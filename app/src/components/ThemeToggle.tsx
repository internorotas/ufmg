import { useTheme } from "../contexts/ThemeContext";
import { IoMoon, IoSunny } from "react-icons/io5";
import { useAnalytics } from "../hooks/useAnalytics";

/**
 * Renderiza um botão que permite ao usuário alternar entre os temas claro and escuro.
 *
 * @returns {JSX.Element} O botão de alternância de tema renderizado.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { trackEvent } = useAnalytics();

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    trackEvent({
      category: "UI Interaction",
      action: "Toggle Theme",
      label: newTheme,
    });
    toggleTheme();
  };

  return (
    <button
      onClick={handleThemeToggle}
      className="p-1 rounded-lg transition-colors bg-background-secondary hover:bg-card dark:bg-card dark:hover:bg-card-hover"
      aria-label={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? (
        <IoMoon size={20} className="text-text-primary" />
      ) : (
        <IoSunny size={20} className="text-brand-accent" />
      )}
    </button>
  );
}
