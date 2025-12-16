'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Hash,
  BarChart3,
  Plus,
  Trash2
} from 'lucide-react';
import URNDisplay from '../../components/common/URNDisplay';
import NewTagModal, { TagFormData } from '@/components/Tags/NewTagModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export interface Tag {
  id: number;
  urn: string;
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

export interface TagsResponse {
  items: Tag[];
}

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

// async function createTag(tagData: TagFormData): Promise<Tag> {
//   const response = await fetch(
//     `${API_BASE_URL}/tags`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(tagData),
//     }
//   );
//   const data = await response.json();
//   if (!response.ok) throw new Error("Failed to create Tag");
//   return data;
// }

async function createTag(tagData: TagFormData): Promise<Tag> {
  const mutation = `
    mutation CreateTag($input: CreateTagInput!) {
      createTag(input: $input)
    }
  `;

  const variables = {
    input: {
      name: tagData.name,
      description: tagData.description || "",
    },
  };


  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: mutation,
      variables,
    }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || "Failed to create tag");
  }

  const createdTag = json.data.createTag;

  // Map GraphQL response → Tag UI model
  return {
    id: Date.now(), // temporary UI id
    urn: createdTag.urn,
    name: createdTag.name,
    description: createdTag.description ?? "",
    color: createdTag.properties?.colorHex ?? "#CBD5E1",
    is_system_tag: false,
    is_active: true,
    usage_count: 0,
    created_at: "",
    updated_at: "",
  };
}

async function deleteTag(tagUrn: string): Promise<void> {
  const mutation = `
    mutation DeleteMyTag {
      deleteTag(urn: "${tagUrn}")
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || "Failed to delete tag");
  }
}

export default function TagsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const fetchTags = async () => {
    try {
      const query = `
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

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    }
  };

  const { data: tags, isLoading: isTagsLoading, refetch: refetchTags } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  console.log('tata', tags)
  const createTagMutation = useMutation({
    mutationFn: (tagData: TagFormData) =>
      createTag(tagData),
    onSuccess: () => {
      refetchTags();
      setIsModalOpen(false);
      toast.success("Tag created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create tag");
      console.error('Failed to create tag:', error);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (urn: string) => deleteTag(urn),
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      setTagToDelete(null);
      refetchTags();
    },
    onError: (error) => {
      toast.error("Failed to delete tag");
      console.error("Delete tag error:", error);
    },
  });

  if (isTagsLoading) {
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
  const systemTags = (tags?.items || []).filter(tag => tag.is_system_tag);
  const userTags = (tags?.items || []).filter(tag => !tag.is_system_tag);
  const highUsageTags = (tags?.items || []).filter(tag => tag.usage_count > 0);
  const unusedTags = (tags?.items || []).filter(tag => tag.usage_count === 0);

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
          <p className="text-lg text-gray-600 mt-2">
            Classify and organize your data assets with descriptive tags
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
            New Tag
          </button>
        </div>
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
                    {(tags?.items || []).length}
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
            {(tags?.items || []).map((tag) => (
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <Link
                            href={`/tags/${tag.id}` as any}
                            className="text-sm font-medium truncate"
                          >
                            {tag.name}
                          </Link>
                          {true && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100">
                              System
                            </span>
                          )}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0 mr-1"
                          style={{ backgroundColor: tag.color }}
                        />
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
                        <Trash2
                          className="mt-auto cursor-pointer text-gray-600 hover:text-red-600"
                          onClick={() => {
                            setTagToDelete(tag);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(tags?.items || []).length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
              <p className="text-gray-600">Get started by creating your first tag to classify your data.</p>
            </div>
          )}
        </div>
      </div>

      <NewTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(tagData: TagFormData) => createTagMutation.mutate(tagData)}
        isLoading={createTagMutation.isPending}
        tagsList={(tags?.items || [])}
      />

      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Tag
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {tagToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setTagToDelete(null)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  deleteTagMutation.mutate(tagToDelete.urn, {
                    onSettled: () => {
                      setTagToDelete(null);
                    },
                  })}
                disabled={deleteTagMutation.isPending}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTagMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
}