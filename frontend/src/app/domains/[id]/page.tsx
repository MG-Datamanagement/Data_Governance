'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Folder,
  Database,
  User,
  ArrowLeft,
  Calendar
} from 'lucide-react';

interface Domain {
  id: number;
  urn?: string;
  name: string;
  description: string;
  color: string;
  steward_id?: number;
  steward_name?: string;
  created_at: string;
  updated_at: string;
  tables_count: number;
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
  created_at: string;
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

interface TablesResponse {
  tables: Table[];
  total: number;
}

export default function DomainDetailPage({ params }: { params: { id: string } }) {
  const [domain, setDomain] = useState<Domain | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/domains/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch domain');
        }
        const domainData: Domain = await response.json();
        setDomain(domainData);
        
        // Fetch tables for this domain
        const tablesResponse = await fetch(`http://localhost:8000/api/v1/tables?domain_ids=${params.id}`);
        if (tablesResponse.ok) {
          const tablesData: TablesResponse = await tablesResponse.json();
          setTables(tablesData.tables);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domain');
      } finally {
        setLoading(false);
      }
    };

    fetchDomain();
  }, [params.id]);

  if (loading) {
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

  if (error || !domain) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading domain</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Domain not found'}</p>
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
          href="/domains"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Domains
        </Link>
        
        <div className="flex items-start space-x-4">
          <div 
            className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${domain.color}20` }}
          >
            <Folder
              className="w-8 h-8"
              style={{ color: domain.color }}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{domain.name}</h1>
            <p className="text-lg text-gray-600 mt-2">{domain.description}</p>
            
            {/* URN Display */}
            {domain.urn && (
              <div className="mt-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">URN:</span>
                  <code className="text-sm bg-gray-100 px-3 py-1 rounded font-mono text-gray-800 break-all">
                    {domain.urn}
                  </code>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
              {domain.steward_name && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Steward: {domain.steward_name}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(domain.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Database className="w-4 h-4" />
                <span>{domain.tables_count} tables</span>
              </div>
            </div>
          </div>
          
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: domain.color }}
            title={`Domain color: ${domain.color}`}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Tables in this Domain</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {tables.map((table) => (
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
                        <span>Source: {table.data_source.name}</span>
                        <span>Type: {table.data_source.type}</span>
                        <span>Created: {new Date(table.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {table.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {table.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${tag.color}20`, 
                                color: tag.color 
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {tables.length === 0 && (
              <div className="p-12 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
                <p className="text-gray-600">This domain doesn't contain any tables yet.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Domain Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Domain ID</dt>
                <dd className="text-sm text-gray-900 mt-1">{domain.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Color</dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-200"
                    style={{ backgroundColor: domain.color }}
                  ></div>
                  <span>{domain.color}</span>
                </dd>
              </div>
              {domain.steward_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data Steward</dt>
                  <dd className="text-sm text-gray-900 mt-1">{domain.steward_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(domain.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {new Date(domain.updated_at).toLocaleDateString('en-US', {
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
              <h2 className="text-lg font-medium text-gray-900">Quick Stats</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Tables</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{domain.tables_count}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}