/**
 * compliance.mock.ts
 * Mock data for the Compliance module.
 * Extracted from lib/mockData.ts.
 */

import type {
  ComplianceFramework,
  ComplianceIssue,
  ComplianceTrend,
} from "@/types/compliance.types";

export const MOCK_COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  { id: "gdpr", name: "GDPR", score: 96, policiesTotal: 24, policiesComplete: 23, status: "excellent", lastUpdated: "2 hours ago", items: [{ label: "Data mapping complete", completed: true }, { label: "DPA conducted", completed: true }, { label: "more", completed: false, count: 2 }] },
  { id: "soc2", name: "SOC 2", score: 98, policiesTotal: 32, policiesComplete: 31, status: "excellent", lastUpdated: "1 hour ago", items: [{ label: "Access control", completed: true }, { label: "Encryption at rest", completed: true }, { label: "more", completed: false, count: 2 }] },
  { id: "hipaa", name: "HIPAA", score: 79, policiesTotal: 19, policiesComplete: 15, status: "warning", lastUpdated: "3 hours ago", items: [{ label: "Review data classification policies for healthcare data", completed: false }, { label: "4 datasets need proper PHI tagging", completed: false }] },
  { id: "dpdpa", name: "DPDPA", score: 62, policiesTotal: 20, policiesComplete: 12, status: "warning", lastUpdated: "3 hours ago", items: [] },
  { id: "euaiact", name: "EU AI Act", score: 45, policiesTotal: 20, policiesComplete: 2, status: "critical", lastUpdated: "5 hours ago", items: [] },
  { id: "internal", name: "Internal", score: 92, policiesTotal: 20, policiesComplete: 18, status: "excellent", lastUpdated: "1 hours ago", items: [] },
];

export const MOCK_COMPLIANCE_ISSUES: ComplianceIssue[] = [
  { id: "1", issue: "Missing data classification for PHI fields", framework: "HIPAA", severity: "HIGH", dataset: "patient_records", assignee: "Sarah Chen", dueDate: "Feb 15, 2026" },
  { id: "2", issue: "Consent records incomplete for EU users", framework: "GDPR", severity: "HIGH", dataset: "user_preferences", assignee: "Mike Johnson", dueDate: "Feb 18, 2026" },
  { id: "3", issue: "Access logs retention policy not configured", framework: "SOC 2", severity: "MEDIUM", dataset: "system_logs", assignee: "Emma Wilson", dueDate: "Feb 22, 2026" },
  { id: "4", issue: "Encryption at rest not enabled", framework: "HIPAA", severity: "HIGH", dataset: "medical_images", assignee: "Alex Kumar", dueDate: "Feb 14, 2026" },
  { id: "5", issue: "Data minimization review needed", framework: "GDPR", severity: "MEDIUM", dataset: "customer_analytics", assignee: "Lisa Park", dueDate: "Feb 25, 2026" },
  { id: "6", issue: "Audit trail gaps detected", framework: "SOC 2", severity: "LOW", dataset: "application_events", assignee: "Tom Davis", dueDate: "Mar 1, 2026" },
];

export const MOCK_COMPLIANCE_TRENDS: ComplianceTrend[] = [
  { month: "Aug", overall: 82, gdpr: 89, soc2: 85, hipaa: 72 },
  { month: "Sep", overall: 84, gdpr: 91, soc2: 87, hipaa: 74 },
  { month: "Oct", overall: 86, gdpr: 93, soc2: 90, hipaa: 75 },
  { month: "Nov", overall: 88, gdpr: 94, soc2: 92, hipaa: 76 },
  { month: "Dec", overall: 89, gdpr: 95, soc2: 94, hipaa: 77 },
  { month: "Jan", overall: 91, gdpr: 96, soc2: 98, hipaa: 79 },
];
