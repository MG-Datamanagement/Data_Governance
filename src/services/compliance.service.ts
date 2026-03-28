/**
 * compliance.service.ts
 * API service for the Compliance module.
 * Covers: health, frameworks, issues, insights, scan, export.
 */

import { dashboardApiClient } from "@/lib/api-clients/dashboardApiClient";
import { ApiComplianceFramework, ApiComplianceIssue } from "@/types/compliance.types";
import { MOCK_COMPLIANCE_FRAMEWORKS, MOCK_COMPLIANCE_ISSUES } from "@/lib/mock/compliance.mock";

export interface ApiComplianceHealth {
  overall_compliance?: {
    score: number;
    change_from_last_month?: number;
    health_status?: string;
    last_updated?: string;
  };
  compliance_health?: {
    score: number;
    trend_label?: string;
  };
  trends?: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
  overall_score_infographic?: string;
}

export interface ApiComplianceFrameworks {
  frameworks?: ApiComplianceFramework[];
  frameworks_infographic?: string;
}

export interface ApiComplianceIssues {
  open_issues?: {
    count?: number;
    severity_summary?: Record<string, number>;
    items?: ApiComplianceIssue[];
  };
}

export interface ApiComplianceInsights {
  ai_insights?: {
    text?: string;
    beta?: boolean;
  };
}

export const complianceService = {
  async getComplianceHealth() {
    return dashboardApiClient.get<ApiComplianceHealth>("/api/compliance/health");
  },

  async getComplianceLoadingSteps(): Promise<{ reasoning_loads: string[] }> {
    return dashboardApiClient.get("/api/compliance/loading");
  },

  async runComplianceScan(): Promise<{
    timestamp: string;
    summary: { frameworks_scanned: number; issues_found: number; policies_checked: number; overall_score: number; issue_summary: string };
    reasoning: Array<{ title: string; description: string }>;
  }> {
    return dashboardApiClient.get("/api/compliance/summary");
  },

  async getComplianceFrameworks() {
    return dashboardApiClient.get<ApiComplianceFrameworks>("/api/compliance/frameworks");
  },

  async getComplianceIssues() {
    return dashboardApiClient.get<ApiComplianceIssues>("/api/compliance/issues");
  },

  async getComplianceInsights() {
    return dashboardApiClient.get<ApiComplianceInsights>("/api/compliance/insights");
  },

  async exportComplianceReport(): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/compliance/report/export`;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const response = await fetch(url, {
      method: "GET",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `compliance-report-${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  },
};
