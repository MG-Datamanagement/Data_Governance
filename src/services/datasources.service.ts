/**
 * datasources.service.ts
 * API service for the Data Sources module.
 * Covers: list, create, delete, ingest, stats, owners, run history, source logs, download.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";

export interface ApiDataSource {
  id?: string;
  source_id?: string;
  name: string;
  source_type?: string;
  owner_id?: string;
  owner_name?: string;
  status: "success" | "failed" | "running";
  schedule: string;
  last_ingested_at: string | null;
  created_at: string;
  description?: string;
}

export interface ApiOwner {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiRunHistory {
  total: number;
  limit: number;
  offset: number;
  results: Array<{
    job_id: string;
    source_id: string;
    source_name: string;
    source_type: string;
    schedule: string;
    owner_name: string;
    status: "success" | "failed" | "running";
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
    records_ingested: number;
    error_message: string | null;
  }>;
}

export interface ApiSourceLog {
  id: string;
  job_id: string;
  source_id: string;
  level: "error" | "warning" | "success";
  message: string;
  logged_at: string;
}

export interface ApiSourceLogs {
  source_id: string;
  total: number;
  filters: Record<string, string | null>;
  logs: ApiSourceLog[];
}

export const datasourcesService = {
  async fetchDataSources(params: { source_type?: string; status?: string; limit?: number }) {
    const queryParams: any = {};
    if (params.source_type) queryParams.source_type = params.source_type;
    if (params.status && params.status !== "All") queryParams.status = params.status.toLowerCase();
    if (params.limit) queryParams.limit = params.limit;
    return dashboardApiClient.get<ApiDataSource[]>("/api/v1/sources-list", { params: queryParams });
  },

  async createDataSource(
    type: "postgres" | "mongodb" | "postgresql" | "athena" | "redshift",
    payload: any,
  ): Promise<{ id?: string; source_id?: string }> {
    const endpoint =
      type === "athena" ? "athena" :
      type === "redshift" ? "redshift" :
      (type === "postgres" || type === "postgresql" ? "postgres" : "mongodb");
    return dashboardApiClient.post(`/api/v1/sources/${endpoint}`, payload);
  },

  async ingestSource(sourceId: string): Promise<{ job_id: string; source_id: string; status: string; message: string }> {
    return dashboardApiClient.post("/api/v1/ingest-source", { source_id: sourceId });
  },

  async deleteSource(sourceId: string): Promise<{ message: string; source_id: string }> {
    return dashboardApiClient.delete(`/api/v1/delete-source/${sourceId}`);
  },

  async fetchSourceStats(id: string, typeFilter?: string, statusFilter?: string) {
    const params: any = {};
    if (typeFilter && typeFilter !== "all") params.type = typeFilter;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    return dashboardApiClient.get(`/api/v1/sources/${id}/stats`, { params });
  },

  async fetchOwnersList(limit: number = 100) {
    return dashboardApiClient.get<ApiOwner[]>("/api/v1/owners-list", { params: { limit } });
  },

  async fetchRunHistory(limit: number = 50, offset: number = 0, status?: string) {
    const params: any = { limit, offset };
    if (status && status !== "All") params.status = status.toLowerCase();
    return dashboardApiClient.get<ApiRunHistory>("/api/v1/run-history", { params });
  },

  async fetchSourceLogs(sourceId: string, params: { last_run?: boolean; level?: string; limit?: number } = {}) {
    return dashboardApiClient.get<ApiSourceLogs>(`/api/v1/sources/${sourceId}/logs`, { params });
  },

  async downloadSourceStats(id: string, typeFilter?: string, statusFilter?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/v1/sources/${id}/stats/export`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const response = await fetch(url, {
      method: "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
    return response;
  },

  async getAgents() {
    return [
      { id: 1, name: "Data Quality Agent", type: "Data Validation", description: "Automatically scans new datasets for anomalies and schema drifts based on defined rules.", useCaseBadge: "BYO Agent", status: "Active", owner: "Data Engineering", models: ["Anomaly Detection v2"], lastUpdated: "Mar 6, 2026" },
      { id: 2, name: "Classification Agent", type: "Metadata Tagging", description: "Platform-managed agent that auto-tags columns with PII and classification metadata.", useCaseBadge: "Platform Agent", status: "Active", owner: "Governance Team", models: ["PII Classifier v4", "Llama-3-70b-Instruct"], lastUpdated: "Mar 5, 2026" },
      { id: 3, name: "Compliance Monitor", type: "Policy Enforcement", description: "Monitors data access patterns for potential compliance violations.", useCaseBadge: "BYO Agent", status: "Paused", owner: "Legal Team", models: ["Policy Evaluator v1"], lastUpdated: "Feb 20, 2026" },
      { id: 4, name: "Support Router Agent", type: "Workflow Automation", description: "Reads incoming tickets and routes them to the appropriate support tier.", useCaseBadge: "BYO Agent", status: "Active", owner: "CX Team", models: ["Support Ticket Classifier v3"], lastUpdated: "Jan 15, 2026" },
      { id: 5, name: "Sync Agent", type: "Data Sync", description: "Validates synchronization jobs across distributed data systems for integrity constraints.", useCaseBadge: "Platform Agent", status: "Error", owner: "DevOps", models: ["Sync Validator v1"], lastUpdated: "Feb 10, 2026" },
    ];
  },
};
