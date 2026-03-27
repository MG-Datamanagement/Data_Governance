/**
 * sanitize.ts — Input Sanitization Utilities (Phase 8.4)
 *
 * Zod-based sanitization helpers for user input in SQL editor fields,
 * query inputs, and any text areas that feed into API calls.
 *
 * Usage:
 *   import { sanitizeSql, sanitizeTextInput, sqlInputSchema } from "@/lib/sanitize";
 *
 *   const clean = sanitizeSql(rawUserInput); // safe string, strips dangerous patterns
 *   const parsed = sqlInputSchema.safeParse({ sql: rawInput }); // typed validation
 */

import { z } from "zod";

// ─── Dangerous patterns ───────────────────────────────────────────────────────
// Block the most common SQLi & script-injection patterns.
// This is a defense-in-depth layer — the backend MUST parameterize queries.
const SQL_INJECTION_PATTERNS = [
  /;\s*(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|EXEC|EXECUTE)\s/i,
  /--\s/,                     // SQL line comment
  /\/\*[\s\S]*?\*\//,         // SQL block comment
  /xp_\w+/i,                  // SQL Server extended procs
  /UNION\s+SELECT/i,
  /OR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i, // OR 1=1 style
];

const SCRIPT_INJECTION_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,              // onerror=, onclick=, etc.
];

// ─── Core sanitizer ───────────────────────────────────────────────────────────
function stripDangerousPatterns(input: string): string {
  let result = input;
  for (const pattern of SCRIPT_INJECTION_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

function hasSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((p) => p.test(input));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sanitize a raw SQL string from the SQL editor sidebar.
 * Strips script injection, rejects destructive SQL patterns.
 * Returns null if the input is potentially malicious.
 */
export function sanitizeSql(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  if (hasSqlInjection(raw)) return null;
  return stripDangerousPatterns(raw);
}

/**
 * Sanitize a plain text input (descriptions, names, emails, etc.)
 * Strips HTML/script injection, trims whitespace.
 */
export function sanitizeTextInput(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return stripDangerousPatterns(raw);
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

/** Schema for SQL editor fields — rejects obviously malicious SQL */
export const sqlInputSchema = z.object({
  sql: z
    .string()
    .min(1, "SQL cannot be empty")
    .max(10_000, "SQL exceeds maximum length")
    .refine((val) => !hasSqlInjection(val), {
      message: "SQL contains potentially unsafe patterns",
    }),
});

/** Schema for dataset/column description fields */
export const descriptionInputSchema = z.object({
  text: z
    .string()
    .min(1, "Description cannot be empty")
    .max(2_000, "Description is too long")
    .transform(sanitizeTextInput),
});

/** Schema for email notification fields (comma-separated) */
export const failureEmailSchema = z.object({
  emails: z
    .string()
    .max(500)
    .transform((val) =>
      val
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    )
    .pipe(
      z.array(z.string().email("Each entry must be a valid email")).max(10),
    ),
});

/** Schema for data source names */
export const dataSourceNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .regex(
      /^[\w\s\-_.]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, underscores, and dots",
    )
    .transform(sanitizeTextInput),
});
