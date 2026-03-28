import { SettingsIcon, Sparkles, BrainCircuit, Lightbulb, Minimize2 } from "lucide-react";
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
  return (
    <>
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
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  memoryEnabled
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
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                  reasoningEnabled
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

          <div>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={onToggleAIPreferences}
              title="AI Preferences"
            >
              <SettingsIcon size={16} className="text-gray-500" />
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
    </>
  );
};
