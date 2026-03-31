/**
 * overview.types.ts
 * Types for the Overview/Dashboard module.
 * Covers: stats metrics, platform usage, domain counts, recent activity,
 * recently-viewed datasets, recommendations, and AI/model risk snapshot.
 */

// ─── Shared Primitives ────────────────────────────────────────────────────────

export interface BaseApiResponse {
  status: "success" | "error";
  timestamp: number;
}

export interface MetricValue {
  value: number;
  info: string;
}

export type EntityType = "DOMAIN" | "TAG" | "DATASET" | "INCIDENT";
export type EntityCounts = Record<EntityType, number>;

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalAssets: number;
  totalAssetsInfo?: string;
  totalAssetsChange?: string;
  governanceScore?: number;
  governanceScoreInfo?: string;
  governanceScoreStatus?: string;
  classified: number;
  classifiedInfo?: string;
  classifiedChange?: string;
  pendingReview?: number;
  pendingReviewInfo?: string;
  aiRiskDomains?: number;
  aiRiskDomainsInfo?: string;
  activeDomains: number;
  activeDomainsInfo?: string;
  activeTables: number;
  activeTablesInfo?: string;
  openIssues?: number;
  openIssuesInfo?: string;
}

export interface DashboardEntityMetricsResponse extends BaseApiResponse {
  total_assets: MetricValue;
  total_datasets: MetricValue;
  total_domains: MetricValue;
  total_tags: MetricValue;
  pending_review?: MetricValue;
  open_issues?: MetricValue;
  governance_score?: MetricValue;
  at_risk_domains?: MetricValue;
}

// ─── Platform & Domain Counts ─────────────────────────────────────────────────

export interface DomainAsset {
  domain: string;
  count: number;
  urn?: string;
}

export interface DomainWithCount {
  urn: string;
  name: string;
  asset_count: number;
}

export interface TopDomainsWithCountsResponse extends BaseApiResponse {
  id: string;
  name: string;
  dataset_count: number;
}

export interface PlatformUsage {
  platform: string;
  count: number;
  urn?: string;
}

export interface PlatformWithCount {
  platform: string;
  catalog_count: number;
}

export interface TopPlatformsWithCountsResponse extends BaseApiResponse {
  platforms: PlatformWithCount[];
}

// ─── Recent Activity & Views ──────────────────────────────────────────────────

export interface RecentActivity {
  id: string;
  name: string;
  type: string;
  platform?: string;
  time?: string;
  table?: string;
  timestamp?: string;
}

export interface NewRecentActivity {
  t: string;
  msg: string;
}

export interface RecentlyViewed {
  id: string;
  name: string;
  platform: string;
  tag: string;
  tagColor: string;
  time: string;
  /** Used by getPlatformDisplay() to resolve icon at render time */
  platformKey: string;
  iconColor: string;
  sourceType?: string;
}

export interface RecentlyViewedDataset {
  urn: string;
  name: string;
  platform: string;
  description: string | null;
  source_module: string;
}

export interface RecentlyViewedDatasetsResponse extends BaseApiResponse {
  user_urn: string;
  total_datasets: number;
  recently_viewed_datasets: RecentlyViewedDataset[];
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface RecentAssetsActivityResponse extends BaseApiResponse {
  user_urn: string;
  recommendations: Recommendations;
}

export interface Recommendations {
  modules: RecommendationModule[];
}

export interface RecommendationModule {
  moduleId: string;
  content: RecommendationContentItem[];
}

export interface RecommendationContentItem {
  entity: RecommendationEntity;
}

export interface RecommendationEntity {
  urn: string;
  type: RecommendationEntityType;
  name?: string;
  platform?: EntityPlatform;
}

export interface EntityPlatform {
  name: string;
}

export type RecommendationEntityType = "DATA_PLATFORM" | "DATASET" | "CONTAINER";

// ─── AI Governance & Model Risk ───────────────────────────────────────────────

export interface AIGovernanceSnapshot {
  modelsInProduction: number;
  flaggedPromptsToday: number;
  aiFairnessScore: number;
  modelsNeedingReview: number;
}

export interface ModelRiskTrend {
  day: string;
  risk: number;
}
