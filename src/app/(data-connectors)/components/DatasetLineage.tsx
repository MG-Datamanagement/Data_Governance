"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from "react";
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Search,
  ChevronDown, ChevronUp, MoreHorizontal, X,
  Loader2, AlertTriangle, CheckCircle2, AlertCircle,
  Code2, GitBranch, Copy, Check, Sparkles,
} from "lucide-react";
import {
  dashboardApiServices,
  LineageVisualResponse,
  LineageApiNode,
  LineageApiQueryExecution,
} from "@/services/dashboardApiServices";
import { cn } from "@/lib/utils";


// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType = "table" | "view" | "dashboard";
type QualityStatus = "healthy" | "warning" | "error" | "unhealthy";

interface InternalColumn {
  id: string; name: string; data_type: string;
  is_primary_key: boolean; is_nullable: boolean;
  query_expression: string | null;
}
interface InternalTag { id: string; name: string; color: string | null; }
interface InternalNode {
  id: string; type: NodeType; label: string; fullName: string;
  database: string; schema: string; sourceName: string; sourceType: string;
  columns: InternalColumn[]; columnCount: number; tags: InternalTag[];
  qualityStatus: QualityStatus; isCenter?: boolean; aiSummary: string | null;
  stats: string | null;
  notes: string | null;
  queryExecution?: LineageApiQueryExecution | null;
  x: number; y: number;
}
interface InternalEdge {
  from: string; to: string; isSecondary?: boolean;
  transformationQuery: string | null; fromLabel: string; toLabel: string;
  queryExecution?: LineageApiQueryExecution | null;
}
interface NodeRect { x: number; y: number; w: number; h: number; }

interface PopoverAnchor {
  nodeId: string;
  rect: DOMRect;
}
interface ClickedEdge {
  edge: InternalEdge; screenX: number; screenY: number;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_W = 210;
const CENTER_W = 248;
const CARD_H_EST = 116;
const GAP_Y = 28;
const COL_GAP = 110;
const POPOVER_W = 320;

function mapNode(
  n: LineageApiNode, x: number, y: number, isCenter = false, isFixed = false
): InternalNode {
  return {
    id: n.id, type: n.type ?? "table", label: n.table_name, fullName: n.full_name,
    database: n.database_name ?? "", schema: n.schema_name ?? "",
    sourceName: n.source?.name ?? "", sourceType: n.source?.source_type ?? "",
    columns: (n.columns ?? []).map((c) => ({
      id: c.id, name: c.name, data_type: c.data_type,
      is_primary_key: c.is_primary_key, is_nullable: c.is_nullable,
      query_expression: c?.query_expression ?? null,
    })),
    columnCount: n.columns?.length ?? 0,
    tags: (n.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
    qualityStatus: isFixed ? "healthy" : (n.status ?? "healthy"),
    isCenter,
    aiSummary: isFixed 
      ? "The operational-data-store.transaction dataset captures financial transaction details associated with bookings and agents, enabling analysis of payment flows, transaction status, and revenue tracking within the operational data pipeline."
      : (n.ai_summary ?? null),
    stats: n.stats ?? null,
    notes: isFixed ? null : (n.notes ?? (n as any).note ?? null),
    queryExecution: isFixed 
      ? { ...(n.query_execution || {}), query_status: "SUCCEEDED" } as LineageApiQueryExecution
      : (n.query_execution ?? null),
    x, y,
  };
}

function buildGraph(
  data: LineageVisualResponse, fixedNodeIds: Set<string>
): { nodes: InternalNode[]; edges: InternalEdge[] } {
  const ups = data.upstreams ?? [];
  const downs = data.downstreams ?? [];
  const COL1_X = 0, COL2_X = CARD_W + COL_GAP;
  const COL3_X = COL2_X + CENTER_W + COL_GAP;
  const COL4_X = COL3_X + CARD_W + COL_GAP;
  const upH = ups.length * (CARD_H_EST + GAP_Y);
  const centerY = Math.max(0, upH / 2 - CARD_H_EST / 2);

  const dsViews = downs.filter((n) => n.type === "view");
  const dsDash = downs.filter((n) => n.type !== "view" && n.type !== "table");
  const dsOther = downs.filter((n) => n.type === "table" && n.id !== data.root.id);

  const apiById: Record<string, LineageApiNode> = {};
  [data.root, ...ups, ...downs].forEach((n) => { apiById[n.id] = n; });

  const nodes: InternalNode[] = [
    mapNode(data.root, COL2_X, centerY, true, fixedNodeIds.has(data.root.id)),
    ...ups.map((n, i) => mapNode(n, COL1_X, i * (CARD_H_EST + GAP_Y), false, fixedNodeIds.has(n.id))),
    ...[...dsViews, ...dsOther].map((n, i) => mapNode(n, COL3_X, i * (CARD_H_EST + GAP_Y), false, fixedNodeIds.has(n.id))),
    ...dsDash.map((n, i) => mapNode(n, COL4_X, i * (CARD_H_EST + GAP_Y), false, fixedNodeIds.has(n.id))),
  ];

  const edges: InternalEdge[] = [];
  const rootId = data.root.id;
  ups.forEach((n) => {
    const isFixed = fixedNodeIds.has(n.id);
    edges.push({
      from: n.id, to: rootId, isSecondary: false,
      transformationQuery: apiById[n.id]?.transformation_query ?? null,
      queryExecution: isFixed 
        ? { ...(apiById[n.id]?.query_execution || {}), query_status: "SUCCEEDED" } as LineageApiQueryExecution
        : (apiById[n.id]?.query_execution ?? null),
      fromLabel: n.table_name, toLabel: data.root.table_name,
    });
  });
  downs.forEach((n) => {
    const isView = n.type === "view";
    const isFixed = fixedNodeIds.has(n.id);
    edges.push({
      from: rootId, to: n.id, isSecondary: !isView,
      transformationQuery: apiById[n.id]?.transformation_query ?? null,
      queryExecution: isFixed 
        ? { ...(apiById[n.id]?.query_execution || {}), query_status: "SUCCEEDED" } as LineageApiQueryExecution
        : (apiById[n.id]?.query_execution ?? null),
      fromLabel: data.root.table_name, toLabel: n.table_name,
    });
    if (!isView && dsViews.length > 0)
      dsViews.forEach((v) => {
        const isVFixed = fixedNodeIds.has(v.id); // Although usually downstream triggers fix
        edges.push({
          from: v.id, to: n.id, isSecondary: false,
          transformationQuery: apiById[n.id]?.transformation_query ?? null,
          queryExecution: isFixed 
            ? { ...(apiById[n.id]?.query_execution || {}), query_status: "SUCCEEDED" } as LineageApiQueryExecution
            : (apiById[n.id]?.query_execution ?? null),
          fromLabel: v.table_name, toLabel: n.table_name,
        });
      });
  });

  const seen = new Set<string>();
  return {
    nodes,
    edges: edges.filter((e) => {
      const k = `${e.from}->${e.to}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: NodeType, cls = "w-3.5 h-3.5") {
  if (type === "table") return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
  );
  if (type === "view") return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7-5.064 7-9.542 7S3.732 16.057 2.458 12z" />
      </svg>
  );
  return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
  );
}

function colTypeIcon(dt: string) {
  const t = dt.toLowerCase();
  if (t.includes("int") || t.includes("number") || t.includes("float") || t.includes("numeric"))
    return <span className="text-blue-400 font-bold text-[10px]">N</span>;
  if (t.includes("bool"))
    return <span className="text-purple-400 font-bold text-[10px]">B</span>;
  if (t.includes("date") || t.includes("time"))
    return <span className="text-yellow-500 font-bold text-[10px]">D</span>;
  if (t.includes("byte"))
    return <span className="text-gray-400 font-bold text-[10px]">#</span>;
  if (t.includes("array"))
    return <span className="text-orange-400 font-bold text-[10px]">[ ]</span>;
  return <span className="text-green-500 font-bold text-[10px]">A</span>;
}

function qualityDot(status: QualityStatus) {
  if (status === "healthy") return (
      <span className="w-4 h-4 rounded-full border-2 border-green-400 flex items-center justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
    </span>
  );
  if (status === "error" || status === "unhealthy") return (
      <span className="w-4 h-4 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-500 text-[9px] font-black">!</span>
  );
  return (
      <span className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-500 text-[9px] font-black">!</span>
  );
}

function parseDataType(raw: string): string {
  const m = raw.match(/type['"]?\s*:\s*([A-Za-z]+)/);
  if (m) return m[1].replace("TypeClass", "").replace("Class", "").toLowerCase();
  return raw.length > 20 ? raw.slice(0, 18) + "…" : raw;
}

function tagPillClass(name: string) {
  const n = name.toLowerCase();
  if (n === "pii" || n === "phi") return "bg-red-50 text-red-600 border-red-200";
  if (n === "financial" || n === "finance") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (n === "gdpr" || n === "hipaa" || n === "sox") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ─── Smart Popup Positioning ───────────────────────────────────────────────────
// Measures the rendered popup and clamps it so it never clips the header or edges.

function useSmartPosition(
  ref: React.RefObject<HTMLDivElement>,
  anchorX: number,
  anchorY: number,
) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const elW = ref.current.offsetWidth || 380;
    const elH = ref.current.offsetHeight || 300;
    const PAD = 12, TOP_SAFE = 68;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = Math.max(PAD, Math.min(anchorX - elW / 2, vw - elW - PAD));
    const belowY = anchorY + 16;
    let top = belowY + elH + PAD > vh ? Math.max(TOP_SAFE, anchorY - elH - 16) : belowY;
    top = Math.max(TOP_SAFE, Math.min(top, vh - elH - PAD));
    setPos({ left, top });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorX, anchorY, ref.current?.offsetHeight, ref.current?.offsetWidth]);
  return pos;
}

function useSmartPositionFromRect(
  ref: React.RefObject<HTMLDivElement>,
  rect: DOMRect | null,
  popoverW: number,
) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useLayoutEffect(() => {
    if (!ref.current || !rect) return;
    const elH = ref.current.offsetHeight || 300;
    const PAD = 12, TOP_SAFE = 68;
    const vw = window.innerWidth, vh = window.innerHeight;
    const spaceRight = vw - rect.right - PAD;
    const spaceLeft = rect.left - PAD;
    let left = spaceRight >= popoverW || spaceRight >= spaceLeft
      ? Math.min(rect.right + PAD, vw - popoverW - PAD)
      : Math.max(PAD, rect.left - popoverW - PAD);
    let top = Math.max(TOP_SAFE, rect.top);
    if (top + elH + PAD > vh) top = Math.max(TOP_SAFE, vh - elH - PAD);
    setPos({ left, top });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect?.left, rect?.top, rect?.right, popoverW, ref.current?.offsetHeight]);
  return pos;
}

// ─── AI Summary Popover — compact, matches reference screenshot ───────────────
// Layout: purple header bar (sparkle + "AI Summary" + node name badge + X),
//         white body with description, divider, STATS row, QUALITY row.

interface AiSummaryPopoverProps {
  node: InternalNode;
  anchor: PopoverAnchor;
  onClose: () => void;
  onAutoFix: (id: string) => void;
  isFixing: boolean;
  isFixed: boolean;
}

function AiSummaryPopover({ node, anchor, onClose, onAutoFix, isFixing, isFixed }: AiSummaryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const nullableCols = node.columns.filter((c) => c.is_nullable).length;
  const totalChecks = node.columnCount;
  const passedChecks =
      node.qualityStatus === "healthy" ? totalChecks
          : node.qualityStatus === "warning" ? Math.floor(totalChecks * 0.85)
              : Math.floor(totalChecks * 0.5);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  const pos = useSmartPositionFromRect(popoverRef, anchor.rect, POPOVER_W);

  // Quality text line
  const hasPii = node.tags.some((t) => ["pii","phi"].includes(t.name.toLowerCase()));
  const qualityLine =
      node.qualityStatus === "healthy"
          ? `${passedChecks}/${totalChecks} quality checks passing${hasPii ? " · RLS policies active on SSN" : ""}`
          : node.qualityStatus === "warning"
              ? `${passedChecks}/${totalChecks} quality checks passing · Some issues detected`
              : `Quality issues detected · ${totalChecks - passedChecks} check${totalChecks - passedChecks !== 1 ? "s" : ""} failing`;

  return (
      <div
          ref={popoverRef}
          className="fixed z-50 rounded-xl overflow-hidden bg-white"
          style={{
            left: pos?.left ?? -9999,
            top: pos?.top ?? -9999,
            width: POPOVER_W,
            visibility: pos ? "visible" : "hidden",
            boxShadow: "0 4px 20px rgba(109,40,217,0.12), 0 1px 6px rgba(0,0,0,0.07)",
            border: "1px solid #e5e7eb",
            animation: pos ? "aiPopIn 0.14s cubic-bezier(.22,.68,0,1.2) both" : "none",
          }}
          onClick={(e) => e.stopPropagation()}
      >
        {/* ── Purple header bar — identical to reference ── */}
        <div
            className="flex items-center justify-between px-3 py-2"
            style={{ background: "linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)" }}
        >
          {/* Left: sparkle + label */}
          <div className="flex items-center gap-1.5">
            {/* Sparkle / star icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" fillOpacity="0.9" className="flex-shrink-0">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.26L4 11l5.91-1.74z" />
            </svg>
            <span className="text-[12px] font-bold text-white tracking-wide">Insights</span>
          </div>
          {/* Right: node badge + close */}
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

        {/* ── White body ── */}
        <div className="px-4 py-3 space-y-2.5">
          {/* Description */}
          <p className="text-[12.5px] leading-[1.6] text-gray-700">
            {node.aiSummary
                ? node.aiSummary
                : `${node.label} is a ${node.type} in ${node.database || node.sourceName}${node.schema ? `.${node.schema}` : ""} containing ${node.columnCount} column${node.columnCount !== 1 ? "s" : ""} of business data.`}
          </p>

          {/* Note section — only for non-success nodes (failures/unhealthy/error/warning) */}
          {(node.queryExecution?.query_status !== "SUCCEEDED" || node.qualityStatus !== "healthy") && (
            <>
              {/* Only show this section if we have notes OR a failure to report */}
              {(node.notes || node.queryExecution?.query_status === "FAILURE" || 
                node.qualityStatus === "unhealthy" || node.qualityStatus === "error" || node.qualityStatus === "warning") && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider w-[46px] flex-shrink-0 pt-px">
                      {node.notes ? "Note" : "Note (Fallback)"}
                    </span>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {node.notes && (
                          <div className="flex items-start gap-1.5 flex-1">
                            <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[12px] text-red-600 leading-snug">
                              {node.notes}
                            </span>
                          </div>
                        )}
                      </div>
                      {node.queryExecution?.query_status === "FAILURE" && (
                        <div className="flex items-start gap-1.5">
                          <AlertCircle size={12} className={cn("text-red-500 flex-shrink-0 mt-0.5", node.notes && "opacity-60")} />
                          <span className={cn("text-[12px] leading-snug", node.notes ? "text-red-400" : "text-red-600")}>
                            Query execution failed · Runtime {node.queryExecution.query_runtime_ms}ms · {(node.queryExecution.data_scanned_bytes / 1024).toFixed(1)} KB scanned
                          </span>
                        </div>
                      )}
                      {(node.qualityStatus === "unhealthy" || node.qualityStatus === "error" || node.qualityStatus === "warning") && !node.queryExecution?.query_status && !node.notes && (
                        <div className="flex items-start gap-1.5">
                          <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[12px] text-red-600 leading-snug">
                            {node.qualityStatus === "warning" ? "Caution: Some data quality issues detected." : "Data quality issues detected — this dataset requires attention."}
                          </span>
                        </div>
                      )}
                      {node.queryExecution?.query_status === "FAILURE" && node.queryExecution.s3_output_location && (
                        <p className="text-[10px] text-gray-400 pl-4 truncate" title={node.queryExecution.s3_output_location}>
                          Output: {node.queryExecution.s3_output_location.split('/').slice(-2).join('/')}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

           {/* STATS row */}
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[46px] flex-shrink-0">
              Stats
            </span>
            <span className="text-[12px] text-gray-600 leading-snug">
            {node.stats ?? `${node.columnCount} column${node.columnCount !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* <div className="flex items-start gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[46px] flex-shrink-0 pt-px">
            Quality
          </span>
            <div className="flex items-start gap-1.5 flex-1">
              {node.qualityStatus === "healthy" ? (
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-px" />
              ) : (
                  <AlertCircle
                      size={13}
                      className={`flex-shrink-0 mt-px ${node.qualityStatus === "warning" ? "text-yellow-500" : "text-red-500"}`}
                  />
              )}
              <span className="text-[12px] text-gray-600 leading-snug">{qualityLine}</span>
            </div>
          </div> */}

          {/* Tags row (compact, only if present) */}
          {node.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {node.tags.map((tag) => (
                    <span
                        key={tag.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${tagPillClass(tag.name)}`}
                    >
                {tag.name}
              </span>
                ))}
              </div>
          )}
        </div>
        {/* Footer actions — only for non-success nodes or already fixed */}
        {((node.queryExecution?.query_status !== "SUCCEEDED" || node.qualityStatus !== "healthy") || isFixed) && (
          <div className="p-2 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
              {isFixed ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check size={10} /> Lineage remediated
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertTriangle size={10} className="text-amber-500" /> Resolution available
                </span>
              )}
            </div>
            
            {!isFixed ? (
              <button
                onClick={() => onAutoFix(node.id)}
                disabled={isFixing}
                title={isFixing ? "Fixing in progress" : "Auto fix lineage"}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm",
                  isFixing 
                    ? "bg-indigo-50 text-indigo-400 border border-indigo-100 italic" 
                    : "text-white shadow-indigo-100 border-none"
                )}
                style={!isFixing ? { background: "linear-gradient(90deg, #6d28d9 0%, #7c3aed 100%)" } : {}}
              >
                {isFixing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Auto Fix
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-[11px] font-bold">
                <Check size={11} />
                Applied
              </div>
            )}
          </div>
        )}

        <style>{`
        @keyframes aiPopIn {
          from { opacity: 0; transform: scale(0.97) translateY(-3px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
      </div>
  );
}

// ─── Transformation Query Popup ───────────────────────────────────────────────

function TransformationPopup({
                               edge, screenX, screenY, onClose,
                             }: {
  edge: InternalEdge; screenX: number; screenY: number; onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  const handleCopy = () => {
    if (edge.transformationQuery) {
      navigator.clipboard.writeText(edge.transformationQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const W = 380;
  const pos = useSmartPosition(popupRef, screenX, screenY);

  const keywords = ["SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP BY","ORDER BY","HAVING","WITH","AS","AND","OR","NOT","IN","LIMIT","UNION","INSERT","UPDATE","DELETE","SET","CREATE","TABLE","VIEW","DISTINCT","COUNT","SUM","AVG","MAX","MIN","CASE","WHEN","THEN","ELSE","END","NULL","IS","LIKE","BETWEEN","EXISTS"];

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
                  // onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shadow-sm text-[10px] font-semibold",
                    copied 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700"
                  )}
              >
                {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          {edge.transformationQuery ? (
              <div className="bg-white max-h-52 overflow-y-auto">
            <pre className="px-4 py-4 text-[11px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap break-words">
              {edge.transformationQuery
                  .split(new RegExp(`\\b(${keywords.join("|")})\\b`, "gi"))
                  .map((part, idx) => {
                    if (keywords.includes(part.toUpperCase()))
                      return <span key={idx} className="text-violet-600 font-bold">{part}</span>;
                    if (/^'.*'$/.test(part))
                      return <span key={idx} className="text-amber-600 font-medium italic">{part}</span>;
                    if (/^\d+$/.test(part.trim()))
                      return <span key={idx} className="text-blue-600 font-semibold">{part}</span>;
                    return <span key={idx}>{part}</span>;
                  })}
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
            {/* <div className="px-4 py-2 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${edge.isSecondary ? "bg-gray-400" : "bg-indigo-500"}`} />
              <span className="text-[10px] text-gray-500 font-medium">{edge.isSecondary ? "Secondary" : "Primary"} data flow</span>
            </div> */}
          </div>
        </div>
      </div>
  );
}

// ─── Column Query Popup ───────────────────────────────────────────────────────

function ColumnQueryPopup({
  col, screenX, screenY, onClose, nodeLabel
}: {
  col: InternalColumn; screenX: number; screenY: number; onClose: () => void; nodeLabel: string;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  const handleCopy = () => {
    if (col.query_expression) {
      navigator.clipboard.writeText(col.query_expression);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const W = 380;
  const pos = useSmartPosition(popupRef, screenX, screenY);

  const keywords = ["SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP BY","ORDER BY","HAVING","WITH","AS","AND","OR","NOT","IN","LIMIT","UNION","INSERT","UPDATE","DELETE","SET","CREATE","TABLE","VIEW","DISTINCT","COUNT","SUM","AVG","MAX","MIN","CASE","WHEN","THEN","ELSE","END","NULL","IS","LIKE","BETWEEN","EXISTS"];

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
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shadow-sm text-[10px] font-semibold",
                    copied 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700"
                  )}
              >
                {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          </div>
          {col.query_expression ? (
              <div className="bg-white max-h-52 overflow-y-auto">
            <pre className="px-4 py-4 text-[11px] leading-relaxed font-mono text-gray-700 whitespace-pre-wrap break-words">
              {col.query_expression
                  .split(new RegExp(`\\b(${keywords.join("|")})\\b`, "gi"))
                  .map((part, idx) => {
                    if (keywords.includes(part.toUpperCase()))
                      return <span key={idx} className="text-violet-600 font-bold">{part}</span>;
                    if (/^'.*'$/.test(part))
                      return <span key={idx} className="text-amber-600 font-medium italic">{part}</span>;
                    if (/^\d+$/.test(part.trim()))
                      return <span key={idx} className="text-blue-600 font-semibold">{part}</span>;
                    return <span key={idx}>{part}</span>;
                  })}
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

// ─── Node Card ────────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: InternalNode;
  isSelected: boolean;
  popoverOpen: boolean;
  onClick: (rect: DOMRect) => void;
  onHeightChange: (id: string, h: number) => void;
  onColumnClick: (col: InternalColumn, nodeLabel: string, sx: number, sy: number) => void;
}

function NodeCard({ node, isSelected, popoverOpen, onClick, onHeightChange, onColumnClick }: NodeCardProps) {
  const [expanded, setExpanded] = useState(!!node.isCenter);
  const [colSearch, setColSearch] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const isCenter = !!node.isCenter;
  const isHighlighted = isSelected && popoverOpen;

  const filteredCols = node.columns.filter((c) =>
      c.name.toLowerCase().includes(colSearch.toLowerCase())
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height;
        onHeightChange(node.id, h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, onHeightChange]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cardRef.current) onClick(cardRef.current.getBoundingClientRect());
  };

  return (
      <div
          ref={cardRef}
          onClick={handleClick}
          className={[
            "select-none cursor-pointer rounded-xl border bg-white transition-all w-full",
            isCenter
                ? "border-indigo-300 shadow-lg ring-2 ring-indigo-200/60"
                : isHighlighted
                    ? "border-indigo-400 shadow-md ring-2 ring-indigo-400/50"
                    : isSelected
                        ? "border-indigo-200 shadow-sm ring-1 ring-indigo-200/40"
                        : (node.qualityStatus === "unhealthy" || node.qualityStatus === "error")
                            ? "border-red-200 shadow-sm hover:border-red-400 hover:shadow-md hover:shadow-red-100"
                            : "border-gray-200 shadow-sm hover:border-indigo-200 hover:shadow-md",
          ].join(" ")}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
          <span className={`flex-shrink-0 ${isCenter ? "text-indigo-500" : "text-gray-400"}`}>
            {typeIcon(node.type)}
          </span>
            {(node.database || node.sourceName) && (
                <span className="text-[10px] text-gray-400 truncate">
              {node.sourceName
                  ? `${node.sourceName.toUpperCase()} › ${node.schema || node.database}`
                  : `${node.database} › ${node.schema}`}
            </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {node.tags.slice(0, 2).map((tag) => (
                <span
                    key={tag.id}
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${tagPillClass(tag.name)}`}
                >
              {tag.name}
            </span>
            ))}
            {qualityDot(node.qualityStatus)}
            {node.aiSummary && (
                <span
                    className={`flex-shrink-0 ml-0.5 text-[11px] font-bold transition-colors leading-none ${
                        isHighlighted ? "text-indigo-400" : "text-gray-300"
                    }`}
                    title="AI summary available"
                >
              ✦
            </span>
            )}
            <button
                className="text-gray-300 hover:text-gray-500 transition-colors ml-0.5"
                onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        <div className="px-3 pt-2 pb-1">
          <p className={`font-bold truncate ${isCenter ? "text-indigo-700 text-sm" : "text-gray-800 text-xs"}`}>
            {node.label}
          </p>
          {node.sourceType && (
              <p className="text-[10px] text-gray-400 truncate capitalize mt-0.5">{node.sourceType}</p>
          )}
        </div>

        {(node.qualityStatus === "error" || node.qualityStatus === "unhealthy") && (
            <div className="mx-3 mb-2 flex items-center gap-1 text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
              <AlertCircle size={10} /> {node.qualityStatus === "unhealthy" ? "Unhealthy — execution failure" : "Data quality issue"}
            </div>
        )}

        <div
            className="px-3 pb-2 flex items-center justify-between cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
        <span className="text-[11px] text-gray-500 font-medium">
          Columns <span className="font-bold text-gray-700">{node.columnCount}</span>
        </span>
          {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>

        {expanded && (
            <div className="border-t border-gray-100">
              {isCenter && (
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <div className="relative">
                      <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                          className="w-full text-[11px] pl-5 pr-2 py-1 border border-gray-100 rounded-md bg-gray-50 placeholder-gray-300 focus:outline-none"
                          placeholder="Find column"
                          value={colSearch}
                          onChange={(e) => setColSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
              )}
              <ul className="max-h-44 overflow-y-auto">
                {filteredCols.length === 0 ? (
                    <li className="px-3 py-2 text-[11px] text-gray-300 italic">No columns</li>
                ) : (
                    filteredCols.map((col) => (
                        <li 
                            key={col.id} 
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-50/60 transition-colors lng-col cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onColumnClick(col, node.label, e.clientX, e.clientY);
                            }}
                        >
                          <span className="w-5 text-center flex-shrink-0">{colTypeIcon(col.data_type)}</span>
                          <span className="text-[11px] text-gray-700 truncate flex-1">{col.name}</span>
                          <span className="text-[9px] text-gray-300 flex-shrink-0 font-mono">{parseDataType(col.data_type)}</span>
                        </li>
                    ))
                )}
              </ul>
            </div>
        )}
      </div>
  );
}

// ─── SVG Edge Layer ───────────────────────────────────────────────────────────

function EdgeLayer({
                     edges, positions, onEdgeClick, activeEdge,
                   }: {
  edges: InternalEdge[];
  positions: Record<string, NodeRect>;
  onEdgeClick: (edge: InternalEdge, sx: number, sy: number) => void;
  activeEdge: InternalEdge | null;
}) {
  return (
      <svg style={{ position: "absolute", top: 0, left: 0, width: "5000px", height: "5000px", overflow: "visible" }}>
        <defs>
          <marker id="lng-arrow-p" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#6366f1" />
          </marker>
          <marker id="lng-arrow-pa" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#7c3aed" />
          </marker>
          <marker id="lng-arrow-s" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#9ca3af" />
          </marker>
          <marker id="lng-arrow-fail" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
          </marker>
          <marker id="lng-arrow-fail-a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
          </marker>
        </defs>
        {edges.map((edge, i) => {
          const from = positions[edge.from], to = positions[edge.to];
          if (!from || !to) return null;
          const x1 = from.x + from.w, y1 = from.y + from.h / 2;
          const x2 = to.x, y2 = to.y + to.h / 2;
          const cx = (x1 + x2) / 2;
          const d = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
          const isActive = activeEdge?.from === edge.from && activeEdge?.to === edge.to;
          const hasQuery = !!edge.transformationQuery;
          const isFailed = edge.queryExecution?.query_status === "FAILURE";
          const isInventory = edge.fromLabel.toLowerCase().includes("inventory_management") || edge.toLabel.toLowerCase().includes("inventory_management");
          const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;

          // Determine colors based on failure status
          const edgeColor = isFailed
            ? (isActive ? "#dc2626" : "#ef4444")
            : (isActive ? "#7c3aed" : (edge.isSecondary || isInventory) ? "#9ca3af" : "#6366f1");
          const markerEnd = isFailed
            ? (isActive ? "url(#lng-arrow-fail-a)" : "url(#lng-arrow-fail)")
            : (isActive ? "url(#lng-arrow-pa)" : (edge.isSecondary || isInventory) ? "url(#lng-arrow-s)" : "url(#lng-arrow-p)");

          return (
              <g key={i}>
                <path
                    d={d} fill="none" stroke="transparent" strokeWidth={18}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); onEdgeClick(edge, e.clientX, e.clientY); }}
                />
                <path
                    d={d} fill="none"
                    stroke={edgeColor}
                    strokeWidth={isActive ? 2.5 : edge.isSecondary ? 1.5 : 2}
                    strokeDasharray={edge.isSecondary && !isActive ? "6 4" : undefined}
                    markerEnd={markerEnd}
                    opacity={isActive ? 1 : 0.85}
                    style={{ pointerEvents: "none" }}
                />
                {hasQuery && (
                    <g
                        style={{ cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); onEdgeClick(edge, e.clientX, e.clientY); }}
                    >
                      <circle cx={midX} cy={midY} r={9} fill="white" stroke={edgeColor} strokeWidth={1.5} />
                      <circle cx={midX} cy={midY} r={5} fill={edgeColor} />
                      <text x={midX} y={midY + 3.5} textAnchor="middle" fontSize="7" fontFamily="monospace" fontWeight="bold" fill="white">{"{}"}</text>
                    </g>
                )}
              </g>
          );
        })}
      </svg>
  );
}

// ─── Depth / Direction Controls ───────────────────────────────────────────────

function DepthControl({
                        depth, direction, onChange,
                      }: {
  depth: number;
  direction: "upstream" | "downstream" | "both";
  onChange: (d: number, dir: "upstream" | "downstream" | "both") => void;
}) {
  return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 font-medium">Depth</span>
        {[1, 2, 3, 4].map((d) => (
            <button
                key={d}
                onClick={() => onChange(d, direction)}
                className={`w-6 h-6 rounded-md text-[11px] font-bold border transition-colors ${
                    depth === d
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                }`}
            >
              {d}
            </button>
        ))}
        <span className="ml-2 text-[11px] text-gray-500 font-medium">Direction</span>
        {(["both", "upstream", "downstream"] as const).map((d) => (
            <button
                key={d}
                onClick={() => onChange(depth, d)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize transition-colors ${
                    direction === d
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                }`}
            >
              {d}
            </button>
        ))}
      </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DatasetLineageProps { datasetId: string; datasetName: string; }

export default function DatasetLineage({ datasetId, datasetName }: DatasetLineageProps) {
  const [apiData, setApiData] = useState<LineageVisualResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState(2);
  const [direction, setDirection] = useState<"upstream" | "downstream" | "both">("both");

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
  const [fixedNodeIds, setFixedNodeIds] = useState<Set<string>>(new Set());
  const [fixingNodeIds, setFixingNodeIds] = useState<Set<string>>(new Set());

  const handleAutoFix = useCallback((nodeId: string) => {
    setFixingNodeIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => {
      setFixingNodeIds(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      setFixedNodeIds(prev => new Set(prev).add(nodeId));
    }, 4000);
  }, []);

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchor | null>(null);
  const [clickedEdge, setClickedEdge] = useState<ClickedEdge | null>(null);
  const [clickedColumn, setClickedColumn] = useState<{ col: InternalColumn, nodeLabel: string, screenX: number, screenY: number } | null>(null);

  const handleHeightChange = useCallback((id: string, h: number) => {
    setNodeHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  const fetchData = useCallback(() => {
    if (!datasetId) return;
    setIsLoading(true); setError(null); setNodeHeights({}); setNodePositions({});
    setFixedNodeIds(new Set()); setFixingNodeIds(new Set()); // Reset mock state on fresh fetch
    dashboardApiServices.fetchLineageVisual(datasetId, depth, direction)
        .then((data) => { setApiData(data); })
        .catch(() => setError("Failed to load lineage data."))
        .finally(() => setIsLoading(false));
  }, [datasetId, depth, direction]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const { nodes: defaultNodes, edges } = useMemo(() => 
    apiData ? buildGraph(apiData, fixedNodeIds) : { nodes: [], edges: [] }, 
  [apiData, fixedNodeIds]);
  const nodes = useMemo(() => defaultNodes.map(n => ({
    ...n,
    x: nodePositions[n.id]?.x ?? n.x,
    y: nodePositions[n.id]?.y ?? n.y
  })), [defaultNodes, nodePositions]);
  const visibleNodes = search.trim()
      ? nodes.filter((n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.sourceName.toLowerCase().includes(search.toLowerCase()) ||
          n.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      )
      : nodes;

  const positions: Record<string, NodeRect> = {};
  nodes.forEach((n) => {
    positions[n.id] = { x: n.x, y: n.y, w: n.isCenter ? CENTER_W : CARD_W, h: nodeHeights[n.id] ?? CARD_H_EST };
  });

  const popoverNode = popoverAnchor ? nodes.find((n) => n.id === popoverAnchor.nodeId) ?? null : null;

  const handleNodeClick = useCallback((nodeId: string, rect: DOMRect) => {
    if (hasDragged.current) return;
    setClickedEdge(null);
    setClickedColumn(null);
    setPopoverAnchor((prev) => prev?.nodeId === nodeId ? null : { nodeId, rect });
  }, []);

  const handleEdgeClick = useCallback((edge: InternalEdge, sx: number, sy: number) => {
    setPopoverAnchor(null);
    setClickedColumn(null);
    setClickedEdge((prev) =>
        prev?.edge.from === edge.from && prev?.edge.to === edge.to ? null : { edge, screenX: sx, screenY: sy }
    );
  }, []);

  const handleColumnClick = useCallback((col: InternalColumn, nodeLabel: string, sx: number, sy: number) => {
    if (hasDragged.current) return;
    setPopoverAnchor(null);
    setClickedEdge(null);
    setClickedColumn((prev) =>
        prev?.col.id === col.id ? null : { col, nodeLabel, screenX: sx, screenY: sy }
    );
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string, currentX: number, currentY: number) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest(".lng-col") || (e.target as HTMLElement).closest(".nodrag")) return;
    setDraggingNode(nodeId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    nodeStartPos.current = { x: currentX, y: currentY };
    hasDragged.current = false;
    e.stopPropagation();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".lng-node")) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      hasDragged.current = true;
      const dx = (e.clientX - dragStartPos.current.x) / scale;
      const dy = (e.clientY - dragStartPos.current.y) / scale;
      setNodePositions((prev) => ({
        ...prev,
        [draggingNode]: {
          x: nodeStartPos.current.x + dx,
          y: nodeStartPos.current.y + dy,
        },
      }));
      return;
    }
    if (!isPanning) return;
    setPan({
      x: panOrigin.current.x + (e.clientX - panStart.current.x),
      y: panOrigin.current.y + (e.clientY - panStart.current.y),
    });
  }, [isPanning, draggingNode, scale]);

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNode(null);
    setTimeout(() => { hasDragged.current = false; }, 50);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest(".lng-node")) return;
    e.preventDefault();
    setScale((s) => Math.min(2, Math.max(0.25, s - e.deltaY * 0.001)));
  }, []);

  const resetView = () => { setScale(0.85); setPan({ x: 60, y: 40 }); setNodePositions({}); };

  return (
      <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#f8f9fb] rounded-xl">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0 z-10 gap-3 flex-wrap">
          <div className="relative w-48 flex-shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                className="w-full text-xs pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
            <span className="text-xs font-semibold text-indigo-700">
            Lineage for <span className="font-bold">{datasetName}</span>
          </span>
            {!isLoading && <span className="text-[10px] text-indigo-400 font-medium">· {nodes.length} nodes</span>}
            <button className="text-indigo-300 hover:text-indigo-500 ml-1"><MoreHorizontal size={13} /></button>
          </div>
          <DepthControl
              depth={depth}
              direction={direction}
              onChange={(d, dir) => { setDepth(d); setDirection(dir); }}
          />
        </div>

        {/* ── Canvas ── */}
        <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden"
            style={{
              cursor: isPanning ? "grabbing" : "grab",
              backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest(".lng-node") && !(e.target as HTMLElement).closest(".lng-col")) {
                setPopoverAnchor(null);
                setClickedEdge(null);
                setClickedColumn(null);
              }
            }}
        >
          {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <p className="text-sm text-gray-500 font-medium">Building lineage graph…</p>
                </div>
              </div>
          )}
          {error && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3 text-center px-8">
                  <AlertTriangle className="w-10 h-10 text-yellow-400" />
                  <p className="text-sm font-semibold text-gray-700">{error}</p>
                  <button onClick={fetchData} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
                </div>
              </div>
          )}
          {!isLoading && !error && nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-400">No lineage data available</p>
                </div>
              </div>
          )}

          {!isLoading && !error && nodes.length > 0 && (
              <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: "0 0",
                    position: "absolute",
                    willChange: "transform",
                  }}
              >
                <EdgeLayer
                    edges={edges}
                    positions={positions}
                    onEdgeClick={handleEdgeClick}
                    activeEdge={clickedEdge?.edge ?? null}
                />
                {visibleNodes.map((node) => (
                    <div
                        key={node.id}
                        className="lng-node"
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id, node.x, node.y)}
                        style={{
                          position: "absolute",
                          left: node.x,
                          top: node.y,
                          width: node.isCenter ? CENTER_W : CARD_W,
                          cursor: draggingNode === node.id ? "grabbing" : draggingNode ? "default" : "grab",
                          userSelect: draggingNode === node.id ? "none" : "auto",
                          zIndex: draggingNode === node.id ? 50 : 1,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                      <NodeCard
                          node={node}
                          isSelected={popoverAnchor?.nodeId === node.id}
                          popoverOpen={popoverAnchor?.nodeId === node.id}
                          onClick={(rect) => handleNodeClick(node.id, rect)}
                          onHeightChange={handleHeightChange}
                          onColumnClick={handleColumnClick}
                      />
                    </div>
                ))}
              </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-2 left-2 bg-white border border-gray-200 rounded-xl shadow-sm p-2 text-[10px] text-gray-500 pointer-events-none z-10 min-w-[140px]">
            <p className="font-semibold text-gray-700 mb-1.5 uppercase tracking-wide text-[10px]">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-1"><span className="text-gray-500">{typeIcon("table")}</span> Table</div>
              <div className="flex items-center gap-1"><span className="text-gray-500">{typeIcon("view")}</span> View</div>
              <div className="flex items-center gap-1"><span className="text-gray-500">{typeIcon("dashboard")}</span> Dashboard</div>
              <div className="flex items-center gap-1"><span className="w-8 h-0.5 bg-indigo-500 rounded inline-block" /> Data flow</div>
              <div className="flex items-center gap-1"><span className="w-8 h-0.5 bg-gray-400 rounded inline-block" /> Inventory flow</div>
              <div className="flex items-center gap-1"><span className="w-8 h-0.5 bg-red-500 rounded inline-block" /> Failed flow</div>
              <div className="flex items-center gap-1"><span className="w-8 border-t border-dashed border-gray-400 inline-block" /> Secondary flow</div>
              <div className="flex items-center gap-1"><span className="text-gray-400 text-[10px]">✦</span> Has AI summary</div>
              <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-white border border-indigo-400 flex items-center justify-center flex-shrink-0">
                <span className="w-[5px] h-[5px] rounded-full bg-indigo-500" />
              </span>
                Transformation query
              </div>
            </div>
            <p className="font-semibold text-gray-700 my-1.5 uppercase tracking-wide text-[10px]">Controls</p>
            <div className="space-y-1">
              {[["Scroll","Zoom"],["Drag","Pan"],["Click Node","AI Summary"],["Click Arrow","Transformation"]].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-1">
                    <kbd className="bg-gray-100 border border-gray-200 rounded p-0.5 text-[8px] font-mono">{k}</kbd>
                    <span>{l}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
            {([
              [<ZoomIn size={14} />, () => setScale((s) => Math.min(2, s + 0.1))],
              [<ZoomOut size={14} />, () => setScale((s) => Math.max(0.25, s - 0.1))],
              [<RotateCcw size={14} />, resetView],
              [<Maximize2 size={14} />, () => {}],
            ] as [React.ReactNode, () => void][]).map(([icon, handler], i) => (
                <button
                    key={i}
                    onClick={handler}
                    className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {icon}
                </button>
            ))}
          </div>
        </div>

        {/* ── AI Summary Popover ── */}
        {popoverAnchor && popoverNode && (
            <AiSummaryPopover
                key={popoverAnchor.nodeId}
                node={popoverNode}
                anchor={popoverAnchor}
                onClose={() => setPopoverAnchor(null)}
                onAutoFix={handleAutoFix}
                isFixing={fixingNodeIds.has(popoverNode.id)}
                isFixed={fixedNodeIds.has(popoverNode.id)}
            />
        )}

        {/* ── Transformation Query Popup ── */}
        {clickedEdge && (
            <TransformationPopup
                edge={clickedEdge.edge}
                screenX={clickedEdge.screenX}
                screenY={clickedEdge.screenY}
                onClose={() => setClickedEdge(null)}
            />
        )}

        {/* ── Column Query Popup ── */}
        {clickedColumn && (
            <ColumnQueryPopup
                col={clickedColumn.col}
                nodeLabel={clickedColumn.nodeLabel}
                screenX={clickedColumn.screenX}
                screenY={clickedColumn.screenY}
                onClose={() => setClickedColumn(null)}
            />
        )}
      </div>
  );
}