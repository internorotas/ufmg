import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/poppins/300.css"; // light
import "@fontsource/poppins/400.css"; // regular
import "@fontsource/poppins/500.css"; // medium
import "@fontsource/poppins/600.css"; // semi-bold
import "@fontsource/poppins/700.css"; // bold

import "./globals.css";

import { App } from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";

/**
 * O ponto de entrada da aplicação. Renderiza o componente principal (`App`) dentro do `StrictMode` e do `ThemeProvider`.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
