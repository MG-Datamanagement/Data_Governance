import { datasourceApiClient } from "@/lib/api-clients/datasourceApiClient";

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
}