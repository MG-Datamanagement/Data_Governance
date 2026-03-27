import React from "react";

export interface StepperProps {
  steps: string[];
  current: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, current }) => (
  <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
    {steps.map((label, idx) => {
      const step = idx + 1;
      const done = step < current;
      const active = step === current;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done
                ? "bg-indigo-600 border-indigo-600 text-white"
                : active
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-gray-200 text-gray-400 bg-white"
                }`}
            >
              {done ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs font-medium text-center leading-tight ${active ? "text-indigo-600" : done ? "text-gray-500" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? "bg-indigo-500" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
