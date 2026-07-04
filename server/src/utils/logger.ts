type Meta = Record<string, unknown>;

const format = (level: string, message: string, meta?: Meta): string => {
  const timestamp = new Date().toISOString();
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${payload}`;
};

export const logger = {
  info: (message: string, meta?: Meta) => console.log(format("INFO", message, meta)),
  warn: (message: string, meta?: Meta) => console.warn(format("WARN", message, meta)),
  error: (message: string, meta?: Meta) => console.error(format("ERROR", message, meta))
};

