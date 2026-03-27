"use client";

import React from "react";

const STEPS = ["Choose Data Source", "Configure Connection", "Sync Schedule", "Finish up"];

export const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
    {STEPS.map((label, idx) => {
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
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? "bg-indigo-500" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export const ModalFooter: React.FC<{
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  extraButtons?: React.ReactNode;
}> = ({ onPrev, onNext, nextLabel = "Next", nextDisabled, extraButtons }) => (
  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
    <button
      onClick={onPrev}
      disabled={!onPrev}
      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      Previous
    </button>
    <div className="flex items-center gap-2">
      {extraButtons}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        {nextLabel}
      </button>
    </div>
  </div>
);
