/**
 * useDashboardQueries.ts — Barrel Re-export
 *
 * All hooks have been split into focused domain modules in src/hooks/queries/.
 * This file is kept for backward compatibility — all existing imports continue to work.
 *
 * For new code, import directly from the domain hook files:
 *   import { useGetCatalogDetail } from "@/hooks/queries/useCatalogQueries";
 *   import { useComplianceHealth } from "@/hooks/queries/useComplianceQueries";
 *   import { useGetDataSources } from "@/hooks/queries/useDatasourcesQueries";
 *   import { useGetSecrets } from "@/hooks/queries/useSecretsQueries";
 *   import { useGetLineageCentric } from "@/hooks/queries/useLineageQueries";
 *   import { useDashboardStats } from "@/hooks/queries/useOverviewQueries";
 */

// ─── Backward-compat re-exports ───────────────────────────────────────────────
export * from "./queries/useOverviewQueries";
export * from "./queries/useDatasourcesQueries";
export * from "./queries/useCatalogQueries";
export * from "./queries/useComplianceQueries";
export * from "./queries/useSecretsQueries";
export * from "./queries/useLineageQueries";

// ─── Convenience re-export of the shared query key map ───────────────────────
// dashboardKeys is kept for any consumers that reference it directly.
// New code should use the per-module key objects (catalogKeys, complianceQueryKeys, etc.)
import { datasourcesKeys } from "./queries/useDatasourcesQueries";
import { catalogKeys } from "./queries/useCatalogQueries";
import { secretsQueryKeys } from "./queries/useSecretsQueries";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  dataSources: (filters?: { limit?: number; status?: string }) => datasourcesKeys.list(filters),
  runHistory: (filters?: { limit?: number; offset?: number; status?: string }) => datasourcesKeys.runHistory(filters),
  sourceStats: (sourceId: string) => datasourcesKeys.stats(sourceId),
  catalogDetail: (catalogId: string) => catalogKeys.detail(catalogId),
  datasetQueries: (catalogId: string) => catalogKeys.datasetQueries(catalogId),
  catalogAuditTrail: (catalogId: string, limit: number, offset: number) => catalogKeys.auditTrail(catalogId, limit, offset),
  catalogProperties: (catalogId: string) => catalogKeys.properties(catalogId),
  lineageCentric: (catalogId: string, depth?: number) => ["dashboard", "lineageCentric", catalogId, depth] as const,
  ownersList: (limit?: number) => datasourcesKeys.ownersList(limit),
  secrets: () => secretsQueryKeys.list(),
};

// ─── Chat hook (standalone — not yet split into its own module) ───────────────
import { useQuery } from "@tanstack/react-query";
import { chatApiServices } from "@/services/chatApi.service";

const STALE_30S = 30_000;

export const useGetChatHistory = () =>
  useQuery({
    queryKey: ["chat", "history"],
    queryFn: () => chatApiServices.getHistory(),
    staleTime: STALE_30S,
    refetchInterval: 5000,
  });

// ─── Top tags hook (overview-adjacent, kept here for compat) ─────────────────
import { dashboardApiServices } from "@/services/dashboardApi.service";

const STALE_5MIN = 5 * 60_000;

export const useTopTags = (limit: number = 30) =>
  useQuery({
    queryKey: ["dashboard", "topTags", limit],
    queryFn: () => dashboardApiServices.getTopTags(limit),
    staleTime: STALE_5MIN,
  });
