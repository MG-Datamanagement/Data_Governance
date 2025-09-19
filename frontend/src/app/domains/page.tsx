'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Folder,
  Database,
  User
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

interface DomainsResponse {
  domains: Domain[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/domains');
        if (!response.ok) {
          throw new Error('Failed to fetch domains');
        }
        const data: DomainsResponse = await response.json();
        setDomains(data.domains);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load domains');
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  if (loading) {
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
              <h3 className="text-sm font-medium text-red-800">Error loading domains</h3>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Domains</h1>
        <p className="text-lg text-gray-600 mt-2">
          Organize your data assets by business domain and ownership
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Domains ({domains.length})</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {domains.map((domain) => (
            <div key={domain.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                          <span className="text-xs font-medium text-gray-500">URN:</span>
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
                        <span>Created: {new Date(domain.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: domain.color }}
                    title={`Domain color: ${domain.color}`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {domains.length === 0 && (
          <div className="p-12 text-center">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600">Get started by creating your first data domain.</p>
          </div>
        )}
      </div>
    </div>
  );
}