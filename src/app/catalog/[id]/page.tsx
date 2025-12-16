'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
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
  PlusCircle,
  Plus,
  Search,
  Trash2,
  Loader2,
  Minus
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
import { normalizeLineageData } from '@/utils/utils';
import { ConfirmModal } from '@/components/common/ConfirmModalNew';
import toast from 'react-hot-toast';
import TableStatsCard, { TableStats } from '@/components/DataCatalog/TableStatsCard';
import TableModal, { TableFormData, TableDetails } from '@/components/DataCatalog/TableModel';
import { fetchFavorites } from '@/app/favorites/page';
import { extractSchemaData } from '@/utils/schemaMapper';
import { convertToCSV, downloadFile, TableData } from '@/utils/exportUitls';
import { RuleList, TableRules } from '@/components/DataCatalog/RuleList';
import { UNCATEGORIZED_DOMAIN } from '@/components/LineageGraph/constants';
import { DomainsDataResponse } from '@/services/DomainsDataResponse';
import AddDomainModal from '@/components/DataCatalog/AddDomainModal';
import AddTagModal from '@/components/DataCatalog/AddTagModal';

interface Tag {
  id: number;
  urn: string;
  name: string;
  color: string;
  description?: string;
  is_system_tag: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

const GQL_DATASET_DETAILS = `
query IngestionFromParticularTable($urn: String!)
{
  dataset(urn: $urn) {
    name # Name of the Table **under main card
    urn # URN of the Table  **under main card
    platform {
      urn
      type # Table Type **under main card **under Table Information
      name # Database Name   **under main card
    }
    properties {
      name
      description #description of the table/catalog    **under main card
      lastModified{
        time #last modification timestamp  **under Table Information
      }
      created #created at timestamp **under Table Information
      createdActor #data steward    **under main card
    }
    domain {
      domain {
        urn
        properties {
          name # Name of the Domain **under main card **under Table Information
        }
      }
    }
    tags {
      tags {
        tag {
          properties {
            name
            colorHex
          }
        }
      }
}
    schemaMetadata { # ** under schema card
      fields {
        fieldPath #column_name
        nativeDataType #datatype
        description #description
        nullable #nullable
        isPartOfKey #active or inactive
        label
      }
    }
  }
}
`;

interface GraphQLDatasetResponse {
  dataset: {
    urn: string;
    name: string;
    platform: {
      urn: string;
      name: string;
      type: string;
    };
    properties: {
      name: string;
      description: string | null;
      lastModified: { time: number } | null;
      created: { time: number } | null;
      createdActor: string | null;
    };
    domain: {
      domain: {
        urn: string;
        properties: { name: string } | null;
      }
    } | null;
    tags: {
      tags: {
        tag: {
          urn: string | undefined
          properties: {
            name: string;
            colorHex?: string;
          }
        }
      }[]
    } | null;
    schemaMetadata: {
      fields: {
        fieldPath: string;
        nativeDataType: string;
        description: string | null;
        nullable: boolean;
        isPartOfKey: boolean;
        label: string | null;
      }[];
    } | null;
  } | null;
}

const GQL_TAGS_QUERY = `
        query ListAllTags {
          searchAcrossEntities(
            input: {
              types: [TAG]
              query: ""
              start: 0
              count: 100
            }
          ) {
            total
            start
            searchResults {
              entity {
                urn
                ... on Tag {
                  name
                  description
                  properties {
                    description
                    colorHex
                  }
                }
              }
            }
          }
        }
      `;

async function gqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL Error');
  return json.data;
}

async function fetchDatasetByUrn(urn: string): Promise<GraphQLDatasetResponse> {
  return gqlRequest<GraphQLDatasetResponse>(GQL_DATASET_DETAILS, { urn });
}

declare global {
  interface String {
    hashCode(): number;
  }
}
String.prototype.hashCode = function () {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
};

async function fetchTableDetails(tableId: string | undefined | undefined): Promise<TableDetails> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`);
  if (!response.ok) throw new Error('Failed to fetch table details');
  return response.json();
}

async function fetchAvailableTags(): Promise<{ items: Tag[] }> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: GQL_TAGS_QUERY }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  const items: Tag[] =
    json.data.searchAcrossEntities.searchResults.map(
      (result: any, index: number) => {
        const entity = result.entity;

        return {
          id: index + 1, // temporary UI id
          urn: entity.urn,
          name: entity.name,
          description: entity.description ?? "",
          color: entity.properties?.colorHex ?? "#CBD5E1", // fallback color
          is_system_tag: false,
          is_active: true,
          usage_count: 0, // not available from GraphQL
          created_at: "",
          updated_at: "",
        };
      }
    );

  return { items };
}

async function addTagsToTable(tableId: string | undefined | undefined, tagIds: number[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tag_ids: tagIds }),
  });
  if (!response.ok) throw new Error('Failed to add tags to table');
}

async function removeTagToTable(tableId: string | undefined, tagId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/tags/${tagId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to remove tags to table');
  return response.json();
}

async function toggleTableFavorite(tableId: string | undefined, isFavorited: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/favorite`, {
    method: isFavorited ? 'DELETE' : 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
  });

  if (!response.ok) throw new Error("Failed to toggle table favorite");
  return response.json();
}

async function updateTable(tableId: string | undefined, tableData: TableFormData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tableData),
  });
  if (!response.ok) throw new Error('Failed to update table description');
}

async function deleteTable(tableId: string | undefined): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to delete table');
  return data
}

async function getTableStats(tableId: string | undefined): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to fetch table stats');
  return data
}

async function updateColumnDescription(tableId: string | undefined, columnId: number, description: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}/columns/${columnId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });
  if (!response.ok) throw new Error('Failed to update column description');
}

export async function fetchUsers(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function fetchDatasources(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/data-sources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data sources')
  return response.json();
}

async function fetchTableQualityRules(tableId: string | undefined): Promise<TableRules> {
  const response = await fetch(`${API_BASE_URL}/quality/table/${tableId}/rules`);
  if (!response.ok) throw new Error('Failed to fetch table quality rules');
  return response.json();
}

interface LineageTable {
  table_id: number;
  table_name: string;
  schema_name: string;
  data_source_name: string;
  data_source_base64_url: string;
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

export async function fetchTableLineage(tableId: string | undefined): Promise<LineageGraph> {
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
  const urn = decodeURIComponent(params.id as string);

  const [activeTab, setActiveTab] = useState<'schema' | 'lineage' | 'quality' | 'usage'>('schema');
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDomainsModal, setShowDomainsModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
  const [columnDescriptions, setColumnDescriptions] = useState<{ [key: number]: string }>({});
  const [searchTags, setSearchTags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [removeTag, setRemoveTag] = useState<Tag | undefined>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableStats, setTableStats] = useState<TableStats | undefined>();
  const [isTableStatsLoading, setIsTableStatsLoading] = useState<boolean>(false);
  const [isRemoveTagModalOpen, setIsRemoveTagModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch dataset from GraphQL using URN
  const { data: gqlData, isLoading: gqlLoading, error: gqlError } = useQuery({
    queryKey: ['dataset', urn],
    queryFn: () => fetchDatasetByUrn(urn),
    enabled: !!urn,
  });

  // Transform GraphQL data to TableDetails format
  const table: TableDetails | null = useMemo(() => {
    if (!gqlData?.dataset) return null;

    const d = gqlData.dataset;

    return {
      id: 0, // GraphQL doesn't provide numeric ID
      urn: d.urn,
      name: d.properties.name || d.name,
      schema_name: d.urn.includes('Patient360DB') ? 'Patient360DB' : '',
      description: d.properties.description || 'No description available',
      data_source: {
        id: 0,
        name: d.platform.name,
        type: d.platform.type,
      },
      domain: {
        id: 0,
        name: d.domain?.domain?.properties?.name || UNCATEGORIZED_DOMAIN,
        color: '#6366f1', // indigo-500
      },
      owner: {
        id: 0,
        name: d.properties.createdActor || 'Data Platform',
        email: '',
      },
      table_type: 'COLLECTION',
      sensitivity_level: 'medium',
      is_active: true,
      is_certified: false,
      created_at: d.properties.created?.time
        ? new Date(d.properties.created.time).toISOString()
        : new Date().toISOString(),
      updated_at: d.properties.lastModified?.time
        ? new Date(d.properties.lastModified.time).toISOString()
        : new Date().toISOString(),
      stats: {
        row_count: 0,
        size_bytes: 0,
        quality_score: 85,
        query_count_last_30d: 0,
        unique_users_last_30d: 0,
      },
      columns: (d.schemaMetadata?.fields || []).map(f => ({
        id: f.fieldPath.hashCode(),
        name: f.fieldPath,
        data_type: f.nativeDataType,
        description: f.description || '',
        is_nullable: f.nullable,
        is_primary_key: f.isPartOfKey,
        is_foreign_key: false,
        is_pii: false,
        sensitivity_level: 'low',
        ordinal_position: 0,
      })),
      tags: d.tags?.tags.map(t => ({
        id: t.tag.urn ?? 0,
        name: t.tag.properties.name,
        color: t.tag.properties.colorHex || '#94a3b8',
        urn: t.tag.urn
      })) || [],
    };
  }, [gqlData]);

  const isLoading = gqlLoading;
  const tableId = table?.id?.toString() || '0';

  // NOTE: Features like lineage, quality rules, favorites, tags, etc. require a numeric table ID
  // from the REST API. Since we're fetching from GraphQL using URN, these features will be
  // disabled unless the table also exists in the REST API database.
  const hasRestApiSupport = tableId !== '0';

  const { data: lineageData, isLoading: lineageLoading, refetch } = useQuery({
    queryKey: ['table-lineage', tableId],
    queryFn: () => fetchTableLineage(tableId),
    enabled: hasRestApiSupport && activeTab === 'lineage',
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  })

  const { data: datasources } = useQuery({
    queryKey: ['datasources'],
    queryFn: () => fetchDatasources(),
  })

  const { data: favorites, isLoading: isFavoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites
  });

  // Check if current table is favorited (works with both URN and ID)
  const isFavoriteTable = useMemo(() => {
    if (!favorites?.tables || !table) return false;
    return favorites.tables.some(
      (f: any) => f.urn === table.urn || f.id === table.id
    );
  }, [favorites, table]);

  // Update isFavorited state when favorites data changes
  useEffect(() => {
    setIsFavorited(isFavoriteTable);
  }, [isFavoriteTable]);

  const { data: tableQualityRules, isLoading: isTableQualityRulesLoading, refetch: refetchTableQualityRules } = useQuery({
    queryKey: ['tablequalityrules'],
    queryFn: () => fetchTableQualityRules(tableId),
    enabled: hasRestApiSupport,
  });

  const { data: availableTags } = useQuery({
    queryKey: ['available-tags'],
    queryFn: fetchAvailableTags,
  });

  const ADD_TAG_MUTATION = `
mutation AddTag($tagUrn: String!, $resourceUrn: String!) {
  addTag(
    input: {
      tagUrn: $tagUrn
      resourceUrn: $resourceUrn
    }
  )
}
`;

  async function addTagsToDataset(
    datasetUrn: string,
    tagUrns: string[]
  ): Promise<void> {
    await Promise.all(
      tagUrns.map(tagUrn =>
        gqlRequest(ADD_TAG_MUTATION, {
          tagUrn,
          resourceUrn: datasetUrn,
        })
      )
    );
  }

  const addTagsMutation = useMutation({
    mutationFn: ({
      datasetUrn,
      tagUrns,
    }: {
      datasetUrn: string;
      tagUrns: string[];
    }) => addTagsToDataset(datasetUrn, tagUrns),

    onSuccess: () => {
      toast.success('Tags added successfully');
      queryClient.invalidateQueries({ queryKey: ['dataset', urn] });
      setShowTagModal(false);
      setSelectedTags([]);
      setSearchTags('');
    },

    onError: () => {
      toast.error('Failed to add tags');
    },
  });

  // const addTagsMutation = useMutation({
  //   mutationFn: ({ tableId, tagIds }: { tableId: string | undefined; tagIds: number[] }) =>
  //     addTagsToTable(tableId, tagIds),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['table', tableId] });
  //     setShowTagModal(false);
  //     setSelectedTags([]);
  //     setSearchTags('');
  //   },
  //   onError: (error) => {
  //     console.error('Failed to add tags:', error);
  //   }
  // });

  const removeTagMutation = useMutation({
    mutationFn: ({ tableId, tagId }: { tableId: string | undefined; tagId: number }) =>
      removeTagToTable(tableId, tagId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setIsRemoveTagModalOpen(false);
      setRemoveTag(undefined);
      setSearchTags('');
      toast.success(data?.message || "Tag removed from table successfully")
    },
    onError: (error) => {
      toast.error("Failed to remove tag")
      console.error('Failed to remove tag:', error);
    }
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ tableId, isFavorited }: { tableId: string | undefined; isFavorited: boolean }) =>
      toggleTableFavorite(tableId, isFavorited),
    onSuccess: (data: any) => {
      setIsFavorited(!isFavorited);
      toast.success(data?.message || (!isFavorited ? "Table added to favorites successfully" : "Table removed from favorites successfully"))
      refetchFavorites()
    },
    onError: (error) => {
      toast.error("Failed to process the favorite/unfavorite")
      console.error('Failed to toggle favorite:', error);
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ tableId, tableData }: { tableId: string | undefined; tableData: TableFormData }) =>
      updateTable(tableId, tableData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      setEditing(false);
      toast.success(data?.message || "Table details updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update table details")
      console.error('Failed to update table details:', error);
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: (tableId: string | undefined) =>
      deleteTable(tableId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      toast.success(data?.message || "Table deleted successfully")
      setIsDeleteModalOpen(false);
      router.push('/catalog')
    },
    onError: (error) => {
      toast.error("Failed to delete table")
      console.error('Failed to delete table:', error);
    }
  });

  const getTableStatsMutation = useMutation({
    mutationFn: (tableId: string | undefined) =>
      getTableStats(tableId),
    onSuccess: (data) => {
      setTableStats(data)
      setIsTableStatsLoading(false);
    },
    onError: (error) => {
      setIsTableStatsLoading(false);
      console.error('Failed to delete table:', error);
    },
  });

  const updateColumnDescriptionMutation = useMutation({
    mutationFn: ({ tableId, columnId, description }: { tableId: string | undefined; columnId: number; description: string }) =>
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

  const handleExport = (format: 'csv' | 'json') => {
    const schemaData = extractSchemaData(table as any);

    if (!schemaData.length) {
      alert('No columns found to export.');
      return;
    }

    if (format === 'csv') {
      const csv = convertToCSV(schemaData);
      downloadFile(csv, `${table?.name}_schema.csv`, 'text/csv');
    } else {
      const json = JSON.stringify(schemaData, null, 2);
      downloadFile(json, `${table?.name}_schema.json`, 'application/json');
    }
  };

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
                  {table.domain.name === UNCATEGORIZED_DOMAIN ? <PlusCircle className='ml-2 cursor-pointer' onClick={() => setShowDomainsModal(true)} /> : ''}
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSensitivityColor(table.sensitivity_level)}`}>
                  {getSensitivityIcon(table.sensitivity_level)}
                  {table.sensitivity_level}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Server className="h-4 w-4" />
                  {table.data_source.name}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {/* {table.owner?.name || 'Unknown'} */}
                  John Doe
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
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-700">
                    {table.description || 'No description available. Click the edit button to add one.'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Tags:</span>
                {table.tags?.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium gap-2"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}40`
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => {
                        setRemoveTag(tag as Tag)
                        setIsRemoveTagModalOpen(true)
                      }}
                      title="Remove Tag"
                      className="inline-flex items-center text-red-300 border-none hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
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
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                disabled={favoriteMutation.isPending}
                title='Mark favorite'
              >
                {isFavorited ? <Star className="h-5 w-5" fill="currentColor" /> : <Star className="h-5 w-5" />}
              </button>
              <button title="Bookmark" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bookmark className="h-5 w-5" />
              </button>
              <button title="share" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Share className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setEditing(true);
                  setDescription(table.description || '');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title='Edit'
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(true)
                }}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                title='Delete'
              >
                <Trash2 className="h-5 w-5" />
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
                        onClick={() => {
                          setActiveTab(tab.key as any);
                          if (tab.key === "usage") {
                            setIsTableStatsLoading(true);
                            getTableStatsMutation.mutate(tableId)
                          }
                        }}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
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
                  <div className='w-full'>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Table Schema ({table.columns?.length || 0} columns)
                      </h3>
                    </div>

                    <div className="overflow-auto border border-gray-200 rounded-lg">
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
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${column.is_nullable
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


                        <div className="bg-white border rounded-lg">
                          <div style={{ width: '100%' }}>
                            <LineageGraphV2 lineageData={normalizeLineageData(lineageData) as any} addTablesFeat handleRefetchUpdatedGraph={(tableId) => refetch()} />

                          </div>
                        </div>

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
                      <div className="text-center">
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
                  <div className="text-center">
                    {isTableQualityRulesLoading ? (
                      <div className="w-full flex justify-center">
                        <Loader2 className="animate-spin text-[#3B82F6] w-10 h-10" />
                      </div>
                    ) : tableQualityRules ? (
                      <div className="flex-col justify-center space-y-3">
                        <h3 className="text-left text-lg font-semibold text-gray-900">Data Quality</h3>
                        <RuleList table={tableQualityRules} />
                      </div>
                    ) : (
                      <div className="text-center">
                        <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Data Quality</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Quality metrics and checks will be displayed here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "usage" && (
                  <div className="text-center py-12">
                    {isTableStatsLoading ? (
                      <div className="w-full flex justify-center">
                        <Loader2 className="animate-spin text-[#3B82F6] w-10 h-10" />
                      </div>
                    ) : tableStats ? (
                      <TableStatsCard data={tableStats as any} isLoading={isTableStatsLoading} />
                    ) : (
                      <div className="text-center">
                        <Eye className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          Usage Analytics
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Usage statistics and analytics will be shown here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Quick Actions */}
            {/* <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                  Preview Data
                </button>
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="h-4 w-4" />
                  Export Schema
                </button>
                <button
                  onClick={() => {
                    if (activeTab !== "usage") {
                      setActiveTab("usage")
                      setIsTableStatsLoading(true);
                      getTableStatsMutation.mutate(tableId)
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </button>
                <button onClick={() => { setActiveTab("lineage") }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Share className="h-4 w-4" />
                  View Lineage
                </button>
              </div>
            </div> */}

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
                  <div className="text-gray-900">{table.owner?.name || 'Unknown'}</div>
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

      <AddTagModal
        open={showTagModal}
        onClose={() => {
          setShowTagModal(false);
          setSelectedTags([]);
          setSearchTags('');
        }}
        table={table}
        availableTags={availableTags?.items || []}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        search={searchTags}
        setSearch={setSearchTags}
        isSubmitting={addTagsMutation.isPending}
        onSubmit={() =>
          addTagsMutation.mutate({
            datasetUrn: table.urn,
            tagUrns: selectedTags,
          })
        }
      />

      <AddDomainModal
        open={showDomainsModal}
        onClose={() => setShowDomainsModal(false)}
        entityUrn={urn}
      />
      {isDeleteModalOpen && <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        onConfirm={() => deleteTableMutation.mutate(tableId)}
        isLoading={deleteTableMutation.isPending}
        entityName={`${table.name} Table`}
      />}

      {editing && <TableModal
        isOpen={editing}
        onClose={() => setEditing(false)}
        onSubmit={(tableData: TableFormData) => updateTableMutation.mutate({ tableId: table?.id?.toString(), tableData })} isLoading={updateTableMutation.isPending}
        sourceList={datasources?.data_sources}
        userList={users?.users}
        table={table}
      />}

      {isRemoveTagModalOpen && removeTag && <ConfirmModal
        isOpen={isRemoveTagModalOpen}
        onClose={() => {
          setIsRemoveTagModalOpen(false);
        }}
        onConfirm={() => removeTagMutation.mutate({ tableId, tagId: removeTag.id })}
        isLoading={removeTagMutation.isPending}
        entityName={`${removeTag.name} Tag`}
      />}
    </div>
  );
}