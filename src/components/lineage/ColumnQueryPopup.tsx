"use client";

import React, { useState, useRef } from "react";
import { Code2, X, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InternalColumn } from "@/hooks/useLineageStateEngine";
import { useSmartPosition, SqlHighlighter, parseDataType } from "./lineageUtils";

interface ColumnQueryPopupProps {
  col: InternalColumn;
  screenX: number;
  screenY: number;
  onClose: () => void;
  nodeLabel: string;
}

export function ColumnQueryPopup({ col, screenX, screenY, onClose, nodeLabel }: ColumnQueryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const W = 380;
  const pos = useSmartPosition(popupRef, screenX, screenY);

  const handleCopy = () => {
    if (col.query_expression) {
      navigator.clipboard.writeText(col.query_expression);
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
        <div className="flex items-center justify-between px-2 py-2 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Code2 size={13} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Column Expression</p>
              <p className="text-[11px] font-semibold text-gray-900 truncate max-w-[200px]">
                <span title={nodeLabel} className="text-indigo-600">{nodeLabel}</span>
                <span className="text-gray-400 mx-1.5">.</span>
                <span title={col.name} className="text-violet-600">{col.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
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

        {col.query_expression ? (
          <div className="bg-white max-h-52 overflow-y-auto">
            <pre className="px-4 py-4 text-[11px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap break-words">
              <SqlHighlighter sql={col.query_expression} />
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50/50 px-4 py-8 flex flex-col items-center gap-2">
            <Code2 size={24} className="text-gray-300" />
            <p className="text-[12px] text-gray-400 font-medium">No expression defined</p>
            <p className="text-[11px] text-gray-300">This column is read directly without transformation.</p>
          </div>
        )}

        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Data Type: {parseDataType(col.data_type)}</span>
        </div>
      </div>
    </div>
  );
}
