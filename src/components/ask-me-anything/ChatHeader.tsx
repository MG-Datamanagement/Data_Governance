import { SettingsIcon, Sparkles, BrainCircuit, Lightbulb, Minimize2, Check, Workflow, ScanSearch, Wrench } from "lucide-react";
import React from "react";
import { AIPreferences } from "@/types";

interface ChatHeaderProps {
  memoryEnabled: boolean;
  reasoningEnabled: boolean;
  onToggleMemory: () => void;
  onToggleReasoning: () => void;
  onSettingsClick: () => void;
  onExpandClick: () => void;
  showAIPreferences: boolean;
  aiPreferences: AIPreferences;
  onToggleAIPreferences: () => void;
  onTogglePreference: (
    key: "multiAgentOrchestration" | "deepAnalysis" | "autoRemediation",
  ) => void;
}

// Pill icons — inline SVG matching the reference image
const MultiAgentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" />
  </svg>
);

const DeepAnalysisIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M11 8v6" /><path d="M8 11h6" />
  </svg>
);

const AutoRemediationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  memoryEnabled,
  reasoningEnabled,
  onToggleMemory,
  onToggleReasoning,
  onSettingsClick,
  onExpandClick,
  onToggleAIPreferences,
  onTogglePreference,
  showAIPreferences,
  aiPreferences,
}) => {
  const preferences: {
    key: "multiAgentOrchestration" | "deepAnalysis" | "autoRemediation";
    label: string;
    Icon: React.ReactNode;
    color: string;
    bgColor: string;
  }[] = [
      { key: "multiAgentOrchestration", label: "Multi-Agent Orchestration", Icon: <Workflow size={12} />, color: "text-indigo-600", bgColor: "bg-indigo-50" },
      { key: "deepAnalysis", label: "Deep Analysis", Icon: <ScanSearch size={12} />, color: "text-green-600", bgColor: "bg-green-50" },
      { key: "autoRemediation", label: "Auto-Remediation", Icon: <Wrench size={12} />, color: "text-orange-600", bgColor: "bg-orange-50" },
    ];

  return (
    <>
      {/* ── Top header bar ── */}
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <Sparkles size={18} className="text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            Chat Assistant
          </span>
          <span className="bg-gray-200/50 text-gray-700 px-2 py-0.5 rounded-xl text-[10px] font-medium">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex justify-around items-center p-1 bg-gray-100 rounded-md">
            <div>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all ${memoryEnabled
                    ? "bg-white text-indigo-600"
                    : "text-gray-500 hover:text-gray-950"
                  }`}
                onClick={onToggleMemory}
              >
                <div>
                  <BrainCircuit size={12} />
                </div>
                <span className="text-[10px] font-medium">
                  Memory {memoryEnabled ? "On" : "Off"}
                </span>
              </button>
            </div>
            <div className="text-gray-300/60 mx-1.5">|</div>
            <div>
              <button
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${reasoningEnabled
                    ? "bg-white text-indigo-600"
                    : "text-gray-500 hover:text-gray-950"
                  }`}
                onClick={onToggleReasoning}
              >
                <div>
                  <Lightbulb size={12} />
                </div>
                <span className="text-[10px] font-medium">
                  Reasoning {reasoningEnabled ? "On" : "Off"}
                </span>
              </button>
            </div>
          </div>

          {/* Settings / AI Preferences toggle — active ring when panel is open */}
          <div>
            <button
              className={`p-2 rounded-lg transition-colors ${showAIPreferences
                  ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                  : "hover:bg-gray-100 text-gray-500"
                }`}
              onClick={onToggleAIPreferences}
              title="AI Workflow Preferences"
              aria-pressed={showAIPreferences}
            >
              <SettingsIcon size={16} />
            </button>
          </div>

          <div>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={onExpandClick}
            >
              <Minimize2 size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Workflow Preferences panel (toggled by gear icon) ── */}
      {showAIPreferences && (
        <div className="px-4 py-2.5 border-b border-gray-200 flex flex-col items-center justify-between gap-4 animate-in slide-in-from-top-1 duration-150">
          {/* Left: lightning label + three pill toggles */}
          <div className="flex justify-between items-center gap-3 w-full">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Sparkles size={13} className="text-indigo-500" />
              <span className="text-xs font-medium text-gray-800 whitespace-nowrap">
                AI Workflow Preferences
              </span>
            </div>

            {/* Right: caption text */}
            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
              Enable advanced features (higher token usage)
            </span>
          </div>

          <div className="flex items-center gap-3 w-full">
            {preferences.map(({ key, label, Icon, color, bgColor }) => {
              const active = aiPreferences[key];
              return (
                <button
                  key={key}
                  onClick={() => onTogglePreference(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all select-none ${active
                      ? `${color} ${bgColor}`
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/40"
                    }`}
                  aria-pressed={active}
                  title={label}
                >
                  {Icon}
                  {label}
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </div>

        </div>
      )}
    </>
  );
};
