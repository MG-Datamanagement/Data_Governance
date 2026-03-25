import { useQuery } from '@tanstack/react-query';
import { dashboardApiServices } from '@/services/dashboardApiServices';
import { datasourceApiServices } from '@/services/datasourceApiServices';
import { chatApiServices } from '@/services/chatApiServices';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  dataSources: (filters?: { limit?: number; status?: string }) => [...dashboardKeys.all, 'dataSources', filters] as const,
  runHistory: (filters?: { limit?: number; offset?: number; status?: string }) => [...dashboardKeys.all, 'runHistory', filters] as const,
  sourceStats: (sourceId: string) => [...dashboardKeys.all, 'sourceStats', sourceId] as const,
  catalogDetail: (catalogId: string) => [...dashboardKeys.all, 'catalogDetail', catalogId] as const,
  datasetQueries: (catalogId: string) => [...dashboardKeys.all, 'datasetQueries', catalogId] as const,
  lineageCentric: (catalogId: string, depth?: number) => [...dashboardKeys.all, 'lineageCentric', catalogId, depth] as const,
  ownersList: (limit?: number) => [...dashboardKeys.all, 'ownersList', limit] as const,
};

// Hooks
export const useGetDataSources = (params?: { limit?: number; status?: string }) => {
  return useQuery({
    queryKey: dashboardKeys.dataSources(params),
    queryFn: () => dashboardApiServices.fetchDataSources(params || {}),
    staleTime: 30000, 
  });
};

export const useGetRunHistory = (limit: number = 10, offset: number = 0, status: string = 'All') => {
  return useQuery({
    queryKey: dashboardKeys.runHistory({ limit, offset, status }),
    queryFn: () => dashboardApiServices.fetchRunHistory(limit, offset, status),
    staleTime: 30000,
  });
};

export const useGetSourceStats = (sourceId: string) => {
  return useQuery({
    queryKey: dashboardKeys.sourceStats(sourceId),
    queryFn: () => dashboardApiServices.fetchSourceStats(sourceId),
    staleTime: 60000,
    enabled: !!sourceId,
  });
};

export const useGetCatalogDetail = (catalogId: string) => {
  return useQuery({
    queryKey: dashboardKeys.catalogDetail(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogDetail(catalogId),
    staleTime: 60000,
    enabled: !!catalogId,
  });
};

export const useGetCatalogDatacard = (catalogId: string) => {
  return useQuery({
    queryKey: dashboardKeys.datasetQueries(catalogId), // Reusing key structure for now
    queryFn: () => dashboardApiServices.fetchCatalogDatacard(catalogId),
    staleTime: 60000,
    enabled: !!catalogId,
  });
};

export const useGetLineageCentric = (catalogId: string, depth: number = 2) => {
  return useQuery({
    queryKey: dashboardKeys.lineageCentric(catalogId, depth),
    queryFn: () => dashboardApiServices.fetchLineageCentric(catalogId, depth),
    staleTime: 60000,
    enabled: !!catalogId,
  });
};

export const useGetOwnersList = (limit: number = 100) => {
  return useQuery({
    queryKey: dashboardKeys.ownersList(limit),
    queryFn: () => dashboardApiServices.fetchOwnersList(limit),
    staleTime: 300000, 
  });
};

export const useGetDatasourceQueries = (catalogId: string) => {
  return useQuery({
    queryKey: ['datasource', 'datasetQueries', catalogId],
    queryFn: () => datasourceApiServices.fetchDatasetQueries(catalogId),
    staleTime: 60000,
    enabled: !!catalogId,
  });
};

export const useGetDatasetComplianceReport = (catalogId: string) => {
  return useQuery({
    queryKey: ['datasource', 'complianceReport', catalogId],
    queryFn: () => datasourceApiServices.fetchDatasetComplianceReport(catalogId),
    staleTime: 120000,
    enabled: false, // Only fetch on demand (when modal opens)
  });
};

export const useGetChatHistory = () => {
  return useQuery({
    queryKey: ['chat', 'history'],
    queryFn: () => chatApiServices.getHistory(),
    staleTime: 30000,
  });
};

export const useGetSourceLogs = (sourceId: string, limit: number = 5) => {
  return useQuery({
    queryKey: ['dashboard', 'sourceLogs', sourceId, limit],
    queryFn: () => dashboardApiServices.fetchSourceLogs(sourceId, { limit }),
    staleTime: 30000,
    enabled: !!sourceId,
  });
};

// ─── Overview / Dashboard hooks ──────────────────────────────────────────────

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApiServices.getDashboardStats(),
    staleTime: 60000,
  });
};

export const useAISnapshot = () => {
  return useQuery({
    queryKey: ['dashboard', 'aiSnapshot'],
    queryFn: () => dashboardApiServices.getAISnapshot(),
    staleTime: 300000,
  });
};

export const useModelRiskTrends = () => {
  return useQuery({
    queryKey: ['dashboard', 'modelRiskTrends'],
    queryFn: () => dashboardApiServices.getModelRiskTrends(),
    staleTime: 300000,
  });
};

export const useTopTags = (limit: number = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'topTags', limit],
    queryFn: () => dashboardApiServices.getTopTags(limit),
    staleTime: 120000,
  });
};

export const usePlatformUsage = () => {
  return useQuery({
    queryKey: ['dashboard', 'platformUsage'],
    queryFn: () => dashboardApiServices.getPlatformUsage(),
    staleTime: 120000,
  });
};

export const useRecentActivity = (userUrn: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recentActivity', userUrn],
    queryFn: () => dashboardApiServices.getRecentActivity(userUrn),
    staleTime: 30000,
    enabled: !!userUrn,
  });
};

export const useRecentlyViewed = (userUrn: string) => {
  return useQuery({
    queryKey: ['dashboard', 'recentlyViewed', userUrn],
    queryFn: () => dashboardApiServices.getRecentlyViewed(userUrn),
    staleTime: 60000,
    enabled: !!userUrn,
  });
};

export const useComplianceFrameworks = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceFrameworks'],
    queryFn: () => dashboardApiServices.getComplianceFrameworks(),
    staleTime: 300000,
  });
};

export const usePendingReviewCount = () => {
  return useQuery({
    queryKey: ['dashboard', 'pendingReviewCount'],
    queryFn: () => dashboardApiServices.getPendingReviewCount(),
    staleTime: 60000,
  });
};

export const useOpenIssues = () => {
  return useQuery({
    queryKey: ['dashboard', 'openIssues'],
    queryFn: () => dashboardApiServices.getOpenIssues(),
    staleTime: 60000,
  });
};

export const useGovernanceScore = () => {
  return useQuery({
    queryKey: ['dashboard', 'governanceScore'],
    queryFn: () => dashboardApiServices.getGovernanceScore(),
    staleTime: 60000,
  });
};

export const useComplianceOverview = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceOverview'],
    queryFn: () => dashboardApiServices.getComplianceOverview(),
    staleTime: 120000,
  });
};

export const useComplianceRun = () => {
  return useQuery({
    queryKey: ['dashboard', 'complianceRun'],
    queryFn: () => dashboardApiServices.runCompliance(),
    staleTime: 120000,
  });
};

