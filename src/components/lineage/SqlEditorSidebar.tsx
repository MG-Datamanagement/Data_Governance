"use client";

import React, { useState, useEffect } from "react";
import { X, Code2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { manualFixSqlTemplate } from "@/lib/constants";
import type { InternalNode, InternalEdge } from "@/hooks/useLineageStateEngine";

interface SqlEditorSidebarProps {
  node: InternalNode | null;
  edges: InternalEdge[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (nodeId: string) => void;
  isFixing: boolean;
}

export function SqlEditorSidebar({ node, edges, isOpen, onClose, onApply, isFixing }: SqlEditorSidebarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (node) {
      const q = manualFixSqlTemplate;
      if (q) {
        setQuery(q);
      } else {
        setQuery(`-- No existing transformation query found for ${node.fullName}\n-- Please enter the remediation SQL below:`);
      }
    }
  }, [node, edges]);

  if (!isOpen || !node) return null;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-200 flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
            <Code2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-none mb-1">SQL Editor</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Manual Remediation · {node.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex flex-col p-5 bg-[#1E1E1E]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Remediation Script</span>
          <span className="text-[10px] text-gray-500 font-mono italic">sql-editor://{node.label.toLowerCase()}_fix.sql</span>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 w-full bg-transparent text-gray-300 font-mono text-[12px] leading-relaxed resize-none focus:outline-none custom-scrollbar"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-500">
          <AlertCircle size={12} />
          <span className="text-[10px] font-medium">Changes will be validated after applying.</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} disabled={isFixing} className="px-3 py-2 text-[10px] font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
          <button
            onClick={() => onApply(node.id)}
            disabled={isFixing}
            className="px-3 py-2 text-[10px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2"
          >
            {isFixing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Applying Changes...
              </>
            ) : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
