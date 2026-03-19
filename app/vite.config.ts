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

          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("scheduler") ||
            id.includes("leaflet") ||
            id.includes("react-leaflet") ||
            id.includes("leaflet-ant-path")
          ) {
            return "vendor-framework-map";
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
