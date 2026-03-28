/**
 * useLineageQueries.ts
 * React Query hooks for the Lineage module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApi.service";

const STALE_1MIN = 60_000;
const STALE_INF = Infinity;

export const lineageQueryKeys = {
  centric: (catalogId: string, depth?: number) => ["lineage", "centric", catalogId, depth] as const,
  ingestionStages: () => ["lineage", "ingestionStages"] as const,
  postIngestionStages: () => ["lineage", "postIngestionStages"] as const,
};

export const useGetLineageCentric = (catalogId: string, depth: number = 2) =>
  useQuery({
    queryKey: lineageQueryKeys.centric(catalogId, depth),
    queryFn: () => dashboardApiServices.fetchLineageCentric(catalogId, depth),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });

export const useGetIngestionLoadingStages = () =>
  useQuery({
    queryKey: lineageQueryKeys.ingestionStages(),
    queryFn: () => dashboardApiServices.getIngestionLoadingStages(),
    staleTime: STALE_INF,
  });

export const useGetPostIngestionLoadingStages = () =>
  useQuery({
    queryKey: lineageQueryKeys.postIngestionStages(),
    queryFn: () => dashboardApiServices.getPostIngestionLoadingStages(),
    staleTime: STALE_INF,
  });
