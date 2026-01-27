import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject build time and build number during build process
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_BUILD_NUMBER': JSON.stringify(Date.now().toString().slice(-6)), // Last 6 digits of timestamp
  },
});
