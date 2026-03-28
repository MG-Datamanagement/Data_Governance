/**
 * src/types/index.ts — Top-level barrel
 *
 * Re-exports all domain type modules. Import from "@/types" for convenience,
 * or from the specific domain file for tree-shaking:
 *
 *   import { DashboardStats } from "@/types";               // via barrel
 *   import { DashboardStats } from "@/types/overview.types"; // direct
 */

// Existing single-domain files (unchanged)
export * from "./chatTypes";
export * from "./tagTypes";
export * from "./datasourcesTypes";

// Refactored domain modules (previously all in dashboardTypes.ts)
export * from "./overview.types";
export * from "./compliance.types";
export * from "./catalog.types";
export * from "./models.types";

// Backward-compat barrel (re-exports same as above — kept for existing imports)
// export * from "./dashboardTypes"; // Not needed — already exporting above directly