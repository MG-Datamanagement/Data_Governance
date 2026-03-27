"use client";

import React, { useState, useRef } from "react";
import { X, AlertCircle, CheckCircle2, Loader2, Sparkles, Code2, Check, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InternalNode, PopoverAnchor } from "@/hooks/useLineageStateEngine";
import { POPOVER_W } from "@/hooks/useLineageStateEngine";
import { tagPillClass, useSmartPositionFromRect } from "./lineageUtils";

interface AiSummaryPopoverProps {
  node: InternalNode;
  anchor: PopoverAnchor;
  onClose: () => void;
  onAutoFix: (id: string) => void;
  onOpenManualFix: (id: string) => void;
  isFixing: boolean;
  isFixed: boolean;
  selectedFixMethod?: 'auto' | 'manual';
}

export function AiSummaryPopover({
  node, anchor, onClose, onAutoFix, onOpenManualFix, isFixing, isFixed, selectedFixMethod = 'auto'
}: AiSummaryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedFix, setSelectedFix] = useState<"auto" | "manual">("auto");
  const [initialConfirmed, setInitialConfirmed] = useState(false);
  const [initialDeclined, setInitialDeclined] = useState(false);
  const [showProceedConfirm, setShowProceedConfirm] = useState(false);

  const nullableCols = node.columns.filter((c) => c.is_nullable).length;
  const totalChecks = node.columnCount;
  const passedChecks =
    node.qualityStatus === "healthy" ? totalChecks
      : node.qualityStatus === "warning" ? Math.floor(totalChecks * 0.85)
        : Math.floor(totalChecks * 0.5);

  const pos = useSmartPositionFromRect(popoverRef, anchor.rect, POPOVER_W);

  const hasPii = node.tags.some((t) => ["pii", "phi"].includes(t.name.toLowerCase()));
  const qualityLine =
    node.qualityStatus === "healthy"
      ? `${passedChecks}/${totalChecks} quality checks passing${hasPii ? " · RLS policies active on SSN" : ""}`
      : node.qualityStatus === "warning"
        ? `${passedChecks}/${totalChecks} quality checks passing · Some issues detected`
        : `Quality issues detected · ${totalChecks - passedChecks} check${totalChecks - passedChecks !== 1 ? "s" : ""} failing`;

  const hasTransformationFailure =
    node.queryExecution?.query_status === "FAILURE" ||
    node.queryExecution?.query_status === "ERROR" ||
    node.qualityStatus === "unhealthy" ||
    node.qualityStatus === "error" ||
    node.qualityStatus === "warning";

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 rounded-xl overflow-hidden bg-white"
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        width: POPOVER_W,
        visibility: pos ? "visible" : "hidden",
        boxShadow: "0 10px 40px rgba(109,40,217,0.15), 0 1px 10px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        animation: pos ? "aiPopIn 0.14s cubic-bezier(.22,.68,0,1.2) both" : "none",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ background: "linear-gradient(90deg, #6D28D9 0%, #7C3AED 100%)" }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" fillOpacity="0.9" className="flex-shrink-0">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.26L4 11l5.91-1.74z" />
          </svg>
          <span className="text-[12px] font-bold text-white tracking-wide">Insights</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold text-white/90 px-2 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {node.label}
          </span>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/20 transition-all"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Scrollable Body */}
        <div className="overflow-y-auto min-h-0 max-h-64 px-4 py-3 space-y-2.5">
          <div className="flex items-start gap-2">
            <p className="text-[12.5px] leading-[1.6] text-gray-700 flex-1">
              {node.aiSummary
                ? node.aiSummary
                : `${node.label} is a ${node.type} in ${node.database || node.sourceName}${node.schema ? `.${node.schema}` : ""} containing ${node.columnCount} column${node.columnCount !== 1 ? "s" : ""} of business data.`}
            </p>
          </div>

          {/* Notes section — only visible when node has active failures */}
          {!isFixed && (node.queryExecution?.query_status !== "SUCCEEDED" || node.qualityStatus !== "healthy") && (
            <>
              {(node.notes || node.queryExecution?.query_status === "FAILURE" ||
                node.qualityStatus === "unhealthy" || node.qualityStatus === "error" || node.qualityStatus === "warning") && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider w-[46px] flex-shrink-0 pt-px">Note</span>
                    <div className="flex-1 space-y-2">
                      {node.notes && (
                        <div className="flex items-start gap-1.5 flex-1">
                          <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[12px] text-red-600 leading-snug">{node.notes}</span>
                        </div>
                      )}
                      {node.queryExecution?.query_status === "FAILURE" && (
                        <div className="flex items-start gap-1.5">
                          <AlertCircle size={12} className={cn("text-red-500 flex-shrink-0 mt-0.5", node.notes && "opacity-60")} />
                          <span className={cn("text-[12px] leading-snug", node.notes ? "text-red-400" : "text-red-600")}>
                            Query failed · {node.queryExecution.query_runtime_ms}ms · {(node.queryExecution.data_scanned_bytes / 1024).toFixed(1)} KB scanned
                          </span>
                        </div>
                      )}
                      {(node.qualityStatus === "unhealthy" || node.qualityStatus === "error" || node.qualityStatus === "warning") && !node.queryExecution?.query_status && !node.notes && (
                        <div className="flex items-start gap-1.5">
                          <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[12px] text-red-600 leading-snug">
                            {node.qualityStatus === "warning" ? "Caution: Some quality issues detected." : "Data quality issues detected requires attention."}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="h-px bg-gray-100" />
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[46px] flex-shrink-0">Stats</span>
            <span className="text-[12px] text-gray-600 leading-snug">{node.stats ?? `${node.columnCount} columns`}</span>
          </div>

          <div className="h-px bg-gray-100" />
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {node.tags.map((tag) => (
                <span key={tag.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${tagPillClass(tag.name)}`}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Remediation footer */}
        {(hasTransformationFailure || isFixed) && !initialDeclined && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-slate-50/95 p-3 flex flex-col gap-2.5 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] backdrop-blur-sm">
            {!isFixed ? (
              <>
                {!initialConfirmed ? (
                  <div className="flex flex-col gap-2.5 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-2 px-1">
                      <Wrench size={12} className="text-indigo-500" />
                      <p className="text-xs font-semibold text-gray-800 leading-tight">Do you want to proceed with resolving the identified issue?</p>
                    </div>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      <button onClick={() => setInitialDeclined(true)} className="px-3.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all font-sans">No</button>
                      <button onClick={() => setInitialConfirmed(true)} className="px-3.5 py-1 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95 transition-all font-sans">Yes</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!showProceedConfirm ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Wrench size={11} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Fix Required Action</span>
                          </div>
                          <button
                            onClick={() => setShowProceedConfirm(true)}
                            disabled={isFixing}
                            className={cn("px-3 py-1 rounded-lg text-[10px] font-bold text-white transition-all shadow-sm", isFixing ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100")}
                          >
                            {isFixing ? <div className="flex items-center gap-1.5 italic"><Loader2 size={10} className="animate-spin" /> {selectedFix === 'auto' ? 'Fixing...' : 'Redirecting...'}</div> : "Apply Fix"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {[
                            { id: "manual", title: "Manual Fix", desc: "Apply custom SQL fixes manually", icon: Code2 },
                            { id: "auto", title: "AI Driven Fix", desc: "Intelligent automated recovery", icon: Sparkles },
                          ].map((opt) => (
                            <div
                              key={opt.id}
                              onClick={() => !isFixing && setSelectedFix(opt.id as "auto" | "manual")}
                              className={cn("flex flex-col items-start p-2 rounded-lg border transition-all cursor-pointer", selectedFix === opt.id ? "border-indigo-300 bg-white shadow-sm ring-1 ring-indigo-300/30" : "border-gray-100 bg-white/50 hover:border-gray-200 hover:bg-white")}
                            >
                              <div className="flex items-center justify-between w-full mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <opt.icon size={11} className={selectedFix === opt.id ? "text-indigo-600" : "text-gray-400"} />
                                  <span className={cn("text-[11px] font-bold", selectedFix === opt.id ? "text-indigo-700" : "text-gray-700")}>{opt.title}</span>
                                </div>
                                <div className={cn("w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all", selectedFix === opt.id ? "bg-indigo-500 border-indigo-500 scale-110" : "border-gray-300 bg-white")}>
                                  {selectedFix === opt.id && <Check size={9} className="text-white" strokeWidth={3} />}
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-400 ml-[18px]">{opt.desc}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2.5 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start gap-2.5 px-1">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {selectedFix === "auto" ? <Sparkles size={16} className="text-indigo-600" /> : <Code2 size={16} className="text-indigo-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold text-gray-800 leading-tight mb-1">
                              {selectedFix === "auto" ? "Confirm AI Remediation" : "Manual Remediation"}
                            </p>
                            <p className="text-[10px] text-gray-500 leading-normal">
                              {selectedFix === "auto"
                                ? "AI will attempt to fix the issue automatically as mentioned in the description above. This may take a few seconds."
                                : "Apply direct SQL corrections to resolve issue. We will provide a suggested remediation template in the SQL Editor."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <button onClick={() => setShowProceedConfirm(false)} disabled={isFixing} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all font-sans disabled:opacity-50">Cancel</button>
                          <button
                            onClick={() => { if (selectedFix === "auto") { onAutoFix(node.id); } else { onOpenManualFix(node.id); } }}
                            disabled={isFixing}
                            className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-95 transition-all font-sans disabled:bg-indigo-300"
                          >
                            {isFixing ? <div className="flex items-center gap-1.5 italic"><Loader2 size={10} className="animate-spin" /> {selectedFix === 'auto' ? 'Fixing...' : 'Applying...'}</div> : (selectedFix === "auto" ? "Confirm & Proceed" : "Open SQL Editor")}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between h-9 bg-green-50 border border-green-100 rounded-lg px-2.5">
                <span className="flex items-center gap-1.5 text-[10px] text-green-700 font-bold">
                  <CheckCircle2 size={13} className="text-green-600" />
                  Lineage remediated successfully
                </span>
                <span className="text-[8px] text-green-600/60 font-bold uppercase tracking-tight">Applied {selectedFixMethod === 'manual' ? 'Manual SQL' : 'AI Driven'} fix</span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes aiPopIn {
          from { opacity: 0; transform: scale(0.97) translateY(-3px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
