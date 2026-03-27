import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApiServices } from '@/services/dashboardApiServices';
import { datasourceApiServices } from '@/services/datasourceApiServices';
import { chatApiServices } from '@/services/chatApiServices';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ StaleTime constants (Phase 10.5) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Use named constants to make staleTime choices intentional and auditable.
const STALE_30S   = 30_000;                 // live/polling data (agents, chat)
const STALE_1MIN  = 60_000;                 // frequently-mutated data
const STALE_5MIN  = 5 * 60_000;             // stable-ish data (sources list, run history, owners)
const STALE_10MIN = 10 * 60_000;            // rarely-updated data (dashboards, model risk)
/** Use for static server-config lists that change only on deployment */
export const STALE_INF = Infinity;

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  dataSources: (filters?: { limit?: number; status?: string }) => [...dashboardKeys.all, 'dataSources', filters] as const,
  runHistory: (filters?: { limit?: number; offset?: number; status?: string }) => [...dashboardKeys.all, 'runHistory', filters] as const,
  sourceStats: (sourceId: string) => [...dashboardKeys.all, 'sourceStats', sourceId] as const,
  catalogDetail: (catalogId: string) => [...dashboardKeys.all, 'catalogDetail', catalogId] as const,
  datasetQueries: (catalogId: string) => [...dashboardKeys.all, 'datasetQueries', catalogId] as const,
  catalogAuditTrail: (catalogId: string, limit: number, offset: number) => [...dashboardKeys.all, 'catalogAuditTrail', catalogId, limit, offset] as const,
  catalogProperties: (catalogId: string) => [...dashboardKeys.all, 'catalogProperties', catalogId] as const,
  lineageCentric: (catalogId: string, depth?: number) => [...dashboardKeys.all, 'lineageCentric', catalogId, depth] as const,
  ownersList: (limit?: number) => [...dashboardKeys.all, 'ownersList', limit] as const,
  secrets: () => [...dashboardKeys.all, 'secrets'] as const,
};

// Hooks
export const useGetDataSources = (params?: { limit?: number; status?: string }) => {
  return useQuery({
    queryKey: dashboardKeys.dataSources(params),
    queryFn: () => dashboardApiServices.fetchDataSources(params || {}),
    staleTime: STALE_5MIN,
  });

};

export const useGetRunHistory = (limit: number = 10, offset: number = 0, status: string = 'All') => {
  return useQuery({
    queryKey: dashboardKeys.runHistory({ limit, offset, status }),
    queryFn: () => dashboardApiServices.fetchRunHistory(limit, offset, status),
    staleTime: STALE_5MIN,
  });

};

export const useGetSourceStats = (sourceId: string) => {
  return useQuery({
    queryKey: dashboardKeys.sourceStats(sourceId),
    queryFn: () => dashboardApiServices.fetchSourceStats(sourceId),
    staleTime: STALE_1MIN,
    enabled: !!sourceId,
  });
};

export const useGetCatalogDetail = (catalogId: string) => {
  return useQuery({
    queryKey: dashboardKeys.catalogDetail(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogDetail(catalogId),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });
};

export const useGetCatalogAuditTrail = (catalogId: string, limit: number = 50, offset: number = 0, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: dashboardKeys.catalogAuditTrail(catalogId, limit, offset),
    queryFn: () => dashboardApiServices.fetchCatalogAuditTrail(catalogId, limit, offset),
    staleTime: STALE_1MIN,
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
  });
};

export const useGetCatalogDatacard = (catalogId: string) => {
  return useQuery({
    queryKey: dashboardKeys.datasetQueries(catalogId), // Reusing key structure for now
    queryFn: () => dashboardApiServices.fetchCatalogDatacard(catalogId),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });
};

export const useGetLineageCentric = (catalogId: string, depth: number = 2) => {
  return useQuery({
    queryKey: dashboardKeys.lineageCentric(catalogId, depth),
    queryFn: () => dashboardApiServices.fetchLineageCentric(catalogId, depth),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });
};

export const useGetOwnersList = (limit: number = 100) => {
  return useQuery({
    queryKey: dashboardKeys.ownersList(limit),
    queryFn: () => dashboardApiServices.fetchOwnersList(limit),
    staleTime: STALE_10MIN, 
  });
};

export const useGetDatasourceQueries = (catalogId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['datasource', 'datasetQueries', catalogId],
    queryFn: () => datasourceApiServices.fetchDatasetQueries(catalogId),
    staleTime: STALE_1MIN,
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
  });
};

export const useGetDatasetComplianceReport = (catalogId: string) => {
  return useQuery({
    queryKey: ['datasource', 'complianceReport', catalogId],
    queryFn: () => datasourceApiServices.fetchDatasetComplianceReport(catalogId),
    staleTime: STALE_5MIN,
    enabled: false, // Only fetch on demand (when modal opens)
  });
};

export const useGetChatHistory = () => {
  return useQuery({
    queryKey: ['chat', 'history'],
    queryFn: () => chatApiServices.getHistory(),
    staleTime: STALE_30S,
    refetchInterval: 5000, // Polling for async chat tasks
  });
};

export const useGetAgents = () => {
  return useQuery({
    queryKey: ['dashboard', 'agents'],
    queryFn: () => dashboardApiServices.getAgents(),
    staleTime: STALE_30S,
    refetchInterval: 10000, // Polling for agent status
  });
};

export const useGetSourceLogs = (sourceId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['dashboard', 'sourceLogs', sourceId, limit],
    queryFn: () => dashboardApiServices.fetchSourceLogs(sourceId, { limit }),
    staleTime: STALE_5MIN,
    enabled: !!sourceId,
  });
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Overview / Dashboard hooks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApiServices.getDashboardStats(),
    staleTime: STALE_1MIN,
  });
};

export const useAISnapshot = () => {
  return useQuery({
    queryKey: ['dashboard', 'aiSnapshot'],
    queryFn: () => dashboardApiServices.getAISnapshot(),
    staleTime: STALE_10MIN,
  });
};

export const useModelRiskTrends = () => {
  return useQuery({
    queryKey: ['dashboard', 'modelRiskTrends'],
    queryFn: () => dashboardApiServices.getModelRiskTrends(),
    staleTime: STALE_10MIN,
  });
};

export const useTopTags = (limit: number = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'topTags', limit],
    queryFn: () => dashboardApiServices.getTopTags(limit),
    staleTime: STALE_5MIN,
  });
};

export const usePlatformUsage = () => {
  return useQuery({
    queryKey: ['dashboard', 'platformUsage'],
    queryFn: () => dashboardApiServices.getPlatformUsage(),
    staleTime: STALE_5MIN,
  });
};

export const useRecentActivity = (userUrn: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recentActivity', userUrn],
    queryFn: () => dashboardApiServices.getRecentActivity(userUrn),
    staleTime: STALE_5MIN,
    enabled: !!userUrn,
  });
};

export const useRecentlyViewed = (userUrn: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recentlyViewed', userUrn],
    queryFn: () => dashboardApiServices.getRecentlyViewed(userUrn),
    staleTime: STALE_1MIN,
    enabled: !!userUrn,
  });
};

export const useComplianceFrameworks = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceFrameworks'],
    queryFn: () => dashboardApiServices.getComplianceFrameworks(),
    staleTime: STALE_10MIN,
  });
};

export const usePendingReviewCount = () => {
  return useQuery({
    queryKey: ['dashboard', 'pendingReviewCount'],
    queryFn: () => dashboardApiServices.getPendingReviewCount(),
    staleTime: STALE_1MIN,
  });
};

export const useOpenIssues = () => {
  return useQuery({
    queryKey: ['dashboard', 'openIssues'],
    queryFn: () => dashboardApiServices.getOpenIssues(),
    staleTime: STALE_1MIN,
  });
};

export const useGovernanceScore = () => {
  return useQuery({
    queryKey: ['dashboard', 'governanceScore'],
    queryFn: () => dashboardApiServices.getGovernanceScore(),
    staleTime: STALE_1MIN,
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceOverview'],
    queryFn: () => dashboardApiServices.getComplianceOverview(),
    staleTime: STALE_5MIN,
  });
};

export const useComplianceHealth = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceHealth'],
    queryFn: () => dashboardApiServices.getComplianceHealth(),
    staleTime: STALE_5MIN,
  });
};

export const useComplianceIssues = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceIssues'],
    queryFn: () => dashboardApiServices.getComplianceIssues(),
    staleTime: STALE_1MIN,
  });
};

export const useComplianceInsights = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceInsights'],
    queryFn: () => dashboardApiServices.getComplianceInsights(),
    staleTime: STALE_10MIN,
  });
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Ingestion Loading Stages hooks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// staleTime: Infinity Ã¢â‚¬â€ these are static server-config lists that never change.
// React Query deduplicates concurrent calls by queryKey, so only one network
// request fires even if multiple components mount at the same time.

export const useGetIngestionLoadingStages = () => {
  return useQuery({
    queryKey: ['dashboard', 'ingestionLoadingStages'],
    queryFn: () => dashboardApiServices.getIngestionLoadingStages(),
    staleTime: Infinity,
  });
};

export const useGetPostIngestionLoadingStages = () => {
  return useQuery({
    queryKey: ['dashboard', 'postIngestionLoadingStages'],
    queryFn: () => dashboardApiServices.getPostIngestionLoadingStages(),
    staleTime: Infinity,
  });
};

export const useGetCatalogProperties = (catalogId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: dashboardKeys.catalogProperties(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogProperties(catalogId),
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
    staleTime: STALE_5MIN,
  });
};

export const useCreateCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, data }: { catalogId: string; data: { key: string; value: string; value_type: string } }) =>
      dashboardApiServices.createCatalogProperty(catalogId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.catalogProperties(variables.catalogId) });
    },
  });
};

export const useUpdateCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, propertyId, data }: { catalogId: string; propertyId: string; data: { value: string; value_type: string } }) =>
      dashboardApiServices.updateCatalogProperty(catalogId, propertyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.catalogProperties(variables.catalogId) });
    },
  });
};

export const useDeleteCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, propertyId }: { catalogId: string; propertyId: string }) =>
      dashboardApiServices.deleteCatalogProperty(catalogId, propertyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.catalogProperties(variables.catalogId) });
    },
  });
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Secrets Hooks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export const useGetSecrets = () => {
  return useQuery({
    queryKey: dashboardKeys.secrets(),
    queryFn: () => dashboardApiServices.fetchSecrets(),
  });
};

export const useCreateSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; value: string; description?: string }) =>
      dashboardApiServices.createSecret(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.secrets() });
    },
  });
};

export const useUpdateSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ secretId, data }: { secretId: string; data: { value: string; description?: string } }) =>
      dashboardApiServices.updateSecret(secretId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.secrets() });
    },
  });
};

export const useDeleteSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) => dashboardApiServices.deleteSecret(secretId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.secrets() });
    },
  });
};

