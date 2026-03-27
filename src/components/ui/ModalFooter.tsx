import React from "react";

export interface ModalFooterProps {
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  extraButtons?: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ onPrev, onNext, nextLabel = "Next", nextDisabled, extraButtons }) => (
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
