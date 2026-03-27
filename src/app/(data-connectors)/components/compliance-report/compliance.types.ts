"use client";

/**
 * compliance.types.ts
 * Shared TypeScript interfaces for compliance-report sub-components.
 * Exported here so both sub-components and the main modal can import from one place.
 */

export interface RuleViolation {
  dataset: string;
  assignee: string;
  due_date: string;
  action_url: string;
}

export interface NewComplianceRule {
  rule_id: string;
  framework: string;
  rule_name: string;
  description: string;
  status: "COMPLIANT" | "VIOLATED";
  severity: "CRITICAL" | "HIGH" | "PASS";
  violations: RuleViolation[];
}

export interface NewComplianceSummary {
  compliance_score: number;
  status: string;
  policies_checked: number;
  compliant_rules: number;
  violated_rules: number;
  protected_assets: number;
  critical_violations: number;
  last_updated: string;
}

export interface NewComplianceDataset {
  catalog_id: string;
  name: string;
  full_name: string;
  owner: string;
}

export interface NewComplianceResponse {
  dataset: NewComplianceDataset;
  summary: NewComplianceSummary;
  rules: NewComplianceRule[];
}
