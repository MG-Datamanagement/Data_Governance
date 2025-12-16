"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Folder, Database, User, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NewDomainModal, {
  DomainFormData,
} from "@/components/Domains/NewDomainModal";
import toast from "react-hot-toast";

export interface Domain {
  id: number;
  urn?: string;
  name: string;
  description: string;
  color?: string;
  steward_id?: number;
  steward_name?: string;
  created_at?: string | any;
  updated_at?: string | any;
  tables_count?: number;
}

interface DomainsResponse {
  domains: Domain[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

// const API_BASE_URL = 'http://localhost:8000/api/v1';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

async function createDomain(domainData: Omit<DomainFormData, "id">): Promise<Domain> {
  const mutation = `
    mutation CreateDomain($input: CreateDomainInput!) {
      createDomain(input: $input)
    }
  `;

  const variables = {
    input: {
      name: domainData.name,
      description: domainData.description || "",
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

  if (json.errors || !json.data?.createDomain) {
    throw new Error(json.errors?.[0]?.message || "Failed to create Domain");
  }

  const urn: string = json.data.createDomain;

  const newDomain: Domain = {
    id: 0,
    urn,
    name: domainData.name,
    description: domainData.description || "",
  };

  return newDomain;
}

async function deleteDomain(domainUrn: string): Promise<void> {
  const mutation = `
    mutation DeleteDomain {
      deleteDomain(urn: "${domainUrn}")
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: mutation,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Failed to delete domain");
  }
}

export default function DomainsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);

  async function fetchDomains(): Promise<DomainsResponse> {
    const query = `
    query listAllDomains {
      listDomains(input: { start: 0, count: 100 }) {
        total
        domains {
          urn
          id
          ownership {
            owners {
              owner {
                ...on CorpUser {
                  username
                }
              }
            }
          }
          properties {
            name
            description
            createdOn {
              time
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

    if (json.errors || !json.data?.listDomains) {
      setError(json.errors?.[0]?.message || "Failed to fetch domains from GraphQL");
      throw new Error(json.errors?.[0]?.message || "Failed to fetch domains from GraphQL");
    }

    const result = json.data.listDomains;

    const mappedDomains: Domain[] = result.domains.map((d: any) => {
      const stewardName =
        d.ownership?.owners?.[0]?.owner?.username || null;

      const color = stringToColor(d.properties.name || d.id);

      return {
        id: Number(d.id) || d.id,
        urn: d.urn,
        name: d.properties.name || "Unnamed Domain",
        description: d.properties.description || "",
        color,
        steward_id: undefined,
        steward_name: stewardName,
        created_at: new Date(d.properties.createdOn.time).toISOString(),
        updated_at: new Date(d.properties.createdOn.time).toISOString(),
        tables_count: 0,
      };
    });
    return {
      domains: mappedDomains,
      total: result.total,
      page: 1,
      size: result.domains.length,
      has_next: result.domains.length < result.total,
    };
  }

  function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  const { data: domains, isLoading: isDomainsLoading, refetch: refetchDomains } = useQuery({
    queryKey: ['domains'],
    queryFn: fetchDomains,
  });

  const queryClient = useQueryClient();

  const createDomainMutation = useMutation({
    mutationFn: createDomain,
    onMutate: async (newDomainData) => {
      await queryClient.cancelQueries({ queryKey: ['domains'] });

      const previousDomains = queryClient.getQueryData<DomainsResponse>(['domains']);

      if (previousDomains) {
        const tempId = Date.now();

        queryClient.setQueryData<DomainsResponse>(['domains'], {
          ...previousDomains,
          domains: [
            ...previousDomains.domains,
            {
              id: tempId,
              urn: "urn:li:dataDomain:temp-" + tempId,
              name: newDomainData.name,
              description: newDomainData.description,
            }
          ],
          total: previousDomains.total + 1,
        });
      }

      return { previousDomains };
    },
    onError: (err, newDomain, context) => {
      queryClient.setQueryData(['domains'], context?.previousDomains);
      toast.error("Failed to create domain");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
    onSuccess: () => {
      setIsModalOpen(false);
      toast.success("Domain created successfully!");
      refetchDomains();
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: (urn: string) => deleteDomain(urn),
    onSuccess: () => {
      toast.success("Domain deleted successfully");
      setDomainToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      refetchDomains();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete domain");
    },
  });

  if (isDomainsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
              <h3 className="text-sm font-medium text-red-800">
                Error loading domains
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Domains</h1>
          <p className="text-lg text-gray-600 mt-2">
            Organize your data assets by business domain and ownership
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
            New Domain
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            All Domains ({(domains?.domains || [])?.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {(domains?.domains || [])?.map((domain: Domain) => (
            <div
              key={domain.id}
              className="relative p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${domain.color}20` }}
                  >
                    <Folder
                      className="w-6 h-6"
                      style={{ color: domain.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/domains/${domain.id}` as any}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {domain.name}
                    </Link>
                    <p className="text-gray-600 mt-1">{domain.description}</p>

                    {domain.urn && (
                      <div className="mt-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">
                            URN:
                          </span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 break-all">
                            {domain.urn}
                          </code>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Database className="w-4 h-4" />
                        <span>{domain.tables_count} tables</span>
                      </div>
                      {domain.steward_name && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Steward: {domain.steward_name}</span>
                        </div>
                      )}
                      <div>
                        <span>
                          Created:{" "}
                          {new Date(domain?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-6 right-6 bottom-6 flex flex-col items-center">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: domain.color }}
                    title={`Domain color: ${domain.color}`}
                  />
                  <Trash2
                    className="mt-auto cursor-pointer text-gray-600 hover:text-red-600"
                    onClick={() => setDomainToDelete(domain)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {(domains?.domains || [])?.length === 0 && (
          <div className="p-12 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No domains found
            </h3>
            <p className="text-gray-600">
              Get started by creating your first data domain.
            </p>
          </div>
        )}
      </div>

      <NewDomainModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data: DomainFormData) => createDomainMutation.mutate(data)}
        isLoading={createDomainMutation.isPending}
      />

      {domainToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Domain
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                {domainToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDomainToDelete(null)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  deleteDomainMutation.mutate(domainToDelete.urn!)
                }
                disabled={deleteDomainMutation.isPending}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteDomainMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
