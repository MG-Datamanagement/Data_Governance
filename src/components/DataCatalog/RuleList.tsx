import React from "react";
import Link from "next/link";
import { AlertTriangle, Shield, Clock, CheckCircle, XCircle, Eye } from "lucide-react";

export interface LatestResult {
  status: 'passed' | 'failed' | 'warning';
  score: number;
  started_at: string; // ISO date string
}

export interface Rule {
  id: number;
  name: string;
  description: string;
  rule_type: 'range_check' | 'null_check' | 'unique_check' | string;
  severity: 'low' | 'medium' | 'high';
  is_blocking: boolean;
  last_check_at: string;
  latest_result: LatestResult;
}

export interface TableRules {
  table_id: number;
  table_name: string;
  rules: Rule[];
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "bg-red-100 text-red-800 border border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    default:
      return "bg-green-100 text-green-800 border border-green-200";
  }
};

export const RuleList: React.FC<{ table: TableRules }> = ({ table }) => {
  if (!table?.rules?.length) {
    return (
      <div className="p-10 text-center text-gray-500 bg-white rounded-lg shadow">
        No rules found for <strong>{table.table_name?.toUpperCase()}</strong> Table.
      </div>
    );
  }

  return (
    <div className="rounded-md shadow-sm divide-y divide-gray-200 min-h-80 max-h-128 overflow-auto">
      {table.rules.map((rule) => {
        const failed = rule.latest_result.status === "failed";
        const statusColor = failed
          ? "bg-red-50 text-red-700"
          : "bg-green-50 text-green-700";

        return (
          <div
            key={rule.id}
            className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-4"
          >
            {/* Left content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center md:justify-between gap-3 mb-2">
                <span className="text-base font-semibold text-blue-600">
                  {rule.name}
                </span>

                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {rule.rule_type.replace("_", " ")}
                  </div>

                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                      rule.severity
                    )}`}
                  >
                    {rule.severity}
                  </div>

                  {rule.is_blocking && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 border border-gray-300">
                      <Shield className="h-3 w-3" />
                      Blocking
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-2 text-left">
                {rule.description || "No description provided."}
              </p>

              {/* Meta info */}
              <div className="flex flex-wrap items-center md:justify-between gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(rule.last_check_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    {failed ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                    >
                      {rule.latest_result.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Score: {(rule.latest_result.score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Right buttons */}
            {/* <div className="flex items-center gap-2">
              <Link
                href={`/data-quality/rules/${rule.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </div> */}
          </div>
        );
      })}
    </div>
  );
};