/**
 * dashboardTypes.ts — Barrel Re-export
 *
 * This file is kept for backward compatibility. All types have been split into
 * focused domain modules. Import directly from those for new code:
 *
 *   import { DashboardStats } from "@/types/overview.types";
 *   import { ComplianceFramework } from "@/types/compliance.types";
 *   import { Dataset, CatalogTag } from "@/types/catalog.types";
 *   import { ModelMetadata } from "@/types/models.types";
 *
 * All existing import paths continue to work via these re-exports.
 */

// ─── Circular dep fix: CatalogTag now lives in catalog.types ─────────────────
// Previously: dashboardTypes imported CatalogTag from services/dashboardApiServices
// which created a circular types → services → types chain.

export * from "./overview.types";
export * from "./compliance.types";
export * from "./catalog.types";
export * from "./models.types";
