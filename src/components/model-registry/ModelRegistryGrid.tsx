"use client";

import { ModelListItem } from "@/types";
import { BrainCircuit, Users, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { getTagColor, getTagTextColor } from "@/lib/utils";

interface ModelRegistryGridProps {
  models: ModelListItem[];
  onModelClick?: () => void;
}

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  Approved: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  "Pending Review": { bg: "bg-yellow-100", text: "text-yellow-700", icon: AlertCircle },
  Deprecated: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};



export function ModelRegistryGrid({ models, onModelClick }: ModelRegistryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model) => {
        const statusStyle = statusConfig[model.status];
        const StatusIcon = statusStyle.icon;

        return (
          <div
            key={model.id}
            onClick={onModelClick}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
          >
            {/* Header: Title, Version, Status */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">
                    {model.name}
                  </h3>
                  <div className="mt-1.5 flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                      {model.version}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} shrink-0`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {model.status}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">
              {model.description || "No description provided."}
            </p>

            {/* Spacer to push metadata & tags to bottom */}
            <div className="flex-grow"></div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mb-4 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
              <span>{model.source}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{model.task}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {model.owner}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {model.lastUpdated}
              </span>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap">
              {model.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
                  style={{ 
                    backgroundColor: getTagColor(tag.name),
                    color: getTagTextColor(tag.name)
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
