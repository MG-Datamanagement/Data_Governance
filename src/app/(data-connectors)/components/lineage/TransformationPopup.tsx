"use client";

import React, { useState, useRef } from "react";
import { GitBranch, X, Code2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InternalEdge } from "@/hooks/useLineageStateEngine";
import { useSmartPosition, SqlHighlighter } from "./lineageUtils";

interface TransformationPopupProps {
  edge: InternalEdge;
  screenX: number;
  screenY: number;
  onClose: () => void;
}

export function TransformationPopup({ edge, screenX, screenY, onClose }: TransformationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const W = 380;
  const pos = useSmartPosition(popupRef, screenX, screenY);

  const handleCopy = () => {
    if (edge.transformationQuery) {
      navigator.clipboard.writeText(edge.transformationQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: W, visibility: pos ? "visible" : "hidden", animation: pos ? "aiPopIn 0.15s cubic-bezier(.22,.68,0,1.2) both" : "none" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-200" style={{ boxShadow: "0 12px 48px rgba(99,102,241,0.18)" }}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <GitBranch size={13} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Transformation</p>
              <p className="text-[11px] font-semibold text-gray-900 truncate max-w-[200px]">
                <span title={edge.fromLabel} className="text-indigo-600">{edge.fromLabel}</span>
                <span className="text-gray-400 mx-1.5">→</span>
                <span title={edge.toLabel} className="text-violet-600">{edge.toLabel}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shadow-sm text-[10px] font-semibold", copied ? "bg-green-50 border-green-200 text-green-700" : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700")}
            >
              {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm">
              <X size={12} />
            </button>
          </div>
        </div>

        {edge.transformationQuery ? (
          <div className="bg-white max-h-52 overflow-y-auto">
            <pre className="px-4 py-4 text-[11px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap break-words">
              <SqlHighlighter sql={edge.transformationQuery} />
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50/50 px-4 py-8 flex flex-col items-center gap-2">
            <Code2 size={24} className="text-gray-300" />
            <p className="text-[12px] text-gray-400 font-medium">No transformation query defined</p>
            <p className="text-[11px] text-gray-300">This edge represents a direct data flow.</p>
          </div>
        )}

        <div className="bg-gray-50 border-t border-gray-100 flex flex-col">
          {edge.queryExecution && (
            <div className="px-4 py-2.5 border-b border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-medium">Status</span>
                <span className={`font-bold ${edge.queryExecution.query_status === 'SUCCEEDED' ? 'text-green-600' : 'text-red-600'}`}>{edge.queryExecution.query_status}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-medium">Runtime</span>
                <span className="text-gray-700 font-medium">{edge.queryExecution.query_runtime_ms} ms</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-400 font-medium">Scanned</span>
                <span className="text-gray-700 font-medium">{(edge.queryExecution.data_scanned_bytes / 1024).toFixed(2)} KB</span>
              </div>
              {edge.queryExecution.engine_version && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-medium">Engine</span>
                  <span className="text-gray-700 font-medium truncate max-w-[80px]" title={edge.queryExecution.engine_version}>{edge.queryExecution.engine_version}</span>
                </div>
              )}
              {edge.queryExecution.query_execution_id && (
                <div className="col-span-2 flex justify-between items-center text-[10px] mt-0.5">
                  <span className="text-gray-400 font-medium">Execution ID</span>
                  <span className="text-gray-500 font-mono text-[9px] truncate max-w-[200px]" title={edge.queryExecution.query_execution_id}>{edge.queryExecution.query_execution_id}</span>
                </div>
              )}
              {edge.queryExecution.s3_output_location && (
                <div className="col-span-2 flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-medium">Output</span>
                  <span className="text-gray-500 font-mono text-[9px] truncate max-w-[200px]" title={edge.queryExecution.s3_output_location}>
                    {edge.queryExecution.s3_output_location.split('/').pop() || edge.queryExecution.s3_output_location}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
