/**
 * env.ts — Environment Variable Validation
 *
 * Uses Next.js runtime to enforce required environment variables at startup.
 * Uses plain Zod for validation without @t3-oss/env-nextjs to avoid extra deps.
 *
 * Usage: import { env } from "@/lib/env" anywhere in server code.
 * Client variables must be prefixed with NEXT_PUBLIC_.
 */
import { z } from "zod";

// ─── Server-side variables (never exposed to client) ─────────────────────────
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// ─── Client-side variables (safe to expose via NEXT_PUBLIC_) ─────────────────
const clientSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

// ─── Parse & validate at module load time ─────────────────────────────────────
const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error(
    "❌ Invalid server environment variables:\n",
    JSON.stringify(_serverEnv.error.format(), null, 2),
  );
  // In production, crash the process so the misconfiguration is caught immediately
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const _clientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
