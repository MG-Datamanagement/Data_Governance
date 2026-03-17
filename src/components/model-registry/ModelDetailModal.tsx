"use client";

import { ModelMetadata } from "@/types";
import { X } from "lucide-react";

interface ModelDetailModalProps {
  model: ModelMetadata;
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Passed: { bg: "bg-green-100", text: "text-green-700" },
  Failed: { bg: "bg-red-100", text: "text-red-700" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const riskTierColors: Record<string, string> = {
  "Low Risk": "bg-green-100 text-green-700",
  "Medium Risk": "bg-yellow-100 text-yellow-700",
  "High Risk": "bg-red-100 text-red-700",
};

const tagColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

export function ModelDetailModal({ model, isOpen, onClose }: ModelDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{model.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                ✓ {model.status}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {model.version}
              </span>
            </div>
            <p className="text-sm text-gray-600">{model.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 font-medium">Source</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{model.source}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 font-medium">Task</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{model.task}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 font-medium">Owner</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{model.owner}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500 font-medium">Last Updated</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{model.lastUpdated}</p>
            </div>
          </div>

          {/* Compliance & Risk */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Compliance & Risk</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Risk Tier</p>
                  <p className="text-sm text-gray-600">Based on internal AI policy</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskTierColors[model.riskTier]}`}>
                  {model.riskTier}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Data Privacy Review</p>
                  <p className="text-sm text-gray-600">Last reviewed: {model.dataPrivacyReview.lastReviewed}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[model.dataPrivacyReview.status].bg} ${statusStyles[model.dataPrivacyReview.status].text}`}>
                  {model.dataPrivacyReview.status}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-4 flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Bias & Fairness Eval</p>
                  <p className="text-sm text-gray-600">{model.biasFairnessEval.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[model.biasFairnessEval.status].bg} ${statusStyles[model.biasFairnessEval.status].text}`}>
                  {model.biasFairnessEval.status}
                </span>
              </div>
            </div>
          </div>

          {/* Usage & Access */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Usage & Access</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Downstream Agents</p>
                <p className="font-semibold text-gray-900">{model.downstreamAgents} Agents connected</p>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-2">API Endpoints</p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-xs text-gray-700 break-all overflow-x-auto">
                  {model.apiEndpoint}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-1">Access Control</p>
                <p className="font-semibold text-gray-900">{model.accessControl}</p>
              </div>
            </div>
          </div>

          {/* Datasets Used */}
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Datasets Used (Training/Eval)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 text-xs">Dataset</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 text-xs">Purpose</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 text-xs">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {model.datasets.map((dataset) => (
                    <tr key={dataset.name}>
                      <td className="px-4 py-3 font-medium text-gray-900">{dataset.name}</td>
                      <td className="px-4 py-3 text-gray-600">{dataset.purpose}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${
                          dataset.classification === "Confidential" ? "bg-red-100 text-red-700" :
                          dataset.classification === "PII" ? "bg-yellow-100 text-yellow-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {dataset.classification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex gap-2 flex-wrap">
              {model.tags.map((tag) => (
                <span
                  key={tag.name}
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${tagColorMap[tag.color]}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Edit Metadata
          </button>
        </div>
      </div>
    </div>
  );
}

