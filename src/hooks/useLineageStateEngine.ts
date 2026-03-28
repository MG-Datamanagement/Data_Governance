import { useState, useMemo } from "react";
import { useGetLineageCentric } from "@/hooks/useDashboardQueries";
import {
  LineageCentricResponse,
  LineageApiNodeCentric,
  LineageApiQueryExecution,
} from "@/services/dashboardApi.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeType = "table" | "view" | "dashboard";
export type QualityStatus = "healthy" | "warning" | "error" | "unhealthy" | "idempotent";

export interface InternalColumn {
  id: string; name: string; data_type: string;
  is_primary_key: boolean; is_nullable: boolean;
  query_expression: string | null;
}
export interface InternalTag { id: string; name: string; color: string | null; }
export interface InternalNode {
  id: string;
  type: NodeType;
  label: string;
  fullName: string;
  database: string;
  schema: string;
  sourceName: string;
  sourceType: string;
  columns: InternalColumn[];
  columnCount: number;
  tags: InternalTag[];
  qualityStatus: QualityStatus;
  isCenter?: boolean;
  aiSummary: string | null;
  stats: string | null;
  notes: string | null;
  transformationQuery: string | null;
  queryExecution?: LineageApiQueryExecution | null;
  x: number;
  y: number;
  colIndex: number;
  colNodeIds: string[];
}
export interface InternalEdge {
  from: string; to: string; isSecondary?: boolean;
  transformationQuery: string | null; fromLabel: string; toLabel: string;
  queryExecution?: LineageApiQueryExecution | null;
  isIdempotent?: boolean;
}
export interface NodeRect { x: number; y: number; w: number; h: number; }

export interface PopoverAnchor {
  nodeId: string;
  rect: DOMRect;
}
export interface ClickedEdge {
  edge: InternalEdge; screenX: number; screenY: number;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const CARD_W = 220;
const CENTER_W = 256;
const CARD_H_EST = 120;
const GAP_Y = 52;
const COL_GAP = 220;
export const POPOVER_W = 320;

export function mapNode(
  n: LineageApiNodeCentric, x: number, y: number, isCenter = false, isFixed = false
): InternalNode {
  return {
    id: n.id, type: (n.type as NodeType) ?? "table", label: n.table_name, fullName: n.full_name,
    database: n.database_name ?? "", schema: n.schema_name ?? "",
    sourceName: n.source?.name ?? "", sourceType: n.source?.source_type ?? "",
    columns: (n.columns ?? []).map((c) => ({
      id: c.id, name: c.name, data_type: c.data_type,
      is_primary_key: c.is_primary_key, is_nullable: c.is_nullable,
      query_expression: c?.query_expression ?? null,
    })),
    columnCount: parseInt(n.stats?.match(/Columns:\s*(\d+)/)?.[1] || "0", 10) || (n.columns?.length ?? 0),
    tags: (n.tags ?? []).map((t) => ({ id: t.id, name: t.name, color: t.color })),
    qualityStatus: isFixed ? "healthy" : ((n.status as QualityStatus) ?? "healthy"),
    isCenter,
    aiSummary: n.ai_summary ?? (isFixed 
      ? "The operational-data-store.transaction dataset captures financial transaction details associated with bookings and agents, enabling analysis of payment flows, transaction status, and revenue tracking within the operational data pipeline."
      : null),
    stats: n.stats ?? null,
    notes: isFixed ? null : (n.notes ?? (n as any).note ?? null),
    transformationQuery: n.transformation_query ?? null,
    queryExecution: (isFixed && n.query_execution) 
      ? { ...n.query_execution, query_status: "SUCCEEDED" } as LineageApiQueryExecution
      : (n.query_execution ?? null),
    x, y,
    colIndex: 0,
    colNodeIds: [],
  };
}

export function buildGraph(
  data: LineageCentricResponse, fixedNodeIds: Set<string>
): { nodes: InternalNode[]; edges: InternalEdge[] } {
  if (!data?.base_node) return { nodes: [], edges: [] };

  const apiById: Record<string, LineageApiNodeCentric> = {};
  const upstreams: LineageApiNodeCentric[] = [];
  const downstreams: LineageApiNodeCentric[] = [];
  
  let maxUpDepth = 0;
  let maxDownDepth = 0;

  const traverseUp = (node: LineageApiNodeCentric, currentDepth: number) => {
    apiById[node.id] = node;
    maxUpDepth = Math.max(maxUpDepth, currentDepth);
    if (node.id !== data.base_node.id) upstreams.push(node);
    
    (node.upstream_nodes || []).forEach(child => traverseUp(child, currentDepth + 1));
  };
  const traverseDown = (node: LineageApiNodeCentric, currentDepth: number) => {
    apiById[node.id] = node;
    maxDownDepth = Math.max(maxDownDepth, currentDepth);
    if (node.id !== data.base_node.id) downstreams.push(node);
    
    (node.downstream_nodes || []).forEach(child => traverseDown(child, currentDepth + 1));
  };

  traverseUp(data.base_node, 0);
  traverseDown(data.base_node, 0);

  const cols = new Map<number, LineageApiNodeCentric[]>();
  const addToCol = (cIndex: number, n: LineageApiNodeCentric) => {
    if (!cols.has(cIndex)) cols.set(cIndex, []);
    cols.get(cIndex)!.push(n);
  };

  addToCol(maxUpDepth, data.base_node);

  const uniqueNodes = new Map<string, LineageApiNodeCentric>();
  uniqueNodes.set(data.base_node.id, data.base_node);
  
  upstreams.forEach(n => !uniqueNodes.has(n.id) && uniqueNodes.set(n.id, n));
  downstreams.forEach(n => !uniqueNodes.has(n.id) && uniqueNodes.set(n.id, n));

  uniqueNodes.forEach((n) => {
    if (n.id === data.base_node.id) return;
    const isUp = upstreams.some(u => u.id === n.id);
    const depthVal = n.depth || 1; 
    let cIndex = maxUpDepth;
    if (isUp) {
      cIndex = maxUpDepth - depthVal;
    } else {
      cIndex = maxUpDepth + depthVal;
    }
    addToCol(cIndex, n);
  });

  const nodes: InternalNode[] = [];
  let maxNodesInCol = 0;
  cols.forEach(list => { maxNodesInCol = Math.max(maxNodesInCol, list.length); });
  const centerY = Math.max(0, (maxNodesInCol * (CARD_H_EST + GAP_Y)) / 2 - CARD_H_EST / 2);

  cols.forEach((list, cIndex) => {
    const startY = centerY - ((list.length - 1) * (CARD_H_EST + GAP_Y)) / 2;
    const colNodeIds = list.map(n => n.id);
    list.forEach((n, i) => {
      const x = cIndex * (CARD_W + COL_GAP);
      const y = startY + i * (CARD_H_EST + GAP_Y);
      
      const mapped = mapNode(n, x, y, n.id === data.base_node.id, fixedNodeIds.has(n.id));
      mapped.colIndex = cIndex;
      mapped.colNodeIds = colNodeIds;
      nodes.push(mapped);
    });
  });

  const edges: InternalEdge[] = [];
  const seenEdges = new Set<string>();
  const addEdge = (fromId: string, toId: string, isFromUpstreamList: boolean) => {
    const k = `${fromId}->${toId}`;
    if (seenEdges.has(k)) return;
    seenEdges.add(k);
    
    const toNode = apiById[toId];
    const fromNode = apiById[fromId];
    const isFixed = fixedNodeIds.has(toId) || fixedNodeIds.has(fromId);
    
    // In a lineage-centric tree, edge properties (query, status) are stored on the nested child node
    const edgeDataNode = isFromUpstreamList ? fromNode : toNode;
    
    edges.push({
      from: fromId, to: toId, 
      isSecondary: toNode?.type !== "view" && !isFromUpstreamList && toNode?.type === "table",
      transformationQuery: edgeDataNode?.transformation_query ?? null,
      queryExecution: isFixed && edgeDataNode?.query_execution
        ? { ...edgeDataNode.query_execution, query_status: "SUCCEEDED" } as LineageApiQueryExecution
        : (edgeDataNode?.query_execution ?? null),
      fromLabel: fromNode?.table_name || fromId, 
      toLabel: toNode?.table_name || toId,
      isIdempotent: edgeDataNode?.status === 'idempotent',
    });
  };

  const traverseEdgesUp = (node: LineageApiNodeCentric) => {
    (node.upstream_nodes || []).forEach(child => {
      addEdge(child.id, node.id, true);
      traverseEdgesUp(child);
    });
  };
  const traverseEdgesDown = (node: LineageApiNodeCentric) => {
    (node.downstream_nodes || []).forEach(child => {
      addEdge(node.id, child.id, false);
      traverseEdgesDown(child);
    });
  };

  traverseEdgesUp(data.base_node);
  traverseEdgesDown(data.base_node);

  return { nodes, edges };
}

export function useLineageStateEngine(datasetId: string, initialDepth = 2) {
  const [depth, setDepth] = useState(initialDepth);
  const [direction, setDirection] = useState<"upstream" | "downstream" | "both">("both");
  
  const { data: apiData = null, isLoading, error: queryError, refetch: refetchLineageData } = useGetLineageCentric(datasetId, depth);
  const error = queryError ? "Failed to load lineage data." : null;

  const [fixedNodeIds, setFixedNodeIds] = useState<Set<string>>(new Set());

  const { nodes: defaultNodes, edges } = useMemo(() => 
    apiData ? buildGraph(apiData, fixedNodeIds) : { nodes: [], edges: [] }, 
  [apiData, fixedNodeIds]);

  return {
    depth, setDepth,
    direction, setDirection,
    apiData, isLoading, error, refetchLineageData,
    fixedNodeIds, setFixedNodeIds,
    defaultNodes, edges
  };
}
