/**
 * Client-side logger — stays a no-op in production except for `error`.
 * Swap in Sentry / Datadog browser SDK calls here without touching feature
 * code.
 */

const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[Tasheen]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info("[Tasheen]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[Tasheen]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[Tasheen]", ...args);
  },
};
