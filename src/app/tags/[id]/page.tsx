'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Database,
  ArrowLeft,
  Calendar,
  Hash,
  BarChart3,
  Pencil,
  Trash2
} from 'lucide-react';
import { ConfirmModal } from '@/components/common/ConfirmModalNew';
import NewTagModal, { TagFormData } from '@/components/Tags/NewTagModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { TagsResponse } from '../page';

interface Tag {
  id: number;
  urn?: string;
  name: string;
  description: string;
  color: string;
  parent_tag_id?: number;
  is_system_tag: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
}

interface Table {
  id: number;
  name: string;
  schema_name?: string;
  description: string;
  data_source: {
    id: number;
    name: string;
    type: string;
  };
  domain?: {
    id: number;
    name: string;
    color: string;
  };
  created_at: string;
  tags?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  data_source_type: string;
  domain_name: string;
  data_source_name: string;
}

interface TablesResponse {
  tables: Table[];
  total: number;
}


const API_BASE_URL = "http://localhost:8000/api/v1"

async function updateTag(tagId: string, tagData: TagFormData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tagData),
  });
  if (!response.ok) throw new Error('Failed to update Tag');
}

async function deleteTag(tagId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Failed to delete Tag');
  return data
}

export default function TagDetailPage({ params }: { params: { id: string } }) {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const router = useRouter();

  const { data: tag, isLoading, refetch: refetchTag } = useQuery({
    queryKey: ['tag', params?.id],
    queryFn: () => fetchTag(),
  });

   const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchTags(),
  });

  const { data: taggedTables, isLoading: isTaggedTablesLoading } = useQuery({
    queryKey: ['taggedtables', params?.id],
    queryFn: () => fetchTaggedTables(),
  });

  const fetchTag = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tag');
      }
      const tagData: Tag = await response.json();

      return tagData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag');
    }
  };

  const fetchTaggedTables = async () => {
    try {
      // Fetch tables that use this tag
      const tablesResponse = await fetch(`${API_BASE_URL}/tables?tag_ids=${params?.id}`);

      if (tablesResponse.ok) {
        const tablesData: TablesResponse = await tablesResponse.json();
        return tablesData
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag');
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data: TagsResponse = await response.json();
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    }
  };
  
  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, tagData }: { tagId: string; tagData: TagFormData }) =>
      updateTag(tagId, tagData),
    onSuccess: (data: any) => {
      setIsModalOpen(false);
      refetchTag();
      toast.success(data?.message || "Successfully updated tag details")
    },
    onError: (error) => {
      toast.error("Failed to update tag details")
      console.error('Failed to update tag details:', error);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId : string ) =>
      deleteTag(tagId),
    onSuccess: (data) => {
      toast.success(data?.message || "Tag deleted successfully")
      setIsDeleteModalOpen(false);
      router.push('/tags')
    },
    onError: (error) => {
      toast.error("Failed to delete Tag")
      console.error('Failed to delete Tag:', error);
    }
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tag) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tag</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Tag not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/tags"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tags
        </Link>
        
        <div className="flex items-start space-x-4">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${tag.color}20` }}
          >
            <Tag
              className="w-8 h-8"
              style={{ color: tag.color }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">{tag.name}</h1>
              {tag.is_system_tag && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  <Hash className="w-4 h-4 mr-1" />
                  System Tag
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 mt-2">{tag.description}</p>
            
            {/* URN Display */}
            {tag.urn && (
              <div className="mt-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">URN:</span>
                  <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-800 break-all">
                    {tag.urn}
                  </code>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Used by {tag.usage_count} items</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(tag.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Status: {tag.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsModalOpen(true);
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
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: tag.color }}
            title={`Tag color: ${tag.color}`}
          ></div>
          </div>
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tables using this Tag</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {(taggedTables?.tables || []).map((table) => (
                <div key={table.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/catalog/${table.id}` as any}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {table.schema_name ? `${table.schema_name}.${table.name}` : table.name}
                      </Link>
                      <p className="text-gray-600 mt-1">{table.description}</p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>Source: {(table?.data_source_name || "")}</span>
                        <span>Type: {table.data_source_type || ""}</span>
                        {table.domain && (
                          <span className="flex items-center space-x-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: table.domain.color }}
                            ></div>
                            <span>Domain: {table?.domain_name || ""}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {(taggedTables?.tables || []).length === 0 && (
              <div className="p-12 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
                <p className="text-gray-600">This tag is not currently applied to any tables.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tag Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tag ID</dt>
                <dd className="text-sm text-gray-900 mt-1">{tag.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Color</dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-200"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span>{tag.color}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {tag.is_system_tag ? 'System Tag' : 'User Tag'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    tag.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tag.is_active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              {tag.parent_tag_id && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Parent Tag</dt>
                  <dd className="text-sm text-gray-900 mt-1">#{tag.parent_tag_id}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(tag.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(tag.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Usage Stats</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Usage</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{tag.usage_count}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tables Tagged</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{(taggedTables?.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <NewTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(tagData: TagFormData) => updateTagMutation.mutate({tagId: tag?.id?.toString(), tagData})}
        isLoading={updateTagMutation.isPending}
        tagsList={(tags?.items || [])}
        tag={tag}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
        }}
        onConfirm={() => deleteTagMutation.mutate(tag?.id?.toString())}
        isLoading={deleteTagMutation.isPending}
        entityName={`${tag.name} Tag`}
      />
    </div>
  );
}