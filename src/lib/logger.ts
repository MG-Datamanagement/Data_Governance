/**
 * logger.ts — Structured Logger (Phase 9.1)
 *
 * Drop-in replacement for bare console calls throughout the application.
 * Provides structured, leveled logging with context objects and consistent
 * prefixing. In production, lower levels are silenced or persist to a
 * log-shipping service (Sentry, Datadog, etc.).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *
 *   logger.info("DataSource connected", { sourceId: "abc123" });
 *   logger.warn("Stale cache", { age: "8min", threshold: "5min" });
 *   logger.error("API call failed", error, { endpoint: "/api/sources" });
 *   logger.debug("Rendering", { component: "NodeCard", nodeId: "n1" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: unknown;
  timestamp: string;
}

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// In production suppress debug + info to keep the console clean.
// Override by setting NEXT_PUBLIC_LOG_LEVEL in .env.local.
const configuredLevel: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === "production" ? "warn" : "debug");

function isEnabled(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[configuredLevel];
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const LEVEL_PREFIX: Record<LogLevel, string> = {
  debug: "🔍 [DEBUG]",
  info: "ℹ️  [INFO] ",
  warn: "⚠️  [WARN] ",
  error: "❌ [ERROR]",
};

function buildEntry(
  level: LogLevel,
  message: string,
  errorOrContext?: unknown,
  context?: Record<string, unknown>,
): LogEntry {
  // Overloads: logger.error(msg, err, ctx?) OR logger.info(msg, ctx?)
  const isError = errorOrContext instanceof Error || (errorOrContext !== null && typeof errorOrContext === "object" && "stack" in (errorOrContext as object));
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    error: isError ? errorOrContext : undefined,
    context: isError ? context : (errorOrContext as Record<string, unknown> | undefined),
  };
}

function emit(entry: LogEntry): void {
  if (!isEnabled(entry.level)) return;

  const prefix = LEVEL_PREFIX[entry.level];
  const parts: unknown[] = [`${prefix} ${entry.message}`];
  if (entry.context) parts.push(entry.context);
  if (entry.error) parts.push(entry.error);

  switch (entry.level) {
    case "debug": console.debug(...parts); break;
    case "info":  console.info(...parts);  break;
    case "warn":  console.warn(...parts);  break;
    case "error": console.error(...parts); break;
  }

  // ── Production log-shipping hook ──────────────────────────────────────────
  // Uncomment and configure when Sentry / Datadog is integrated (Phase 9.3).
  // if (entry.level === "error" && typeof window !== "undefined") {
  //   Sentry.captureException(entry.error ?? new Error(entry.message), {
  //     extra: entry.context,
  //   });
  // }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    emit(buildEntry("debug", message, context));
  },

  info(message: string, context?: Record<string, unknown>): void {
    emit(buildEntry("info", message, context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    emit(buildEntry("warn", message, context));
  },

  /** @param err - the caught Error object */
  error(message: string, err?: unknown, context?: Record<string, unknown>): void {
    emit(buildEntry("error", message, err, context));
  },
} as const;

export type { LogLevel, LogEntry };
