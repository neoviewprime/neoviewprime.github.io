import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const normalizeEnvValue = (value?: string) => {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    const lowered = normalized.toLowerCase();
    return lowered === "null" || lowered === "undefined" ? null : normalized;
  };

  const clientPort = Number(normalizeEnvValue(env.VITE_PORT) || 3389);
  const backendPort = Number(normalizeEnvValue(env.PORT) || 3390);
  const apiProxyTarget =
    normalizeEnvValue(env.VITE_API_PROXY_TARGET) || `http://127.0.0.1:${backendPort}`;

  return {
    server: {
      host: "0.0.0.0",
      port: clientPort,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-tooltip"],
            charts: ["recharts"],
            motion: ["framer-motion"],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
