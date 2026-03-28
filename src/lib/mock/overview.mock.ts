/**
 * overview.mock.ts
 * Mock data for the Overview / Dashboard module.
 * Extracted from lib/mockData.ts.
 */

import type {
  DashboardStats,
  AIGovernanceSnapshot,
  ModelRiskTrend,
  DomainAsset,
  PlatformUsage,
  RecentActivity,
  RecentlyViewed,
} from "@/types/overview.types";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export const MOCK_USERS: MockUser[] = [
  { id: "usr-001", name: "James Carter", email: "james.carter@infinity.io", role: "Data Steward", avatar: null },
  { id: "usr-002", name: "Emily Richardson", email: "emily.richardson@infinity.io", role: "Chief Data Officer", avatar: null },
  { id: "usr-003", name: "Michael Torres", email: "michael.torres@infinity.io", role: "Privacy Engineer", avatar: null },
  { id: "usr-004", name: "Sarah Bennett", email: "sarah.bennett@infinity.io", role: "Compliance Analyst", avatar: null },
];

export const ACTIVE_USER_INDEX = 0;
export const MOCK_USER: MockUser = MOCK_USERS[ACTIVE_USER_INDEX];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalAssets: 112,
  totalAssetsChange: "+12% vs last month",
  governanceScore: 87,
  governanceScoreStatus: "Above target",
  classified: 14,
  classifiedChange: "+8% vs last month",
  pendingReview: 243,
  aiRiskDomains: 16,
  activeDomains: 12,
  activeTables: 45,
};

export const MOCK_AI_SNAPSHOT: AIGovernanceSnapshot = {
  modelsInProduction: 12,
  flaggedPromptsToday: 23,
  aiFairnessScore: 0.89,
  modelsNeedingReview: 3,
};

export const MOCK_MODEL_RISK_TRENDS: ModelRiskTrend[] = [
  { day: "7 days", risk: 0.65 },
  { day: "6 days", risk: 0.72 },
  { day: "5 days", risk: 0.68 },
  { day: "4 days", risk: 0.78 },
  { day: "3 days", risk: 0.82 },
  { day: "2 days", risk: 0.75 },
  { day: "1 day", risk: 0.88 },
  { day: "today", risk: 0.92 },
];

export const MOCK_DOMAIN_ASSETS: DomainAsset[] = [
  { domain: "Business Term", count: 2 },
  { domain: "Human resource", count: 1 },
  { domain: "Customer Management", count: 1 },
];

export const MOCK_PLATFORM_USAGE: PlatformUsage[] = [
  { platform: "PostgreSQL", count: 85 },
  { platform: "Snowflake", count: 80 },
  { platform: "MongoDB", count: 22 },
  { platform: "Cockroach/Adv", count: 8 },
];

export const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  { id: "1", name: "hum_resources_department", type: "Postgres", table: "Table", timestamp: "1 hour ago" },
  { id: "2", name: "LINEITEM", type: "Snowflake", table: "Table", timestamp: "3 hours ago" },
  { id: "3", name: "CUSTOMER_LTV", type: "Snowflake", table: "View", timestamp: "3 hours ago" },
  { id: "4", name: "customer_ltv", type: "Postgres", table: "Table", timestamp: "4 hours ago" },
  { id: "5", name: "customer_lv", type: "Postgres", table: "Table", timestamp: "4 hours ago" },
  { id: "6", name: "customer_lv", type: "Postgres", table: "Table", timestamp: "4 hours ago" },
  { id: "7", name: "customers", type: "Postgres", table: "Table", timestamp: "5 hours ago" },
  { id: "8", name: "order_line_items", type: "Postgres", table: "Table", timestamp: "6 hours ago" },
];

export const MOCK_RECENTLY_VIEWED: RecentlyViewed[] = [
  { id: "1", name: "customers", platform: "postgres_db", tag: "PII", tagColor: "yellow", time: new Date(Date.now() - 2 * 60 * 1000).toISOString(), platformKey: "postgres", iconColor: "text-slate-600" },
  { id: "2", name: "transactions", platform: "snowflake_dw", tag: "Financial", tagColor: "blue", time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), platformKey: "snowflake", iconColor: "text-sky-600" },
  { id: "3", name: "medical_images", platform: "mongodb_atlas", tag: "PHI", tagColor: "red", time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), platformKey: "mongo", iconColor: "text-green-600" },
  { id: "4", name: "user_preferences", platform: "postgres_db", tag: "GDPR", tagColor: "green", time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), platformKey: "postgres", iconColor: "text-slate-600" },
  { id: "5", name: "patient_records", platform: "snowflake_dw", tag: "HIPAA", tagColor: "indigo", time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), platformKey: "snowflake", iconColor: "text-sky-600" },
];
