"use client";

import React, { useState } from "react";
import type { NewComplianceRule } from "./compliance.types";

interface ViolationRuleProps {
  rule: NewComplianceRule;
  onRemediate: (ruleId: string, text: string) => Promise<void>;
}

export const ViolationRule: React.FC<ViolationRuleProps> = ({ rule, onRemediate }) => {
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
            <span className="inline-block text-[10px] font-bold tracking-wide text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">{rule.framework}</span>
            <span className="inline-block text-[10px] font-bold tracking-wide text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">{rule.status}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-7">{rule.description}</p>

        {rule.violations && rule.violations.length > 0 && (
          <div className="mt-4 ml-7 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
                Violation Instances ({rule.violations.length})
              </span>
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
                  <span className={`text-xs font-semibold uppercase ${rule.severity === "CRITICAL" ? "text-red-600" : "text-orange-500"}`}>
                    {rule.severity}
                  </span>
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
                        <button
                          disabled={!inputText || isSubmitting}
                          onClick={() => handleApply(rule.rule_id, inputText)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSubmitting && (
                            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
