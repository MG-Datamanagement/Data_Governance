'use client';

import { useQuery } from '@tanstack/react-query';
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
  Bell
} from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = 'http://172.188.2.173:8000/api/v1';

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

async function fetchQualityData() {
  // Since backend doesn't have quality endpoints, return mock data
  return mockQualityData;
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
  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['quality'],
    queryFn: fetchQualityData,
  });

  if (isLoading) {
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

  if (!qualityData) return null;

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
            Last scan: {formatDate(qualityData.lastScanTime)}
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
                <span className={`text-2xl font-bold ${getScoreColor(qualityData.overallScore)}`}>
                  {qualityData.overallScore}%
                </span>
                {qualityData.trend !== 0 && (
                  <div className={`flex items-center text-sm ${
                    qualityData.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {qualityData.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(qualityData.trend)}%
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getScoreBackground(qualityData.overallScore)}`}>
              <BarChart3 className={`h-6 w-6 ${getScoreColor(qualityData.overallScore)}`} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tables with Issues</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-2xl font-bold text-gray-900">
                  {qualityData.tablesWithIssues}
                </span>
                <span className="text-sm text-gray-500">
                  of {qualityData.totalTables}
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
                  {qualityData.criticalIssues}
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
                  {Math.round((qualityData.passedChecks / (qualityData.passedChecks + qualityData.failedChecks)) * 100)}%
                </span>
                <span className="text-sm text-gray-500">
                  {qualityData.passedChecks} passed
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
              {qualityData.qualityBreakdown.map((dimension) => (
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
                        {dimension.trend !== 0 && (
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
                        )}
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
            <Link
              href={"/quality/issues" as any}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {qualityData.recentIssues.map((issue) => (
              <div key={issue.id} className="p-6">
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
                        href={`/catalog/${issue.table.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {issue.table.schema}.{issue.table.name}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {issue.issue}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Rule: {issue.rule}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(issue.detectedAt)}</span>
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
              {qualityData.topPerformingTables.map((table, index) => (
                <div key={table.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full text-xs font-medium text-green-800">
                      {index + 1}
                    </div>
                    <div>
                      <Link
                        href={`/catalog/${table.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {table.schema}.{table.name}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">
                      {table.score}%
                    </span>
                    {table.trend !== 0 && (
                      <div className={`flex items-center text-xs ${
                        table.trend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {table.trend > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                      </div>
                    )}
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
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Run Quality Scan</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </button>

            <Link
              href={"/quality/rules" as any}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Manage Rules</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </Link>

            <Link
              href="/catalog?quality=low"
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">Tables Needing Attention</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </Link>

            <Link
              href={"/quality/reports" as any}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Generate Report</span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </Link>
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
    </div>
  );
}