/**
 * useSecretsQueries.ts
 * React Query hooks for the Secrets module.
 * Extracted from useDashboardQueries.ts.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApiServices } from "@/services/dashboardApi.service";

export const secretsQueryKeys = {
  all: ["secrets"] as const,
  list: () => [...secretsQueryKeys.all, "list"] as const,
};

export const useGetSecrets = () =>
  useQuery({
    queryKey: secretsQueryKeys.list(),
    queryFn: () => dashboardApiServices.fetchSecrets(),
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
