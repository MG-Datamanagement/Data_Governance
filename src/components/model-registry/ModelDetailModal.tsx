"use client";

import { ModelMetadata } from "@/types";
import { 
  X, 
  Database, 
  Activity, 
  Users, 
  Clock, 
  ShieldCheck,
  Tag
} from "lucide-react";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { getTagColor, getTagTextColor, getSourceIconColor } from "@/lib/utils";

interface ModelDetailModalProps {
  model: ModelMetadata;
  isOpen: boolean;
  onClose: () => void;
}

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  Passed: { bg: "bg-green-50/50", text: "text-green-600", border: "border-green-200" },
  Failed: { bg: "bg-red-50/50", text: "text-red-600", border: "border-red-200" },
  Pending: { bg: "bg-yellow-50/50", text: "text-yellow-600", border: "border-yellow-200" },
};

const riskTierStyles: Record<string, { text: string; border: string }> = {
  "Low Risk": { text: "text-green-600", border: "border-green-200" },
  "Medium Risk": { text: "text-orange-500", border: "border-orange-200" },
  "High Risk": { text: "text-red-600", border: "border-red-200" },
};



export function ModelDetailModal({ model, isOpen, onClose }: ModelDetailModalProps) {
  if (!isOpen) return null;

  const datasetColumns: DataGridColumn<any>[] = [
    {
      key: "name",
      header: "Dataset",
      render: (row) => <span className="text-[13.5px] font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (row) => <span className="text-[13.5px] text-gray-500">{row.purpose}</span>,
    },
    {
      key: "classification",
      header: "Classification",
      render: (row) => (
        <span 
          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-sm"
          style={{ 
            backgroundColor: getTagColor(row.classification),
            color: getTagTextColor(row.classification)
          }}
        >
          {row.classification}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-[22px] font-bold text-[#111827]">{model.name}</h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
              {model.version}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#eafbf0] text-[#16a34a] text-sm font-medium rounded-full border border-[#d1f4e0]">
              <span className="mr-1 mt-0.5">✓</span> {model.status}
            </span>
          </div>
          <p className="text-[15px] text-gray-500">
            {model.description}
          </p>
          
          <div className="mt-3 border-b border-gray-100"></div>
        </div>

        {/* Content Body */}
        <div className="px-7 pb-6 overflow-y-auto space-y-6 flex-grow">
          {/* Quick Info Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-gray-200/60 rounded-xl p-3.5 bg-white shadow-sm h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <Database className="w-4 h-4" />
                <span className="text-[13px] font-medium">Source</span>
              </div>
              <p className="font-semibold text-gray-900 text-[14.5px] mt-0.5">{model.source}</p>
            </div>
            <div className="border border-gray-200/60 rounded-xl p-3.5 bg-white shadow-sm h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <Activity className="w-4 h-4" />
                <span className="text-[13px] font-medium">Task</span>
              </div>
              <p className="font-semibold text-gray-900 text-[14.5px] mt-0.5">{model.task}</p>
            </div>
            <div className="border border-gray-200/60 rounded-xl p-3.5 bg-white shadow-sm h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <Users className="w-4 h-4" />
                <span className="text-[13px] font-medium">Owner</span>
              </div>
              <p className="font-semibold text-gray-900 text-[14.5px] mt-0.5 truncate" title={model.owner}>{model.owner}</p>
            </div>
            <div className="border border-gray-200/60 rounded-xl p-3.5 bg-white shadow-sm h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-[13px] font-medium">Last Updated</span>
              </div>
              <p className="font-semibold text-gray-900 text-[14.5px] mt-0.5">{model.lastUpdated}</p>
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Compliance & Risk */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4 text-[15px] border-b border-gray-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Compliance & Risk
              </h3>
              <div className="border border-gray-100 bg-white rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">Risk Tier</p>
                    <p className="text-xs text-gray-500 mt-0.5">Based on internal AI policy</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${riskTierStyles[model.riskTier].border} ${riskTierStyles[model.riskTier].text} bg-white`}>
                    {model.riskTier}
                  </span>
                </div>
                
                <div className="border-t border-gray-50/50"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">Data Privacy Review</p>
                    <p className="text-xs text-gray-500 mt-0.5">Last reviewed: {model.dataPrivacyReview.lastReviewed}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[model.dataPrivacyReview.status].border} ${statusStyles[model.dataPrivacyReview.status].text} bg-white`}>
                    {model.dataPrivacyReview.status}
                  </span>
                </div>
                
                <div className="border-t border-gray-50/50"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[14px] font-medium text-gray-900">Bias & Fairness Eval</p>
                    <p className="text-xs text-gray-500 mt-0.5">{model.biasFairnessEval.description}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[model.biasFairnessEval.status].border} ${statusStyles[model.biasFairnessEval.status].text} bg-white`}>
                    {model.biasFairnessEval.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage & Access */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4 text-[15px] border-b border-gray-200 pb-2">
                <Activity className="w-4 h-4 text-indigo-600" /> Usage & Access
              </h3>
              <div className="border border-gray-100 bg-white rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <p className="text-[13px] text-gray-500 mb-1">Downstream Agents</p>
                  <p className="text-[14px] font-semibold text-gray-900">{model.downstreamAgents} Agents connected</p>
                </div>
                
                <div className="border-t border-gray-50/50 pt-4">
                  <p className="text-[13px] text-gray-500 mb-1.5">API Endpoints</p>
                  <div className="bg-[#f9fafb] p-2.5 rounded text-[13px] font-mono text-gray-600 break-all border border-gray-100">
                    {model.apiEndpoint}
                  </div>
                </div>
                
                <div className="border-t border-gray-50/50 pt-4">
                  <p className="text-[13px] text-gray-500 mb-1">Access Control</p>
                  <p className="text-[14px] font-semibold text-gray-900">{model.accessControl}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-2">
            {/* Datasets Used */}
            <div className="col-span-2">
              <h3 className="flex items-center gap-2 font-semibold text-[#111827] mb-3 text-[15px] border-b border-gray-200 pb-2">
                <Database className="w-4 h-4 text-indigo-600" /> Datasets Used (Training/Eval)
              </h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white mt-1">
                <DataGrid
                  data={model.datasets}
                  columns={datasetColumns}
                  keyExtractor={(row: any) => row.name}
                  density="compact"
                  className="border-none shadow-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="col-span-1 pl-4">
              <h3 className="flex items-center gap-2 font-semibold text-[#111827] mb-4 text-[15px] border-b border-gray-200 pb-2">
                <Tag className="w-4 h-4 text-indigo-600" /> Tags
              </h3>
              <div className="flex gap-2 flex-wrap">
                {model.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-block px-3 py-1 rounded-full text-[12.5px] font-medium shadow-sm"
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[15px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button className="px-5 py-2.5 text-[15px] font-medium text-white bg-[#4f46e5] hover:bg-[#4338ca] rounded-lg transition-colors">
            Edit Metadata
          </button>
        </div>
      </div>
    </div>
  );
}
