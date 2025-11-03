'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  BarChart3
} from 'lucide-react';
import LineageGraphV2 from '@/components/LineageGraphV2/LineageGraphV2';
import { normalizeLineageData } from '@/utils/utils';

interface Table {
  table_id: number;
  table_name: string;
  schema_name: string;
  data_source_name: string;
  transformation_logic?: string;
  confidence_score?: number;
  depth?: number;
  direction?: string;
}

interface LineageGraph {
  center_table: Table;
  upstream_links: Table[];
  downstream_links: Table[];
  metadata: {
    max_depth_reached: number;
    total_upstream_tables: number;
    total_downstream_tables: number;
    include_columns: boolean;
  };
}

interface ImpactAnalysis {
  table_id: number;
  table_name: string;
  impact_analysis: {
    upstream_table_count: number;
    upstream_column_count: number;
    max_upstream_depth: number;
    downstream_table_count: number;
    downstream_column_count: number;
    max_downstream_depth: number;
    is_critical_path: boolean;
    criticality_score: number;
    impact_radius: number;
    upstream_tables: any[];
    downstream_tables: any[];
    last_computed_at: string;
    analysis_version: string;
  };
}

interface LineageJob {
  id: number;
  name: string;
  description: string;
  external_job_id: string;
  job_type: string;
  schedule: string;
  is_scheduled: boolean;
  last_run_at: string;
  next_run_at: string;
  last_run_status: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LineageStatistics {
  overview: {
    total_active_edges: number;
    total_active_jobs: number;
    tables_with_upstream_lineage: number;
    tables_with_downstream_lineage: number;
  };
  edge_breakdown: {
    by_type: Array<{ type: string; count: number }>;
    by_source: Array<{ source: string; count: number }>;
  };
  recent_job_runs: Array<{
    job_name: string;
    run_id: string;
    status: string;
    started_at: string;
    tables_processed: number;
    lineage_edges_created: number;
  }>;
}

const API_BASE_URL = 'https://nmqhfvs3-8000.inc1.devtunnels.ms';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: string; className?: string }> = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 bg-white text-gray-700"
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${className}`}>
      {children}
    </span>
  );
};

const Button: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  className?: string 
}> = ({ children, onClick, disabled = false, className = "" }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

interface LineageVisualizationProps {
  lineageData: LineageGraph;
  fetchLineageGraph: (tableId: number) => void;
}

const LineageVisualization: React.FC<LineageVisualizationProps> = ({ lineageData, fetchLineageGraph }) => {
  const renderTableCard = (table: Table, isCenter: boolean = false) => (
    <Card key={table.table_id} className={`${isCenter ? 'border-blue-500 shadow-lg' : 'border-gray-200'} min-w-[200px] m-2`}>
      <CardHeader className="pb-2">
        <div className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {table.table_name}
        </div>
        <div className="text-xs text-gray-600">
          {table.schema_name} • {table.data_source_name}
        </div>
      </CardHeader>
      {(table.transformation_logic || table.confidence_score) && (
        <CardContent className="pt-0">
          {table.transformation_logic && (
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-1">
              {table.transformation_logic.length > 60 
                ? table.transformation_logic.substring(0, 60) + '...'
                : table.transformation_logic
              }
            </p>
          )}
          {table.confidence_score && (
            <Badge variant="secondary" className="text-xs">
              {table.confidence_score}% confidence
            </Badge>
          )}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="w-full p-6">
      <LineageGraphV2 lineageData={normalizeLineageData(lineageData) as any} addTablesFeat handleRefetchUpdatedGraph={(tableId) => fetchLineageGraph(tableId)} />
      {/* <div className="flex flex-col lg:flex-row items-center gap-8">

        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Upstream Dependencies ({lineageData.metadata.total_upstream_tables})
          </h3>
          {lineageData.upstream_links.length > 0 ? (
            <div className="flex flex-wrap justify-center">
              {lineageData.upstream_links.map(table => renderTableCard(table))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No upstream dependencies found
            </div>
          )}
        </div>


        <div className="flex-shrink-0">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-xs">Current Table</Badge>
          </div>
          {renderTableCard(lineageData.center_table, true)}
        </div>


        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            Downstream Consumers ({lineageData.metadata.total_downstream_tables})
            <ArrowRight className="h-4 w-4" />
          </h3>
          {lineageData.downstream_links.length > 0 ? (
            <div className="flex flex-wrap justify-center">
              {lineageData.downstream_links.map(table => renderTableCard(table))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No downstream consumers found
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

const StatisticsView: React.FC<{ stats: LineageStatistics }> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Lineage Edges</p>
                <p className="text-2xl font-bold">{stats.overview.total_active_edges}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.overview.total_active_jobs}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tables with Upstream</p>
                <p className="text-2xl font-bold">{stats.overview.tables_with_upstream_lineage}</p>
              </div>
              <ArrowLeft className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tables with Downstream</p>
                <p className="text-2xl font-bold">{stats.overview.tables_with_downstream_lineage}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Job Runs */}
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Job Runs
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Job Name</th>
                  <th className="text-left py-2">Run ID</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Started At</th>
                  <th className="text-left py-2">Tables Processed</th>
                  <th className="text-left py-2">Edges Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_job_runs.map((run, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{run.job_name}</td>
                    <td className="py-2 font-mono text-xs">{run.run_id}</td>
                    <td className="py-2">
                      <Badge variant={run.status === 'success' ? 'default' : 'destructive'}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="py-2">{new Date(run.started_at).toLocaleString()}</td>
                    <td className="py-2">{run.tables_processed}</td>
                    <td className="py-2">{run.lineage_edges_created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function LineagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [lineageData, setLineageData] = useState<LineageGraph | null>(null);
  const [statistics, setStatistics] = useState<LineageStatistics | null>(null);
  const [activeTab, setActiveTab] = useState('graph');
  const [maxDepth, setMaxDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [availableTables, setAvailableTables] = useState<Array<{id: number, name: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Fetch available tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/tables`);
        const data = await response.json();
        if (data.tables) {
          setAvailableTables(data.tables.map((t: any) => ({
            id: t.id,
            name: `${t.schema_name}.${t.name}`
          })));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      }
    };
    
    fetchTables();
    fetchStatistics();
  }, []);

  const fetchLineageGraph = async (tableId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/lineage/table/${tableId}/full-graph?max_depth=${maxDepth}`);
      const data = await response.json();
      setLineageData(data);
      setSearchTerm("");
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to fetch lineage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/lineage/statistics`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleSearch = () => {
    if (selectedTable) {
      fetchLineageGraph(selectedTable);
    }
  };

  const filteredTables = availableTables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Data Lineage
        </h1>
        <p className="text-gray-600">
          Explore data flow relationships, track dependencies, and analyze impact across your data ecosystem.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'graph', label: 'Lineage Graph' },
              { id: 'statistics', label: 'Statistics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          {/* Search and Controls */}
          <Card>
            <CardHeader>
              <div className="text-lg font-semibold">Explore Table Lineage</div>
              <div className="text-gray-600">
                Search for a table to visualize its data flow and dependencies
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tables..."
                      value={searchTerm}
                      onChange={(e) => {setSearchTerm(e.target.value); setShowSuggestions(true);}}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {(searchTerm && showSuggestions) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredTables.map((table) => (
                        <button
                          key={table.id}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50"
                          onClick={() => {
                            setSelectedTable(table.id);
                            setSearchTerm(table.name);
                            setShowSuggestions(false);
                          }}
                        >
                          {table.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select 
                  value={maxDepth} 
                  onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                  className="py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Depth: 1</option>
                  <option value={2}>Depth: 2</option>
                  <option value={3}>Depth: 3</option>
                  <option value={4}>Depth: 4</option>
                  <option value={5}>Depth: 5</option>
                  <option value={6}>Depth: 6</option>
                </select>
                <Button 
                  onClick={handleSearch} 
                  disabled={!selectedTable || loading}
                  className="whitespace-nowrap"
                >
                  {loading ? 'Loading...' : 'Explore Lineage'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lineage Visualization */}
          {lineageData && (
            <Card>
              <CardHeader>
                <div className="text-lg font-semibold">{`${lineageData?.center_table?.schema_name}.${(lineageData?.center_table as any)?.table_name || (lineageData?.center_table as any)?.name}`}</div>
                {/* <div className="text-lg font-semibold">Data Flow Visualization</div> */}
                {/* <div className="text-gray-600">
                  Lineage graph showing upstream dependencies and downstream consumers
                </div> */}
              </CardHeader>
              <div className="border-t">
                <LineageVisualization lineageData={lineageData} fetchLineageGraph={(tableId) =>fetchLineageGraph(tableId)} />
              </div>
            </Card>
          )}

          {!lineageData && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  Select a table and click "Explore Lineage" to visualize its data flow relationships
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Lineage Statistics</h2>
              <p className="text-gray-600">Overview of data lineage coverage and health metrics</p>
            </div>
            <Button onClick={fetchStatistics}>
              Refresh Statistics
            </Button>
          </div>
          {statistics && <StatisticsView stats={statistics} />}
        </div>
      )}
    </div>
  );
}