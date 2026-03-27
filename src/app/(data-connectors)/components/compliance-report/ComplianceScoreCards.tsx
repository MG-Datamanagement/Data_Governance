"use client";

import React from "react";
import type { NewComplianceSummary } from "./compliance.types";

interface ComplianceScoreCardsProps {
  summary: NewComplianceSummary | null;
  scorePercent: number;
}

export const ComplianceScoreCards: React.FC<ComplianceScoreCardsProps> = ({ summary, scorePercent }) => (
  <div className="grid grid-cols-3 gap-3">
    {/* Compliance Score */}
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-gray-400 font-medium">Compliance Score</p>
        <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-2">{scorePercent?.toFixed(0)}/100</p>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
          style={{ width: `${Math.min(100, scorePercent)}%` }}
        />
      </div>
      {summary?.critical_violations !== undefined && summary.critical_violations > 0 && (
        <p className="text-xs font-medium text-orange-500">
          {summary.critical_violations} Critical Violation{summary.critical_violations > 1 ? "s" : ""} Detected
        </p>
      )}
    </div>

    {/* Policies Checked */}
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-gray-400 font-medium">Policies Checked</p>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">{summary?.policies_checked ?? 0}</p>
      <p className="text-xs text-gray-400">Against &ldquo;Enterprise Data Policy&rdquo;</p>
    </div>

    {/* Protected Assets */}
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-gray-400 font-medium">Protected Assets</p>
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 mb-1">{summary?.protected_assets ?? 0}</p>
      <p className="text-xs text-gray-400">Columns encrypted or masked</p>
    </div>
  </div>
);
