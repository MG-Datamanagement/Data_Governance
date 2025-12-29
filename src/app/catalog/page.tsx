'use client';

import { MutableRefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Database,
  Tag as TagIcon,
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
import { FiltersModal, FilterState } from '@/components/DataCatalog/FiltersModal';
import { UNCATEGORIZED_DOMAIN } from '@/components/LineageGraph/constants';

/* -------------------------------------------------------
 * TYPES
 * ----------------------------------------------------- */

interface Table {
  id: string; // Changed to string for better URN-based handling
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

export interface SearchFilters {
  q?: string;
  domain_ids?: number[];
  data_source_ids?: number[];
  owner_ids?: number[];
  sensitivity_levels?: string[];
  is_certified?: boolean;
  page?: number;
  size?: number;
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

/* -------------------------------------------------------
 * GRAPHQL CLIENT
 * ----------------------------------------------------- */

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors && json.errors.length > 0) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('No data returned from GraphQL');
  }

  return json.data;
}

const GQL_LIST_TABLES = /* GraphQL */ `
  query SearchDatasets($start: Int!, $count: Int!) {
    search(input: {
      type: DATASET
      query: "*"
      start: $start
      count: $count
    }) {
      total
      searchResults {
        entity {
          ... on Dataset {
            urn
            name
            properties {
              name
              description
            }
            platform {
              name
            }
            domain {
              domain {
                properties {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GQL_SEARCH_TABLES = /* GraphQL */ `
  query SearchTables($input: TableSearchInput!) {
    searchTables(input: $input) {
      total
      page
      size
      has_next
      query
      query_fields
      filters_applied {
        domain_ids
        data_source_ids
        owner_ids
        sensitivity_levels
        is_certified
      }
      search_time_ms
      results {
        id
        name
        schema_name
        description
        table_type
        sensitivity_level
        is_active
        is_certified
        certification_notes
        urn
        data_source_id
        data_source_name
        data_source_type
        domain_id
        domain_name
        owner_id
        owner_name
        created_at
        updated_at
        last_schema_check_at
        row_count
        size_bytes
        query_count_last_30d
        unique_users_last_30d
        column_count
        tags {
          id
          name
          description
          color
          parent_tag_id
          urn
          is_system_tag
          is_active
          created_at
          updated_at
          usage_count
        }
      }
    }
  }
`;

/** GraphQL: domains */
const GQL_DOMAINS = /* GraphQL */ `
  query Domains {
    domains {
      id
      name
      description
      color
    }
    totalDomains
  }
`;

/** GraphQL: data sources */
const GQL_DATASOURCES = /* GraphQL */ `
  query DataSources {
    data_sources {
      id
      name
      type
    }
  }
`;

/** GraphQL: users */
const GQL_USERS = /* GraphQL */ `
  query Users {
    users {
      id
      name
    }
  }
`;

/** GraphQL: create table mutation */
const GQL_CREATE_TABLE = /* GraphQL */ `
  mutation CreateTable($input: CreateTableInput!) {
    createTable(input: $input) {
      id
      urn
      name
      schema_name
      description
      data_source_id
      data_source_name
      data_source_type
      domain_id
      domain_name
      owner_id
      owner_name
      table_type
      sensitivity_level
      is_active
      is_certified
      certification_notes
      created_at
      updated_at
      row_count
      size_bytes
      query_count_last_30d
      unique_users_last_30d
      column_count
      tags {
        id
        name
        description
        color
        parent_tag_id
        urn
        is_system_tag
        is_active
        created_at
        updated_at
        usage_count
      }
    }
  }
`;


/* -------------------------------------------------------
 * API FUNCTIONS
 * ----------------------------------------------------- */

async function fetchTables(
  page: number = 1,
  _search?: string,
  domain: string = ''
): Promise<TablesResponse> {
  const size = 20;
  const start = (page - 1) * size;

  const data = await gqlRequest<any>(GQL_LIST_TABLES, {
    start,
    count: size,
  });

  const searchResults = data.search?.searchResults || [];

  const tables: Table[] = searchResults.map((result: any) => {
    const dataset = result.entity;
    const props = dataset.properties || {};

    const platformName = dataset.platform?.name || 'Unknown Platform';
    const domainName = dataset.domain?.domain?.properties?.name || UNCATEGORIZED_DOMAIN;

    // Use last part of URN as stable ID (or hash if needed)
    const urnParts = dataset.urn.split(':');
    const shortId = urnParts[urnParts.length - 1].slice(0, -5); // removes ",PROD)"

    return {
      id: shortId || dataset.urn,
      urn: dataset.urn,
      name: props.name || dataset.name || 'Unnamed Table',
      schema_name: '', // Not available in basic search; can be parsed from URN if needed
      description: props.description || 'No description available',
      data_source_id: 0,
      data_source_name: platformName,
      data_source_type: platformName.toLowerCase(),
      domain_id: 0,
      domain_name: domainName,
      owner_id: 0,
      owner_name: 'Unknown',
      table_type: 'TABLE',
      sensitivity_level: 'low',
      is_active: true,
      is_certified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      row_count: undefined,
      size_bytes: undefined,
      query_count_last_30d: undefined,
      unique_users_last_30d: undefined,
      column_count: undefined,
      tags: [],
    } as Table;
  });

  return {
    tables,
    total: data.search?.total || 0,
    page,
    size,
    has_next: start + size < (data.search?.total || 0),
  };
}

/* -------------------------------------------------------
 * UTIL FUNCTIONS
 * ----------------------------------------------------- */

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
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/* -------------------------------------------------------
 * PAGE COMPONENT
 * ----------------------------------------------------- */

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryResults, setQueryResults] = useState<any | undefined>();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    domain_ids: [],
    data_source_ids: [],
    owner_ids: [],
    sensitivity_levels: [],
    is_certified: null,
  });

  const router = useRouter();
  const debouncedSearch = useDebounce(search, 600);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    data: tablesData,
    isLoading: tablesLoading,
    refetch: refetchTables,
  } = useQuery({
    queryKey: ['tables', page],
    queryFn: () => fetchTables(page),
    retry: 2,
  });

  const {
    data: favorites,
    isLoading: isFavoritesLoading,
    refetch: refetchFavorites,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    retry: 2,
  });

  const createFavoritesLookup = () => {
    const favList = favorites?.tables || [];
    return new Set(favList.flatMap((f: any) => [f.id, f.urn]));
  };

  const favSet = createFavoritesLookup();

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors space-y-4">
      <div className="flex justify-between items-end p-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Catalog</h1>
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
      {/* <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
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
              {queryResults?.results && search && (
                <button
                  type="button"
                  title="Clear Search"
                  onClick={handleClearSearch}
                  className="absolute right-12 top-3"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}

              {(queryResults?.results || []).length > 0 && search && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200/60 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-64 overflow-auto">
                  {(queryResults?.results || []).map((s) => (
                    <div
                      key={`${s.table_type}-${s.id}`}
                      onClick={() => handleSelect(s.id)}
                      className="flex justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      <span className="text-slate-900 dark:text-white">{s.name}</span>
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

          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
      </div> */}

      {/* Results */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {queryResults
              ? `${queryResults.total} Search/Filter Results`
              : tablesData
                ? `${tablesData.total} Tables`
                : 'Fetching Tables...'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
            >
              <Database className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
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

        {tablesLoading && !queryResults ? (
          <div className="p-12 text-center">
            <div className="text-gray-500 flex justify-center items-center w-full">
              <Loader2 className="animate-spin w-10 h-10" />
            </div>
          </div>
        ) : queryResults && queryResults.results.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {(
              (queryResults && !search ? queryResults.results : tablesData?.tables) ||
              []
            ).map((table: Table) => {
              const isFav = favSet.has((table as any).id) || favSet.has((table as any)?.urn);
              return (
                <div key={table.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {table.is_active ? (
                          <Link
                            href={`/catalog/${table.urn}` as any}
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSensitivityColor(
                            table.sensitivity_level
                          )}`}
                        >
                          {table.sensitivity_level}
                        </span>

                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {table.domain_name}
                        </span>
                      </div>

                      {/* <p className="text-sm text-gray-600 mb-2">
                        {table.description || 'No description available'}
                      </p> */}

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
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span className="font-medium text-gray-700 capitalize">
                              {table.data_source_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Size:{' '}
                          {table.size_bytes ? formatBytes(table.size_bytes) : 'Unknown'}
                        </div>

                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {table.query_count_last_30d
                            ? formatNumber(table.query_count_last_30d) + ' queries'
                            : 'No usage data'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {table.is_active ? (
                        <Link
                          href={`/catalog/${table.urn}` as any}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!queryResults && tablesData && (page > 1 || tablesData.has_next) && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1} to{' '}
              {Math.min(page * 20, tablesData.total)} of {tablesData.total} results
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
        onSubmit={() => {
          refetchTables();
          toast.success('Table created!');
        }}
        isLoading={false}
        sourceList={[]}
        domainList={[]}
        userList={[]}
      />

      <FiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={() => { }}
        initialFilters={filters}
        domains={[]}
        dataSources={[]}
        owners={[]}
      />
    </div>
  );
}
