"use client";

/**
 * lineageUtils.tsx
 *
 * Pure utility functions and shared UI helpers for lineage sub-components.
 * No state, no hooks — only pure computations and JSX renderers.
 */

import React, { useState, useLayoutEffect } from "react";
import type { NodeType, QualityStatus, InternalColumn } from "@/hooks/useLineageStateEngine";
import s3Icon from "@/assets/node-img-icons/amazon-s3-img-icon .jpg";
import apiIcon from "@/assets/node-img-icons/api-img-icon.png";
import lambdaIcon from "@/assets/node-img-icons/lambda-img-icon.jpg";
import mssqlIcon from "@/assets/node-img-icons/ms-sql-img-icon.jpg";
import nifiIcon from "@/assets/node-img-icons/nifi-img-icon.png";
import redshiftIcon from "@/assets/node-img-icons/redshift-img-icon.png";
import sparkIcon from "@/assets/node-img-icons/spark-img-icon-transparent.png";

// ─── Type icon (table / view / dashboard) ────────────────────────────────────
export function typeIcon(type: NodeType, cls = "w-3.5 h-3.5") {
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

// ─── Node icon resolver ───────────────────────────────────────────────────────
export function getNodeIconSrc(label: string) {
  const lbl = label.toLowerCase();
  // Cast module exports to any to safely check .src property
  const getSrc = (img: any) => img?.src || img;

  if (lbl === "api") return getSrc(apiIcon);
  if (lbl === "lambda") return getSrc(lambdaIcon);
  if (lbl === "nifi") return getSrc(nifiIcon);
  if (["microsoft_sql_server", "microsoft sql server", "ms sql server", "ms_sql_server"].includes(lbl)) return getSrc(mssqlIcon);
  if (["ods_profiles", "sfmc_profiles", "ciam_profiles"].includes(lbl)) return getSrc(sparkIcon);
  if (lbl === "cdp_profiles") return getSrc(redshiftIcon);
  return getSrc(s3Icon);
}

// ─── Column data-type icon ─────────────────────────────────────────────────────
export function colTypeIcon(dt: string) {
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

// ─── Quality status dot ────────────────────────────────────────────────────────
export function qualityDot(status: QualityStatus) {
  if (status === "healthy") return (
    <span className="w-4 h-4 rounded-full border-2 border-green-400 flex items-center justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
    </span>
  );
  if (status === "idempotent") return (
    <span className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
    </span>
  );
  if (status === "error" || status === "unhealthy") return (
    <span className="w-4 h-4 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-500 text-[9px] font-black">!</span>
  );
  return (
    <span className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-500 text-[9px] font-black">!</span>
  );
}

// ─── Parse datatype from raw schema string ─────────────────────────────────────
export function parseDataType(raw: string): string {
  const m = raw.match(/type['\"]?\s*:\s*([A-Za-z]+)/);
  if (m) return m[1].replace("TypeClass", "").replace("Class", "").toLowerCase();
  return raw.length > 20 ? raw.slice(0, 18) + "…" : raw;
}

// ─── Tag pill CSS class ────────────────────────────────────────────────────────
export function tagPillClass(name: string) {
  const n = name.toLowerCase();
  if (n === "pii" || n === "phi") return "bg-red-50 text-red-600 border-red-200";
  if (n === "financial" || n === "finance") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (n === "gdpr" || n === "hipaa" || n === "sox") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

// ─── SQL keyword highlighter (shared by TransformationPopup and ColumnQueryPopup) ─
export const SQL_KEYWORDS = [
  "SELECT","FROM","WHERE","JOIN","LEFT","RIGHT","INNER","OUTER","ON","GROUP BY","ORDER BY",
  "HAVING","WITH","AS","AND","OR","NOT","IN","LIMIT","UNION","INSERT","UPDATE","DELETE","SET",
  "CREATE","TABLE","VIEW","DISTINCT","COUNT","SUM","AVG","MAX","MIN","CASE","WHEN","THEN",
  "ELSE","END","NULL","IS","LIKE","BETWEEN","EXISTS",
];

export function SqlHighlighter({ sql }: { sql: string }) {
  const parts = sql.split(new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi"));
  return (
    <>
      {parts.map((part, idx) => {
        if (SQL_KEYWORDS.includes(part.toUpperCase()))
          return <span key={idx} className="text-violet-600 font-bold">{part}</span>;
        if (/^'.*'$/.test(part))
          return <span key={idx} className="text-amber-600 font-medium italic">{part}</span>;
        if (/^\d+$/.test(part.trim()))
          return <span key={idx} className="text-blue-600 font-semibold">{part}</span>;
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

// ─── Smart popup positioning hooks ────────────────────────────────────────────
export function useSmartPosition(
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
    const left = Math.max(PAD, Math.min(anchorX - elW / 2, vw - elW - PAD));
    const belowY = anchorY + 16;
    let top = belowY + elH + PAD > vh ? Math.max(TOP_SAFE, anchorY - elH - 16) : belowY;
    top = Math.max(TOP_SAFE, Math.min(top, vh - elH - PAD));
    setPos({ left, top });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorX, anchorY, ref.current?.offsetHeight, ref.current?.offsetWidth]);
  return pos;
}

export function useSmartPositionFromRect(
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
    const left = spaceRight >= popoverW || spaceRight >= spaceLeft
      ? Math.min(rect.right + PAD, vw - popoverW - PAD)
      : Math.max(PAD, rect.left - popoverW - PAD);
    let top = Math.max(TOP_SAFE, rect.top);
    if (top + elH + PAD > vh) top = Math.max(TOP_SAFE, vh - elH - PAD);
    setPos({ left, top });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect?.left, rect?.top, rect?.right, popoverW, ref.current?.offsetHeight]);
  return pos;
}
