/**
 * secrets.service.ts
 * API service for the Data Source Secrets module.
 * Covers: list, create, update, delete.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";

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

export const secretsService = {
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
};
