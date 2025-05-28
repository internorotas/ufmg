import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/poppins/300.css"; // light
import "@fontsource/poppins/400.css"; // regular
import "@fontsource/poppins/500.css"; // medium
import "@fontsource/poppins/600.css"; // semi-bold
import "@fontsource/poppins/700.css"; // bold

import "./index.css";

import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
