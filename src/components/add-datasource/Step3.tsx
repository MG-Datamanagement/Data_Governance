"use client";

import React from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

type Frequency = "Hourly" | "Daily" | "Weekly";

export interface ScheduleConfig {
  enabled: boolean;
  frequency: Frequency;
  hour: string;
  minute: string;
  timezone: string;
}

const TIMEZONES = [
  "Asia/Calcutta", "Asia/Kolkata", "UTC",
  "America/New_York", "America/Los_Angeles",
  "Europe/London", "Europe/Paris",
  "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney",
];

interface Step3Props {
  schedule: ScheduleConfig;
  onChange: (k: string, v: string | boolean) => void;
}

export const Step3: React.FC<Step3Props> = ({ schedule, onChange }) => {
  const summary =
    schedule.frequency === "Hourly"
      ? "Runs every hour"
      : schedule.frequency === "Daily"
        ? `Runs daily at ${schedule.hour}:${schedule.minute}`
        : `Runs weekly at ${schedule.hour}:${schedule.minute}`;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <h2 className="text-base font-bold text-gray-900 mb-1">Configure an Ingestion Schedule</h2>
      <p className="text-xs text-gray-400 mb-5">Set up how often you want to sync metadata from this source.</p>

      <label className="flex items-center gap-3 cursor-pointer mb-5">
        <button
          onClick={() => onChange("enabled", !schedule.enabled)}
          className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${schedule.enabled ? "bg-indigo-600" : "bg-gray-200"}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${schedule.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm font-medium text-gray-700">Run on a schedule (Recommended)</span>
      </label>

      {schedule.enabled && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-red-500 mb-2">* Schedule</p>
            <div className="flex gap-2 mb-3">
              {(["Hourly", "Daily", "Weekly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onChange("frequency", f)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${schedule.frequency === f
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  {f === "Hourly" && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  {(f === "Daily" || f === "Weekly") && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  {f}
                </button>
              ))}
            </div>

            {schedule.frequency !== "Hourly" && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Run at</span>
                <Input 
                  type="text" 
                  value={schedule.hour}
                  onChange={(val) => onChange("hour", val.replace(/\D/g, '').slice(0, 2))}
                  onBlur={() => onChange("hour", schedule.hour.padStart(2, "0"))}
                  maxLength={2}
                  className="w-14 text-center"
                />
                <span className="text-gray-400">:</span>
                <Input 
                  type="text" 
                  value={schedule.minute}
                  onChange={(val) => onChange("minute", val.replace(/\D/g, '').slice(0, 2))}
                  onBlur={() => onChange("minute", schedule.minute.padStart(2, "0"))}
                  maxLength={2}
                  className="w-14 text-center"
                />
                <span className="text-sm text-gray-400">
                  {schedule.frequency === "Daily" ? "every day" : "every week"}
                </span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-indigo-600 font-medium">{summary}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-red-500 mb-1.5">* Timezone</p>
            <Select 
              value={schedule.timezone} 
              onChange={(val) => onChange("timezone", val)}
              className="bg-white"
              options={TIMEZONES.map(tz => ({ value: tz, label: tz }))}
            />
          </div>
        </div>
      )}
    </div>
  );
};
