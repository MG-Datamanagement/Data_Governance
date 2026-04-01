/**
 * catalog.types.ts
 * Types for the Catalog / Dataset / DataSource module.
 * Covers: Dataset, DataSource, Column, Tag, Queries, IngestionLog.
 *
 * NOTE: CatalogTag is defined here (previously lived in dashboardApiServices.ts)
 * to break the circular dependency: dashboardTypes.ts → services/ → types/.
 */

// ─── Shared Tag / Column ──────────────────────────────────────────────────────

export interface CatalogTag {
  name: string;
  color: string;
  tag_id: string;
}

export interface ApiTag {
  id: string;
  name: string;
  color?: string;
}

export interface ApiColumn {
  name: string;
  data_type: string;
  type?: string;
  description: string | null;
  comment: string | null;
  is_nullable: boolean;
  is_primary_key: boolean;
  tags?: ApiTag[];
}

// ─── Ingestion Log ────────────────────────────────────────────────────────────

export interface IngestionLog {
  time: string;
  message: string;
  status: "success" | "error" | "info";
}

// ─── Data Source ──────────────────────────────────────────────────────────────

export type DataSourceStatus = "success" | "failed" | "running";

export interface DataSourceStats {
  totalDatasets: number;
  totalColumns: string;
  totalRows: string;
  piiDetected: number;
}

export interface DataSource {
  id: string;
  sourceType: string;
  name: string;
  icon: string;
  iconBg: string;
  schedule: string;
  owner: string;
  ownerIcon: string;
  lastRun: string;
  status: DataSourceStatus;
  stats: DataSourceStats;
  ingestionLogs: IngestionLog[];
  totalDatasets: number;
}

// ─── Dataset / Catalog ────────────────────────────────────────────────────────

export type DatasetType = "table" | "view" | "Materialized View";
export type DatasetStatus = "healthy" | "warning" | "error";

export interface Dataset {
  id: string;
  name: string;
  hasPII: boolean;
  type: DatasetType;
  rows: string | null;
  columns: number;
  size: string | null;
  lastSync: string;
  status: DatasetStatus;
  tags: CatalogTag[];
}

export interface DatasetsBySource {
  [sourceId: string]: Dataset[];
}

export interface KeyField {
  name: string;
  description: string;
}

export interface DatasetDetail {
  id: string;
  sourceId: string;
  name: string;
  type: string;
  overview: string;
  keyFields: KeyField[];
  freshness: string;
  volume: string;
  qualityScore: string;
  columnCount: number;
  owner: string;
  ownerInitials: string;
  tags: string[];
  lineageWarning?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export interface ApiQuery {
  id: string;
  catalog_id: string;
  title: string;
  description: string;
  query_text: string;
  owner_name: string;
  created_at: string;
  updated_at: string;
  is_lineage_query: boolean;
}

export interface CreateQueryRequest {
  title: string;
  description: string;
  query_text: string;
  owner_id: string;
}

export interface UpdateQueryRequest {
  title: string;
  description: string;
  query_text: string;
  owner_id: string;
}

export interface DeleteQueryResponse {
  success: boolean;
  message?: string;
}

export interface QueryOwner {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ─── UI Primitive ─────────────────────────────────────────────────────────────

export type InlineStateType = "loading" | "empty" | "error";

export type Option = {
  value: string;
  label: string;
  description?: string;
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
