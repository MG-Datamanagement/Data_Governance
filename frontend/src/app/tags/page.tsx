'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Hash,
  BarChart3
} from 'lucide-react';
import URNDisplay from '../../components/common/URNDisplay';

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

interface TagsResponse {
  items: Tag[];
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('https://nmqhfvs3-8001.inc1.devtunnels.ms/api/v1/tags');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const data: TagsResponse = await response.json();
        setTags(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tags</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group tags by usage (high, medium, low usage)
  const systemTags = tags.filter(tag => tag.is_system_tag);
  const userTags = tags.filter(tag => !tag.is_system_tag);
  const highUsageTags = tags.filter(tag => tag.usage_count > 0);
  const unusedTags = tags.filter(tag => tag.usage_count === 0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
        <p className="text-lg text-gray-600 mt-2">
          Classify and organize your data assets with descriptive tags
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tags
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tags.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Use
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {highUsageTags.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Hash className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Tags
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {systemTags.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Tag className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Unused
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {unusedTags.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Tags</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div 
                key={tag.id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tag.color}20` }}
                    >
                      <Tag
                        className="w-4 h-4"
                        style={{ color: tag.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/tags/${tag.id}` as any}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
                        >
                          {tag.name}
                        </Link>
                        {tag.is_system_tag && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {tag.description}
                      </p>
                      {tag.urn && (
                        <URNDisplay
                          urn={tag.urn}
                          variant="compact"
                          showLabel={false}
                          className="mt-2 mb-2"
                        />
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          Used by {tag.usage_count} items
                        </span>
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: tag.color }}
                          title={`Color: ${tag.color}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {tags.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
              <p className="text-gray-600">Get started by creating your first tag to classify your data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}