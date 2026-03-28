import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { AxiosRequestConfig } from "axios";
import { logger } from "@/lib/logger";

// ─── Types & Interfaces ──────────────────────────────────────────────────────

export interface CreateLineOfBusinessRequest {
  name: string;
  description: string;
  owner: string;
  color: string;
  custom_domain_name?: string;
  catalog_id?: string;
}

export interface LineOfBusiness {
  id: string;
  name: string;
  description: string;
  owner: string;
  color: string;
  custom_domain_name?: string;
  catalog_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LineOfBusinessListResponse {
  count?: number;
  total?: number;
  limit?: number;
  offset?: number;
  data?: LineOfBusiness[];
  results?: LineOfBusiness[];
}

export interface DeleteLineOfBusinessResponse {
  message: string;
  lob_id: string;
}

export interface ApiOwner {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Catalog {
  id: string;
  database_name?: string | null;
  schema_name?: string;
  table_name?: string;
  full_name?: string;
  description?: string | null;
  source_name?: string;
  source_type?: string;
  columns?: any[];
  properties?: Record<string, any>;
  column_count?: number;
  row_count?: number;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogListResponse {
  data?: Catalog[];
  results?: Catalog[];
}

const config: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};

// ─── API Service ─────────────────────────────────────────────────────────────

export const lineOfBusinessApiService = {
  /**
   * Create a new Line of Business
   * @param payload - Create Line of Business request payload
   * @returns Created Line of Business object
   */
  async createLineOfBusiness(
    payload: CreateLineOfBusinessRequest,
  ): Promise<LineOfBusiness> {
    return dashboardApiClient.post(
      "/api/v1/line-of-business",
      payload,
      config,
    );
  },

  /**
   * Fetch all Lines of Business
   * @param params - Optional query parameters (limit, offset, etc.)
   * @returns List of Lines of Business
   */
  async fetchLineOfBusinessList(params?: {
    limit?: number;
    offset?: number;
    owner?: string;
    [key: string]: any;
  }): Promise<LineOfBusiness[]> {
    const response = await dashboardApiClient.get<LineOfBusinessListResponse>(
      "/api/v1/line-of-business",
      { params: params || {} },
    );

    // Handle both response formats: { data: [...] } and { results: [...] }
    const items = (response as any)?.data || (response as any)?.results || [];
    return Array.isArray(items) ? items : [];
  },

  /**
   * Get all domains (convenience method for fetching all)
   * @returns List of all Line of Business domains
   */
  async getAllDomains(): Promise<LineOfBusiness[]> {
    try {
      return await this.fetchLineOfBusinessList({ limit: 1000 });
    } catch (error) {
      logger.error("Failed to fetch domains:", error);
      return [];
    }
  },

  /**
   * Fetch all Line of Business domains with child domains
   * @returns List of all Line of Business domains with subdomains
   */
  async fetchAllLineOfBusiness(): Promise<LineOfBusiness[]> {
    try {
      return await this.fetchLineOfBusinessList({ limit: 1000 });
    } catch (error) {
      logger.error("Failed to fetch all Line of Business:", error);
      return [];
    }
  },

  /**
   * Fetch a specific Line of Business by ID
   * @param lobId - Line of Business ID
   * @returns Line of Business details
   */
  async fetchLineOfBusinessDetail(lobId: string): Promise<LineOfBusiness> {
    return dashboardApiClient.get(
      `/api/v1/line-of-business/${lobId}`,
      config,
    );
  },

  /**
   * Update a Line of Business
   * @param lobId - Line of Business ID
   * @param payload - Updated data
   * @returns Updated Line of Business object
   */
  async updateLineOfBusiness(
    lobId: string,
    payload: Partial<CreateLineOfBusinessRequest>,
  ): Promise<LineOfBusiness> {
    return dashboardApiClient.put(
      `/api/v1/line-of-business/${lobId}`,
      payload,
      config,
    );
  },

  /**
   * Delete a Line of Business
   * @param lobId - Line of Business ID
   * @returns Deletion confirmation response
   */
  async deleteLineOfBusiness(
    lobId: string,
  ): Promise<DeleteLineOfBusinessResponse> {
    return dashboardApiClient.delete(
      `/api/v1/line-of-business/${lobId}`,
      config,
    );
  },

  /**
   * Fetch list of available owners for Line of Business selection
   * Used to populate the owner dropdown in create/edit forms
   * @param limit - Maximum number of owners to fetch
   * @returns List of available owners
   */
  async fetchOwnersForLobSelection(limit: number = 100): Promise<ApiOwner[]> {
    return dashboardApiClient.get("/api/v1/owners-list", {
      params: { limit },
    });
  },

  /**
   * Fetch list of Line of Business domains for parent domain selection
   * @returns List of available domains to use as parent
   */
  async fetchDomainsForParentSelection(): Promise<LineOfBusiness[]> {
    try {
      const domains = await this.fetchLineOfBusinessList({ limit: 1000 });
      return domains.filter(d => d.id && d.name);
    } catch (error) {
      logger.error("Failed to fetch domains for parent selection:", error);
      return [];
    }
  },

  /**
   * Fetch all catalogs
   * @returns List of all catalogs
   */
  async fetchAllCatalogs(): Promise<Catalog[]> {
    try {
      const response = await dashboardApiClient.get<Catalog[] | CatalogListResponse>(
        "/api/v1/catalogs/list",
        config,
      );

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === 'object') {
        return (response as any).data || (response as any).results || [];
      }

      return [];
    } catch (error) {
      logger.error("Failed to fetch catalogs:", error);
      return [];
    }
  },
};

export default lineOfBusinessApiService;
