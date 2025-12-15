import {
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorApiResponse,
  ApiError,
} from "../types/types";
import apiClient from "./client";

const CONNECTORS_ENDPOINT = "/connectors";

export const connectorApi = {
  create: async (
    data: CreateConnectorRequest
  ): Promise<ConnectorApiResponse> => {
    try {
      const response = await apiClient.post<ConnectorApiResponse>(
        CONNECTORS_ENDPOINT,
        data
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create connector",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  getAll: async (): Promise<ConnectorApiResponse[]> => {
    try {
      const response =
        await apiClient.get<ConnectorApiResponse[]>(CONNECTORS_ENDPOINT);
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch connectors",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  getById: async (connectorId: string): Promise<ConnectorApiResponse> => {
    try {
      const response = await apiClient.get<ConnectorApiResponse>(
        `${CONNECTORS_ENDPOINT}/${connectorId}`
      );
      return response.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || "Failed to fetch connector details",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  update: async (
    connectorId: string,
    data: UpdateConnectorRequest
  ): Promise<ConnectorApiResponse> => {
    try {
      const response = await apiClient.put<ConnectorApiResponse>(
        `${CONNECTORS_ENDPOINT}/${connectorId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update connector",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  delete: async (connectorId: string): Promise<void> => {
    try {
      await apiClient.delete(`${CONNECTORS_ENDPOINT}/${connectorId}`);
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete connector",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  testConnection: async (
    data: CreateConnectorRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>(`${CONNECTORS_ENDPOINT}/test`, data);
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Connection test failed",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },

  sync: async (connectorId: string): Promise<void> => {
    try {
      await apiClient.post(`${CONNECTORS_ENDPOINT}/${connectorId}/sync`);
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to sync connector",
        code: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
  },
};
