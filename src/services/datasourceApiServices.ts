import { datasourceApiClient } from "@/lib/api-clients/datasourceApiClient";
import { ApiQuery, CreateQueryRequest, DeleteQueryResponse, QueryOwner, UpdateQueryRequest } from "@/types/dashboardTypes";

export type ComplianceStatus = "PASS" | "VIOLATION";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface DatasetInfo {
    catalog_id: string;
    name: string;
    full_name: string;
    owner: string;
}

export interface ComplianceSummary {
    compliance_score: number;
    status: string;
    policies_checked: number;
    protected_assets: number;
    critical_violations: number;
}

export interface RuleViolation {
    dataset: string;
    assignee: string;
    due_date: string; // ISO date string
    action_url: string;
}

export interface ComplianceRule {
    rule_id: string;
    rule_name: string;
    description: string;
    status: ComplianceStatus;
    severity: SeverityLevel;
    violations: RuleViolation[];
}

export interface ComplianceApiResponse {
    dataset: DatasetInfo;
    summary: ComplianceSummary;
    rules: ComplianceRule[];
}

export const datasourceApiServices = {
    // compliance report for dataset
    async fetchDatasetComplianceReport(catalogId: string) {
        return datasourceApiClient.get<ComplianceApiResponse>(
            `/api/compliance/dataset/${catalogId}`,
        );
    },

    // Get list of queries for a dataset
    async fetchDatasetQueries(catalogId: string) {
        return datasourceApiClient.get<{ catalog_id: string; user_queries: ApiQuery[] }>(
            `/api/v1/catalogs/${catalogId}/queries`,
        );
    },

    // Create a new query for a dataset
    async createDatasetQuery(catalogId: string, payload: CreateQueryRequest) {
        return datasourceApiClient.post<ApiQuery>(
            `/api/v1/catalogs/${catalogId}/queries`,
            payload,
        );
    },

    // Delete a query
    async deleteDatasetQuery(catalogId: string, queryId: string) {
        return datasourceApiClient.delete<string>(
            `/api/v1/catalogs/${catalogId}/queries/${queryId}`,
        );
    },

    // Get owners list
    async fetchOwnersList() {
        return datasourceApiClient.get<QueryOwner[]>(`/api/v1/owners-list`);
    },
};