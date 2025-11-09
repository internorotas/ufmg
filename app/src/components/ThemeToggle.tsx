import { useTheme } from "../contexts/ThemeContext";
import { IoMoon, IoSunny } from "react-icons/io5";

/**
 * Renderiza um botão que permite ao usuário alternar entre os temas claro and escuro.
 *
 * @returns {JSX.Element} O botão de alternância de tema renderizado.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
      title={`Alternar para tema ${theme === "light" ? "escuro" : "claro"}`}
    >
      {theme === "light" ? (
        <IoMoon size={20} className="text-gray-700" />
      ) : (
        <IoSunny size={20} className="text-yellow-400" />
      )}
    </button>
  );
}
