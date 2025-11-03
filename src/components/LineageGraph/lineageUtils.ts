import { GRAPH_CONFIG } from "./constants";
import { GraphLink, GraphNode, LineageData, ProcessedGraphData } from "./types";

export const processLineageData = (data: LineageData): ProcessedGraphData => {
  const nodes = new Map<number, GraphNode>();
  const links: GraphLink[] = [];

  // Add center table
  const centerTable = data.center_table;
  nodes.set(centerTable.table_id, {
    id: centerTable.table_id,
    name: centerTable.table_name,
    schema: centerTable.schema_name,
    dataSource: centerTable.data_source_name,
    type: 'center',
    depth: 0
  });

  // Process upstream links
  data.upstream_links.forEach(link => {
    const src = link.source_table;
    const tgt = link.target_table;
    
    if (!nodes.has(src.id)) {
      nodes.set(src.id, {
        id: src.id,
        name: src.name,
        schema: src.schema_name,
        dataSource: src.data_source_name,
        type: 'upstream',
        depth: -link.depth
      });
    }
    
    if (!nodes.has(tgt.id) && tgt.id !== centerTable.table_id) {
      nodes.set(tgt.id, {
        id: tgt.id,
        name: tgt.name,
        schema: tgt.schema_name,
        dataSource: tgt.data_source_name,
        type: 'upstream',
        depth: -(link.depth - 1)
      });
    }
    
    links.push({
      source: src.id,
      target: tgt.id,
      transform: link.transformation_logic,
      type: 'upstream'
    });
  });

  // Process downstream links
  data.downstream_links.forEach(link => {
    const src = link.source_table;
    const tgt = link.target_table;
    
    if (!nodes.has(src.id) && src.id !== centerTable.table_id) {
      nodes.set(src.id, {
        id: src.id,
        name: src.name,
        schema: src.schema_name,
        dataSource: src.data_source_name,
        type: 'downstream',
        depth: link.depth - 1
      });
    }
    
    if (!nodes.has(tgt.id)) {
      nodes.set(tgt.id, {
        id: tgt.id,
        name: tgt.name,
        schema: tgt.schema_name,
        dataSource: tgt.data_source_name,
        type: 'downstream',
        depth: link.depth
      });
    }
    
    links.push({
      source: src.id,
      target: tgt.id,
      transform: link.transformation_logic,
      type: 'downstream'
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    links
  };
};

export const calculateLayout = (
  nodes: GraphNode[],
  width: number,
  height: number
): void => {
  const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing } = GRAPH_CONFIG;

  // Group nodes by depth
  const depthMap = new Map<number, GraphNode[]>();
  nodes.forEach(node => {
    if (!depthMap.has(node.depth)) {
      depthMap.set(node.depth, []);
    }
    depthMap.get(node.depth)!.push(node);
  });

  // Sort depths and position nodes
  const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);

  sortedDepths.forEach((depth, idx) => {
    const nodesAtDepth = depthMap.get(depth)!;
    const x = idx * horizontalSpacing;
    
    nodesAtDepth.forEach((node, i) => {
      const totalHeight = nodesAtDepth.length * verticalSpacing;
      const y = (height / 2) - (totalHeight / 2) + (i * verticalSpacing);
      node.x = x;
      node.y = y;
    });
  });

  // Center the graph horizontally
  const allX = nodes.map(n => n.x!);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const offsetX = (width - (maxX - minX + nodeWidth)) / 2 - minX;

  nodes.forEach(node => {
    node.x = node.x! + offsetX;
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
