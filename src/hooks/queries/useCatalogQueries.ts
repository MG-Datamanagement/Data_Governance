/**
 * useCatalogQueries.ts
 * React Query hooks for the Catalog / Dataset module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApiServices";
import { datasourceApiServices } from "@/services/datasourceApiServices";

const STALE_1MIN = 60_000;
const STALE_5MIN = 5 * 60_000;
const STALE_INF = Infinity;

export const catalogKeys = {
  all: ["catalog"] as const,
  detail: (catalogId: string) => [...catalogKeys.all, "detail", catalogId] as const,
  datacard: (catalogId: string) => [...catalogKeys.all, "datacard", catalogId] as const,
  auditTrail: (catalogId: string, limit: number, offset: number) => [...catalogKeys.all, "auditTrail", catalogId, limit, offset] as const,
  properties: (catalogId: string) => [...catalogKeys.all, "properties", catalogId] as const,
  datasetQueries: (catalogId: string) => [...catalogKeys.all, "datasetQueries", catalogId] as const,
  complianceReport: (catalogId: string) => [...catalogKeys.all, "complianceReport", catalogId] as const,
};

export const useGetCatalogDetail = (catalogId: string) =>
  useQuery({
    queryKey: catalogKeys.detail(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogDetail(catalogId),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });

export const useGetCatalogDatacard = (catalogId: string) =>
  useQuery({
    queryKey: catalogKeys.datacard(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogDatacard(catalogId),
    staleTime: STALE_1MIN,
    enabled: !!catalogId,
  });

export const useGetCatalogAuditTrail = (catalogId: string, limit: number = 50, offset: number = 0, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: catalogKeys.auditTrail(catalogId, limit, offset),
    queryFn: () => dashboardApiServices.fetchCatalogAuditTrail(catalogId, limit, offset),
    staleTime: STALE_1MIN,
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
  });

export const useGetCatalogProperties = (catalogId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: catalogKeys.properties(catalogId),
    queryFn: () => dashboardApiServices.fetchCatalogProperties(catalogId),
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
    staleTime: STALE_5MIN,
  });

export const useCreateCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, data }: { catalogId: string; data: { key: string; value: string; value_type: string } }) =>
      dashboardApiServices.createCatalogProperty(catalogId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.properties(variables.catalogId) });
    },
  });
};

export const useUpdateCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, propertyId, data }: { catalogId: string; propertyId: string; data: { value: string; value_type: string } }) =>
      dashboardApiServices.updateCatalogProperty(catalogId, propertyId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.properties(variables.catalogId) });
    },
  });
};

export const useDeleteCatalogProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalogId, propertyId }: { catalogId: string; propertyId: string }) =>
      dashboardApiServices.deleteCatalogProperty(catalogId, propertyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.properties(variables.catalogId) });
    },
  });
};

export const useGetDatasourceQueries = (catalogId: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: catalogKeys.datasetQueries(catalogId),
    queryFn: () => datasourceApiServices.fetchDatasetQueries(catalogId),
    staleTime: STALE_1MIN,
    enabled: options?.enabled !== undefined ? options.enabled : !!catalogId,
  });

export const useGetDatasetComplianceReport = (catalogId: string) =>
  useQuery({
    queryKey: catalogKeys.complianceReport(catalogId),
    queryFn: () => datasourceApiServices.fetchDatasetComplianceReport(catalogId),
    staleTime: STALE_5MIN,
    enabled: false,
  });
