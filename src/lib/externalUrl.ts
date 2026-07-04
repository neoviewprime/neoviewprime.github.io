const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'vbscript:']);

export const parseExternalUrl = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
};

export const isValidExternalUrl = (value: string): boolean => {
  const parsed = parseExternalUrl(value);
  if (!parsed) return false;
  return !BLOCKED_PROTOCOLS.has(parsed.protocol.toLowerCase());
};

export const shouldWarnInsecureExternalUrl = (value: string): boolean => {
  const parsed = parseExternalUrl(value);
  if (!parsed) return false;
  return parsed.protocol.toLowerCase() !== 'https:';
};
