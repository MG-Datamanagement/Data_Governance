"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAiReclassification } from "@/hooks/useAiReclassification";

interface DatasetColumnsTabProps {
  catalogData: any;
  datasetId: string;
}

const DatasetColumnsTab: React.FC<DatasetColumnsTabProps> = ({
  catalogData,
  datasetId,
}) => {
  const {
    reclassifyAiScanPhase,
    setReclassifyAiScanPhase,
    aiResults,
    handleReclassificationActionWithAI,
  } = useAiReclassification(datasetId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-bold text-gray-900">Schema Definition</h2>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold border border-indigo-100">
            {catalogData?.columns?.length || 0} Columns
          </span>
        </div>
        <div className="flex items-center gap-2">
          {reclassifyAiScanPhase === "never" && (
            <button
              onClick={handleReclassificationActionWithAI}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Reclassify with AI
            </button>
          )}
          {reclassifyAiScanPhase === "scanning" && (
            <button
              disabled
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <div>
                <Loader2 className="text-indigo-400 animate-spin" size={16} />
              </div>
              Reclassifying...
            </button>
          )}
          {["re-scan", "complete"].includes(reclassifyAiScanPhase) && (
            <button
              onClick={() => {
                setReclassifyAiScanPhase("re-scan");
                handleReclassificationActionWithAI();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <div>
                <CheckCircle2 size={16} className="text-green-400" />
              </div>
              Reclassified
            </button>
          )}
          <button className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg bg-white transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {reclassifyAiScanPhase === "scanning" && (
          <div className={cn("p-4 flex items-center w-full gap-2", "bg-indigo-50")}>
            <div>
              <Loader2 className="text-indigo-400 animate-spin" size={16} />
            </div>
            <div>
              <h3 className="text-sm text-indigo-600">AI Reclassification in progress...</h3>
              <p className="text-xs text-indigo-500">
                Analyzing column patterns, data types, and semantic context
              </p>
            </div>
          </div>
        )}

        {["complete", "re-scan"].includes(reclassifyAiScanPhase) && (
          <div className={cn("p-4 flex items-center w-full gap-2 bg-green-50")}>
            <div>
              <CheckCircle2 size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-700">
                Reclassification complete — confidence scores updated. Review any changes below.
              </p>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">
                #
              </th>
              <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Column Name
              </th>
              <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th className="py-3 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Classification
              </th>
            </tr>
          </thead>
          <tbody>
            {catalogData?.columns?.map((col: any, idx: number) => {
              const ai = aiResults[col.name];

              return (
                <tr
                  key={col.name}
                  className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors"
                >
                  <td className="py-4 px-6 text-xs text-gray-400">{idx + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800">{col.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                        {col.is_nullable ? "NULLABLE" : "NOT NULL"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                      {(col.type || col.data_type || "UNKNOWN").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500 italic">
                    <div className="overflow-y-auto min-h-10 max-h-16">
                      {col?.description || "No description yet."}
                    </div>
                  </td>
                  <td className="py-2 px-6 text-sm text-gray-600 font-medium">
                    <div className="flex flex-col justify-center items-start gap-1">
                      {ai ? (
                        <>
                          <span className="gap-1 px-2 rounded-xl bg-yellow-100 text-yellow-800 text-[10px] font-bold border border-yellow-200">
                            {ai?.tag_name ? ai?.tag_name?.toUpperCase() : ""}
                          </span>
                          <span className="items-center gap-1 px-2 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 w-fit">
                            ✦ AI
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${ai.confidence_score * 100}%` }}
                                className="h-full bg-green-500 rounded-full"
                              />
                            </div>
                            <span className="text-[10px] text-gray-500">
                              {Math.round(ai.confidence_score * 100)}%
                            </span>
                          </div>
                        </>
                      ) : col.tags?.length ? (
                        col.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200 capitalize"
                          >
                            {tag?.name ? tag?.name?.toUpperCase() : ""}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!catalogData?.columns || catalogData.columns.length === 0) && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-gray-400 italic">
                  No columns found for this dataset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatasetColumnsTab;
