/**
 * mockData.ts — Barrel Re-export
 *
 * All mock data has been split into focused domain modules in src/lib/mock/.
 * This file is kept for backward compatibility — all existing imports continue to work.
 *
 * For new code, import directly from the domain mock files:
 *   import { MOCK_RECENTLY_VIEWED } from "@/lib/mock/overview.mock";
 *   import { MOCK_COMPLIANCE_FRAMEWORKS } from "@/lib/mock/compliance.mock";
 *   import { MOCK_MODEL_LIST } from "@/lib/mock/models.mock";
 */

export * from "./mock/overview.mock";
export * from "./mock/compliance.mock";
export * from "./mock/models.mock";
