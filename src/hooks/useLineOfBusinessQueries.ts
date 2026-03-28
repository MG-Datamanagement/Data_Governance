import { useQuery } from '@tanstack/react-query';
import { lineOfBusinessApiService } from '@/services/lineOfBusinessApi.service';

export const lobKeys = {
  all: ['lineOfBusiness'] as const,
  lists: () => [...lobKeys.all, 'list'] as const,
  list: (params?: any) => [...lobKeys.lists(), params] as const,
  domains: () => [...lobKeys.all, 'domains'] as const,
  owners: (limit?: number) => [...lobKeys.all, 'owners', limit] as const,
  catalogs: () => [...lobKeys.all, 'catalogs'] as const,
};

export const useGetAllLineOfBusiness = () => {
  return useQuery({
    queryKey: lobKeys.list({ limit: 1000 }),
    queryFn: () => lineOfBusinessApiService.fetchAllLineOfBusiness(),
    staleTime: 60000,
  });
};

export const useGetLobOwners = (limit: number = 100) => {
  return useQuery({
    queryKey: lobKeys.owners(limit),
    queryFn: () => lineOfBusinessApiService.fetchOwnersForLobSelection(limit),
    staleTime: 300000,
  });
};

export const useGetLobDomainsForSelection = () => {
  return useQuery({
    queryKey: lobKeys.domains(),
    queryFn: () => lineOfBusinessApiService.fetchDomainsForParentSelection(),
    staleTime: 60000,
  });
};

export const useGetLobCatalogs = () => {
  return useQuery({
    queryKey: lobKeys.catalogs(),
    queryFn: () => lineOfBusinessApiService.fetchAllCatalogs(),
    staleTime: 60000,
  });
};
