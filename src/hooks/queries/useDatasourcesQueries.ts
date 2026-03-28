/**
 * useDatasourcesQueries.ts
 * React Query hooks for the Data Sources module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApiServices";

const STALE_1MIN = 60_000;
const STALE_5MIN = 5 * 60_000;
const STALE_30S = 30_000;
const STALE_INF = Infinity;

export const datasourcesKeys = {
  all: ["datasources"] as const,
  list: (filters?: { limit?: number; status?: string }) => [...datasourcesKeys.all, "list", filters] as const,
  stats: (sourceId: string) => [...datasourcesKeys.all, "stats", sourceId] as const,
  runHistory: (filters?: { limit?: number; offset?: number; status?: string }) => [...datasourcesKeys.all, "runHistory", filters] as const,
  logs: (sourceId: string, limit: number) => [...datasourcesKeys.all, "logs", sourceId, limit] as const,
  agents: () => [...datasourcesKeys.all, "agents"] as const,
  ownersList: (limit?: number) => [...datasourcesKeys.all, "ownersList", limit] as const,
};

export const useGetDataSources = (params?: { limit?: number; status?: string }) =>
  useQuery({
    queryKey: datasourcesKeys.list(params),
    queryFn: () => dashboardApiServices.fetchDataSources(params || {}),
    staleTime: STALE_5MIN,
  });

export const useGetSourceStats = (sourceId: string) =>
  useQuery({
    queryKey: datasourcesKeys.stats(sourceId),
    queryFn: () => dashboardApiServices.fetchSourceStats(sourceId),
    staleTime: STALE_1MIN,
    enabled: !!sourceId,
  });

export const useGetRunHistory = (limit: number = 10, offset: number = 0, status: string = "All") =>
  useQuery({
    queryKey: datasourcesKeys.runHistory({ limit, offset, status }),
    queryFn: () => dashboardApiServices.fetchRunHistory(limit, offset, status),
    staleTime: STALE_5MIN,
  });

export const useGetSourceLogs = (sourceId: string, limit: number = 5) =>
  useQuery({
    queryKey: datasourcesKeys.logs(sourceId, limit),
    queryFn: () => dashboardApiServices.fetchSourceLogs(sourceId, { limit }),
    staleTime: STALE_5MIN,
    enabled: !!sourceId,
  });

export const useGetAgents = () =>
  useQuery({
    queryKey: datasourcesKeys.agents(),
    queryFn: () => dashboardApiServices.getAgents(),
    staleTime: STALE_30S,
    refetchInterval: 10000,
  });

export const useGetOwnersList = (limit: number = 100) =>
  useQuery({
    queryKey: datasourcesKeys.ownersList(limit),
    queryFn: () => dashboardApiServices.fetchOwnersList(limit),
    staleTime: 10 * 60_000,
  });
