const normalizeEnvValue = (value?: string) => {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  return lowered === "null" || lowered === "undefined" ? null : normalized;
};

const buildApiBaseFromProxyTarget = (proxyTarget: string) => `${proxyTarget.replace(/\/+$/u, "")}/api`;

const resolveBrowserApiUrl = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  if (window.location.protocol !== "file:") {
    return `${window.location.origin}/api`;
  }

  const proxyTarget = normalizeEnvValue(import.meta.env.VITE_API_PROXY_TARGET);
  if (proxyTarget) {
    return buildApiBaseFromProxyTarget(proxyTarget);
  }

  return "http://127.0.0.1:3390/api";
};

export const API_URL = normalizeEnvValue(import.meta.env.VITE_API_URL) || resolveBrowserApiUrl();
