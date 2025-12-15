'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Database,
  Calendar,
  User,
  Tag,
  Folder,
  Table
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { TablesResponse } from '../catalog/pagev1';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// Mock favorite tables data since backend endpoints are stubs
const mockFavorites = [
  {
    id: 1,
    name: 'user_accounts',
    schema_name: 'auth',
    description: 'User authentication and account management data',
    table_type: 'BASE TABLE',
    data_source: { id: 1, name: 'Primary DB', type: 'postgresql' },
    domain: { id: 1, name: 'User Management', color: '#3B82F6' },
    owner: { id: 1, name: 'John Smith', email: 'john.smith@company.com' },
    updated_at: '2024-01-15T10:30:00Z',
    stats: {
      row_count: 156789,
      quality_score: 95,
      query_count_last_30d: 342
    },
    tags: [
      { id: 1, name: 'PII', color: '#EF4444' },
      { id: 2, name: 'Critical', color: '#F59E0B' }
    ]
  },
  {
    id: 2,
    name: 'product_catalog',
    schema_name: 'inventory',
    description: 'Product information and catalog data',
    table_type: 'BASE TABLE',
    data_source: { id: 1, name: 'Primary DB', type: 'postgresql' },
    domain: { id: 2, name: 'Product Management', color: '#10B981' },
    owner: { id: 2, name: 'Sarah Johnson', email: 'sarah.j@company.com' },
    updated_at: '2024-01-14T15:45:00Z',
    stats: {
      row_count: 23456,
      quality_score: 88,
      query_count_last_30d: 156
    },
    tags: [
      { id: 3, name: 'Public', color: '#6B7280' },
      { id: 4, name: 'Master Data', color: '#8B5CF6' }
    ]
  },
  {
    id: 3,
    name: 'sales_transactions',
    schema_name: 'sales',
    description: 'Daily sales transaction records',
    table_type: 'BASE TABLE',
    data_source: { id: 2, name: 'Analytics DB', type: 'snowflake' },
    domain: { id: 3, name: 'Sales & Revenue', color: '#F59E0B' },
    owner: { id: 3, name: 'Mike Wilson', email: 'mike.w@company.com' },
    updated_at: '2024-01-16T09:15:00Z',
    stats: {
      row_count: 892345,
      quality_score: 92,
      query_count_last_30d: 567
    },
    tags: [
      { id: 5, name: 'Financial', color: '#059669' },
      { id: 6, name: 'High Volume', color: '#DC2626' }
    ]
  }
];

export async function fetchFavorites():Promise<TablesResponse> {
  const response = await fetch(`${API_BASE_URL}/tables/favorites`);
  if (!response.ok) throw new Error('Failed to fetch favorites list');
  return response.json();
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatNumber(num: number) {
  return num.toLocaleString();
}

export default function FavoritesPage() {
  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  const handleRemoveFromFavorites = async (tableId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/favorite`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (response.ok) {
        refetch();
        toast.success(data?.message || "Table removed from favorites successfully")
      }
    } catch (error) {
      toast.error("Failed to remove from favorites")
      console.error('Failed to remove from favorites:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-yellow-500" fill="currentColor" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Favorite Tables</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Tables you've marked as favorites for quick access
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {(favorites?.tables || []).length} {(favorites?.tables || []).length === 1 ? 'table' : 'tables'}
        </div>
      </div>

      {(favorites?.tables || []).length === 0 ? (
        // Empty state
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Start adding tables to your favorites by clicking the star icon when viewing table details.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Table className="h-5 w-5 mr-2" />
            Browse Data Catalog
          </Link>
        </div>
      ) : (
        // Favorites grid
        <div className="space-y-4">
          {(favorites?.tables || []).map((table) => (
            <div
              key={table.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Table Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/catalog/${table.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {table.schema_name}.{table.name}
                        </Link>
                        <button
                          onClick={() => handleRemoveFromFavorites(table.id)}
                          className="p-1 text-yellow-500 hover:text-yellow-600 transition-colors"
                          title="Remove from favorites"
                        >
                          <Star className="h-5 w-5" fill="currentColor" />
                        </button>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {table.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4" />
                      <span>{table.data_source_name}</span>
                    </div>
                    
                    {table.domain_name && (
                      <div className="flex items-center space-x-1">
                        <Folder className="h-4 w-4" />
                        <span>{table.domain_name}</span>
                      </div>
                    )}
                    
                    {table.owner_name && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{table.owner_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(table.updated_at)}</span>
                    </div>
                  </div>

                  {/* Stats and Tags Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <>
                          {/* {table.row_count && (<div className="text-sm">
                            <span className="text-gray-500">Rows:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {formatNumber(table.row_count)}
                            </span>
                          </div>)} */}
                          
                          {/* {table.quality_score && (<div className="text-sm">
                            <span className="text-gray-500">Quality:</span>
                            <span className={`font-medium ml-1 ${
                              table.quality_score >= 90 ? 'text-green-600' :
                              table.quality_score >= 70 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {table.quality_score}%
                            </span>
                          </div>)} */}
                          
                          {/* {table.query_count_last_30d && <div className="text-sm">
                            <span className="text-gray-500">Usage:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {formatNumber(table.query_count_last_30d)} queries
                            </span>
                          </div>} */}
                        </>
                    </div>

                    {/* Tags */}
                    {table.tags && table.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {table.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {table.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{table.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {(favorites?.tables || []).length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Database className="h-4 w-4 mr-2" />
              Browse More Tables
            </Link>
            <Link
              href="/domains"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Folder className="h-4 w-4 mr-2" />
              Explore Domains
            </Link>
            <Link
              href="/tags"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Tag className="h-4 w-4 mr-2" />
              Manage Tags
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}