"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, ChevronUp, MoreHorizontal, AlertCircle } from "lucide-react";
import type { InternalNode, InternalColumn } from "@/hooks/useLineageStateEngine";
import { colTypeIcon, qualityDot, tagPillClass, parseDataType, getNodeIconSrc } from "./lineageUtils";

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
        "select-none cursor-pointer rounded-xl border bg-white transition-all w-full overflow-hidden",
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
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex-shrink-0 flex items-center justify-center ${isCenter ? "text-indigo-500" : "text-gray-400"}`}>
            <div className={`flex items-center justify-center rounded-lg ${isCenter ? 'w-[30px] h-[30px] shadow-sm' : 'w-10 h-10 shadow-sm'}`}>
              <img src={getNodeIconSrc(node.label)} alt={node.label} className={`${isCenter ? 'w-[20px] h-[20px]' : 'w-10 h-10'} object-contain mix-blend-multiply`} />
            </div>
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
            <span key={tag.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${tagPillClass(tag.name)}`}>
              {tag.name}
            </span>
          ))}
          {qualityDot(node.qualityStatus)}
          {node.aiSummary && (
            <span
              className={`flex-shrink-0 ml-0.5 text-[11px] font-bold transition-colors leading-none ${isHighlighted ? "text-indigo-400" : "text-gray-300"}`}
              title="AI summary available"
            >
              ✦
            </span>
          )}
          <button className="text-gray-300 hover:text-gray-500 transition-colors ml-0.5" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-3 pt-2 pb-1">
        <p className={`font-bold truncate ${isCenter ? "text-indigo-700 text-sm" : "text-gray-800 text-xs"}`}>{node.label}</p>
        {node.sourceType && (
          <p className="text-[10px] text-gray-400 truncate capitalize mt-0.5">{node.sourceType}</p>
        )}
      </div>

      {/* Quality warning */}
      {(node.qualityStatus === "error" || node.qualityStatus === "unhealthy") && (
        <div className="mx-3 mb-2 flex items-center gap-1 text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
          <AlertCircle size={10} /> {node.qualityStatus === "unhealthy" ? "Unhealthy — execution failure" : "Data quality issue"}
        </div>
      )}

      {/* Expand toggle */}
      <div className="px-3 pb-2 flex items-center justify-between cursor-pointer" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
        <span className="text-[11px] text-gray-500 font-medium">Columns <span className="font-bold text-gray-700">{node.columnCount}</span></span>
        {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </div>

      {/* Columns list */}
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
                  onClick={(e) => { e.stopPropagation(); onColumnClick(col, node.label, e.clientX, e.clientY); }}
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

export const MemoizedNodeCard = React.memo(NodeCard, (prev, next) => {
  return prev.node === next.node &&
    prev.isSelected === next.isSelected &&
    prev.popoverOpen === next.popoverOpen;
});
