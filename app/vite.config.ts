import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ghPages } from "vite-plugin-gh-pages";

export default defineConfig({
  plugins: [react(), tailwindcss(), ghPages()],
  base: "/ufmg/",
  // Removed manualChunks as it seems to be causing timeouts in this environment.
  // Vite's default chunking strategy is often sufficient.
});
