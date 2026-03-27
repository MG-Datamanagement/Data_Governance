/**
 * env.ts — Environment Variable Validation (Phase 6.5 + Phase 8.3)
 *
 * Uses Zod to validate all required environment variables at module load time.
 * In production, missing required variables cause an immediate process.exit(1).
 *
 * Server-side variables are NEVER prefixed with NEXT_PUBLIC_.
 * Any variable exposed to the client MUST be intentionally prefixed.
 */
import { z } from "zod";

// ─── Server-side variables (never exposed to client) ─────────────────────────
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Auth — required in non-development environments
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters")
    .optional()
    .refine(
      (val) => process.env.NODE_ENV !== "production" || Boolean(val),
      { message: "NEXTAUTH_SECRET is required in production" },
    ),

  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .optional()
    .refine(
      (val) => process.env.NODE_ENV !== "production" || Boolean(val),
      { message: "NEXTAUTH_URL is required in production" },
    ),
});

// ─── Client-side variables (safe to expose via NEXT_PUBLIC_) ─────────────────
// RULE: Never put secrets here. Only URLs, feature flags, and public identifiers.
const clientSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_DASHBOARD_API_URL: z.string().url().optional(),
});

// ─── Guard: block secret variables from being prefixed NEXT_PUBLIC_ ───────────
const FORBIDDEN_PUBLIC_KEYS = ["SECRET", "KEY", "TOKEN", "PASSWORD", "PRIVATE"];
const exposedKeys = Object.keys(process.env).filter(
  (k) =>
    k.startsWith("NEXT_PUBLIC_") &&
    FORBIDDEN_PUBLIC_KEYS.some((forbidden) => k.includes(forbidden)),
);
if (exposedKeys.length > 0) {
  console.error(
    `🔒 SECURITY WARNING: The following environment variables look like secrets but are exposed to the client:\n  ${exposedKeys.join("\n  ")}\n  Remove the NEXT_PUBLIC_ prefix or rename them.`,
  );
}

// ─── Parse & validate at module load time ─────────────────────────────────────
const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error(
    "❌ Invalid server environment variables:\n",
    JSON.stringify(_serverEnv.error.format(), null, 2),
  );
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_DASHBOARD_API_URL: process.env.NEXT_PUBLIC_DASHBOARD_API_URL,
});

if (!_clientEnv.success) {
  console.warn(
    "⚠️ Optional client environment variables are misconfigured:\n",
    JSON.stringify(_clientEnv.error.format(), null, 2),
  );
}

export const env = {
  ...(_serverEnv.data ?? {}),
  ...(_clientEnv.data ?? {}),
} as z.infer<typeof serverSchema> & Partial<z.infer<typeof clientSchema>>;
