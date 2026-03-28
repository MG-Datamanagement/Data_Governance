/**
 * useOverviewQueries.ts
 * React Query hooks for the Overview / Dashboard home page module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApiServices";

export const STALE_1MIN = 60_000;
export const STALE_5MIN = 5 * 60_000;
export const STALE_10MIN = 10 * 60_000;

export const overviewKeys = {
  stats: () => ["overview", "stats"] as const,
  aiSnapshot: () => ["overview", "aiSnapshot"] as const,
  modelRiskTrends: () => ["overview", "modelRiskTrends"] as const,
  platformUsage: () => ["overview", "platformUsage"] as const,
  recentActivity: (userUrn: string) => ["overview", "recentActivity", userUrn] as const,
  recentlyViewed: (userUrn: string) => ["overview", "recentlyViewed", userUrn] as const,
};

export const useDashboardStats = () =>
  useQuery({
    queryKey: overviewKeys.stats(),
    queryFn: () => dashboardApiServices.getDashboardStats(),
    staleTime: STALE_1MIN,
  });

export const useAISnapshot = () =>
  useQuery({
    queryKey: overviewKeys.aiSnapshot(),
    queryFn: () => dashboardApiServices.getAISnapshot(),
    staleTime: STALE_10MIN,
  });

export const useModelRiskTrends = () =>
  useQuery({
    queryKey: overviewKeys.modelRiskTrends(),
    queryFn: () => dashboardApiServices.getModelRiskTrends(),
    staleTime: STALE_10MIN,
  });

export const usePlatformUsage = () =>
  useQuery({
    queryKey: overviewKeys.platformUsage(),
    queryFn: () => dashboardApiServices.getPlatformUsage(),
    staleTime: STALE_5MIN,
  });

export const useRecentActivity = (userUrn: string) =>
  useQuery({
    queryKey: overviewKeys.recentActivity(userUrn),
    queryFn: () => dashboardApiServices.getRecentActivity(userUrn),
    staleTime: STALE_5MIN,
    enabled: !!userUrn,
  });

export const useRecentlyViewed = (userUrn: string) =>
  useQuery({
    queryKey: overviewKeys.recentlyViewed(userUrn),
    queryFn: () => dashboardApiServices.getRecentlyViewed(userUrn),
    staleTime: STALE_1MIN,
    enabled: !!userUrn,
  });
