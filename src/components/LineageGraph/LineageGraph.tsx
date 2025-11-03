'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphNode, TooltipData, LineageData } from './types';
import { GRAPH_CONFIG } from './constants';
import { calculateLayout, processLineageData, truncateText } from './lineageUtils';

interface DataLineageGraphProps {
    lineageData: LineageData | any
}

const LineageGraph: React.FC<DataLineageGraphProps> = ({lineageData}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: ''
  });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  // Handle window resize
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

  // Initialize and render graph
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const { nodeWidth, nodeHeight } = GRAPH_CONFIG;

    const g = svg.append('g');

    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([GRAPH_CONFIG.zoom.min, GRAPH_CONFIG.zoom.max])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Define arrow markers
    const defs = svg.append('defs');
    
    ['upstream', 'downstream'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', GRAPH_CONFIG.colors.link[type as 'upstream' | 'downstream']);
    });

    // Process data
    const graphData = processLineageData(lineageData);
    calculateLayout(graphData.nodes, width, height);

    const nodeById = new Map(graphData.nodes.map(n => [n.id, n]));

    // Draw links
    const linkGroup = g.append('g').attr('class', 'links');

    linkGroup.selectAll('path')
      .data(graphData.links)
      .join('path')
      .attr('d', d => {
        const source = nodeById.get(d.source)!;
        const target = nodeById.get(d.target)!;
        const sx = source.x! + nodeWidth;
        const sy = source.y! + nodeHeight / 2;
        const tx = target.x!;
        const ty = target.y! + nodeHeight / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const offsetX = dx * 0.5;
        
        return `M${sx},${sy} C${sx + offsetX},${sy} ${tx - offsetX},${ty} ${tx},${ty}`;
      })
      .attr('stroke', d => GRAPH_CONFIG.colors.link[d.type])
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 3)
          .attr('opacity', 1);
        
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content: `Transformation: ${d.transform}`
        });
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('opacity', 0.6);
        
        setTooltip(prev => ({ ...prev, visible: false }));
      });

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodes = nodeGroup.selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'grab')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', function() {
          d3.select(this).style('cursor', 'grabbing');
        })
        .on('drag', function(event, d) {
          d.x = event.x;
          d.y = event.y;
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
          
          // Update connected links
          linkGroup.selectAll('path')
            .attr('d', function(linkData: any) {
              const source = nodeById.get(linkData.source)!;
              const target = nodeById.get(linkData.target)!;
              const sx = source.x! + nodeWidth;
              const sy = source.y! + nodeHeight / 2;
              const tx = target.x!;
              const ty = target.y! + nodeHeight / 2;
              const dx = tx - sx;
              const offsetX = dx * 0.5;
              
              return `M${sx},${sy} C${sx + offsetX},${sy} ${tx - offsetX},${ty} ${tx},${ty}`;
            });
        })
        .on('end', function() {
          d3.select(this).style('cursor', 'grab');
        }) as any
      );

    // Node rectangles
    nodes.append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', d => GRAPH_CONFIG.colors[d.type])
      .attr('stroke', d => d.type === 'center' ? '#dc2626' : '#fff')
      .attr('stroke-width', d => d.type === 'center' ? 4 : 2)
      .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))')
      .on('mouseenter', function(event, d) {
        d3.select(this).style('filter', 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.15)) brightness(1.1)');
        
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content: `Table: ${d.name}\nSchema: ${d.schema}\nData Source: ${d.dataSource}\nType: ${d.type}`
        });
      })
      .on('mouseleave', function() {
        d3.select(this).style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))');
        setTooltip(prev => ({ ...prev, visible: false }));
      });

    // Node text - table name
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 28)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .text(d => truncateText(d.name, 20));

    // Node text - schema
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 48)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.85)')
      .attr('font-size', '11px')
      .style('pointer-events', 'none')
      .text(d => truncateText(d.schema, 22));

    // Node text - data source
    nodes.append('text')
      .attr('x', nodeWidth / 2)
      .attr('y', 64)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('font-size', '9px')
      .style('pointer-events', 'none')
      .text(d => truncateText(d.dataSource, 28));

    // Initial zoom to fit
    const bounds = g.node()!.getBBox();
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;

    const scale = 0.85 / Math.max(fullWidth / width, fullHeight / height);
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    svg.call(
      zoom.transform as any,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );

  }, [dimensions, lineageData]);

  // Control functions
  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform as any, d3.zoomIdentity);
    }
  }, []);

  const handleFitToView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const bounds = (g.node() as SVGGElement).getBBox();
    
    const { width, height } = dimensions;
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;

    const scale = 0.85 / Math.max(fullWidth / width, fullHeight / height);
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

    svg
      .transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }, [dimensions]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full h-full bg-transparent rounded-xl relative overflow-hidden" ref={containerRef}>
        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />

        {/* Tooltip */}
        {/* {tooltip.visible && (
          <div
            className="fixed bg-slate-900 text-white text-xs px-4 py-3 rounded-lg shadow-xl pointer-events-none z-50 max-w-xs whitespace-pre-line"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y + 10,
            }}
          >
            {tooltip.content}
          </div>
        )} */}

        {/* Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 space-y-2 z-10">
          <button
            onClick={handleResetZoom}
            className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            Reset Zoom
          </button>
          <button
            onClick={handleFitToView}
            className="w-full py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
          >
            Fit to View
          </button>
        </div>

        {/* Legend */}
        {/* <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-3 rounded bg-[#16A34A]`}></div>
            <span className="text-sm font-medium text-slate-700">Center Table</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-3 rounded bg-[#2563EB]`}></div>
            <span className="text-sm font-medium text-slate-700">Upstream Sources</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-6 h-3 rounded bg-[#EA580C]`}></div>
            <span className="text-sm font-medium text-slate-700">Downstream Targets</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default LineageGraph;