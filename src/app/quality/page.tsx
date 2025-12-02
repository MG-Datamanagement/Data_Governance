'use client';

import AttentionTablesDrawer from '@/components/DataQuality/AttentionTablesDrawer';
import ManageRulesDrawer from '@/components/DataQuality/ManageRulesDrawer';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Database,
  Bell,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export interface DataQualityReport {
  total_rules: number;
  passing_rules: number;
  failing_rules: number;
  warning_rules: number;
  overall_quality_score: number;
  rules_without_results: number;
  tables_with_issues: {
    count: number;
    total_active_tables: number;
  };
  critical_unresolved_alerts: number;
  checks_passed_tables: {
    count: number;
    total_active_tables: number;
  };
  timestamp: string;
}

export interface DataQualityDimensions {
  total_rules: number;
  passing_rules: number;
  failing_rules: number;
  warning_rules: number;
  overall_quality_score: number;
  rules_without_results: number;
  dimension_scores: DimensionScore[];
  timestamp: string; // ISO 8601 format
}

export interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  rule_count: number;
}

export interface DataQualityIssuesResponse {
  count: number;
  limit: number;
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  alert_id: number;
  rule_name: string;
  table_name: string;
  alert_type: "QUALITY_FAILURE" | string; // Can extend if there are other alert types
  severity: "critical" | "high" | "medium" | "low" | string;
  message: string;
  created_at: string; // ISO timestamp
  is_resolved: boolean;
  resolved_at: string | null;
}

export interface TopTablesResponse {
  count: number;
  top_tables: TopTable[];
}

export interface TopTable {
  table_id: number;
  table_name: string;
  quality_score: number;
  rules_covered: number;
}

export interface QualityScanActionResponse {
  success: boolean;
  message: string;
  data: QualityScanData;
}

export interface QualityScanData {
  scan_triggered_at: string; // ISO 8601 timestamp
}

export interface QualityRulesResponse {
  count: number;
  rules: QualityRule[];
}

export interface QualityRule {
  id: number;
  name: string;
  severity: "critical" | "high" | "medium" | "low" | string;
  table_name: string;
}

export interface AttentionRequiredTableResponse {
  count: number;
  tables: AttentionTable[];
}

export interface AttentionTable {
  id: number;
  name: string;
  domain_id: number;
}

const mockManageRules:QualityRulesResponse = {
  count: 142,
  rules: [
    {
      id: 1,
      name: "customers - PK Not Null",
      severity: "critical",
      table_name: "customers",
    },
    {
      id: 2,
      name: "customers - PK Uniqueness",
      severity: "critical",
      table_name: "customers",
    },
    {
      id: 3,
      name: "customers - Freshness",
      severity: "medium",
      table_name: "customers",
    },
    {
      id: 4,
      name: "accounts - PK Not Null",
      severity: "critical",
      table_name: "accounts",
    },
    {
      id: 5,
      name: "accounts - PK Uniqueness",
      severity: "critical",
      table_name: "accounts",
    },
    {
      id: 6,
      name: "accounts - Freshness",
      severity: "medium",
      table_name: "accounts",
    },
    {
      id: 7,
      name: "accounts - Amount Positive",
      severity: "high",
      table_name: "accounts",
    },
    {
      id: 8,
      name: "accounts - Accuracy Sum",
      severity: "medium",
      table_name: "accounts",
    },
    {
      id: 9,
      name: "customer_contac - PK Not Null",
      severity: "critical",
      table_name: "customer_contacts",
    },
    {
      id: 10,
      name: "customer_contac - PK Uniqueness",
      severity: "critical",
      table_name: "customer_contacts",
    },
    {
      id: 11,
      name: "customer_contac - Freshness",
      severity: "medium",
      table_name: "customer_contacts",
    },
    {
      id: 12,
      name: "transactions - PK Not Null",
      severity: "critical",
      table_name: "transactions",
    },
    {
      id: 13,
      name: "transactions - PK Uniqueness",
      severity: "critical",
      table_name: "transactions",
    },
    {
      id: 14,
      name: "transactions - Freshness",
      severity: "medium",
      table_name: "transactions",
    },
    {
      id: 15,
      name: "transactions - Amount Positive",
      severity: "high",
      table_name: "transactions",
    },
    {
      id: 16,
      name: "transactions - Accuracy Sum",
      severity: "medium",
      table_name: "transactions",
    },
    {
      id: 17,
      name: "payments - PK Not Null",
      severity: "critical",
      table_name: "payments",
    },
    {
      id: 18,
      name: "payments - PK Uniqueness",
      severity: "critical",
      table_name: "payments",
    },
    {
      id: 19,
      name: "payments - Freshness",
      severity: "medium",
      table_name: "payments",
    },
    {
      id: 20,
      name: "transaction_cat - PK Not Null",
      severity: "critical",
      table_name: "transaction_categories",
    },
    {
      id: 21,
      name: "transaction_cat - PK Uniqueness",
      severity: "critical",
      table_name: "transaction_categories",
    },
    {
      id: 22,
      name: "transaction_ana - PK Not Null",
      severity: "critical",
      table_name: "transaction_analytics",
    },
    {
      id: 23,
      name: "transaction_ana - PK Uniqueness",
      severity: "critical",
      table_name: "transaction_analytics",
    },
    {
      id: 24,
      name: "transaction_ana - Amount Positive",
      severity: "high",
      table_name: "transaction_analytics",
    },
    {
      id: 25,
      name: "transaction_ana - Accuracy Sum",
      severity: "medium",
      table_name: "transaction_analytics",
    },
    {
      id: 26,
      name: "credit_scores - PK Not Null",
      severity: "critical",
      table_name: "credit_scores",
    },
    {
      id: 27,
      name: "credit_scores - PK Uniqueness",
      severity: "critical",
      table_name: "credit_scores",
    },
    {
      id: 28,
      name: "credit_scores - Freshness",
      severity: "medium",
      table_name: "credit_scores",
    },
    {
      id: 29,
      name: "fraud_alerts - PK Not Null",
      severity: "critical",
      table_name: "fraud_alerts",
    },
    {
      id: 30,
      name: "fraud_alerts - PK Uniqueness",
      severity: "critical",
      table_name: "fraud_alerts",
    },
    {
      id: 31,
      name: "risk_scores - PK Not Null",
      severity: "critical",
      table_name: "risk_scores",
    },
    {
      id: 32,
      name: "risk_scores - PK Uniqueness",
      severity: "critical",
      table_name: "risk_scores",
    },
    {
      id: 33,
      name: "risk_scores - Freshness",
      severity: "medium",
      table_name: "risk_scores",
    },
    {
      id: 34,
      name: "loans - PK Not Null",
      severity: "critical",
      table_name: "loans",
    },
    {
      id: 35,
      name: "loans - PK Uniqueness",
      severity: "critical",
      table_name: "loans",
    },
    {
      id: 36,
      name: "loans - Freshness",
      severity: "medium",
      table_name: "loans",
    },
    {
      id: 37,
      name: "loans - Amount Positive",
      severity: "high",
      table_name: "loans",
    },
    {
      id: 38,
      name: "loans - Accuracy Sum",
      severity: "medium",
      table_name: "loans",
    },
    {
      id: 39,
      name: "loan_payments - PK Not Null",
      severity: "critical",
      table_name: "loan_payments",
    },
    {
      id: 40,
      name: "loan_payments - PK Uniqueness",
      severity: "critical",
      table_name: "loan_payments",
    },
    {
      id: 41,
      name: "loan_payments - Freshness",
      severity: "medium",
      table_name: "loan_payments",
    },
    {
      id: 42,
      name: "loan_payments - Amount Positive",
      severity: "high",
      table_name: "loan_payments",
    },
    {
      id: 43,
      name: "loan_payments - Accuracy Sum",
      severity: "medium",
      table_name: "loan_payments",
    },
    {
      id: 44,
      name: "loan_applicatio - PK Not Null",
      severity: "critical",
      table_name: "loan_applications",
    },
    {
      id: 45,
      name: "loan_applicatio - PK Uniqueness",
      severity: "critical",
      table_name: "loan_applications",
    },
    {
      id: 46,
      name: "loan_applicatio - Freshness",
      severity: "medium",
      table_name: "loan_applications",
    },
    {
      id: 47,
      name: "loan_applicatio - Amount Positive",
      severity: "high",
      table_name: "loan_applications",
    },
    {
      id: 48,
      name: "loan_applicatio - Accuracy Sum",
      severity: "medium",
      table_name: "loan_applications",
    },
    {
      id: 49,
      name: "financial_repor - PK Not Null",
      severity: "critical",
      table_name: "financial_reports",
    },
    {
      id: 50,
      name: "financial_repor - PK Uniqueness",
      severity: "critical",
      table_name: "financial_reports",
    },
  ],
};

const mockAttentionTables: AttentionRequiredTableResponse = {
  count: 2,
  tables: [
    {
      id: 1,
      name: "customers",
      domain_id: 1,
    },
    {
      id: 2,
      name: "accounts",
      domain_id: 1,
    },
  ],
};



const API_BASE_URL = 'http://localhost:5000/api/v1';

// Mock quality data since backend doesn't have quality endpoints yet
const mockQualityData = {
  overallScore: 85,
  trend: 2,
  totalTables: 247,
  tablesWithIssues: 23,
  criticalIssues: 3,
  warningIssues: 20,
  passedChecks: 1247,
  failedChecks: 89,
  lastScanTime: '2024-01-16T08:30:00Z',
  
  qualityBreakdown: [
    { name: 'Completeness', score: 92, trend: 1 },
    { name: 'Accuracy', score: 88, trend: -2 },
    { name: 'Consistency', score: 85, trend: 3 },
    { name: 'Validity', score: 89, trend: 0 },
    { name: 'Uniqueness', score: 76, trend: -1 },
    { name: 'Timeliness', score: 91, trend: 2 }
  ],

  recentIssues: [
    {
      id: 1,
      table: { name: 'sales_transactions', schema: 'sales', id: 3 },
      issue: 'High null percentage in amount column (15%)',
      severity: 'warning',
      detectedAt: '2024-01-16T07:45:00Z',
      rule: 'Null Value Check'
    },
    {
      id: 2,
      table: { name: 'user_profiles', schema: 'auth', id: 5 },
      issue: 'Duplicate records detected (142 duplicates)',
      severity: 'critical',
      detectedAt: '2024-01-16T06:20:00Z',
      rule: 'Uniqueness Check'
    },
    {
      id: 3,
      table: { name: 'product_inventory', schema: 'inventory', id: 7 },
      issue: 'Data freshness exceeds threshold (3 days old)',
      severity: 'warning',
      detectedAt: '2024-01-16T05:15:00Z',
      rule: 'Timeliness Check'
    },
    {
      id: 4,
      table: { name: 'customer_orders', schema: 'sales', id: 9 },
      issue: 'Invalid email formats found (23 records)',
      severity: 'critical',
      detectedAt: '2024-01-15T22:30:00Z',
      rule: 'Format Validation'
    }
  ],

  topPerformingTables: [
    { id: 1, name: 'user_accounts', schema: 'auth', score: 98, trend: 1 },
    { id: 2, name: 'product_catalog', schema: 'inventory', score: 96, trend: 0 },
    { id: 4, name: 'order_items', schema: 'sales', score: 95, trend: 2 },
    { id: 6, name: 'payment_methods', schema: 'billing', score: 94, trend: -1 }
  ],

  qualityTrend: [
    { date: '2024-01-10', score: 82 },
    { date: '2024-01-11', score: 83 },
    { date: '2024-01-12', score: 81 },
    { date: '2024-01-13', score: 84 },
    { date: '2024-01-14', score: 85 },
    { date: '2024-01-15', score: 83 },
    { date: '2024-01-16', score: 85 }
  ]
};

async function fetchDataQualityReport():Promise<DataQualityReport> {
  const response = await fetch(`${API_BASE_URL}/quality/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data quality');
  return response.json();
}

async function fetchDataQualityDimensions():Promise<DataQualityDimensions> {
  const response = await fetch(`${API_BASE_URL}/quality/dashboard_v2`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data quality dimensions');
  return response.json();
}

async function fetchDataQualityIssues():Promise<DataQualityIssuesResponse> {
  const response = await fetch(`${API_BASE_URL}/quality/recent_issues?limit=10`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data quality recent issues');
  return response.json();
}

async function fetchTopTables():Promise<TopTablesResponse> {
  const response = await fetch(`${API_BASE_URL}/quality/top_tables_by_quality?limit=5`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch quality top performing tables');
  return response.json();
}

async function runQualityScanAction():Promise<QualityScanActionResponse> {
  const response = await fetch(`${API_BASE_URL}/quality/action/run_full_scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to run a quality scan action!');
  return response.json();
}

async function fetchDataQualityRules():Promise<QualityRulesResponse> {
  const response = await fetch(`${API_BASE_URL}/quality/action/manage_rules?skip=0&limit=50`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data quality rules!');
  return response.json();
}

async function fetchAttentionRequiredTables():Promise<AttentionRequiredTableResponse> {
  const response = await fetch(`${API_BASE_URL}/quality/action/tables_needing_action`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch attention required tables!');
  return response.json();
}

async function generateReportAction():Promise<any> {
  const response = await fetch(`${API_BASE_URL}/quality/action/generate_issue_report`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to generate report!');
  }

  // Read the response as a blob (CSV file)
  const blob = await response.blob();

  // Create a download link for the file
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'issue_report.csv';
  a.click();

  // Clean up
  window.URL.revokeObjectURL(url);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBackground(score: number) {
  if (score >= 90) return 'bg-green-100';
  if (score >= 70) return 'bg-yellow-100';
  return 'bg-red-100';
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-100';
    case 'warning': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export default function QualityPage() {

  const [isRulesDrawerOpen, setIsRulesDrawerOpen] = useState<boolean>(false);
  const [isAttentionDrawerOpen, setIsAttentionDrawerOpen] = useState<boolean>(false);

  const { data: dataQualityReport, isLoading: isDataQualityReport } = useQuery({
    queryKey: ['dataQualityReport'],
    queryFn: fetchDataQualityReport,
  });

  const { data: dataQualityDimensions, isLoading: isDataQualityDimensionsLoading } = useQuery({
    queryKey: ['dataQualityDimensions'],
    queryFn: fetchDataQualityDimensions,
  });

  const { data: dataQualityIssues, isLoading: isDataQualityIssuesLoading } = useQuery({
    queryKey: ['dataQualityIssues'],
    queryFn: fetchDataQualityIssues,
  });

  const { data: topTables, isLoading: isTopTablesLoading } = useQuery({
    queryKey: ['topTables'],
    queryFn: fetchTopTables,
  });

  const runQualityScanActionMutation = useMutation({
    mutationFn: runQualityScanAction,
    onSuccess: (data) => {
      toast.success(data.message)
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to run quality scan action")
    },
  });

  const { data: dataQualityRules, refetch: refetchQualityRules, isFetching: isFetchingDataQualityRules } = useQuery({
    queryKey: ['dataQualityRules'],
    queryFn: fetchDataQualityRules,
    enabled: false
  });

  const { data: attentionRequiredTables, refetch: refetchAttentionRequiredTables, isFetching: isFetchingAttentionRequiredTables } = useQuery({
    queryKey: ['attentionRequiredTables'],
    queryFn: fetchAttentionRequiredTables,
    enabled: false,
  });

  const generateReportActionMutation = useMutation({
    mutationFn: generateReportAction,
    onSuccess: (data) => {
      toast.success("Generated report successfully!")
    },
    onError: (error) => {
      toast.error("Failed to generate report!")
    },
  });

  const handleFetchQualityRules = async () => {
    setIsRulesDrawerOpen(true);
    refetchQualityRules();
  };
 
  const handleFetchAttentionTables = async () => {
    setIsAttentionDrawerOpen(true);
    refetchAttentionRequiredTables();
  };

  if (isDataQualityReport) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!dataQualityReport) return null;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Quality Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Monitor and track data quality across data sources
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last scan: {runQualityScanActionMutation?.data?.data?.scan_triggered_at ? formatDate(runQualityScanActionMutation?.data?.data?.scan_triggered_at) : "-"}
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Bell className="h-4 w-4 mr-2" />
            Set Alerts
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Quality</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-2xl font-bold ${getScoreColor(dataQualityReport.overall_quality_score)}`}>
                  {dataQualityReport.overall_quality_score}%
                </span>
                {/* {dataQualityReport.trend !== 0 && (
                  <div className={`flex items-center text-sm ${
                    dataQualityReport.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dataQualityReport.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(dataQualityReport.trend)}%
                  </div>
                )} */}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getScoreBackground(dataQualityReport.overall_quality_score)}`}>
              <BarChart3 className={`h-6 w-6 ${getScoreColor(dataQualityReport.overall_quality_score)}`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tables with Issues</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {dataQualityReport.tables_with_issues.count}
                </span>
                <span className="text-sm text-gray-500">
                  of {dataQualityReport.tables_with_issues.total_active_tables}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold text-red-600">
                  {dataQualityReport.critical_unresolved_alerts}
                </span>
                <span className="text-sm text-gray-500">
                  active
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Checks Passed</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold text-green-600">
                  {Math.round((dataQualityReport.checks_passed_tables.count / (dataQualityReport.checks_passed_tables.total_active_tables)) * 100)}%
                </span>
                <span className="text-sm text-gray-500">
                  {dataQualityReport.checks_passed_tables.count} passed
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quality Breakdown and Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quality Dimensions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quality Dimensions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dataQualityDimensions?.dimension_scores.map((dimension) => (
                <div key={dimension.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {dimension.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getScoreColor(dimension.score)}`}>
                          {dimension.score}%
                        </span>
                        {/* {dimension.trend !== 0 && (
                          <div className={`flex items-center text-xs ${
                            dimension.trend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dimension.trend > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(dimension.trend)}
                          </div>
                        )} */}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dimension.score >= 90 ? 'bg-green-500' :
                          dimension.score >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${dimension.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
            {/* <Link
              href={"/quality/issues" as any}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link> */}
          </div>
          <div className="divide-y divide-gray-200">
            {dataQualityIssues?.issues.map((issue) => (
              <div key={issue.alert_id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 rounded-full p-1 ${getSeverityColor(issue.severity)}`}>
                    {issue.severity === 'critical' ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link
                        href={`/catalog`}
                        // href={`/catalog/${issue.table_name}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {issue.table_name}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {issue.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Rule: {issue.rule_name}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(issue.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Tables and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Tables */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Tables</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topTables?.top_tables.map((table, index) => (
                <div key={table.table_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full text-xs font-medium text-green-800">
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/catalog/${table.table_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {table.table_name}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">
                      {table.quality_score}%
                    </span>
                    {/* {table.trend !== 0 && (
                      <div className={`flex items-center text-xs ${
                        table.trend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {table.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={() => runQualityScanActionMutation.mutate()}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Run Quality Scan</span>
              </div>
              <span className="text-sm text-gray-400">{runQualityScanActionMutation.isPending ? <Loader2 className='animate-spin w-5 h-5' /> : "→"}</span>
            </button>

            <button
              onClick={handleFetchQualityRules}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Manage Rules</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </button>

            <button
              onClick={handleFetchAttentionTables}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">Tables Needing Attention</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </button>

            <button
              onClick={() => generateReportActionMutation.mutate()}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
              </div>
              <span className="text-sm text-gray-400">{generateReportActionMutation.isPending ? <Loader2 className='animate-spin w-5 h-5' /> :"→"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quality Insights */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Improving</span>
            </div>
            <p className="text-sm text-gray-600">
              Data consistency has improved by 3% this week across all domains.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">Attention Needed</span>
            </div>
            <p className="text-sm text-gray-600">
              Sales domain tables show increasing null values. Consider data validation rules.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Recommendation</span>
            </div>
            <p className="text-sm text-gray-600">
              Enable automated quality monitoring for critical business tables.
            </p>
          </div>
        </div>
      </div>

      <ManageRulesDrawer
        isOpen={isRulesDrawerOpen}
        onClose={() => setIsRulesDrawerOpen(false)}
        rules={dataQualityRules}
        isLoading={isFetchingDataQualityRules}
      />

      <AttentionTablesDrawer
        isOpen={isAttentionDrawerOpen}
        onClose={() => setIsAttentionDrawerOpen(false)}
        tables={attentionRequiredTables}
        isLoading={isFetchingAttentionRequiredTables}
      />
    </div>
  );
}