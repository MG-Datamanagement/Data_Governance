"use client";

import React from "react";
import ConnectorIcon from "@/app/(data-connectors)/components/connectors/ConnectorIcon";
import { ConnectorDefinition } from "@/lib/connectors";
import { ApiOwner } from "@/services/dashboardApiServices";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import type { DataSourceConfig } from "./Step2";
import type { ScheduleConfig } from "./Step3";
import { Input } from "@/components/ui/Input";

export interface FinishConfig {
  name: string;
  piiEnabled: boolean;
  piiApproval: boolean;
  failureEmail: string;
  owner_id: string;
}

interface Step4Props {
  connector: ConnectorDefinition;
  config: DataSourceConfig;
  schedule: ScheduleConfig;
  finish: FinishConfig;
  owners: ApiOwner[];
  onChange: (k: string, v: string | boolean) => void;
}

export const Step4: React.FC<Step4Props> = ({ connector, config, schedule, finish, owners, onChange }) => {
  const scheduleStr = `Every ${schedule.frequency.toLowerCase()} at ${schedule.hour}:${schedule.minute}`;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Configuration Summary */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">Configuration Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Source Type</p>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${connector.iconBg} flex items-center justify-center`}>
                <ConnectorIcon icon={connector.icon} className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-800">{connector.name}</span>
            </div>
          </div>
          {connector.id !== 'athena' && connector.id !== 'redshift' && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Connection URI</p>
              <span className="text-sm text-gray-500">{config.uri || "Not configured"}</span>
            </div>
          )}
          {connector.id === 'redshift' && (
            <>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Host & Port</p>
                <span className="text-sm text-gray-500">{config.host_port || "Not configured"}</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Database</p>
                <span className="text-sm text-gray-500">{config.database || "Not configured"}</span>
              </div>
            </>
          )}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Schedule</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {scheduleStr}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Timezone</p>
            <span className="text-sm text-gray-600">{schedule.timezone}</span>
          </div>
        </div>
      </div>

      {/* Source Name */}
      <div>
        <label className="block text-sm font-semibold text-red-500 mb-0.5">* Name</label>
        <p className="text-xs text-gray-400 mb-1.5">Give this data source a name</p>
        <Input type="text" value={finish.name} onChange={(e) => onChange("name", e.target.value)} placeholder={connector.defaultName}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
      </div>

      {/* Owner */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">* Owner</label>
        <p className="text-xs text-gray-400 mb-1.5">Select the primary owner for this data source</p>
        <Select 
          value={finish.owner_id} 
          onChange={(e) => onChange("owner_id", e.target.value)}
          className="w-full bg-white text-gray-700"
          options={[
            { value: "", label: "Select an owner" },
            ...owners.map((owner) => ({
              value: owner.id,
              label: owner.name
            }))
          ]}
        />
      </div>

      {/* PII Detection */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-sm font-semibold text-gray-800">PII Detection Settings</p>
        </div>
        <p className="text-xs text-gray-400 mb-3">Control how sensitive data is detected and handled during ingestion.</p>
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
          {[
            { key: "piiEnabled", label: "Enable PII detection during ingestion", desc: "Scan columns for personally identifiable information and apply classification tags automatically.", value: finish.piiEnabled },
            { key: "piiApproval", label: "Require approval for PII actions", desc: "Pause ingestion at PII detection steps and wait for a human to review and approve before proceeding.", value: finish.piiApproval },
          ].map((opt) => (
            <label key={opt.key} className="flex items-start gap-3 p-4 cursor-pointer">
              <Checkbox checked={opt.value} onChange={(e) => onChange(opt.key, e.target.checked)} />
              <div>
                <p className="text-sm font-medium text-gray-700">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {finish.piiEnabled && finish.piiApproval && (
          <div className="mt-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-yellow-800">Human-in-the-loop mode</p>
              <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">PII will be detected during ingestion and flagged for your review. The pipeline will pause and wait for your approval before applying tags or policies.</p>
            </div>
          </div>
        )}
      </div>

      {/* Failure Notifications */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Failure Notifications</p>
        </div>
        <p className="text-xs text-gray-400 mb-2">Enter email addresses to notify when an ingestion run fails. Separate multiple emails with commas.</p>
        <Input type="text" value={finish.failureEmail} onChange={(e) => onChange("failureEmail", e.target.value)}
          placeholder="e.g. data-team@company.com, oncall@company.com"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
        <div className="mt-2 flex items-start gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-yellow-700">
            Notifications are sent <strong>only on failures</strong>, not on every successful run. Leave blank to disable failure alerts.
          </p>
        </div>
      </div>
    </div>
  );
};
