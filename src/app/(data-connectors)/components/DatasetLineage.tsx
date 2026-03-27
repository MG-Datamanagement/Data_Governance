"use client";

/**
 * DatasetLineage.tsx — Orchestrator
 *
 * Reduced from 1,614 lines to ~250 lines by extracting all sub-components
 * and utilities into the lineage/ sub-directory.
 *
 * Sub-components:
 *  - lineage/AiSummaryPopover.tsx   — AI insight popover with fix remediation
 *  - lineage/TransformationPopup.tsx — Edge SQL transformation popup
 *  - lineage/ColumnQueryPopup.tsx   — Column expression popup
 *  - lineage/NodeCard.tsx           — Individual node card + memoized wrapper
 *  - lineage/EdgeLayer.tsx          — SVG edge layer + memoized wrapper
 *  - lineage/DepthControl.tsx       — Depth / direction toolbar controls
 *  - lineage/SqlEditorSidebar.tsx   — Manual SQL remediation sidebar
 *  - lineage/lineageUtils.tsx       — Pure utils: typeIcon, qualityDot, positionHooks, etc.
 *  - lineage/lineage.types.ts       — Layout constants (CARD_W, GAP_Y, etc.)
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, MoreHorizontal, Loader2, AlertTriangle } from "lucide-react";
import { useLineageStateEngine, InternalColumn, InternalEdge, InternalNode, NodeRect, ClickedEdge, PopoverAnchor } from "@/hooks/useLineageStateEngine";
import { AiSummaryPopover } from "./lineage/AiSummaryPopover";
import { TransformationPopup } from "./lineage/TransformationPopup";
import { ColumnQueryPopup } from "./lineage/ColumnQueryPopup";
import { MemoizedNodeCard } from "./lineage/NodeCard";
import { MemoizedEdgeLayer } from "./lineage/EdgeLayer";
import { DepthControl } from "./lineage/DepthControl";
import { SqlEditorSidebar } from "./lineage/SqlEditorSidebar";
import { typeIcon } from "./lineage/lineageUtils";
import { CARD_W, CENTER_W, CARD_H_EST, GAP_Y } from "./lineage/lineage.types";

interface DatasetLineageProps { datasetId: string; datasetName: string; }

export default function DatasetLineage({ datasetId, datasetName }: DatasetLineageProps) {
  const { depth, setDepth, direction, setDirection, isLoading, error, refetchLineageData, defaultNodes, edges, fixedNodeIds, setFixedNodeIds } = useLineageStateEngine(datasetId, 2);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.82);
  const [pan, setPan] = useState({ x: 60, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const [search, setSearch] = useState("");
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
  const hasAutoFit = useRef(false);
  const [fixedNodes, setFixedNodes] = useState<Record<string, 'auto' | 'manual'>>({});
  const [fixingNodeIds, setFixingNodeIds] = useState<Set<string>>(new Set());
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const [popoverAnchor, setPopoverAnchor] = useState<PopoverAnchor | null>(null);
  const [showSqlSidebar, setShowSqlSidebar] = useState(false);
  const [sidebarNodeId, setSidebarNodeId] = useState<string | null>(null);
  const [manualFixingNodeId, setManualFixingNodeId] = useState<string | null>(null);
  const [clickedEdge, setClickedEdge] = useState<ClickedEdge | null>(null);
  const [clickedColumn, setClickedColumn] = useState<{ col: InternalColumn, nodeLabel: string, screenX: number, screenY: number } | null>(null);

  const handleAutoFix = useCallback((nodeId: string) => {
    setFixingNodeIds(prev => new Set(prev).add(nodeId));
    setTimeout(() => {
      setFixingNodeIds(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
      setFixedNodes(prev => ({ ...prev, [nodeId]: 'auto' }));
      setFixedNodeIds(prev => new Set(prev).add(nodeId));
    }, 4000);
  }, [setFixedNodeIds]);

  const handleOpenManualFix = useCallback((nodeId: string) => {
    setSidebarNodeId(nodeId);
    setShowSqlSidebar(true);
  }, []);

  const handleManualFixApply = useCallback((nodeId: string) => {
    setManualFixingNodeId(nodeId);
    setTimeout(() => {
      setManualFixingNodeId(null);
      setFixedNodes(prev => ({ ...prev, [nodeId]: 'manual' }));
      setFixedNodeIds(prev => new Set(prev).add(nodeId));
      setShowSqlSidebar(false);
    }, 4000);
  }, []);

  const handleHeightChange = useCallback((id: string, h: number) => {
    setNodeHeights((prev) => (prev[id] === h ? prev : { ...prev, [id]: h }));
  }, []);

  useEffect(() => {
    setNodeHeights({});
    setNodePositions({});
    setFixedNodeIds(new Set());
    setFixingNodeIds(new Set());
    setFixedNodes({});
  }, [datasetId, depth, setFixedNodeIds]);

  const positions = useMemo(() => {
    const pos: Record<string, NodeRect> = {};
    const colStacks: Record<number, { id: string, h: number }[]> = {};

    defaultNodes.forEach(n => {
      if (!colStacks[n.colIndex]) colStacks[n.colIndex] = [];
      if (!colStacks[n.colIndex].find(x => x.id === n.id)) {
        colStacks[n.colIndex].push({ id: n.id, h: nodeHeights[n.id] ?? CARD_H_EST });
      }
    });

    defaultNodes.forEach((n) => {
      let x = n.x;
      let y = n.y;
      const isDragged = !!nodePositions[n.id];

      if (isDragged) {
        x = nodePositions[n.id].x;
        y = nodePositions[n.id].y;
      } else if (colStacks[n.colIndex]) {
        const stack = colStacks[n.colIndex];
        const totalH = stack.reduce((acc, curr) => acc + curr.h, 0) + (stack.length - 1) * GAP_Y;
        const startY = 400 - totalH / 2;
        let currentY = startY;
        for (const item of stack) {
          if (item.id === n.id) { y = currentY; break; }
          currentY += item.h + GAP_Y;
        }
      }

      pos[n.id] = { x, y, w: n.isCenter ? CENTER_W : CARD_W, h: nodeHeights[n.id] ?? CARD_H_EST };
    });
    return pos;
  }, [defaultNodes, nodePositions, nodeHeights]);

  const visibleNodes = search.trim()
    ? defaultNodes.filter((n) =>
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.sourceName.toLowerCase().includes(search.toLowerCase()) ||
        n.columns.some((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      )
    : defaultNodes;

  const popoverNode = popoverAnchor ? defaultNodes.find((n) => n.id === popoverAnchor.nodeId) ?? null : null;

  const handleNodeClick = useCallback((nodeId: string, rect: DOMRect) => {
    if (hasDragged.current) return;
    setClickedEdge(null);
    setClickedColumn(null);
    setPopoverAnchor((prev) => prev?.nodeId === nodeId ? null : { nodeId, rect });
  }, []);

  const handleEdgeClick = useCallback((edge: InternalEdge, sx: number, sy: number) => {
    setPopoverAnchor(null);
    setClickedColumn(null);
    setClickedEdge((prev) => prev?.edge.from === edge.from && prev?.edge.to === edge.to ? null : { edge, screenX: sx, screenY: sy });
  }, []);

  const handleColumnClick = useCallback((col: InternalColumn, nodeLabel: string, sx: number, sy: number) => {
    if (hasDragged.current) return;
    setPopoverAnchor(null);
    setClickedEdge(null);
    setClickedColumn((prev) => prev?.col.id === col.id ? null : { col, nodeLabel, screenX: sx, screenY: sy });
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
      setNodePositions((prev) => ({ ...prev, [draggingNode]: { x: nodeStartPos.current.x + dx, y: nodeStartPos.current.y + dy } }));
      return;
    }
    if (!isPanning) return;
    setPan({ x: panOrigin.current.x + (e.clientX - panStart.current.x), y: panOrigin.current.y + (e.clientY - panStart.current.y) });
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

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || !defaultNodes.length) return;
    const vw = container.clientWidth, vh = container.clientHeight, PADDING = 60;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    defaultNodes.forEach(n => {
      const pos = positions[n.id];
      if (!pos) return;
      minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.w); maxY = Math.max(maxY, pos.y + pos.h);
    });
    if (!isFinite(minX)) return;
    const fitScale = Math.min((vw - PADDING * 2) / (maxX - minX), (vh - PADDING * 2) / (maxY - minY), 1);
    setScale(parseFloat(fitScale.toFixed(3)));
    setPan({ x: PADDING - minX * fitScale, y: PADDING - minY * fitScale });
  }, [defaultNodes, positions]);

  const resetView = () => { setScale(0.82); setPan({ x: 60, y: 40 }); setNodePositions({}); };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#f8f9fb] rounded-xl">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0 z-10 gap-1 flex-wrap">
        <div className="relative w-48 flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full text-xs pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 transition-all"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
          <span className="text-xs font-semibold text-indigo-700">
            Lineage for <span className="font-bold">{datasetName}</span>
          </span>
          {!isLoading && <span className="text-[10px] text-indigo-400 font-medium">· {defaultNodes.length} nodes</span>}
          <button className="text-indigo-300 hover:text-indigo-500 ml-1"><MoreHorizontal size={13} /></button>
        </div>
        <DepthControl depth={depth} direction={direction} onChange={(d, dir) => { setDepth(d); setDirection(dir); }} />
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ cursor: isPanning ? "grabbing" : "grab", backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".lng-node") && !(e.target as HTMLElement).closest(".lng-col")) {
            setPopoverAnchor(null); setClickedEdge(null); setClickedColumn(null);
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
              <button onClick={() => refetchLineageData()} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
            </div>
          </div>
        )}
        {!isLoading && !error && defaultNodes.length === 0 && (
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

        {!isLoading && !error && defaultNodes.length > 0 && (
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0", position: "absolute", willChange: "transform" }}>
            <MemoizedEdgeLayer edges={edges} positions={positions} onEdgeClick={handleEdgeClick} activeEdge={clickedEdge?.edge ?? null} />
            {visibleNodes.map((node) => (
              <div
                key={node.id}
                className="lng-node"
                onMouseDown={(e) => handleNodeMouseDown(e, node.id, positions[node.id].x, positions[node.id].y)}
                style={{
                  position: "absolute", left: 0, top: 0,
                  transform: `translate(${positions[node.id].x}px, ${positions[node.id].y}px)`,
                  width: node.isCenter ? CENTER_W : CARD_W,
                  cursor: draggingNode === node.id ? "grabbing" : draggingNode ? "default" : "grab",
                  willChange: "transform",
                  userSelect: draggingNode === node.id ? "none" : "auto",
                  zIndex: draggingNode === node.id ? 50 : 1,
                  transition: draggingNode === node.id ? "none" : "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <MemoizedNodeCard
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
            {[["Scroll", "Zoom"], ["Drag", "Pan"], ["Click Node", "AI Summary"], ["Click Arrow", "Transformation"]].map(([k, l]) => (
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
            [<Maximize2 size={14} />, fitToView],
          ] as [React.ReactNode, () => void][]).map(([icon, handler], i) => (
            <button key={i} onClick={handler} className="w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* AI Summary Popover */}
      {popoverAnchor && popoverNode && (
        <AiSummaryPopover
          key={popoverAnchor.nodeId}
          node={popoverNode}
          anchor={popoverAnchor}
          onClose={() => setPopoverAnchor(null)}
          onAutoFix={handleAutoFix}
          onOpenManualFix={handleOpenManualFix}
          isFixing={fixingNodeIds.has(popoverNode.id) || manualFixingNodeId === popoverNode.id}
          isFixed={fixedNodeIds.has(popoverNode.id)}
          selectedFixMethod={fixedNodes[popoverNode.id] || (manualFixingNodeId === popoverNode.id ? 'manual' : 'auto')}
        />
      )}

      <SqlEditorSidebar
        node={sidebarNodeId ? defaultNodes.find(n => n.id === sidebarNodeId) ?? null : null}
        edges={edges}
        isOpen={showSqlSidebar}
        onClose={() => setShowSqlSidebar(false)}
        onApply={handleManualFixApply}
        isFixing={!!manualFixingNodeId}
      />

      {/* Transformation Query Popup */}
      {clickedEdge && (
        <TransformationPopup
          edge={clickedEdge.edge}
          screenX={clickedEdge.screenX}
          screenY={clickedEdge.screenY}
          onClose={() => setClickedEdge(null)}
        />
      )}

      {/* Column Query Popup */}
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