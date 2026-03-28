/**
 * catalog.service.ts
 * API service for the Catalog / Dataset / Column module.
 * Covers: catalog detail, datacard, properties CRUD, audit trail, bulk datacard generation.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { ApiTag, ApiColumn } from "@/types/catalog.types";

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

export interface ApiOwner {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
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

export interface GenerateDescriptionsResponse {
  catalog_id: string;
  table_name: string;
  total_null_columns: number;
  updated: number;
  failed: any[];
  message: string;
}

export const catalogService = {
  async fetchCatalogDetail(catalogId: string) {
    return dashboardApiClient.get<ApiCatalogDetail>(`/api/v1/catalogs/minimal-detail/${catalogId}`);
  },

  async fetchCatalogDatacard(catalogId: string) {
    return dashboardApiClient.get<ApiCatalogDatacard>(`/api/v1/catalogs/${catalogId}/datacard`);
  },

  async fetchCatalogAuditTrail(catalogId: string, limit: number = 50, offset: number = 0) {
    return dashboardApiClient.get<ApiAuditTrailResponse>(
      `/api/v1/catalogs/${catalogId}/audit-trail`,
      { params: { limit, offset } },
    );
  },

  async fetchCatalogProperties(catalogId: string): Promise<ApiCustomPropertiesResponse> {
    return dashboardApiClient.get<ApiCustomPropertiesResponse>(`/api/v1/catalogs/${catalogId}/properties`);
  },

  async createCatalogProperty(catalogId: string, payload: ApiCreateCustomPropertyRequest): Promise<ApiCustomProperty> {
    return dashboardApiClient.post<ApiCustomProperty>(`/api/v1/catalogs/${catalogId}/properties`, payload);
  },

  async updateCatalogProperty(catalogId: string, propertyId: string, payload: ApiUpdateCustomPropertyRequest): Promise<ApiCustomProperty> {
    return dashboardApiClient.patch<ApiCustomProperty>(`/api/v1/catalogs/${catalogId}/properties/${propertyId}`, payload);
  },

  async deleteCatalogProperty(catalogId: string, propertyId: string): Promise<string> {
    return dashboardApiClient.delete<string>(`/api/v1/catalogs/${catalogId}/properties/${propertyId}`);
  },

  async generateBulkSourceDatacards(sourceId: string): Promise<DatacardBulkGenerationResponse> {
    return dashboardApiClient.post<DatacardBulkGenerationResponse>(`/api/v1/sources/${sourceId}/datacards/bulk-generate`);
  },

  async generateDescriptions(catalogId: string): Promise<GenerateDescriptionsResponse> {
    return dashboardApiClient.post<GenerateDescriptionsResponse>(
      `/api/v1/catalog/${catalogId}/columns/generate-descriptions`,
      {},
    );
  },
};
