
import {
  MOCK_RECENTLY_VIEWED,
  MOCK_COMPLIANCE_FRAMEWORKS,
  MOCK_COMPLIANCE_ISSUES,
  MOCK_COMPLIANCE_TRENDS,
  MOCK_AI_SNAPSHOT,
  MOCK_MODEL_RISK_TRENDS,
} from "@/lib/mockData";
import { AxiosRequestConfig } from "axios";
import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { logger } from "@/lib/logger";
import {
  DashboardEntityMetricsResponse,
  DashboardStats,
  DomainAsset,
  NewRecentActivity,
  PlatformUsage,
  PlatformWithCount,
  RecentActivity,
  RecentlyViewed,
  TopDomainsWithCountsResponse,
  TopPlatformsWithCountsResponse,
} from "@/types/overview.types";
import {
  ApiTag,
  ApiColumn,
  CatalogTag,
} from "@/types/catalog.types";
import {
  ApiComplianceRunResponse,
  ApiComplianceFramework,
  ApiComplianceIssue,
} from "@/types/compliance.types";
import { TopTagsResponse, TopTag } from "@/types/tagTypes";

export interface ApiComplianceHealth {
  overall_compliance?: {
    score: number;
    change_from_last_month?: number;
    health_status?: string;
    last_updated?: string;
  };
  compliance_health?: {
    score: number;
    trend_label?: string;
  };
  trends?: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  overall_score_infographic?: string;
}

export interface ApiComplianceFrameworks {
  frameworks?: ApiComplianceFramework[];
  frameworks_infographic?: string;
}

export interface ApiComplianceIssues {
  open_issues?: {
    count?: number;
    severity_summary?: Record<string, number>;
    items?: ApiComplianceIssue[];
  };
}

export interface ApiComplianceInsights {
  ai_insights?: {
    text?: string;
    beta?: boolean;
  };
}

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

export interface ApiSourceStats {
  source_id: string;
  source_name: string;
  source_type: string;
  total_tables_ingested: number;
  total_row_count: number;
  total_column_count: number;
  type: string;
  status: string;
  catalogs?: Array<{
    catalog_id: string;
    full_name: string;
    table_name: string;
    row_count: number | null;
    column_count: number;
    updated_at: string;
  }>;
}

export interface ApiOwner {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCatalogDetail {
  id: string;
  table_name: string;
  full_name: string;
  database_name: string;
  schema_name: string;
  description: string | null;
  source_name: string;
  source_type: string;
  row_count: number | null;
  column_count: number;
  properties: any;
  created_at: string;
  updated_at: string;
  owner?: string | ApiOwner | null;
  domains?: any[];
  tags?: ApiTag[];
  columns: ApiColumn[];
}

export interface ApiCatalogDatacard {
  catalog_id: string;
  table_name: string;
  full_name: string;
  data_card: string;
  generated_at: string;
  status: string;
}

export interface ApiAuditLogEntry {
  id: string;
  when_time: string;
  who_name: string;
  what_action: string;
  where_location: string;
  details: string;
  status: string;
}

export interface ApiAuditSummary {
  total_events: number;
  metadata_updates: number;
  classification_events: number;
  access_events: number;
  lineage_events: number;
}

export interface ApiAuditTrailResponse {
  catalog_id: string;
  summary: ApiAuditSummary;
  total_log_count: number;
  activity_log: ApiAuditLogEntry[];
}

export interface ApiSecret {
  id: string;
  name: string;
  type: string;
  description?: string;
  created_at?: string;
  last_rotated?: string;
  is_active?: boolean;
}

export interface ApiSecretCreateRequest {
  name: string;
  type: string;
  value: string;
  description?: string;
}

export interface ApiSecretUpdateRequest {
  value: string;
  description?: string;
}

export interface ApiCustomProperty {
  id: string;
  key: string;
  value: string;
  value_type: string;
  last_updated: string;
}

export interface ApiCustomPropertiesResponse {
  name: string;
  custom_properties: ApiCustomProperty[];
}

export interface ApiCreateCustomPropertyRequest {
  key: string;
  value: string;
  value_type: string;
}

export interface ApiUpdateCustomPropertyRequest {
  value: string;
  value_type: string;
}

export interface DatacardBulkGenerationResult {
  catalog_id: string;
  table_name: string;
  full_name: string;
  status: string;
  error: string | null;
  generated_at: string;
}

export interface DatacardBulkGenerationResponse {
  source_id: string;
  total_catalogs: number;
  generated: number;
  cached: number;
  failed: number;
  results: DatacardBulkGenerationResult[];
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

export interface ReclassifyWithAiRequest {
  source_id: string;
  save_to_db: boolean;
  assigned_by: string;
  min_confidence: number;
}

export interface ReClassifyWithAiResponse {
  source_id: string;
  catalog_id: string;
  total_columns: number;
  classified: number;
  saved: number;
  results: TableClassificationResult[];
}

export interface ReclassificationActionWithAiRequest {
  catalog_id: string;
  save_to_db: boolean;
  assigned_by: string;
  min_confidence: number;
}

export interface PiiClassificationRequest {
  source_id: string;
  Require_human_approval: boolean;
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

export type PipelineStatus = "success" | "failed" | "running" | "pending";

export interface SourceAiSummaryBadges {
  ingested: number;
  classified: number;
}

export interface SourceAiSummaryStats {
  total_rows: number;
  sensitive_columns: number;
  healthy: number;
  warning: number;
  risk: number;
  duration_seconds: number;
}

export interface SourceAiSummaryLogCounts {
  error: number;
  warning: number;
}

export type CatalogStatus = "healthy" | "warning" | "error";
export type CatalogType = "table" | "view";

export interface SourceCatalogResponse {
  source_id: string;
  source_name: string;
  source_type: string;
  total_tables_ingested: number;
  total_row_count: number;
  total_column_count: number;
  filters: Filters;
  catalogs: Catalog[];
}

export interface Filters {
  type: string | null;
  status: string | null;
}

export interface Catalog {
  catalog_id: string;
  full_name: string;
  table_name: string;
  row_count: number | null;
  column_count: number;
  type: CatalogType;
  status: CatalogStatus;
  last_sync: string;
  tags: CatalogTag[];
}

// CatalogTag is now defined in @/types/catalog.types and imported above.
// Re-exported here for any consumers that still import it from this file.
export type { CatalogTag } from "@/types/catalog.types";

const config: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};

export const dashboardApiServices = {
  getAgents: async () => {
    return [
      {
        id: 1,
        name: "Data Quality Agent",
        type: "Data Validation",
        description: "Automatically scans new datasets for anomalies and schema drifts based on defined rules.",
        useCaseBadge: "BYO Agent",
        status: "Active",
        owner: "Data Engineering",
        models: ["Anomaly Detection v2"],
        lastUpdated: "Mar 6, 2026"
      },
      {
        id: 2,
        name: "Classification Agent",
        type: "Metadata Tagging",
        description: "Platform-managed agent that auto-tags columns with PII and classification metadata.",
        useCaseBadge: "Platform Agent",
        status: "Active",
        owner: "Governance Team",
        models: ["PII Classifier v4", "Llama-3-70b-Instruct"],
        lastUpdated: "Mar 5, 2026"
      },
      {
        id: 3,
        name: "Compliance Monitor",
        type: "Policy Enforcement",
        description: "Monitors data access patterns for potential compliance violations.",
        useCaseBadge: "BYO Agent",
        status: "Paused",
        owner: "Legal Team",
        models: ["Policy Evaluator v1"],
        lastUpdated: "Feb 20, 2026"
      },
      {
        id: 4,
        name: "Support Router Agent",
        type: "Workflow Automation",
        description: "Reads incoming tickets and routes them to the appropriate support tier.",
        useCaseBadge: "BYO Agent",
        status: "Active",
        owner: "CX Team",
        models: ["Support Ticket Classifier v3"],
        lastUpdated: "Jan 15, 2026"
      },
      {
        id: 5,
        name: "Sync Agent",
        type: "Data Sync",
        description: "Validates synchronization jobs across distributed data systems for integrity constraints.",
        useCaseBadge: "Platform Agent",
        status: "Error",
        owner: "DevOps",
        models: ["Sync Validator v1"],
        lastUpdated: "Feb 10, 2026"
      }
    ];
  },
  // ─── Compliance & Overview ───────────────────────────────────────────────
  async getComplianceHealth() {
    return dashboardApiClient.get<ApiComplianceHealth>("/api/compliance/health");
  },

  async getComplianceLoadingSteps(): Promise<{ reasoning_loads: string[] }> {
    return dashboardApiClient.get("/api/compliance/loading");
  },

  async runComplianceScan(): Promise<{
    timestamp: string;
    summary: {
      frameworks_scanned: number;
      issues_found: number;
      policies_checked: number;
      overall_score: number;
      issue_summary: string;
    };
    reasoning: Array<{ title: string; description: string }>;
  }> {
    return dashboardApiClient.get("/api/compliance/summary");
  },
  async getComplianceFrameworks() {
    return dashboardApiClient.get<ApiComplianceFrameworks>("/api/compliance/frameworks");
  },
  async getComplianceIssues() {
    return dashboardApiClient.get<ApiComplianceIssues>("/api/compliance/issues");
  },
  async getComplianceInsights() {
    return dashboardApiClient.get<ApiComplianceInsights>("/api/compliance/insights");
  },
  async getAISnapshot() {
    return MOCK_AI_SNAPSHOT;
  },
  async getModelRiskTrends() {
    return MOCK_MODEL_RISK_TRENDS;
  },

  async getDashboardStats() {
    const response: DashboardEntityMetricsResponse = await dashboardApiClient.get(
      "/api/v1/overview/stats",
    );

    const dashboardStats: DashboardStats = {
      totalAssets: response?.total_assets?.value || 0,
      totalAssetsInfo: response?.total_assets?.info || "",
      classified: response?.total_tags?.value || 0,
      classifiedInfo: response?.total_tags?.info || "",
      activeDomains: response?.total_domains?.value || 0,
      activeDomainsInfo: response?.total_domains?.info || "",
      activeTables: response?.total_datasets?.value || 0,
      activeTablesInfo: response?.total_datasets?.info || "",
      pendingReview: response?.pending_review?.value || 0,
      pendingReviewInfo: response?.pending_review?.info || "",
      openIssues: response?.open_issues?.value || 0,
      openIssuesInfo: response?.open_issues?.info || "",
      governanceScore: response?.governance_score?.value || 0,
      governanceScoreInfo: response?.governance_score?.info || "",
      aiRiskDomains: response?.at_risk_domains?.value || 0,
      aiRiskDomainsInfo: response?.at_risk_domains?.info || "",
    };
    return dashboardStats;
  },

  async getPendingReviewCount() {
    // return dashboardApiClient.get<{ pending_review: number }>(
    //   "/api/dashboard/pending-review",
    // );
    return { pending_review: { value: 0, info: "" } };
  },

  async getOpenIssues() {
    // return dashboardApiClient.get<{ open_issues: number }>(
    //   "/api/dashboard/open-issues",
    // );
    return { open_issues: { value: 0, info: "" } };
  },

  async getGovernanceScore() {
    // return dashboardApiClient.get<{ governance_score: number }>(
    //   "/api/dashboard/governance-score",
    // );
    return { governance_score: { value: 0, info: "" } };
  },

  async getComplianceOverview() {
    return dashboardApiClient.get<{
      info?: string;
      insight: string;
      framework_scores: { framework: string; score: number }[];
    }>("/compliance-overview");
  },

  // ─── Top Tags (replaces Domains on overview) ────────────────────────────
  async getTopTags(limit: number = 30): Promise<TopTag[]> {
    const response: TopTagsResponse = await dashboardApiClient.get(
      `/api/v1/tags/top`,
      { params: { limit } },
    );
    return response?.tags ?? [];
  },

  // async getDomainAssets() {
  //   const response: TopDomainsWithCountsResponse[] = await dashboardApiClient.get(
  //     "/api/v1/domains/dataset-count",
  //   );
  //   return response?.map((domain: TopDomainsWithCountsResponse) => ({
  //     domain: domain?.name,
  //     count: domain?.dataset_count,
  //     urn: domain?.id,
  //   }));
  //   return [];
  // },

  async getPlatformUsage() {
    const response: TopPlatformsWithCountsResponse = await dashboardApiClient.get(
      "/api/v1/overview/datasets-by-platform",
    );
    return response?.platforms?.map((platform: PlatformWithCount) => ({
      platform: platform?.platform,
      urn: platform?.platform,
      count: platform?.catalog_count,
    }));
  },

  async getRecentlyViewed(userUrn: string) {
    try {
      const response = await dashboardApiClient.get<{ recently_viewed: any[] }>(
        "/api/v1/recently-viewed",
      );

      return response.recently_viewed.map((item, index) => {
        const platformRaw: string = item.source || "";
        const tag = (item.tag || "").toLowerCase();
        let tagColor = "gray";
        if (tag === "pii") tagColor = "yellow";
        else if (tag === "financial") tagColor = "blue";
        else if (tag === "phi") tagColor = "red";
        else if (tag === "gdpr") tagColor = "green";
        else if (tag === "hipaa") tagColor = "indigo";

        const platform = platformRaw.toLowerCase();
        let iconColor = "text-gray-600";
        if (platform.includes("postgres")) iconColor = "text-slate-600";
        else if (platform.includes("snowflake")) iconColor = "text-sky-600";
        else if (platform.includes("mongo")) iconColor = "text-green-600";
        else if (platform.includes("redshift")) iconColor = "text-red-700";

        return {
          id: `${item.dataset}-${index}`,
          name: item.dataset || "Unknown Dataset",
          platform: platformRaw,
          tag: item.tag || "",
          tagColor,
          time: item.time || "",
          platformKey: platformRaw,
          iconColor,
        };
      });
    } catch (e) {
      logger.error("Failed to fetch recently viewed items:", e);
      return [];
    }
  },

  async getRecentActivity(userUrn: string) {
    const response = await dashboardApiClient.get<{ info: string, activities: NewRecentActivity[] }>(
      `/api/v1/recent-activity`,
    );
    return response.activities.map((activity: NewRecentActivity, index: number) => ({
      id: `${activity.t}-${index}`,
      name: activity.msg || "",
      type: "",
      platform: "",
      time: activity.t,
    }));
  },

  // ─── Data Sources ───────────────────────────────────────────────────────
  async fetchDataSources(params: {
    source_type?: string;
    status?: string;
    limit?: number;
  }) {
    const queryParams: any = {};
    if (params.source_type) queryParams.source_type = params.source_type;
    if (params.status && params.status !== "All")
      queryParams.status = params.status.toLowerCase();
    if (params.limit) queryParams.limit = params.limit;

    return dashboardApiClient.get<ApiDataSource[]>("/api/v1/sources-list", {
      params: queryParams,
    });
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

  async fetchSourceStats(
    id: string,
    typeFilter?: string,
    statusFilter?: string,
  ) {
    const params: any = {};
    if (typeFilter && typeFilter !== "all") params.type = typeFilter;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;

    return dashboardApiClient.get<SourceCatalogResponse>(`/api/v1/sources/${id}/stats`, {
      params,
    });
  },

  async ingestSource(sourceId: string): Promise<{
    job_id: string;
    source_id: string;
    status: string;
    message: string;
  }> {
    return dashboardApiClient.post("/api/v1/ingest-source", {
      source_id: sourceId,
    });
  },

  async deleteSource(sourceId: string): Promise<{
    message: string;
    source_id: string;
  }> {
    return dashboardApiClient.delete(`/api/v1/delete-source/${sourceId}`);
  },

  async fetchOwnersList(limit: number = 100) {
    return dashboardApiClient.get<ApiOwner[]>("/api/v1/owners-list", {
      params: { limit },
    });
  },

  async fetchCatalogDetail(catalogId: string) {
    return dashboardApiClient.get<ApiCatalogDetail>(
      `/api/v1/catalogs/minimal-detail/${catalogId}`,
    );
  },

  async fetchCatalogAuditTrail(catalogId: string, limit: number = 50, offset: number = 0) {
    return dashboardApiClient.get<ApiAuditTrailResponse>(
      `/api/v1/catalogs/${catalogId}/audit-trail`,
      { params: { limit, offset } }
    );
  },

  // Properties CRUD
  async fetchCatalogProperties(catalogId: string): Promise<ApiCustomPropertiesResponse> {
    return dashboardApiClient.get<ApiCustomPropertiesResponse>(
      `/api/v1/catalogs/${catalogId}/properties`
    );
  },

  async createCatalogProperty(catalogId: string, payload: ApiCreateCustomPropertyRequest): Promise<ApiCustomProperty> {
    return dashboardApiClient.post<ApiCustomProperty>(
      `/api/v1/catalogs/${catalogId}/properties`,
      payload
    );
  },

  async updateCatalogProperty(catalogId: string, propertyId: string, payload: ApiUpdateCustomPropertyRequest): Promise<ApiCustomProperty> {
    return dashboardApiClient.patch<ApiCustomProperty>(
      `/api/v1/catalogs/${catalogId}/properties/${propertyId}`,
      payload
    );
  },

  async deleteCatalogProperty(catalogId: string, propertyId: string): Promise<string> {
    return dashboardApiClient.delete<string>(
      `/api/v1/catalogs/${catalogId}/properties/${propertyId}`
    );
  },

  async fetchCatalogDatacard(catalogId: string) {
    return dashboardApiClient.get<ApiCatalogDatacard>(
      `/api/v1/catalogs/${catalogId}/datacard`,
    );
  },

  async generateBulkSourceDatacards(
    sourceId: string, max_tokens?: number, skip_cached?: boolean
  ): Promise<DatacardBulkGenerationResponse> {
    return dashboardApiClient.post<DatacardBulkGenerationResponse>(
      `/api/v1/sources/${sourceId}/datacards/bulk-generate`,
    );
  },

  async fetchRunHistory(
    limit: number = 50,
    offset: number = 0,
    status?: string,
  ) {
    const params: any = { limit, offset };
    if (status && status !== "All") params.status = status.toLowerCase();

    return dashboardApiClient.get<ApiRunHistory>("/api/v1/run-history", {
      params,
    });
  },

  // Secrets CRUD
  async fetchSecrets(): Promise<ApiSecret[]> {
    return dashboardApiClient.get<ApiSecret[]>("/api/v1/get/secrets");
  },

  async createSecret(payload: ApiSecretCreateRequest) {
    return dashboardApiClient.post<any>("/api/v1/add/secrets", payload);
  },

  async updateSecret(secretId: string, payload: ApiSecretUpdateRequest) {
    return dashboardApiClient.put<any>(`/api/v1/update/secrets/${secretId}`, payload);
  },

  async deleteSecret(secretId: string) {
    return dashboardApiClient.delete<any>(`/api/v1/secrets/remove/${secretId}`);
  },

  async fetchSourceLogs(
    sourceId: string,
    params: { last_run?: boolean; level?: string; limit?: number } = {},
  ) {
    return dashboardApiClient.get<ApiSourceLogs>(
      `/api/v1/sources/${sourceId}/logs`,
      { params },
    );
  },

  async initPiiClassification(
    payload: PiiClassificationRequest,
  ): Promise<ClassificationResponse> {
    return dashboardApiClient.post("/tables/classify-table/source", payload);
  },

  async downloadSourceStats(
    id: string,
    typeFilter?: string,
    statusFilter?: string,
  ) {
    const baseUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/v1/sources/${id}/stats/export`;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    return response;
  },

  async exportComplianceReport(): Promise<void> {
    const baseUrl =
      process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/compliance/report/export`;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `compliance-report-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  },

  async fetchIngestionAiSummary(sourceId: string) {
    return dashboardApiClient.get<SourceAiSummaryResponse>(
      `/api/v1/sources/${sourceId}/ai-summary`,
    );
  },

  // ─── Lineage Visual Types ─────────────────────────────────────────────────────

  async fetchLineageCentric(
    catalogId: string,
    depth: number = 2,
  ): Promise<LineageCentricResponse> {
    return dashboardApiClient.get<LineageCentricResponse>(
      `/api/v1/lineage-centric/${catalogId}`,
      { params: { depth } },
    );
  },

  async reclassifyWithAi(
    reClassifyPayload: ReclassifyWithAiRequest,
  ): Promise<ReClassifyWithAiResponse> {
    const BASE_DEV_API_URL = process.env.NEXT_PUBLIC_DEV_API_URL;
    const url = `${BASE_DEV_API_URL}/columns/classify-column/source`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reClassifyPayload),
      });

      if (!response.ok) {
        throw new Error(`ReClassification with Ai API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error(`Failed to trigger ReClassification with AI for source ${reClassifyPayload?.source_id}:`, error);
      throw error;
    }
  },

  async reclassificationActionWithAi(
    reClassificationActionPayload: ReclassificationActionWithAiRequest,
  ): Promise<ReClassifyWithAiResponse> {
    const BASE_DEV_API_URL = process.env.NEXT_PUBLIC_DEV_API_URL;
    const url = `${BASE_DEV_API_URL}/columns/classify-column/catalog`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reClassificationActionPayload),
      });

      if (!response.ok) {
        throw new Error(`ReClassification Action with Ai API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error(`Failed to trigger ReClassification Action with AI for catalog ${reClassificationActionPayload?.catalog_id}:`, error);
      throw error;
    }
  },

  generateDescriptions(catalogId: string): Promise<GenerateDescriptionsResponse> {
    return dashboardApiClient.post<GenerateDescriptionsResponse>(
      `/api/v1/catalog/${catalogId}/columns/generate-descriptions`,
      {}
    );
  },
  getIngestionLoadingStages(): Promise<IngestionLoadingResponse> {
    return dashboardApiClient.get<IngestionLoadingResponse>(
      "/api/v1/sources/ingestion/loading"
    );
  },
  getPostIngestionLoadingStages(): Promise<PostIngestionLoadingResponse> {
    return dashboardApiClient.get<PostIngestionLoadingResponse>(
      "/api/v1/sources/post-ingestion/loading"
    );
  },
};

export interface IngestionLoadingResponse {
  ingestion_loads: string[];
}

export interface PostIngestionLoadingResponse {
  reasoning_loads: string[];
}

export interface GenerateDescriptionsResponse {
  catalog_id: string;
  table_name: string;
  total_null_columns: number;
  updated: number;
  failed: any[];
  message: string;
}

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

export interface LineageApiQueryExecution {
  query_execution_id: string;
  query_start_time: string;
  query_end_time: string;
  query_runtime_ms: number;
  data_scanned_bytes: number;
  query_status: string;
  engine_version: string;
  s3_output_location: string;
}

export interface LineageApiColumnMapping {
  source_column: string;
  target_column: string;
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
  query_execution?: LineageApiQueryExecution | null;
  depth: number;
  ai_summary?: string | null;
  stats: string;
  notes?: string | null;
  upstream_nodes: LineageApiNodeCentric[];
  downstream_nodes: LineageApiNodeCentric[];
}

export interface LineageCentricResponse {
  base_node: LineageApiNodeCentric;
}
