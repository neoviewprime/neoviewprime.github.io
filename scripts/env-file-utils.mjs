import { networkInterfaces } from "node:os";

const INVALID_ENV_VALUES = new Set(["", "null", "undefined"]);

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

export const normalizeEnvValue = (value) => {
  if (value == null) {
    return null;
  }

  const normalized = stripWrappingQuotes(String(value).trim()).trim();
  return INVALID_ENV_VALUES.has(normalized.toLowerCase()) ? null : normalized;
};

export const parseEnvFile = (content) => {
  const values = new Map();

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values.set(key, normalizeEnvValue(value));
  }

  return values;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

export const upsertEnvValue = (content, key, value) => {
  const bom = content.startsWith("\uFEFF") ? "\uFEFF" : "";
  const rawContent = bom ? content.slice(1) : content;
  const hasTrailingNewline = /\r?\n$/u.test(rawContent);
  const lines = rawContent.split(/\r?\n/u);
  const nextLine = `${key}=${value}`;
  const keyPattern = new RegExp(`^${escapeRegExp(key)}\\s*=`, "u");

  let replaced = false;
  const nextLines = [];

  for (const line of lines) {
    if (!line) {
      nextLines.push(line);
      continue;
    }

    if (!keyPattern.test(line.trimStart())) {
      nextLines.push(line);
      continue;
    }

    if (!replaced) {
      nextLines.push(nextLine);
      replaced = true;
    }
  }

  if (!replaced) {
    nextLines.push(nextLine);
  }

  const normalizedContent = nextLines.join("\n");
  return `${bom}${normalizedContent}${hasTrailingNewline ? "\n" : ""}`;
};

const resolvePrimaryLanAddress = () => {
  const nets = networkInterfaces();

  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
};

export const buildRecommendedEnvDefaults = () => {
  const frontendPort = "3389";
  const backendPort = "3390";
  const lanAddress = resolvePrimaryLanAddress();
  const clientHost = lanAddress ?? "localhost";

  return {
    frontendPort,
    backendPort,
    lanAddress,
    root: {
      VITE_PORT: frontendPort,
      PORT: backendPort,
      VITE_API_URL: "/api",
      VITE_API_PROXY_TARGET: `http://127.0.0.1:${backendPort}`,
    },
    server: {
      HOST: "0.0.0.0",
      PORT: backendPort,
      CLIENT_URL: `http://${clientHost}:${frontendPort}`,
    },
  };
};
