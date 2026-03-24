"use client";

import { ModelListItem } from "@/types";
import { BrainCircuit, Edit2, Trash2 } from "lucide-react";

interface ModelRegistryTableProps {
  models: ModelListItem[];
  onModelClick?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  Approved: { bg: "bg-green-100", text: "text-green-700", icon: "✓" },
  "Pending Review": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "◎" },
  Deprecated: { bg: "bg-red-100", text: "text-red-700", icon: "✕" },
};

const tagColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

export function ModelRegistryTable({ models, onModelClick }: ModelRegistryTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Model Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Version
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Owner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {models.map((model) => {
            const statusStyle = statusColors[model.status];
            return (
              <tr
                key={model.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={onModelClick}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {model.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.name}
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              tagColorMap[tag.color]
                            }`}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {model.tags.length > 2 && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            +{model.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{model.version}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{model.source}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{model.task}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg}`}>
                    <span className={statusStyle.text}>{statusStyle.icon} {model.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{model.owner}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{model.lastUpdated}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onModelClick?.();
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit model"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete model"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
