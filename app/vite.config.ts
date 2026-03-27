import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ghPages } from "vite-plugin-gh-pages";

export default defineConfig({
  plugins: [react(), tailwindcss(), ghPages()],
  base: "/ufmg/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Leaflet e dependências de mapa — chunk separado, muda raramente
          if (
            id.includes("leaflet")
          ) {
            return "vendor-leaflet";
          }

          // React core — chunk separado para cache independente
          if (
            id.includes("react") ||
            id.includes("scheduler")
          ) {
            return "vendor-react";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }

          if (id.includes("date-fns")) {
            return "vendor-date";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
