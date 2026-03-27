"use client";

/**
 * ComplianceReportModal.tsx — Orchestrator
 *
 * Reduced from 426 lines to ~95 lines by extracting all sub-components and types
 * into the compliance-report/ sub-directory.
 *
 * Sub-components:
 *  - compliance-report/compliance.types.ts  — shared TypeScript interfaces
 *  - compliance-report/CompliantRule.tsx    — passing rule card (green)
 *  - compliance-report/ViolationRule.tsx    — failing rule card with inline remediation
 *  - compliance-report/ComplianceScoreCards.tsx — 3-KPI metrics grid
 */

import React, { useState, useEffect } from "react";
import { dashboardApiServices } from "@/services/dashboardApiServices";
import type { NewComplianceRule, NewComplianceSummary, NewComplianceResponse } from "./compliance-report/compliance.types";
import { CompliantRule } from "./compliance-report/CompliantRule";
import { ViolationRule } from "./compliance-report/ViolationRule";
import { ComplianceScoreCards } from "./compliance-report/ComplianceScoreCards";

interface ComplianceReportModalProps {
  datasetName?: string;
  onClose: () => void;
  complianceData?: NewComplianceResponse | any;
  refetchCatalogDetails: () => void;
}

const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  datasetName, onClose, complianceData, refetchCatalogDetails,
}) => {
  const [localRules, setLocalRules] = useState<NewComplianceRule[]>([]);
  const [localSummary, setLocalSummary] = useState<NewComplianceSummary | null>(null);
  const [isRemediating, setIsRemediating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (complianceData) {
      setLocalRules(complianceData.rules || []);
      setLocalSummary(complianceData.summary || null);
    }
  }, [complianceData]);

  const handleRemediate = async (ruleId: string, text: string) => {
    if (!complianceData?.dataset?.catalog_id) return;
    setIsRemediating(true);
    try {
      const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));
      const apiPromise = dashboardApiServices.generateDescriptions(complianceData.dataset.catalog_id);
      const [res] = await Promise.all([apiPromise, delayPromise]);
      setSuccessMsg((res as any).message || "Successfully remediated!");
      setLocalRules(prev => prev.map(r =>
        r.rule_id === ruleId ? { ...r, status: "COMPLIANT", severity: "PASS", violations: [] } as NewComplianceRule : r
      ));
      setLocalSummary(prev => {
        if (!prev) return prev;
        const isCritical = localRules.find(r => r.rule_id === ruleId)?.severity === "CRITICAL";
        return {
          ...prev,
          violated_rules: Math.max(0, prev.violated_rules - 1),
          compliant_rules: prev.compliant_rules + 1,
          critical_violations: isCritical ? Math.max(0, prev.critical_violations - 1) : prev.critical_violations,
          compliance_score: Math.min(100, prev.compliance_score + (100 / prev.policies_checked)),
        };
      });
      refetchCatalogDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRemediating(false);
    }
  };

  const dataset = complianceData?.dataset;
  const finalDatasetName = dataset?.name || datasetName || "Unknown Dataset";
  const scorePercent = localSummary?.compliance_score ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Policy Enforcement &amp; Audit</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Automated compliance check for <strong className="text-gray-700">{finalDatasetName}</strong>
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-run Check
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Remediate Violations
            </button>
          </div>

          {successMsg && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800">Remediation Successful</p>
                  <p className="text-xs text-green-600">{successMsg}</p>
                </div>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-green-800 hover:bg-green-100 p-1 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <ComplianceScoreCards summary={localSummary} scorePercent={scorePercent} />

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Automated Audit Results</h3>
            <div className="space-y-4">
              {localRules.map((rule: NewComplianceRule) =>
                rule.status === "COMPLIANT" ? (
                  <CompliantRule key={rule.rule_id} rule={rule} />
                ) : (
                  <ViolationRule key={rule.rule_id} rule={rule} onRemediate={handleRemediate} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReportModal;

// Re-export types for backward compatibility with any consumers importing them from this file
export type { RuleViolation, NewComplianceRule, NewComplianceSummary, NewComplianceDataset, NewComplianceResponse } from "./compliance-report/compliance.types";
