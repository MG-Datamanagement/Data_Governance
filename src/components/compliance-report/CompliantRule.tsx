"use client";

import React from "react";
import type { NewComplianceRule } from "./compliance.types";

export const CompliantRule: React.FC<{ rule: NewComplianceRule }> = ({ rule }) => (
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
          <span className="inline-block text-[10px] font-bold tracking-wide text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">{rule.framework}</span>
          <span className="inline-block text-[10px] font-bold tracking-wide text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">{rule.status}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 ml-7">{rule.description}</p>
    </div>
  </div>
);
