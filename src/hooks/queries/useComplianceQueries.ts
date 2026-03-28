/**
 * useComplianceQueries.ts
 * React Query hooks for the Compliance module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApiServices";

const STALE_1MIN = 60_000;
const STALE_5MIN = 5 * 60_000;
const STALE_10MIN = 10 * 60_000;

export const complianceQueryKeys = {
  health: () => ["compliance", "health"] as const,
  frameworks: () => ["compliance", "frameworks"] as const,
  issues: () => ["compliance", "issues"] as const,
  insights: () => ["compliance", "insights"] as const,
  overview: () => ["compliance", "overview"] as const,
  pendingReviewCount: () => ["compliance", "pendingReviewCount"] as const,
  openIssues: () => ["compliance", "openIssues"] as const,
  governanceScore: () => ["compliance", "governanceScore"] as const,
};

export const useComplianceHealth = () =>
  useQuery({
    queryKey: complianceQueryKeys.health(),
    queryFn: () => dashboardApiServices.getComplianceHealth(),
    staleTime: STALE_5MIN,
  });

export const useComplianceFrameworks = () =>
  useQuery({
    queryKey: complianceQueryKeys.frameworks(),
    queryFn: () => dashboardApiServices.getComplianceFrameworks(),
    staleTime: STALE_10MIN,
  });

export const useComplianceIssues = () =>
  useQuery({
    queryKey: complianceQueryKeys.issues(),
    queryFn: () => dashboardApiServices.getComplianceIssues(),
    staleTime: STALE_1MIN,
  });

export const useComplianceInsights = () =>
  useQuery({
    queryKey: complianceQueryKeys.insights(),
    queryFn: () => dashboardApiServices.getComplianceInsights(),
    staleTime: STALE_10MIN,
  });

export const useComplianceOverview = () =>
  useQuery({
    queryKey: complianceQueryKeys.overview(),
    queryFn: () => dashboardApiServices.getComplianceOverview(),
    staleTime: STALE_5MIN,
  });

export const usePendingReviewCount = () =>
  useQuery({
    queryKey: complianceQueryKeys.pendingReviewCount(),
    queryFn: () => dashboardApiServices.getPendingReviewCount(),
    staleTime: STALE_1MIN,
  });

export const useOpenIssues = () =>
  useQuery({
    queryKey: complianceQueryKeys.openIssues(),
    queryFn: () => dashboardApiServices.getOpenIssues(),
    staleTime: STALE_1MIN,
  });

export const useGovernanceScore = () =>
  useQuery({
    queryKey: complianceQueryKeys.governanceScore(),
    queryFn: () => dashboardApiServices.getGovernanceScore(),
    staleTime: STALE_1MIN,
  });
