import { 
  useComplianceHealth, 
  useComplianceFrameworks, 
  useComplianceIssues, 
  useComplianceInsights 
} from "@/hooks/useDashboardQueries";

export function useComplianceData() {
  const healthQuery = useComplianceHealth();
  const frameworksQuery = useComplianceFrameworks();
  const issuesQuery = useComplianceIssues();
  const insightsQuery = useComplianceInsights();

  return { 
    healthQuery,
    frameworksQuery,
    issuesQuery,
    insightsQuery
  } as const;
}

export type ComplianceData = ReturnType<typeof useComplianceData>;