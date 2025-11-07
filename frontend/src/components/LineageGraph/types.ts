export interface TableInfo {
  id: number;
  name: string;
  schema_name: string;
  data_source_name: string;
}

export interface LineageLink {
  source_table: TableInfo;
  target_table: TableInfo;
  transformation_logic: string;
  depth: number;
  direction: 'upstream' | 'downstream';
  lineage_type: string;
}

export interface LineageData {
  center_table: {
    table_id: number;
    table_name: string;
    schema_name: string;
    data_source_name: string;
    data_source_base64_url: string;
  };
  upstream_links: LineageLink[];
  downstream_links: LineageLink[];
  metadata: {
    max_depth_reached: number;
    total_upstream_links: number;
    total_downstream_links: number;
    include_columns: boolean;
  };
}

export interface GraphNode {
  id: number;
  name: string;
  schema: string;
  dataSource: string;
  type: 'center' | 'upstream' | 'downstream';
  depth: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: number;
  target: number;
  transform: string;
  type: 'upstream' | 'downstream';
}

export interface ProcessedGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  content: string;
}
