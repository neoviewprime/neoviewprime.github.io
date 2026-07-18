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
    modulePreload: {
      polyfill: false,
      resolveDependencies: () => [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.split(path.sep).join("/");

            if (
              normalizedId.includes("/node_modules/react/") ||
              normalizedId.includes("/node_modules/react-dom/") ||
              normalizedId.includes("/node_modules/react-router-dom/") ||
              normalizedId.includes("react/jsx-runtime") ||
              normalizedId.includes("react-jsx-runtime")
            ) {
              return "react";
            }

            if (normalizedId.includes("/node_modules/framer-motion/")) {
              return "motion";
            }

            if (normalizedId.includes("/node_modules/recharts/")) {
              return "charts";
            }

            if (
              normalizedId.includes("/node_modules/@radix-ui/react-dialog/") ||
              normalizedId.includes("/node_modules/@radix-ui/react-dropdown-menu/") ||
              normalizedId.includes("/node_modules/@radix-ui/react-popover/") ||
              normalizedId.includes("/node_modules/@radix-ui/react-tooltip/")
            ) {
              return "ui";
            }

            return undefined;
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
