'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Share,
  Bookmark,
  Eye,
  Pencil,
  Tag,
  ShieldCheck,
  Clock,
  Server,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Search
} from 'lucide-react';
import Link from 'next/link';
import URNDisplay from '../../../components/common/URNDisplay';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import LineageGraphV2 from '@/components/LineageGraphV2/LineageGraphV2';

const API_BASE_URL = 'http://172.188.2.173:8000/api/v1';

interface TableDetails {
  id: number;
  urn?: string;
  name: string;
  schema_name: string;
  description?: string;
  data_source: {
    id: number;
    name: string;
    type: string;
  };
  domain: {
    id: number;
    name: string;
    color: string;
  };
  owner: {
    id: number;
    name: string;
    email: string;
  };
  table_type: string;
  sensitivity_level: string;
  is_certified: boolean;
  certification_notes?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    row_count: number;
    size_bytes: number;
    quality_score: number;
    query_count_last_30d: number;
    unique_users_last_30d: number;
  };
  columns: Array<{
    id: number;
    name: string;
    description?: string;
    data_type: string;
    max_length?: number;
    precision?: number;
    scale?: number;
    is_nullable: boolean;
    is_primary_key: boolean;
    is_foreign_key: boolean;
    default_value?: string;
    is_pii: boolean;
    sensitivity_level: string;
    ordinal_position: number;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
}

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  is_system_tag: boolean;
}

async function fetchTableDetails(tableId: string): Promise<TableDetails> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`);
  if (!response.ok) throw new Error('Failed to fetch table details');
  return response.json();
}

async function fetchAvailableTags(): Promise<{ items: Tag[] }> {
  const response = await fetch(`${API_BASE_URL}/tags`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
}

async function addTagsToTable(tableId: string, tagIds: number[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tag_ids: tagIds }),
  });
  if (!response.ok) throw new Error('Failed to add tags to table');
}

async function toggleTableFavorite(tableId: string, isFavorited: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/favorite`, {
    method: isFavorited ? 'DELETE' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to toggle table favorite');
}

async function updateTableDescription(tableId: string, description: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to update table description');
}

async function updateColumnDescription(tableId: string, columnId: number, description: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/columns/${columnId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to update column description');
}

interface LineageTable {
  table_id: number;
  table_name: string;
  schema_name: string;
  data_source_name: string;
  transformation_logic?: string;
  confidence_score?: number;
  depth?: number;
  direction?: string;
}

interface LineageGraph {
  center_table: LineageTable;
  upstream_links: LineageTable[];
  downstream_links: LineageTable[];
  metadata: {
    max_depth_reached: number;
    total_upstream_tables: number;
    total_downstream_tables: number;
    include_columns: boolean;
  };
}

export async function fetchTableLineage(tableId: string): Promise<LineageGraph> {
  const response = await fetch(`${API_BASE_URL}/lineage/table/${tableId}/full-graph?max_depth=2`);
  if (!response.ok) throw new Error('Failed to fetch table lineage');
  return response.json();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getSensitivityColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getSensitivityIcon(level: string) {
  switch (level.toLowerCase()) {
    case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'medium': return <ShieldCheck className="h-4 w-4 text-yellow-600" />;
    case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
    default: return <ShieldCheck className="h-4 w-4 text-gray-600" />;
  }
}

function getDataTypeIcon(dataType: string) {
  const type = dataType.toLowerCase();
  if (type.includes('int') || type.includes('number') || type.includes('decimal') || type.includes('float')) {
    return <BarChart3 className="h-4 w-4 text-blue-600" />;
  } else if (type.includes('char') || type.includes('text') || type.includes('string')) {
    return <FileText className="h-4 w-4 text-green-600" />;
  } else if (type.includes('date') || type.includes('time')) {
    return <Clock className="h-4 w-4 text-purple-600" />;
  } else if (type.includes('bool')) {
    return <CheckCircle className="h-4 w-4 text-orange-600" />;
  } else {
    return <Server className="h-4 w-4 text-gray-600" />;
  }
}

export default function TableDetailsPage() {
  const params = useParams();
  const tableId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'schema' | 'lineage' | 'quality' | 'usage'>('schema');
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [columnDescriptions, setColumnDescriptions] = useState<{[key: number]: string}>({});
  const [searchTags, setSearchTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);

  const queryClient = useQueryClient();

  const { data: table, isLoading } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => fetchTableDetails(tableId),
    enabled: !!tableId,
  });

  const { data: lineageData, isLoading: lineageLoading } = useQuery({
    queryKey: ['table-lineage', tableId],
    queryFn: () => fetchTableLineage(tableId),
    enabled: !!tableId && activeTab === 'lineage',
  });

  // For now, let's use default React Flow nodes to ensure edges work
  const nodeTypes = {
    // We'll use default nodes for better compatibility
  };

  // Transform lineage data for React Flow
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!lineageData) return { nodes: [], edges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate better positioning
    const upstreamCount = lineageData.upstream_links.length;
    const downstreamCount = lineageData.downstream_links.length;
    const maxCount = Math.max(upstreamCount, downstreamCount);
    
    // Center table position
    const centerY = maxCount > 0 ? (maxCount * 150) / 2 : 200;

    // Add center table node
    const centerNodeId = `table_${lineageData.center_table.table_id}`;
    nodes.push({
      id: centerNodeId,
      type: 'default',
      position: { x: 400, y: centerY },
      data: {
        label: `${lineageData.center_table.schema_name}.${lineageData.center_table.table_name}\nCurrent Table`
      },
      style: {
        background: '#dcfce7',
        border: '2px solid #16a34a',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '220px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#15803d',
      },
    });

    // Add upstream table nodes
    lineageData.upstream_links.forEach((table, index) => {
      const nodeId = `table_${table.table_id}`;
      const yPosition = upstreamCount === 1 ? centerY : index * 150 + 50;
      
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x: 50, y: yPosition },
        data: {
          label: `${table.schema_name}.${table.table_name}\n${table.confidence_score}% confidence`
        },
        style: {
          background: '#dbeafe',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '220px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#1d4ed8',
        },
      });

      // Add edge from upstream to center
      edges.push({
        id: `edge_${nodeId}_to_center`,
        source: nodeId,
        target: centerNodeId,
        type: 'default',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
        style: {
          stroke: '#3b82f6',
          strokeWidth: 2,
        },
        label: table.confidence_score ? `${table.confidence_score}%` : '',
        labelStyle: { fontSize: '12px', fill: '#1f2937', fontWeight: 'bold' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
      });
    });

    // Add downstream table nodes
    lineageData.downstream_links.forEach((table, index) => {
      const nodeId = `table_${table.table_id}`;
      const yPosition = downstreamCount === 1 ? centerY : index * 150 + 50;
      
      nodes.push({
        id: nodeId,
        type: 'default',
        position: { x: 750, y: yPosition },
        data: {
          label: `${table.schema_name}.${table.table_name}\n${table.confidence_score}% confidence`
        },
        style: {
          background: '#fed7aa',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '220px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#d97706',
        },
      });

      // Add edge from center to downstream
      edges.push({
        id: `edge_center_to_${nodeId}`,
        source: centerNodeId,
        target: nodeId,
        type: 'default',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#f59e0b',
        },
        style: {
          stroke: '#f59e0b',
          strokeWidth: 2,
        },
        label: table.confidence_score ? `${table.confidence_score}%` : '',
        labelStyle: { fontSize: '12px', fill: '#1f2937', fontWeight: 'bold' },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
        labelBgPadding: [4, 2] as [number, number],
      });
    });

    console.log('Generated nodes:', nodes.map(n => ({ id: n.id, position: n.position })));
    console.log('Generated edges:', edges.map(e => ({ id: e.id, source: e.source, target: e.target })));

    return { nodes, edges };
  }, [lineageData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when lineage data changes
  useEffect(() => {
    if (lineageData) {
      const { nodes: newNodes, edges: newEdges } = { nodes: initialNodes, edges: initialEdges };
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [initialNodes, initialEdges, lineageData, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Clicked node:', node);
    // You can add navigation logic here, e.g., redirect to table detail page
  }, []);

  // Initialize column descriptions when table data loads
  useEffect(() => {
    if (table?.columns) {
      const descriptions: {[key: number]: string} = {};
      table.columns.forEach(column => {
        descriptions[column.id] = column.description || '';
      });
      setColumnDescriptions(descriptions);
    }
  }, [table]);

  const { data: availableTags } = useQuery({
    queryKey: ['available-tags'],
    queryFn: fetchAvailableTags,
    enabled: showTagModal,
  });

  const addTagsMutation = useMutation({
    mutationFn: ({ tableId, tagIds }: { tableId: string; tagIds: number[] }) =>
      addTagsToTable(tableId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setShowTagModal(false);
      setSelectedTags([]);
      setSearchTags('');
    },
    onError: (error) => {
      console.error('Failed to add tags:', error);
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ tableId, isFavorited }: { tableId: string; isFavorited: boolean }) =>
      toggleTableFavorite(tableId, isFavorited),
    onSuccess: () => {
      setIsFavorited(!isFavorited);
    },
    onError: (error) => {
      console.error('Failed to toggle favorite:', error);
    }
  });

  const updateTableDescriptionMutation = useMutation({
    mutationFn: ({ tableId, description }: { tableId: string; description: string }) =>
      updateTableDescription(tableId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setEditingDescription(false);
    },
    onError: (error) => {
      console.error('Failed to update table description:', error);
    }
  });

  const updateColumnDescriptionMutation = useMutation({
    mutationFn: ({ tableId, columnId, description }: { tableId: string; columnId: number; description: string }) =>
      updateColumnDescription(tableId, columnId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setEditingColumnId(null);
    },
    onError: (error) => {
      console.error('Failed to update column description:', error);
    }
  });

  const filteredTags = availableTags?.items?.filter(tag =>
    tag.name.toLowerCase().includes(searchTags.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-white rounded-lg shadow mb-6"></div>
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3">
                <div className="h-96 bg-white rounded-lg shadow"></div>
              </div>
              <div className="h-96 bg-white rounded-lg shadow"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Table not found</h2>
          <p className="text-gray-600 mb-4">The requested table could not be found.</p>
          <Link 
            href="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const fullTableName = table.schema_name ? `${table.schema_name}.${table.name}` : table.name;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/catalog" className="hover:text-blue-600 transition-colors">
            Data Catalog
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">{fullTableName}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{fullTableName}</h1>
                
                {table.is_certified && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                    <ShieldCheck className="h-4 w-4" fill="currentColor" />
                    <span className="text-sm font-medium">Certified</span>
                  </div>
                )}

                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: table.domain.color + '20', 
                    color: table.domain.color,
                    border: `1px solid ${table.domain.color}40`
                  }}
                >
                  {table.domain.name}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSensitivityColor(table.sensitivity_level)}`}>
                  {getSensitivityIcon(table.sensitivity_level)}
                  {table.sensitivity_level}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Server className="h-4 w-4" />
                  {table.data_source.name} ({table.data_source.type})
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {table.owner.name}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated {new Date(table.updated_at).toLocaleDateString()}
                </div>
              </div>

              {/* URN Display */}
              {table.urn && (
                <URNDisplay
                  urn={table.urn}
                  variant="compact"
                  showLabel={true}
                  className="mb-4"
                />
              )}

              {/* Description */}
              <div className="mb-4">
                {editingDescription ? (
                  <div className="space-y-3">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description for this table..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateTableDescriptionMutation.mutate({ tableId, description });
                        }}
                        disabled={updateTableDescriptionMutation.isPending}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {updateTableDescriptionMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingDescription(false);
                          setDescription(table.description || '');
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <p className="text-gray-700 flex-1">
                      {table.description || 'No description available. Click the edit button to add one.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingDescription(true);
                        setDescription(table.description || '');
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                {table.tags?.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}40`
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
                <button
                  onClick={() => setShowTagModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Tag
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-6">
              <button
                onClick={() => favoriteMutation.mutate({ tableId, isFavorited })}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                  isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                }`}
                disabled={favoriteMutation.isPending}
              >
                {isFavorited ? <Star className="h-5 w-5" fill="currentColor" /> : <Star className="h-5 w-5" />}
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bookmark className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-9">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rows</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {table.stats?.row_count ? formatNumber(table.stats.row_count) : 'N/A'}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {table.stats?.size_bytes ? formatBytes(table.stats.size_bytes) : 'N/A'}
                    </p>
                  </div>
                  <Server className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quality</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {table.stats?.quality_score ? `${table.stats.quality_score}%` : 'N/A'}
                    </p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Queries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {table.stats?.query_count_last_30d ? formatNumber(table.stats.query_count_last_30d) : 'N/A'}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {[
                    { key: 'schema', label: 'Schema', icon: Server },
                    { key: 'lineage', label: 'Lineage', icon: Share },
                    { key: 'quality', label: 'Quality', icon: ShieldCheck },
                    { key: 'usage', label: 'Usage', icon: Eye }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'schema' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Table Schema ({table.columns?.length || 0} columns)
                      </h3>
                    </div>
                    
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Column
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nullable
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Keys
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sensitivity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {table.columns?.map(column => (
                            <tr key={column.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getDataTypeIcon(column.data_type)}
                                  <span className="font-medium text-gray-900">{column.name}</span>
                                  {column.is_pii && (
                                    <span title="Contains PII">
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {column.data_type}
                                  {column.max_length && `(${column.max_length})`}
                                  {column.precision && column.scale && `(${column.precision},${column.scale})`}
                                </code>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  column.is_nullable 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {column.is_nullable ? 'Nullable' : 'Not Null'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {column.is_primary_key && (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      PK
                                    </span>
                                  )}
                                  {column.is_foreign_key && (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                      FK
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSensitivityColor(column.sensitivity_level)}`}>
                                  {getSensitivityIcon(column.sensitivity_level)}
                                  {column.sensitivity_level}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {editingColumnId === column.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={columnDescriptions[column.id] || ''}
                                      onChange={(e) => setColumnDescriptions({
                                        ...columnDescriptions,
                                        [column.id]: e.target.value
                                      })}
                                      placeholder="Add a description for this column..."
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                                      rows={2}
                                    />
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          updateColumnDescriptionMutation.mutate({
                                            tableId,
                                            columnId: column.id,
                                            description: columnDescriptions[column.id] || ''
                                          });
                                        }}
                                        disabled={updateColumnDescriptionMutation.isPending}
                                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                      >
                                        {updateColumnDescriptionMutation.isPending ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingColumnId(null);
                                          setColumnDescriptions({
                                            ...columnDescriptions,
                                            [column.id]: column.description || ''
                                          });
                                        }}
                                        className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 group">
                                    <span className="flex-1">
                                      {column.description || 'No description'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingColumnId(column.id);
                                        setColumnDescriptions({
                                          ...columnDescriptions,
                                          [column.id]: column.description || ''
                                        });
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'lineage' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Data Lineage</h3>
                      <Link
                        href="/lineage"
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        View Full Lineage Explorer
                      </Link>
                    </div>
                    
                    {lineageLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading lineage data...</p>
                      </div>
                    ) : lineageData ? (
                      <div className="space-y-6">
                        {/* Lineage Overview */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-blue-900">Upstream Tables</p>
                                <p className="text-lg font-bold text-blue-700">{lineageData.metadata.total_upstream_tables}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <Share className="h-8 w-8 text-green-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-green-900">Current Table</p>
                                <p className="text-lg font-bold text-green-700">{lineageData.center_table.table_name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <BarChart3 className="h-8 w-8 text-orange-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-orange-900">Downstream Tables</p>
                                <p className="text-lg font-bold text-orange-700">{lineageData.metadata.total_downstream_tables}</p>
                              </div>
                            </div>
                          </div>
                        </div>


                        {/* React Flow Lineage Graph */}
                        <div className="bg-white border rounded-lg">
                          <div style={{ width: '100%' }}>
                            <LineageGraphV2 lineageData={lineageData as any} showControls />
                            {/* <ReactFlow
                              nodes={nodes}
                              edges={edges}
                              onNodesChange={onNodesChange}
                              onEdgesChange={onEdgesChange}
                              onNodeClick={onNodeClick}
                              fitView
                              fitViewOptions={{
                                padding: 0.2,
                                includeHiddenNodes: false,
                              }}
                              attributionPosition="bottom-left"
                              className="bg-gray-50"
                              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                            >
                              <Background color="#e5e7eb" gap={20} />
                              <Controls
                                position="bottom-right"
                                showZoom={true}
                                showFitView={true}
                                showInteractive={false}
                              />
                            </ReactFlow> */}
                          </div>
                        </div>

                        {/* Transformation Details */}
                        {(lineageData.upstream_links.some(t => t.transformation_logic) ||
                          lineageData.downstream_links.some(t => t.transformation_logic)) && (
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Transformation Details</h4>
                            <div className="space-y-3">
                              {lineageData.upstream_links.filter(t => t.transformation_logic).map(table => (
                                <div key={table.table_id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="font-medium text-blue-900">
                                    {table.schema_name}.{table.table_name} → {lineageData.center_table.table_name}
                                  </div>
                                  <div className="text-sm text-blue-700 mt-1">{table.transformation_logic}</div>
                                </div>
                              ))}
                              {lineageData.downstream_links.filter(t => t.transformation_logic).map(table => (
                                <div key={table.table_id} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                  <div className="font-medium text-orange-900">
                                    {lineageData.center_table.table_name} → {table.schema_name}.{table.table_name}
                                  </div>
                                  <div className="text-sm text-orange-700 mt-1">{table.transformation_logic}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Share className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Lineage Data Available</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          No lineage relationships have been discovered for this table yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'quality' && (
                  <div className="text-center py-12">
                    <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Data Quality</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Quality metrics and checks will be displayed here
                    </p>
                  </div>
                )}

                {activeTab === 'usage' && (
                  <div className="text-center py-12">
                    <Eye className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Usage Analytics</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Usage statistics and analytics will be shown here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                  Preview Data
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="h-4 w-4" />
                  Export Schema
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Share className="h-4 w-4" />
                  View Lineage
                </button>
              </div>
            </div>

            {/* Table Info */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Table Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <div className="text-gray-900">{new Date(table.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <div className="text-gray-900">{new Date(table.updated_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Table Type:</span>
                  <div className="text-gray-900">{table.table_type}</div>
                </div>
                <div>
                  <span className="text-gray-600">Data Source:</span>
                  <div className="text-gray-900">{table.data_source.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Owner:</span>
                  <div className="text-gray-900">{table.owner.name}</div>
                </div>
                {table.stats?.unique_users_last_30d && (
                  <div>
                    <span className="text-gray-600">Monthly Users:</span>
                    <div className="text-gray-900">{table.stats.unique_users_last_30d}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Tags</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTags}
                  onChange={(e) => setSearchTags(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredTags.map(tag => {
                  const isAlreadyAttached = table?.tags?.some(existingTag => existingTag.id === tag.id);
                  const isSelected = selectedTags.includes(tag.id);
                  
                  return (
                    <label key={tag.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      isAlreadyAttached ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isAlreadyAttached}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                          border: `1px solid ${tag.color}40`
                        }}
                      >
                        {tag.name}
                        {isAlreadyAttached && (
                          <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                        )}
                      </span>
                      <span className="text-sm text-gray-600 flex-1">{tag.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setSelectedTags([]);
                  setSearchTags('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={addTagsMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedTags.length > 0) {
                    addTagsMutation.mutate({ tableId, tagIds: selectedTags });
                  }
                }}
                disabled={selectedTags.length === 0 || addTagsMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addTagsMutation.isPending ? 'Adding...' : `Add Tags${selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}