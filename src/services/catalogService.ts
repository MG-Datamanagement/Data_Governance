import { gqlRequest } from "@/lib/graphqlClient";
import { SEARCH_DATASETS } from "@/graphql/queries/search";
import { LIST_DATASETS } from "@/graphql/queries/datasets";
import { GET_DOMAINS } from "@/graphql/queries/domains";
import { GET_DATA_SOURCES } from "@/graphql/queries/datasources";
import { GET_USERS } from "@/graphql/queries/users";

import type { Dataset, DataSource, Domain, SearchResult, User } from "@/graphql/types";

export async function searchDatasets(query: string): Promise<SearchResult> {
  const input = {
    type: "DATASET",
    query: query || "*",
    start: 0,
    count: 100,
  };

  const data = await gqlRequest(SEARCH_DATASETS, { input });

  const results =
    data.search.searchResults.map((res: any): Dataset => ({
      name: res.entity.name,
      urn: res.entity.urn,
      description: res.entity.properties?.description,
      lastModifiedTime: res.entity.properties?.lastModified?.time,
      created: res.entity.properties?.created,
      createdActor: res.entity.properties?.createdActor,
      platform: res.entity.platform?.name,
      domain: res.entity.domain?.domain
        ? {
            urn: res.entity.domain.domain.urn,
            name: res.entity.domain.domain.properties.name,
          }
        : null,
      tags:
        res.entity.tags?.tags?.map((t: any) => ({
          name: t.tag.properties.name,
          colorHex: t.tag.properties.colorHex,
        })) ?? [],
    })) ?? [];

  return {
    total: data.search.total,
    results,
  };
}

export async function listDatasets(page: number, size: number = 20): Promise<{
  total: number;
  datasets: Dataset[];
}> {
  const start = (page - 1) * size;

  const data = await gqlRequest(LIST_DATASETS, {
    start,
    count: size,
  });

  return {
    total: data.listDatasets.total,
    datasets: data.listDatasets.datasets.map((d: any) => ({
      name: d.name,
      urn: d.urn,
      description: d.properties?.description,
      platform: d.platform?.name,
      tags: [],
    })),
  };
}

export async function fetchDomains(): Promise<Domain[]> {
  const data = await gqlRequest(GET_DOMAINS);
  return data.domains as Domain[];
}

export async function fetchDataSources(): Promise<DataSource[]> {
  const data = await gqlRequest(GET_DATA_SOURCES);
  return data.dataSources as DataSource[];
}

export async function fetchUsers(): Promise<User[]> {
  const data = await gqlRequest(GET_USERS);
  return data.users as User[];
}
