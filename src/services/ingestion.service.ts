/**
 * ingestion.service.ts
 * API service for the Ingestion / AI Classification module.
 * Covers: PII classification, column reclassification with AI, AI source summary, bulk datacards.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { logger } from "@/lib/logger";

export interface PiiClassificationRequest {
  source_id: string;
  Require_human_approval: boolean;
  assigned_by: string;
  min_confidence: number;
}

export interface ReclassifyWithAiRequest {
  source_id: string;
  save_to_db: boolean;
  assigned_by: string;
  min_confidence: number;
}

export interface ReclassificationActionWithAiRequest {
  catalog_id: string;
  save_to_db: boolean;
  assigned_by: string;
  min_confidence: number;
}

export interface TableClassificationResult {
  catalog_id: string;
  table_name: string;
  full_name: string;
  suggested_tag: string;
  tag_id: string | null;
  confidence_score: number;
  reasoning: string;
  saved: boolean;
}

export interface ClassificationResponse {
  source_id: string;
  total_catalogs: number;
  classified: number;
  saved: number;
  results: TableClassificationResult[];
}

export interface ReClassifyWithAiResponse {
  source_id: string;
  catalog_id: string;
  total_columns: number;
  classified: number;
  saved: number;
  results: TableClassificationResult[];
}

export interface SourceAiSummaryBadges { ingested: number; classified: number; }
export interface SourceAiSummaryStats { total_rows: number; sensitive_columns: number; healthy: number; warning: number; risk: number; duration_seconds: number; }
export interface SourceAiSummaryLogCounts { error: number; warning: number; }
export type PipelineStatus = "success" | "failed" | "running" | "pending";

export interface SourceAiSummaryResponse {
  source_id: string;
  source_name: string;
  job_id: string;
  pipeline_status: PipelineStatus;
  badges: SourceAiSummaryBadges;
  stats: SourceAiSummaryStats;
  log_counts: SourceAiSummaryLogCounts;
  ai_summary: string;
}

export const ingestionService = {
  async initPiiClassification(payload: PiiClassificationRequest): Promise<ClassificationResponse> {
    return dashboardApiClient.post("/tables/classify-table/source", payload);
  },

  async reclassifyWithAi(payload: ReclassifyWithAiRequest): Promise<ReClassifyWithAiResponse> {
    const BASE_DEV_API_URL = process.env.NEXT_PUBLIC_DEV_API_URL;
    const url = `${BASE_DEV_API_URL}/columns/classify-column/source`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`ReClassification API error: ${response.statusText}`);
    return response.json();
  },

  async reclassificationActionWithAi(payload: ReclassificationActionWithAiRequest): Promise<ReClassifyWithAiResponse> {
    const BASE_DEV_API_URL = process.env.NEXT_PUBLIC_DEV_API_URL;
    const url = `${BASE_DEV_API_URL}/columns/classify-column/catalog`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`ReClassification Action API error: ${response.statusText}`);
      return response.json();
    } catch (error) {
      logger.error(`Failed to trigger ReClassification Action with AI for catalog ${payload?.catalog_id}:`, error);
      throw error;
    }
  },

  async fetchIngestionAiSummary(sourceId: string) {
    return dashboardApiClient.get<SourceAiSummaryResponse>(`/api/v1/sources/${sourceId}/ai-summary`);
  },
};
