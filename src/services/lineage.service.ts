/**
 * lineage.service.ts
 * API service for the Lineage module.
 * Covers: lineage centric fetch, ingestion loading stages.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";

export interface LineageApiColumn {
  id: string;
  name: string;
  data_type: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  is_nullable: boolean;
  query_expression?: string | null;
}

export interface LineageApiTag {
  id: string;
  name: string;
  color: string | null;
  tag_type: string;
}

export interface LineageApiSource {
  id: string;
  name: string;
  source_type: string;
}

export interface LineageApiNodeCentric {
  id: string;
  table_name: string;
  full_name: string;
  schema_name: string;
  database_name: string | null;
  type: string;
  status: string;
  source: LineageApiSource;
  columns: LineageApiColumn[];
  tags: LineageApiTag[];
  lineage_id: string | null;
  transformation_query: string | null;
  depth: number;
  ai_summary?: string | null;
  stats: string;
  notes?: string | null;
  upstream_nodes: LineageApiNodeCentric[];
  downstream_nodes: LineageApiNodeCentric[];
}

export interface LineageCentricResponse {
  node: LineageApiNodeCentric;
}

export interface IngestionLoadingResponse {
  ingestion_loads: string[];
}

export interface PostIngestionLoadingResponse {
  reasoning_loads: string[];
}

export const lineageService = {
  async fetchLineageCentric(catalogId: string, depth: number = 2): Promise<LineageCentricResponse> {
    return dashboardApiClient.get<LineageCentricResponse>(
      `/api/v1/lineage-centric/${catalogId}`,
      { params: { depth } },
    );
  },

  async getIngestionLoadingStages(): Promise<IngestionLoadingResponse> {
    return dashboardApiClient.get<IngestionLoadingResponse>("/api/v1/sources/ingestion/loading");
  },

  async getPostIngestionLoadingStages(): Promise<PostIngestionLoadingResponse> {
    return dashboardApiClient.get<PostIngestionLoadingResponse>("/api/v1/sources/post-ingestion/loading");
  },
};
