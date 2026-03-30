/**
 * useSecretsQueries.ts
 * React Query hooks for the Secrets module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApi.service";

export const secretsQueryKeys = {
  all: ["secrets"] as const,
  list: (filters?: { limit?: number; offset?: number }) => [...secretsQueryKeys.all, "list", filters] as const,
};

export const useGetSecrets = (limit: number = 10, offset: number = 0) =>
  useQuery({
    queryKey: secretsQueryKeys.list({ limit, offset }),
    queryFn: () => dashboardApiServices.fetchSecrets(limit, offset),
  });

export const useCreateSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string; value: string; description?: string }) =>
      dashboardApiServices.createSecret(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKeys.list() });
    },
  });
};

export const useUpdateSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ secretId, data }: { secretId: string; data: { value: string; description?: string } }) =>
      dashboardApiServices.updateSecret(secretId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKeys.list() });
    },
  });
};

export const useDeleteSecret = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) => dashboardApiServices.deleteSecret(secretId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: secretsQueryKeys.list() });
    },
  });
};
