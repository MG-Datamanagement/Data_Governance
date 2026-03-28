/**
 * compliance.types.ts
 * Types for the Compliance module.
 * Covers: framework scores, issues, trends, API response shapes.
 */

// ─── UI/Display Compliance Types ─────────────────────────────────────────────

export interface ComplianceItem {
  label: string;
  completed: boolean;
  count?: number;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  score: number;
  policiesTotal: number;
  policiesComplete: number;
  status: "excellent" | "warning" | "critical";
  lastUpdated: string;
  items?: ComplianceItem[];
}

export interface ComplianceIssue {
  id: string;
  issue: string;
  framework: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  dataset: string;
  assignee: string;
  dueDate: string;
}

export interface ComplianceTrend {
  month: string;
  overall: number;
  gdpr: number;
  soc2: number;
  hipaa: number;
}

// ─── API Compliance Response Types ───────────────────────────────────────────

export interface ApiComplianceIndicator {
  text: string;
  status: "success" | "error" | "warning";
}

export interface ApiComplianceFramework {
  name: string;
  score: number;
  status: "excellent" | "warning" | "critical" | "needs_attention";
  details: string;
  last_checked: string;
  indicators: ApiComplianceIndicator[];
}

export interface ApiComplianceIssue {
  issue: string;
  framework: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  dataset: string;
  assignee: string;
  due_date: string;
  action_url: string;
}

export interface ApiComplianceRunResponse {
  timestamp: string;
  overall_score_infographic: string;
  frameworks_infographic: string;
  overall_compliance: {
    score: number;
    change_from_last_month: number;
    health_status: string;
    last_updated: string;
  };
  compliance_health: {
    score: number;
    trend_label: string;
  };
  trends: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
  frameworks: ApiComplianceFramework[];
  open_issues: {
    count: number;
    severity_summary: Record<string, number>;
    items: ApiComplianceIssue[];
  };
  ai_insights: {
    text: string;
    beta: boolean;
  };
  quick_actions: {
    label: string;
    action: string;
  }[];
}

export interface ApiOpenIssuesResponse {
  open_issues: number;
}

export interface ApiGovernanceScoreResponse {
  governance_score: number;
}

export interface ApiComplianceOverviewResponse {
  insight: string;
  framework_scores: {
    framework: string;
    score: number;
  }[];
}
