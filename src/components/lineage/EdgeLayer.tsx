"use client";

import React from "react";
import type { InternalEdge, NodeRect } from "@/hooks/useLineageStateEngine";

interface EdgeLayerProps {
  edges: InternalEdge[];
  positions: Record<string, NodeRect>;
  onEdgeClick: (edge: InternalEdge, sx: number, sy: number) => void;
  activeEdge: InternalEdge | null;
}

function EdgeLayer({ edges, positions, onEdgeClick, activeEdge }: EdgeLayerProps) {
  return (
    <svg style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }} width="10000" height="8000">
      <defs>
        <marker id="lng-arrow-p" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0.5 L0,7.5 L7.5,4 z" fill="#818cf8" />
        </marker>
        <marker id="lng-arrow-pa" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0.5 L0,7.5 L7.5,4 z" fill="#7c3aed" />
        </marker>
        <marker id="lng-arrow-s" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0.5 L0,7.5 L7.5,4 z" fill="#9ca3af" />
        </marker>
        <marker id="lng-arrow-fail" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0.5 L0,7.5 L7.5,4 z" fill="#ef4444" />
        </marker>
        <marker id="lng-arrow-fail-a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0.5 L0,7.5 L7.5,4 z" fill="#dc2626" />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const from = positions[edge.from], to = positions[edge.to];
        if (!from || !to) return null;

        const x1 = from.x + from.w - 2;
        const y1 = from.y + from.h / 2;
        const x2 = to.x + 2;
        const y2 = to.y + to.h / 2;

        const absDx = Math.abs(x2 - x1);
        const absDy = Math.abs(y2 - y1);
        const cOffset = Math.max(absDx * 0.45, absDy * 0.25, 80);
        const d = `M${x1},${y1} C${x1 + cOffset},${y1} ${x2 - cOffset},${y2} ${x2},${y2}`;

        const isActive = activeEdge?.from === edge.from && activeEdge?.to === edge.to;
        const hasQuery = !!edge.transformationQuery;
        const isFailed = edge.queryExecution?.query_status === "FAILURE";
        const isInventory = edge.fromLabel.toLowerCase().includes("inventory_management") || edge.toLabel.toLowerCase().includes("inventory_management");
        const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
        const isIdemp = edge.isIdempotent;

        const edgeColor = isFailed
          ? (isActive ? "#dc2626" : "#ef4444")
          : (isActive ? "#7c3aed" : (edge.isSecondary || isInventory || isIdemp) ? "#9ca3af" : "#818cf8");
        const markerEnd = isFailed
          ? (isActive ? "url(#lng-arrow-fail-a)" : "url(#lng-arrow-fail)")
          : (isActive ? "url(#lng-arrow-pa)" : (edge.isSecondary || isInventory || isIdemp) ? "url(#lng-arrow-s)" : "url(#lng-arrow-p)");

        return (
          <g key={i}>
            <path
              d={d} fill="none" stroke="transparent" strokeWidth={18}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); onEdgeClick(edge, e.clientX, e.clientY); }}
            />
            <path
              d={d} fill="none"
              stroke={edgeColor}
              strokeWidth={isActive ? 3 : edge.isSecondary ? 1.5 : 2.5}
              strokeDasharray={edge.isSecondary && !isActive ? "6 4" : undefined}
              markerEnd={markerEnd}
              opacity={isActive ? 1 : 0.9}
              style={{ pointerEvents: "none" }}
              className="transition-all duration-300 ease-in-out"
            />
            {hasQuery && (
              <g
                style={{ pointerEvents: "all", cursor: "pointer" }}
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

export const MemoizedEdgeLayer = React.memo(EdgeLayer, (prev, next) => {
  return prev.edges === next.edges &&
    prev.positions === next.positions &&
    prev.activeEdge === next.activeEdge;
});
