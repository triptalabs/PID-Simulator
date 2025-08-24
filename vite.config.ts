import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { DEV_CONFIG } from "./src/config/app.config";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: DEV_CONFIG.server.host,
    port: DEV_CONFIG.server.port,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: DEV_CONFIG.test.environment === 'jsdom' ? 'es' : 'es',
  },
  optimizeDeps: {
    exclude: ['src/workers/simulation.worker.ts']
  },
  test: {
    environment: DEV_CONFIG.test.environment,
    setupFiles: DEV_CONFIG.test.setupFiles,
    testTimeout: DEV_CONFIG.test.testTimeout,
    hookTimeout: DEV_CONFIG.test.hookTimeout,
    include: DEV_CONFIG.test.include,
    reporters: DEV_CONFIG.test.reporters
  }
});
