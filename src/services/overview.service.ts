/**
 * overview.service.ts
 * API service for the Overview / Dashboard home page module.
 * Covers: stats, platform usage, domain assets, recent activity, recently-viewed,
 * AI governance snapshot, model risk trends.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { logger } from "@/lib/logger";
import {
  DashboardEntityMetricsResponse,
  DashboardStats,
  NewRecentActivity,
  PlatformWithCount,
  TopPlatformsWithCountsResponse,
} from "@/types/overview.types";
import { TopTagsResponse, TopTag } from "@/types/tagTypes";
import {
  MOCK_AI_SNAPSHOT,
  MOCK_MODEL_RISK_TRENDS,
} from "@/lib/mock/overview.mock";

export const overviewService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response: DashboardEntityMetricsResponse = await dashboardApiClient.get(
      "/api/v1/overview/stats",
    );
    return {
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
  },

  async getPendingReviewCount() {
    return { pending_review: { value: 0, info: "" } };
  },

  async getOpenIssues() {
    return { open_issues: { value: 0, info: "" } };
  },

  async getGovernanceScore() {
    return { governance_score: { value: 0, info: "" } };
  },

  async getTopTags(limit: number = 30): Promise<TopTag[]> {
    const response: TopTagsResponse = await dashboardApiClient.get(
      "/api/v1/tags/top",
      { params: { limit } },
    );
    return response?.tags ?? [];
  },

  async getPlatformUsage() {
    const response: TopPlatformsWithCountsResponse = await dashboardApiClient.get(
      "/api/v1/overview/datasets-by-platform",
    );
    return response?.platforms?.map((p: PlatformWithCount) => ({
      platform: p?.platform,
      urn: p?.platform,
      count: p?.catalog_count,
    }));
  },

  async getRecentlyViewed(_userUrn: string) {
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
        return { id: `${item.dataset}-${index}`, name: item.dataset || "Unknown Dataset", platform: platformRaw, tag: item.tag || "", tagColor, time: item.time || "", platformKey: platformRaw, iconColor };
      });
    } catch (e) {
      logger.error("Failed to fetch recently viewed items:", e);
      return [];
    }
  },

  async getRecentActivity(_userUrn: string) {
    const response = await dashboardApiClient.get<{ info: string; activities: NewRecentActivity[] }>(
      "/api/v1/recent-activity",
    );
    return response.activities.map((activity: NewRecentActivity, index: number) => ({
      id: `${activity.t}-${index}`,
      name: activity.msg || "",
      type: "",
      platform: "",
      time: activity.t,
    }));
  },

  async getComplianceOverview() {
    return dashboardApiClient.get<{
      info?: string;
      insight: string;
      framework_scores: { framework: string; score: number }[];
    }>("/compliance-overview");
  },

  async getAISnapshot() {
    return MOCK_AI_SNAPSHOT;
  },

  async getModelRiskTrends() {
    return MOCK_MODEL_RISK_TRENDS;
  },
};
