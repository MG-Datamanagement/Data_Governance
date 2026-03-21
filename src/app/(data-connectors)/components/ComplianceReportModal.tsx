"use client";

import React, { useState, useEffect } from "react";
import { dashboardApiServices } from "@/services/dashboardApiServices";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const CompliantRule: React.FC<{ rule: NewComplianceRule }> = ({ rule }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="border-l-4 border-l-green-500 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900">{rule.rule_name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                   <span className="inline-block text-[10px] font-bold tracking-wide text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
                       {rule.framework}
                   </span>
                   <span className="inline-block text-[10px] font-bold tracking-wide text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                       {rule.status}
                   </span>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-7">{rule.description}</p>
        </div>
    </div>
);

const ViolationRule: React.FC<{ rule: NewComplianceRule; onRemediate: (ruleId: string, text: string) => Promise<void> }> = ({ rule, onRemediate }) => {
    const isDescriptionRule = rule.description.toLowerCase().includes("description");
    const [remediatingIndex, setRemediatingIndex] = useState<number | null>(null);
    const [inputText, setInputText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApply = async (ruleId: string, text: string) => {
        setIsSubmitting(true);
        await onRemediate(ruleId, text);
        setIsSubmitting(false);
        setRemediatingIndex(null);
    };

    return (
        <div className="border border-red-200 rounded-xl overflow-hidden">
            {/* Action banner */}
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 border-b border-red-100">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs font-medium text-red-600">Action required — this violation needs your attention</span>
            </div>

            <div className="border-l-4 border-l-red-400 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-sm font-semibold text-gray-900">{rule.rule_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="inline-block text-[10px] font-bold tracking-wide text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
                            {rule.framework}
                        </span>
                        <span className="inline-block text-[10px] font-bold tracking-wide text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                            {rule.status}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">{rule.description}</p>

                {/* Violation details */}
                {rule.violations && rule.violations.length > 0 && (
                    <div className="mt-4 ml-7 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Violation Instances ({rule.violations.length})</span>
                        </div>
                        {rule.violations.map((vd, i) => (
                            <div key={i} className="p-4 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span className="text-xs font-medium text-gray-800">{vd.dataset}</span>
                                    </div>
                                    <span className={`text-xs font-semibold uppercase ${rule.severity === 'CRITICAL' ? 'text-red-600' : 'text-orange-500'}`}>{rule.severity}</span>
                                </div>
                                
                                <div className="text-[10px] text-gray-500 leading-relaxed mt-1 mb-3 flex items-center gap-4">
                                    <span><strong className="text-gray-700">Assignee:</strong> {vd.assignee}</span>
                                    <span><strong className="text-gray-700">Due:</strong> {vd.due_date}</span>
                                </div>
                                
                                <div className="flex justify-end mt-2">
                                    {remediatingIndex === i ? (
                                        <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Add missing description for this catalog:</p>
                                            <textarea
                                                className="w-full text-xs border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
                                                rows={2}
                                                placeholder="Enter description..."
                                                value={inputText}
                                                onChange={e => setInputText(e.target.value)}
                                                autoFocus
                                                disabled={isSubmitting}
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setRemediatingIndex(null)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                                                    Cancel
                                                </button>
                                                <button disabled={!inputText || isSubmitting} onClick={() => handleApply(rule.rule_id, inputText)} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50">
                                                    {isSubmitting && (
                                                        <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    )}
                                                    {isSubmitting ? "Applying..." : "Apply"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (isDescriptionRule) {
                                                    setRemediatingIndex(i);
                                                    setInputText("");
                                                } else {
                                                    // window.open(vd.action_url, '_blank');
                                                }
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Remediate Issue
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface ComplianceReportModalProps {
    datasetName?: string;
    onClose: () => void;
    // We allow any so it's backwards-compatible if the API returns old/new formats
    complianceData?: NewComplianceResponse | any;
    refetchCatalogDetails: () => void;
}

const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
    datasetName,
    onClose,
    complianceData,
    refetchCatalogDetails
}) => {
    // Local state for mock remediation
    const [localRules, setLocalRules] = useState<NewComplianceRule[]>([]);
    const [localSummary, setLocalSummary] = useState<NewComplianceSummary | null>(null);

    useEffect(() => {
        if (complianceData) {
            setLocalRules(complianceData.rules || []);
            setLocalSummary(complianceData.summary || null);
        }
    }, [complianceData]);

    const [isRemediating, setIsRemediating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleRemediate = async (ruleId: string, text: string) => {
        if (!complianceData?.dataset?.catalog_id) return;
        
        setIsRemediating(true);
        try {
            const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));
            const apiPromise = dashboardApiServices.generateDescriptions(complianceData.dataset.catalog_id);
            
            const [res] = await Promise.all([apiPromise, delayPromise]);
            
            setSuccessMsg(res.message || "Successfully remediated!");
            // setTimeout(() => setSuccessMsg(null), 5000);

            setLocalRules(prev => prev.map(r => {
                if (r.rule_id === ruleId) {
                    return {
                        ...r,
                        status: "COMPLIANT",
                        severity: "PASS",
                        violations: []
                    } as NewComplianceRule;
                }
                return r;
            }));

            setLocalSummary(prev => {
                if (!prev) return prev;
                const isCritical = localRules.find(r => r.rule_id === ruleId)?.severity === "CRITICAL";
                
                return {
                    ...prev,
                    violated_rules: Math.max(0, prev.violated_rules - 1),
                    compliant_rules: prev.compliant_rules + 1,
                    critical_violations: isCritical ? Math.max(0, prev.critical_violations - 1) : prev.critical_violations,
                    compliance_score: Math.min(100, prev.compliance_score + (100 / prev.policies_checked))
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
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Panel */}
            <div
                className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Policy Enforcement &amp; Audit</h2>
                            <p className="text-sm text-gray-400 mt-0.5">
                                Automated compliance check for{" "}
                                <strong className="text-gray-700">{finalDatasetName}</strong>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-4">
                        {/* <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View History
                        </button> */}
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
                    {/* Score cards */}
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
                            <p className="text-3xl font-extrabold text-gray-900 mb-2">
                                {scorePercent?.toFixed(0)}/100
                            </p>
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                                    style={{ width: `${Math.min(100, scorePercent)}%` }}
                                />
                            </div>
                            {localSummary?.critical_violations !== undefined && localSummary.critical_violations > 0 && (
                                <p className="text-xs font-medium text-orange-500">
                                    {localSummary.critical_violations} Critical Violation{localSummary.critical_violations > 1 ? 's' : ''} Detected
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
                            <p className="text-3xl font-extrabold text-gray-900 mb-1">{localSummary?.policies_checked ?? 0}</p>
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
                            <p className="text-3xl font-extrabold text-gray-900 mb-1">{localSummary?.protected_assets ?? 0}</p>
                            <p className="text-xs text-gray-400">Columns encrypted or masked</p>
                        </div>
                    </div>

                    {/* Audit results */}
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
