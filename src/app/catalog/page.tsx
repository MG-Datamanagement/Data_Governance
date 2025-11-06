'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Database,
  Tag,
  Eye,
  Star,
  Clock,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';
import URNDisplay from '../../components/common/URNDisplay';
import toast from 'react-hot-toast';
import TableModal, { TableFormData } from '@/components/DataCatalog/TableModel';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchFavorites } from '../favorites/page';

interface Table {
  id: number;
  urn?: string;
  name: string;
  schema_name: string;
  description?: string;
  data_source_id: number;
  data_source_name: string;
  data_source_type: string;
  domain_id: number;
  domain_name: string;
  owner_id: number;
  owner_name: string;
  table_type: string;
  sensitivity_level: string;
  is_active: boolean;
  is_certified: boolean;
  certification_notes?: string;
  created_at: string;
  updated_at: string;
  row_count?: number;
  size_bytes?: number;
  query_count_last_30d?: number;
  unique_users_last_30d?: number;
  column_count?: number;
  tags: any[];
}

export interface TablesResponse {
  tables: Table[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

export interface DomainsResponse {
  domains: Array<{
    id: number;
    name: string;
    description: string;
    color: string;
  }>;
  total: number;
}

export interface SearchTablesResponse {
  results: TableSummary[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
  query: string | null;
  query_fields: string[];
  filters_applied: {
    domain_ids: number[] | null;
    data_source_ids: number[] | null;
    owner_ids: number[] | null;
    sensitivity_levels: string[] | null;
    is_certified: boolean | null;
  };
  search_time_ms: number;
}

export interface TableSummary {
  id: number;
  name: string;
  schema_name: string;
  description: string | null;
  table_type: string;
  sensitivity_level: string;
  is_active: boolean;
  is_certified: boolean;
  certification_notes: string | null;
  urn: string | null;
  data_source_id: number;
  data_source_name: string;
  data_source_type: string;
  domain_id: number;
  domain_name: string;
  owner_id: number;
  owner_name: string;
  created_at: string;
  updated_at: string;
  last_schema_check_at: string | null;
  row_count: number;
  size_bytes: number;
  query_count_last_30d: number;
  unique_users_last_30d: number;
  column_count: number;
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  parent_tag_id: number | null;
  urn: string | null;
  is_system_tag: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

const API_BASE_URL = 'https://nmqhfvs3-8000.inc1.devtunnels.ms/api/v1';

async function fetchTables(page: number = 1, search: string = '', domain: string = ''): Promise<TablesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: '20',
  });
  
  if (search) params.append('search', search);
  if (domain) params.append('domain_id', domain);
  
  const response = await fetch(`${API_BASE_URL}/tables?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tables');
  return response.json();
}

async function createTable(tableData: TableFormData): Promise<Table[]> {
  const response = await fetch(`${API_BASE_URL}/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tableData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to create table');
  return data
}

async function fetchUsers(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function fetchDatasources(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/data-sources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch data sources')
  return response.json();
}

async function fetchDomains(): Promise<DomainsResponse> {
  const response = await fetch(`${API_BASE_URL}/domains`);
  if (!response.ok) throw new Error('Failed to fetch domains');
  return response.json();
}

async function searchTables(query: string, domainId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/search?q=${query}&domain_ids=${domainId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to search tables');
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
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryResults, setQueryResults] = useState<SearchTablesResponse | undefined>();

  const router = useRouter();
  const debouncedSearch = useDebounce(search, 600);

  const { data: tablesData, isLoading: tablesLoading, refetch: refetchTables } = useQuery({
    queryKey: ['tables', page, selectedDomain],
    queryFn: () => fetchTables(page, selectedDomain),
  });

  const { data: domainsData } = useQuery({
    queryKey: ['domains'],
    queryFn: () => fetchDomains(),
  });

  const {data: users} = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  })

  const {data: datasources} = useQuery({
    queryKey: ['datasources'],
    queryFn: () => fetchDatasources(),
  })

  const { data: favorites, isLoading: isFavoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites
  });

  const createTableMutation = useMutation({
      mutationFn: (tableData : TableFormData ) =>
        createTable(tableData),
      onSuccess: (data) => {
        setIsModalOpen(false)
        refetchTables()
        toast.success("Successfully Table Created!")
      },
      onError: (error) => {
        toast.error("Failed to create table")
        console.error('Failed to create table:', error);
      },
    });

  const searchTablesMutation = useMutation({
    mutationFn: ({query, domainId}:{query: string, domainId: string}) =>
      searchTables(query, domainId),
    onSuccess: (data) => {
      setIsModalOpen(false)
      setQueryResults(data)
    },
    onError: (error) => {
      console.error('Failed to create table:', error);
    },
  });

    useEffect(() => {
    if (debouncedSearch.trim() === "") {
      setQueryResults(undefined);
      return;
    }

    // Auto-trigger search
    searchTablesMutation.mutate({query: debouncedSearch, domainId:selectedDomain});
  }, [debouncedSearch]);

  const handleChange = (query: string) => {
    if(query === ""){
      setSearch(query)
      setQueryResults(undefined)
    } else {
      setSearch(query)
    }
  }

  const handleSelect = (tableId: number) => {
    router.push(`/catalog/${tableId}`);
    setQueryResults(undefined);
  };

  const handleClearSearch = () => {
    setSearch(""); 
    setQueryResults(undefined)
  }

  const createFavoritesLookup = () => {
    const favList = favorites?.tables || [];
    return new Set(favList.flatMap(f => [f.id, f.urn]));
  }

  const favSet = createFavoritesLookup();

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Catalog
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 mt-2">
            Browse and discover data tables across your data sources
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <Plus size={16} />
            New Table
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Search Tables
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => {
                  handleChange(e.target.value);
                }}
                placeholder="Search by table name, description, or column..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTablesMutation.isPending && (
                <Loader2 className="absolute right-3 top-3 h-5 w-5 text-gray-400 animate-spin" />
              )}
              {queryResults?.results && (
                <button type="button" onClick={handleClearSearch} className="absolute right-3 top-3">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}

              {(queryResults?.results || []).length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-64 overflow-auto">
                  {(queryResults?.results || []).map((s) => (
                    <div
                      key={`${s.table_type}-${s.id}`}
                      onClick={() => handleSelect(s.id)}
                      className="flex justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <span className="text-slate-900 dark:text-white">
                        {s.name}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600 shadow-[0_0_8px_rgba(34,197,94,0.7)]}`}
                      >
                        {s.table_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-48">
            <label
              htmlFor="domain"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Domain
            </label>
            <select
              id="domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Domains</option>
              {domainsData?.domains?.map((domain: any) => (
                <option key={domain.id} value={domain.id.toString()}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {tablesData ? `${tablesData.total} Tables` : "Loading..."}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <Database className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <div className="h-5 w-5 grid grid-cols-2 gap-0.5">
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
                <div className="bg-gray-400 rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>

        {tablesLoading ? (
          <div className="p-12 text-center">
            <div className="text-gray-500">Loading tables...</div>
          </div>
        ) : !tablesData?.tables?.length ? (
          <div className="p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No tables found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tablesData.tables.map((table: Table) => {
              const isFav = favSet.has(table.id) || favSet.has(table.urn);
              return(
              <div
                key={table.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {table.is_active ? (
                        <Link
                          href={`/catalog/${table.id}` as any}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {table.schema_name ? `${table.schema_name}.${table.name}` : table.name}
                        </Link>
                      ) : (
                        <span
                          className="text-lg font-medium text-gray-400 cursor-not-allowed"
                          title="This table is inactive"
                        >
                          {table.schema_name ? `${table.schema_name}.${table.name}` : table.name}
                        </span>
                      )}

                      {!table.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-300 text-gray-800 border border-gray-300">
                          Inactive
                        </span>
                      )}

                      {isFav && (
                        <span title="Certified">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSensitivityColor(table.sensitivity_level)}`}
                      >
                        {table.sensitivity_level}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {table.domain_name}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {table.description || "No description available"}
                    </p>

                    {table.urn && (
                      <URNDisplay
                        urn={table.urn}
                        variant="compact"
                        showLabel={false}
                        className="mb-3"
                        disabled={table.is_active ? false : true}
                      />
                    )}

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        {table.row_count
                          ? formatNumber(table.row_count) + " rows"
                          : "No stats"}
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Size:{" "}
                        {table.size_bytes
                          ? formatBytes(table.size_bytes)
                          : "Unknown"}
                      </div>

                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {table.query_count_last_30d
                          ? formatNumber(table.query_count_last_30d) +
                            " queries"
                          : "No usage data"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {table.is_active ? (
                      <Link
                        href={`/catalog/${table.id}` as any}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                        title="This table is inactive"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                    )}

                    <button disabled={table.is_active ? false : true} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Tag className="h-5 w-5" />
                    </button>

                    <button disabled={table.is_active ? false : true} className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                      <Star className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Pagination */}
        {tablesData && (page > 1 || tablesData.has_next) && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1} to{" "}
              {Math.min(page * 20, tablesData.total)} of {tablesData.total}{" "}
              results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {page}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!tablesData.has_next}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data: TableFormData) => createTableMutation.mutate(data)}
        isLoading={createTableMutation.isPending}
        sourceList={datasources?.data_sources as any[]}
        domainList={domainsData?.domains as any[]}
        userList={users?.users}
      />
    </div>
  );
}