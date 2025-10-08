'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchTableLineage } from '@/app/catalog/[id]/page';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ZoomInIcon,
  ZoomOutIcon,
  XIcon,
  LucideListPlus,
  LoaderIcon,
  LucideFullscreen,
  LucideUploadCloud,
  RouteOffIcon
} from 'lucide-react';
import { link } from 'fs';

interface SourceTable {
  id: number;
  name: string;
  schema_name: string;
  data_source_name: string;
}

interface LineageLink {
  source_table: SourceTable;
  target_table: SourceTable;
  transformation_logic: string;
  depth: number;
  direction: 'upstream' | 'downstream';
  lineage_type: string;
}

interface LineageData {
  center_table: {
    table_id: number;
    table_name: string;
    schema_name: string;
    data_source_name: string;
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

interface GraphNode {
  id: number;
  name: string;
  schema: string;
  dataSource: string;
  type: 'center' | 'upstream' | 'downstream' | 'custom';
  depth: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: number;
  target: number;
  transform: string;
  type: 'upstream' | 'downstream' | 'custom';
}

interface RawAvailableTable {
  table_id: number;
  table_name: string;
  schema_name: string;
  data_source_name: string;
  table_type: string;
  created_at: string;
  description: string;
  upstream_tables: string[];
  downstream_tables: string[];
}

interface RawLineageResponse {
  source_table: {
    table_id: number;
    table_name: string;
    schema_name: string;
    data_source_name: string;
    upstream_tables: string[];
    downstream_tables: string[];
  };
  available_tables: RawAvailableTable[];
}

interface SavePayload {
  table_id: number;
  new_table_id: number;
  connection_table_id: number;
  connection_type: 'upstream' | 'downstream';
}

const GRAPH_CONFIG = {
  nodeWidth: 215,
  nodeHeight: 61,
  horizontalSpacing: 300,
  verticalSpacing: 120,
  zoom: { min: 0.1, max: 3 },
  colors: {
    center: '#fff',
    upstream: '#fff',
    downstream: '#fff',
    custom: '#fff',
    centerNodeBorder: '#16A34A',
    nodeBorder: '#75757533',
    nodeBorderOnHover: '#1570EF',
    label: '#181d27',
    link: {
      upstream: '#B1B1B7',
      downstream: '#B1B1B7',
      custom: '#B1B1B7'
    }
  }
};

interface LineageGraphProps {
  lineageData: LineageData;
  showControls?: boolean;
}

const API_BASE_URL = 'http://172.188.2.173:8000';

const LineageGraph: React.FC<LineageGraphProps> = (props: LineageGraphProps) => {
  const { lineageData, showControls = false } = props;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [customNodes, setCustomNodes] = useState<GraphNode[]>([]);
  const [customLinks, setCustomLinks] = useState<GraphLink[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [listOfTables, setListOfTables] = useState<RawLineageResponse | undefined>();
  const [linkingMode, setLinkingMode] = useState<{ active: boolean; sourceId: number | null }>({
    active: false,
    sourceId: null
  });
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(false);
  const [isEdgeInfoPanelOpen, setIsEdgeInfoPanelOpen] = useState<boolean>(false);
  const [edgeInfo, setEdgeInfo] = useState<{ source: GraphNode, target: GraphNode, link: GraphLink } | undefined>(undefined);
  const [tempLink, setTempLink] = useState<{ sourceId: number; x: number; y: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined>>();

  const params = useParams();
  const tableId = params.id as string;

  const { isLoading } = useQuery({
    queryKey: ['listOfTables', tableId],
    queryFn: () => handleFetchListTables(),
    enabled: !!(showControls && lineageData.center_table.table_id)
  });

  const handleFetchListTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/lineage/table/${tableId}/add_new_connection`);
      const tablesList = await response?.json();
      setListOfTables(tablesList);
    } catch (error) {
      console.error('Error fetching list of tables:', error);
    }
  };

  const processLineageData = useCallback((data: LineageData) => {
    const nodes = new Map<number, GraphNode>();
    const links: GraphLink[] = [];

    const centerTable = data.center_table;
    const centerId = centerTable.table_id;
    const centerName = centerTable.table_name;

    nodes.set(centerTable.table_id, {
      id: centerId,
      name: centerName,
      schema: centerTable.schema_name,
      dataSource: centerTable.data_source_name,
      type: 'center',
      depth: 0
    });

    data.upstream_links.forEach(link => {
      const src = link.source_table;
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
      links.push({
        source: src.id,
        target: link.target_table.id,
        transform: link.transformation_logic,
        type: 'upstream'
      });
    });

    data.downstream_links.forEach(link => {
      const tgt = link.target_table;
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
        source: link.source_table.id,
        target: tgt.id,
        transform: link.transformation_logic,
        type: 'downstream'
      });
    });

    return { nodes: Array.from(nodes.values()), links };
  }, []);

  const calculateLayout = useCallback((nodes: GraphNode[], width: number, height: number) => {
    const { nodeWidth, horizontalSpacing, verticalSpacing } = GRAPH_CONFIG;
    const depthMap = new Map<number, GraphNode[]>();

    nodes.forEach(node => {
      if (!depthMap.has(node.depth)) {
        depthMap.set(node.depth, []);
      }
      depthMap.get(node.depth)!.push(node);
    });

    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    sortedDepths.forEach((depth, idx) => {
      const nodesAtDepth = depthMap.get(depth)!;
      const x = idx * horizontalSpacing;

      // Center nodes vertically
      nodesAtDepth.forEach((node, i) => {
        const totalHeight = nodesAtDepth.length * verticalSpacing;
        const y = (height / 2) - (totalHeight / 2) + (i * verticalSpacing);
        node.x = x; // Assign x position based on depth and spacing
        node.y = y; // Assign y position to center nodes vertically
      });
    });

    const allX = nodes.map(n => n.x!);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const offsetX = (width - (maxX - minX + nodeWidth)) / 2 - minX;

    nodes.forEach(node => {
      node.x = node.x! + offsetX;
    });
  }, []);

  const formatNodeLabel = (name: string, maxLength = 20) => {
    if (!name) return '';

    const formatted = name
      .replace(/[-_.]/g, ' ')                     // Replace hyphens/underscores with spaces
      .replace(/\b\w/g, c => c.toUpperCase());  // Capitalize each word

    return formatted.length > maxLength
      ? formatted.substring(0, maxLength) + '...'
      : formatted;
  }

  const handleAddTable = useCallback(() => {
    if (!selectedTable) {
      alert('Please select a table to add');
      return;
    }

    const tableId = parseInt(selectedTable);
    const tableInfo = listOfTables?.available_tables.find(t => t.table_id === tableId);

    // Determine if this table is upstream or downstream of center table
    const centerTableName = lineageData.center_table.table_name;
    // if is upstream of center table then depth -1 else if downstream then depth +1 else 0
    const isUpstream = tableInfo?.downstream_tables?.includes(centerTableName);
    const isDownstream = tableInfo?.upstream_tables?.includes(centerTableName);

    if (!tableInfo) {
      alert('Table not found');
      return;
    }

    if (customNodes.find(n => n.id === tableId)) {
      alert('Table already added to graph');
      return;
    }

    // commenting specific id line for testing
    const newNode: GraphNode = {
      id: tableInfo.table_id,
      // id: tableInfo.table_id + 10000,
      name: tableInfo.table_name,
      schema: tableInfo.schema_name,
      dataSource: tableInfo.data_source_name,
      type: 'custom',
      depth: isUpstream ? -1 : (isDownstream ? 1 : 0),
      x: dimensions.width / 2,
      y: dimensions.height / 2
    };

    setCustomNodes(prev => [...prev, newNode]);
    setSelectedTable('');
    setIsControlPanelOpen(false);
    setIsEdgeInfoPanelOpen(false);
  }, [selectedTable, customNodes, dimensions, listOfTables]);

  const handleStartLinking = useCallback((nodeId: number, event?: any) => {
    if (event) event.stopPropagation();

    const graphData = processLineageData(lineageData);
    const allNodes = [...graphData.nodes, ...customNodes];
    const node = allNodes.find(n => n.id === nodeId);

    if (node && node.x !== undefined && node.y !== undefined) {
      setLinkingMode({ active: true, sourceId: nodeId });
      setTempLink({
        sourceId: nodeId,
        x: node.x + GRAPH_CONFIG.nodeWidth,
        y: node.y + GRAPH_CONFIG.nodeHeight / 2
      });
    }
  }, [lineageData, customNodes, processLineageData]);

  const handleEndLinking = useCallback((targetId: number, event?: any) => {
    if (event) event.stopPropagation();

    if (!linkingMode.active || !linkingMode.sourceId || linkingMode.sourceId === targetId) {
      setLinkingMode({ active: false, sourceId: null });
      setTempLink(null);
      return;
    }

    const linkExists = customLinks.some(
      link => link.source === linkingMode.sourceId && link.target === targetId
    );

    if (linkExists) {
      alert('Link already exists between these tables');
      setLinkingMode({ active: false, sourceId: null });
      setTempLink(null);
      return;
    }

    setCustomLinks(prev => [...prev, {
      source: linkingMode.sourceId!,
      target: targetId,
      transform: 'Custom transformation',
      type: 'custom'
    }]);

    setLinkingMode({ active: false, sourceId: null });
    setTempLink(null);
  }, [linkingMode, customLinks]);

  const handleCancelLinking = useCallback(() => {
    setLinkingMode({ active: false, sourceId: null });
    setTempLink(null);
  }, []);

  const handleRemoveNode = useCallback((nodeId: number) => {
    if (window.confirm('Remove this custom node and all its connections?')) {
      setCustomNodes(prev => prev.filter(n => n.id !== nodeId));
      setCustomLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
    }
  }, []);

  const handleRemoveLink = useCallback((sourceId: number, targetId: number) => {
    if (window.confirm('Remove this connection?')) {
      setCustomLinks(prev => prev.filter(l => !(l.source === sourceId && l.target === targetId)));
    }
  }, []);

  const handleSaveData = useCallback(async () => {
    if (customLinks.length === 0) {
      alert('No custom links to save. Please create at least one connection.');
      return;
    }

    setIsSaving(true);

    try {
      const centerTableId = lineageData.center_table.table_id;
      const payloads: SavePayload[] = [];

      customLinks.forEach(link => {
        const customNode = customNodes.find(n => n.id === link.source || n.id === link.target);

        if (!customNode) return;

        let connectionType: 'upstream' | 'downstream';
        let connectionTableId: number;

        if (link.target === centerTableId) {
          connectionType = 'upstream';
          connectionTableId = centerTableId;
        } else if (link.source === centerTableId) {
          connectionType = 'downstream';
          connectionTableId = centerTableId;
        } else {
          const graphData = processLineageData(lineageData);
          const existingNode = graphData.nodes.find(n => n.id === link.source || n.id === link.target);

          if (existingNode) {
            connectionTableId = existingNode.id;
            connectionType = existingNode.id === link.source ? 'upstream' : 'downstream';
          } else {
            connectionTableId = centerTableId;
            connectionType = 'downstream';
          }
        }

        const payload: SavePayload = {
          table_id: centerTableId,
          new_table_id: customNode.id,
          connection_table_id: connectionTableId,
          connection_type: connectionType
        };

        payloads.push(payload);
      });

      // Send first (or loop) payload(s) 
      const response = await fetch(`${API_BASE_URL}/api/v1/lineage/table/${centerTableId}/update-lineage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[0]),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      alert(`Successfully saved ${payloads.length} connection(s)!`);
      fetchTableLineage(centerTableId.toString());
      setCustomNodes([]);
      setCustomLinks([]);

    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  }, [lineageData, customNodes, customLinks, processLineageData]);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(zoomRef.current.transform as any, d3.zoomIdentity);
    setZoomLevel(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .call(zoomRef.current.scaleBy as any, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(300)
      .call(zoomRef.current.scaleBy as any, 0.7);
  }, []);

  const handleFitToView = useCallback(() => {
    if (!svgRef.current || !gRef.current) return;

    const graphData = processLineageData(lineageData);
    const allNodes = [...graphData.nodes, ...customNodes];

    if (allNodes.length === 0) return;

    const bounds = gRef.current.node()?.getBBox();
    if (!bounds) return;

    const { width, height } = dimensions;
    const { nodeWidth } = GRAPH_CONFIG;

    const fullWidth = bounds.width + nodeWidth;
    const fullHeight = bounds.height + GRAPH_CONFIG.nodeHeight;

    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
    const translate = [
      width / 2 - scale * midX,
      height / 2 - scale * midY
    ];

    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current!.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );

    setZoomLevel(scale);
  }, [dimensions, lineageData, customNodes, processLineageData]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const { nodeWidth, nodeHeight } = GRAPH_CONFIG;

    // Define dot background pattern
    const patternSize = 15;
    const defs = svg.append('defs');
    defs.append('pattern')
      .attr('id', 'dotted-bg')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', patternSize)
      .attr('height', patternSize)
      .append('circle')
      .attr('cx', 1)
      .attr('cy', 1)
      .attr('r', 1)
      .attr('fill', '#cacace');

    // Now append g for zoom / content
    const g = svg.append('g');

    g.append('rect')
      .attr('class', 'background')
      .attr('width', width * 5) // extend it to allow for pan/zoom
      .attr('height', height * 5)
      .attr('x', -width * 2) // center it around 0,0
      .attr('y', -height * 2)
      .attr('fill', 'url(#dotted-bg)');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([GRAPH_CONFIG.zoom.min, GRAPH_CONFIG.zoom.max])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);
    zoomRef.current = zoom;
    gRef.current = g;
    svg.on('click', () => linkingMode.active && handleCancelLinking());

    // Define arrow markers
    const arrowDefs = defs;
    ['upstream', 'downstream', 'custom'].forEach(type => {
      arrowDefs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', GRAPH_CONFIG.colors.link[type as keyof typeof GRAPH_CONFIG.colors.link]);
    });

    // Render graph data
    const graphData = processLineageData(lineageData);
    calculateLayout(graphData.nodes, width, height);

    const allNodes = [...graphData.nodes, ...customNodes];
    const allLinks = [...graphData.links, ...customLinks];
    const nodeById = new Map(allNodes.map(n => [n.id, n]));

    // currently testing this filter - commenting out for now
    // const validLinks = allLinks.filter(link =>
    //   nodeById.has(link.source) && nodeById.has(link.target)
    // );
    // above replaced with:
    const validLinks = allLinks.filter(link => {
    const sourceNode = nodeById.get(link.source);
    const targetNode = nodeById.get(link.target);
    
    // Only show link if BOTH nodes exist AND at least one is from original data OR both are custom
    if (!sourceNode || !targetNode) return false;
    
    // If link is custom, always show it
    if (link.type === 'custom') return true;
    
    // For original links, only show if both nodes are from original lineage data (not custom)
    return sourceNode.type !== 'custom' && targetNode.type !== 'custom';
    });
    //--

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');
    const updateLinks = () => {
      linkGroup.selectAll('*').remove();

      const linkElements = linkGroup.selectAll('g').data(validLinks).join('g');

      // Link paths
      linkElements.append('path')
        .attr('d', d => {
          const source = nodeById.get(d.source);
          const target = nodeById.get(d.target);
          if (!source || !target) return '';

          // Determine connection points based on relative position
          let sx, sy, tx, ty;
          
          // Check if target is to the left or right of source
          const isTargetRight = target.x! > source.x!;
          
          if (isTargetRight) {
            // Connect from right port of source to left port of target
            sx = source.x! + nodeWidth;  // Right port of source
            sy = source.y! + nodeHeight / 2;
            tx = target.x!;  // Left port of target
            ty = target.y! + nodeHeight / 2;
          } else {
            // Connect from left port of source to right port of target
            sx = source.x!;  // Left port of source
            sy = source.y! + nodeHeight / 2;
            tx = target.x! + nodeWidth;  // Right port of target
            ty = target.y! + nodeHeight / 2;
          }
          
          const dx = tx - sx;
          const dy = ty - sy;
          const angle = Math.atan2(dy, dx);
          const arrowOffset = 10; // Offset to avoid arrow overlapping node
          const adjustedTx = tx - Math.cos(angle) * arrowOffset;
          const adjustedTy = ty - Math.sin(angle) * arrowOffset;
          
          const offsetX = Math.abs(dx) * 0.5;

          return `M${sx},${sy} C${sx + (dx > 0 ? offsetX : -offsetX)},${sy} ${adjustedTx - (dx > 0 ? offsetX : -offsetX)},${adjustedTy} ${adjustedTx},${adjustedTy}`;
        })
        .attr('stroke', d => GRAPH_CONFIG.colors.link[d.type])
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('opacity', 0.6)
        .attr('marker-end', d => `url(#arrow-${d.type})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).attr('stroke-width', 3).attr('opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('stroke-width', 2).attr('opacity', 0.6);
        })
        .on('click', function (event, d) {
          event.stopPropagation();
          setEdgeInfo({ source: nodeById.get(d.source)!, target: nodeById.get(d.target)!, link: d });
          setIsEdgeInfoPanelOpen(true);
          setIsControlPanelOpen(false);
        });

      // Custom link labels (×) etc.
      linkElements.filter(d => d.type === 'custom').each(function (d) {
        const source = nodeById.get(d.source);
        const target = nodeById.get(d.target);
        if (!source || !target) return;

        const sx = source.x! + nodeWidth;
        const sy = source.y! + nodeHeight / 2;
        const tx = target.x!;
        const ty = target.y! + nodeHeight / 2;
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;

        // Remove previous elements
        const gThis = d3.select(this);
        // Add circle background
        gThis.append('circle')
          .attr('cx', midX).attr('cy', midY).attr('r', 10)
          .attr('fill', '#ef4444').style('cursor', 'pointer')
          .on('click', function (event) {
            event.stopPropagation();
            handleRemoveLink(d.source, d.target);
          });

        // // Add '×' text
        // gThis.append('text')
        //   .attr('x', midX).attr('y', midY + 4)
        //   .attr('text-anchor', 'middle').attr('fill', 'white')
        //   .attr('font-size', '12px').attr('font-weight', 'bold')
        //   .style('pointer-events', 'none')
        //   .text('×');

        const iconSize = 10;
        const scale = iconSize / 24;

        // Append Lucide 'x' icon
        const xIconGroup = gThis.append('g')
          .attr('transform', `translate(${midX}, ${midY}) scale(${scale}) translate(-12, -12)`) // Centering and scaling
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .style('pointer-events', 'none'); // Remove interactivity if needed

        xIconGroup.append('path').attr('d', 'M18 6 6 18');
        xIconGroup.append('path').attr('d', 'm6 6 12 12');
      });

      if (tempLink) {
        const source = nodeById.get(tempLink.sourceId);
        if (source) {
          linkGroup.append('path')
            .attr('d', `M${source.x! + nodeWidth},${source.y! + nodeHeight / 2} L${tempLink.x},${tempLink.y}`)
            .attr('stroke', '#8b5cf6').attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5').attr('fill', 'none')
            .attr('opacity', 0.6).style('pointer-events', 'none');
        }
      }
    };

    updateLinks();

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodes = nodeGroup.selectAll('g')
      .data(allNodes).join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'grab')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', function () { d3.select(this).style('cursor', 'grabbing'); })
        .on('drag', function (event, d) {
          d.x = event.x;
          d.y = event.y;
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
          updateLinks();
        })
        .on('end', function () { d3.select(this).style('cursor', 'grab'); }) as any
      );

    nodes.append('rect')
      .attr('width', nodeWidth).attr('height', nodeHeight).attr('rx', 8)
      .attr('fill', d => GRAPH_CONFIG.colors[d.type])
      .attr('stroke', d => d.type === 'center' ? `${GRAPH_CONFIG.colors.centerNodeBorder}` :
        (linkingMode.active && linkingMode.sourceId === d.id ? `#8b5cf6` : `${GRAPH_CONFIG.colors.nodeBorder}`))
      .attr('stroke-width', d => d.type === 'center' ? 1 :
        (linkingMode.active && linkingMode.sourceId === d.id ? 2 : 1))
      .style('filter', 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))')
      .on('click', function (event, d) {
        event.stopPropagation();
        if (linkingMode.active && linkingMode.sourceId !== d.id) {
          handleEndLinking(d.id, event);
        }
      })
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke', `${GRAPH_CONFIG.colors.nodeBorderOnHover}`);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).attr('stroke', d.type === 'center' ? `${GRAPH_CONFIG.colors.centerNodeBorder}` : `${GRAPH_CONFIG.colors.nodeBorder}`);
      });

    // Node labels
    nodes.append('text')
      .attr('x', nodeWidth / 2).attr('y', nodeHeight / 1.85).attr('text-anchor', 'middle')
      .attr('fill', '#181d27').attr('font-size', '16px').attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text(d => formatNodeLabel(d.name));

    // Remove button for custom nodes
    nodes.filter(d => d.type === 'custom')
      .append('circle')
      .attr('cx', nodeWidth - 12).attr('cy', 12).attr('r', 8)
      .attr('fill', `#ef4444`).style('cursor', 'pointer')
      .on('click', function (event, d) {
        event.stopPropagation();
        handleRemoveNode(d.id);
      });

    // '×' icon using Lucide paths
    nodes.filter(d => d.type === 'custom')
      .append('g')
      .attr('transform', `translate(${nodeWidth - 18},6) scale(0.5)`)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .each(function () {
        const g = d3.select(this);
        g.append('path').attr('d', 'M18 6 6 18');
        g.append('path').attr('d', 'M6 6 18 18');
      });


    // // Connection port (circle)
    // const portGroup = nodes.append('g')
    //   .attr('class', 'connection-port')
    //   .attr('transform', `translate(${nodeWidth}, ${nodeHeight / 2})`)
    //   .style('cursor', 'pointer')
    //   .on('click', function (event, d) {
    //     event.stopPropagation();
    //     if (linkingMode.active && linkingMode.sourceId !== d.id) {
    //       handleEndLinking(d.id, event);
    //     } else if (!linkingMode.active) {
    //       handleStartLinking(d.id, event);
    //     }
    //   });

    // Connection port (circle with +)
    const portGroup = nodes.append('g')
      .attr('class', 'connection-port')
      .attr('transform', `translate(${nodeWidth}, ${nodeHeight / 2})`)
      .style('cursor', 'pointer')
      .on('click', function (event, d) {
        event.stopPropagation();
        if (linkingMode.active && linkingMode.sourceId !== d.id) {
          handleEndLinking(d.id, event);
        } else if (!linkingMode.active) {
          handleStartLinking(d.id, event);
        }
      });

    // Port circle
    portGroup.append('circle')
      .attr('r', 8)
      .attr('fill', d => linkingMode.active && linkingMode.sourceId === d.id ? '#8b5cf6' : '#fff')
      .attr('stroke', '#F0F0F2').attr('stroke-width', 1)
      .style('filter', 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))')

    portGroup.append('circle')
      .attr('r', 8)
      .attr('class', 'connection-port')
      .attr('transform', `translate(${-nodeWidth}, ${nodeHeight / 100})`)
      .attr('fill', d => linkingMode.active && linkingMode.sourceId === d.id ? '#8b5cf6' : '#fff')
      .attr('stroke', '#F0F0F2').attr('stroke-width', 1)
      .style('filter', 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))')
    // .on('mouseenter', function () { d3.select(this).transition().duration(200).attr('r', 10); })
    // .on('mouseleave', function () { d3.select(this).transition().duration(200).attr('r', 8); });

    // Port '+' icon using Lucide paths
    const iconSize = 10;
    const plusIconGroup = portGroup.append('g')
      .attr('transform', `translate(-5, -5) scale(${iconSize / 24})`) // Center & scale
      .attr('stroke', '#757575')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style('pointer-events', 'none'); // Keep icon non-interactive if needed

    plusIconGroup.append('path').attr('d', 'M5 12h14');
    plusIconGroup.append('path').attr('d', 'M12 5v14');

    // Initial zoom to fit
    svg.on('mousemove', function (event) {
      if (linkingMode.active && tempLink) {
        const [x, y] = d3.pointer(event, g.node());
        setTempLink(prev => prev ? { ...prev, x, y } : null);
      }
    });

  }, [dimensions, lineageData, customNodes, customLinks, linkingMode, tempLink, processLineageData, calculateLayout, handleStartLinking, handleEndLinking, handleCancelLinking, handleRemoveNode, handleRemoveLink]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-0 to-slate-50">
      <div className="w-full h-full relative overflow-hidden" ref={containerRef}>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />

        {showControls ?
          <div className={`absolute top-2 left-2 bg-white rounded-lg shadow-lg transition-all duration-300 z-10 ${isControlPanelOpen ? 'w-72' : 'w-0'}`}>
            {isControlPanelOpen ? (
              <div className="space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className='px-2 py-1 flex items-center justify-between border-b border-slate-300'>
                  <label className="text-sm font-semibold text-gray-700">Add New Table</label>
                  <button onClick={() => setIsControlPanelOpen(!isControlPanelOpen)} title='Close' className="p-1 hover:bg-gray-200 rounded">
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="space-y-1 px-2 py-1">
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none text-sm"
                  >
                    <option value="">Select Table...</option>
                    {listOfTables?.available_tables.map((table) => (
                      <option value={table.table_id} key={table.table_id}>
                        {table.table_name} ({table.schema_name})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddTable}
                    disabled={!selectedTable}
                    className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Add Table
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          :
          null
        }

        <div className={`absolute top-2 left-2 bg-white rounded-lg shadow-lg transition-all duration-300 z-10 ${isEdgeInfoPanelOpen ? 'w-60' : 'w-0'}`}>
          {isEdgeInfoPanelOpen ? (
            <div className="space-y-1 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className='px-2 py-1 flex items-center justify-between border-b border-slate-300'>
                <label className="text-sm font-bold text-gray-700">Edge Information</label>
                <button onClick={() => setIsEdgeInfoPanelOpen(!isEdgeInfoPanelOpen)} title='Close' className="p-1 hover:bg-gray-200 rounded">
                  <XIcon size={20} />
                </button>
              </div>
              <div className='space-y-2 p-2'>
                <div className='bg-[#F8F9FC] px-2 py-1 rounded space-y-1'>
                  <div className='space-x-1 flex items-center'>
                    <label className="text-sm font-bold text-gray-700">Source :</label>
                    <p className="text-sm font-normal" title={formatNodeLabel(edgeInfo?.source?.name!)}>{formatNodeLabel(edgeInfo?.source?.name!)}</p>
                  </div>
                  <div className='space-x-1 flex items-center'>
                    <label className="text-sm font-bold text-gray-700">Target :</label>
                    <p className="text-sm font-normal" title={formatNodeLabel(edgeInfo?.target?.name!)}>{formatNodeLabel(edgeInfo?.target?.name!)}</p>
                  </div>
                </div>
                <div className='bg-[#F8F9FC] px-2 py-1 rounded'>
                  <div className='space-y-1'>
                    <label className="text-sm font-bold text-gray-700">Transformation Logic :</label>
                    <p className="text-sm font-normal" title={edgeInfo?.link?.transform!}>{formatNodeLabel(edgeInfo?.link?.transform!, 50)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="absolute top-2 right-2 border border-[#eaecf5] bg-white rounded-lg shadow-lg z-10 flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="p-3 hover:bg-sky-50 transition-colors flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomInIcon size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-3 hover:bg-sky-50 transition-colors flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOutIcon size={20} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-3 hover:bg-sky-50 transition-colors flex items-center justify-center text-sm font-medium"
            title="Reset Zoom"
          >
            1:1
          </button>
          <button
            onClick={handleFitToView}
            className="p-3 hover:bg-sky-50 transition-colors flex items-center justify-center text-sm font-medium"
            title="Fit to View"
          >
            <LucideFullscreen size={20} />
          </button>
          {showControls &&
            <>
              <button
                onClick={() => {setIsControlPanelOpen(!isControlPanelOpen);setIsEdgeInfoPanelOpen(false);}}
                className="p-3 hover:bg-sky-50 transition-colors flex items-center justify-center"
                title="Add Table"
              >
                <LucideListPlus size={20} />
              </button>
              <button
                onClick={handleSaveData}
                disabled={isSaving || customLinks.length === 0}
                title='Save Connection/Changes'
                className="p-3 hover:bg-sky-50 flex items-center justify-center disabled:bg-gray-200 transition-colors"
              >
                {isSaving ? <LoaderIcon size={20} className="animate-spin" /> : <LucideUploadCloud size={20} />}
              </button>
              {linkingMode?.active && 
                <button
                  onClick={handleCancelLinking}
                  title='Cancel Linking'
                  disabled={!linkingMode.active}
                  className="p-3 flex items-center justify-center transition-colors disabled:bg-gray-200 hover:bg-red-500"
                >
                  <RouteOffIcon size={16} />
                </button>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
};

export default LineageGraph;