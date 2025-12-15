"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Plus, X, ChevronDown, ChevronRight, Copy, Trash2, Play, Edit, Info, AlertCircle, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

type SourceDefinition = {
  id: string;
  name: string;
  description: string;
  supports: { form: boolean; yaml: boolean };
  icon?: string;
  category?: string;
};

type ConnectionConfig = {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  database?: string;
  sslMode?: string;
  connectionUri?: string;
  // Azure AD
  clientId?: string;
  tenantId?: string;
  clientSecret?: string;
  // BigQuery
  projectId?: string;
  credentialsJson?: string;
  // Generic
  apiKey?: string;
  baseUrl?: string;
  token?: string;
  warehouse?: string;
  role?: string;
  catalog?: string;
  scheme?: string;
};

type FilterConfig = {
  schemas: { allow: string[]; deny: string[] };
  tables: { allow: string[]; deny: string[] };
  views: { allow: string[]; deny: string[] };
};

type SettingsConfig = {
  includeTables: boolean;
  includeViews: boolean;
  enableTableProfiling: boolean;
  enableColumnProfiling: boolean;
  enableStatefulIngestion: boolean;
};

type ScheduleConfig = {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone: string;
  cronExpression?: string;
};

type AdvancedConfig = {
  executorId: string;
  cliVersion: string;
  debugMode: boolean;
  extraEnvVars: Array<{ key: string; value: string }>;
  extraPlugins: string[];
  extraPipLibs: string[];
};

type DataSource = {
  id: string;
  urn: string;
  name: string;
  type: string;
  platform: string;
  schedule?: ScheduleConfig;
  status: 'succeeded' | 'failed' | 'running';
  lastRun?: string;
  config: {
    recipe: string;
    version: string;
  };
};

type RunHistory = {
  id: string;
  requestedAt: string;
  startedAt: string;
  duration: string;
  status: 'succeeded' | 'failed' | 'running';
  source: 'Manual' | 'System';
  logs?: string;
  recipe?: string;
};

export const SOURCE_REGISTRY: SourceDefinition[] = [
  {
    id: "cassandra",
    name: "CassandraDB",
    description: "Import metadata from Cassandra.",
    category: "Database",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/png/cassandra.png"
  },
  {
    id: "clickhouse",
    name: "ClickHouse",
    description: "Import Tables, Views, and Materialized Views.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/clickhouse.svg"
  },
  {
    id: "cockroach",
    name: "CockroachDB",
    description: "Import Schemas, Tables, Views, and lineage.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/cockroachdb.png"
  },
  {
    id: "hive",
    name: "Hive",
    description: "Import Tables, Views, and metadata from Hive.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/hive.svg"
  },
  {
    id: "mariadb",
    name: "MariaDB",
    description: "Import Tables, Views, and Schemas from MariaDB.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/mariadb.png"
  },
  {
    id: "mssql",
    name: "MSSQL",
    description: "Import Tables, Schema metadata, and lineage.",
    category: "Database",
    supports: { form: true, yaml: false },
    icon: "/icons/sources/svg/mssql.svg"
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "Import Tables, Views, Schemas, and metadata.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/mysql.svg"
  },
  {
    id: "postgres",
    name: "Postgres",
    description: "Import Schemas, Tables, Views, and stats from Postgres.",
    category: "Database",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/postgres.svg"
  },

  // ============================
  // WAREHOUSE
  // ============================
  {
    id: "athena",
    name: "Athena",
    description: "Import Schemas, Tables, Views, and lineage from Athena.",
    category: "Warehouse",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/athena.svg"
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description: "Import Projects, Datasets, Tables, Views, lineage, and statistics.",
    category: "Warehouse",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/bigquery.svg"
  },
  {
    id: "databricks",
    name: "Databricks",
    description: "Import metastores, schemas, tables, lineage and statistics.",
    category: "Warehouse",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/databricks.png"
  },
  {
    id: "redshift",
    name: "Redshift",
    description: "Import Databases, Schemas, Tables, and lineage.",
    category: "Warehouse",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/redshift.svg"
  },
  {
    id: "snowflake",
    name: "Snowflake",
    description: "Import Warehouses, Databases, Schemas, Tables, and lineage.",
    category: "Warehouse",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/snowflake.svg"
  },
  {
    id: "trino",
    name: "Trino",
    description: "Import Tables, Schemas, and metadata.",
    category: "Warehouse",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/png/trino.png"
  },

  // ============================
  // BI
  // ============================
  {
    id: "looker",
    name: "Looker",
    description: "Import models, explores, looks, dashboards, and lineage.",
    category: "BI",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/looker.svg"
  },
  {
    id: "metabase",
    name: "Metabase",
    description: "Import collections, dashboards, and cards.",
    category: "BI",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/metabase.svg"
  },
  {
    id: "superset",
    name: "Superset",
    description: "Import Charts and Dashboards.",
    category: "BI",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/superset.svg"
  },
  {
    id: "tableau",
    name: "Tableau",
    description: "Import dashboard metadata from Tableau.",
    category: "BI",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/tableau.png"
  },

  // ============================
  // PIPELINE
  // ============================
  {
    id: "fivetran",
    name: "Fivetran",
    description: "Import Connectors, Destinations, and lineage.",
    category: "Pipeline",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/fivetran.png"
  },
  {
    id: "dbt-cloud",
    name: "dbt Cloud",
    description: "Import sources, models, tests and lineage.",
    category: "Pipeline",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/dbt.svg"
  },

  // ============================
  // NOSQL
  // ============================
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Import Databases and Collections from MongoDB.",
    category: "NoSQL",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/mongodb.svg"
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    description: "Import Tables and metadata from DynamoDB.",
    category: "NoSQL",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/png/dynamodb.png"
  },
  {
    id: "neo4j",
    name: "Neo4j",
    description: "Import graphs and metadata from Neo4j.",
    category: "NoSQL",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/neo4j.png"
  },

  // ============================
  // IDENTITY
  // ============================
  {
    id: "azure-ad",
    name: "Azure AD",
    description: "Import Users and Groups from Azure Active Directory.",
    category: "Identity",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/svg/azure.svg"
  },
  {
    id: "okta",
    name: "Okta",
    description: "Import Users and Groups from Okta.",
    category: "Identity",
    supports: { form: true, yaml: true },
    icon: "/icons/sources/png/okta.png"
  },

  // ============================
  // STREAMING
  // ============================
  {
    id: "kafka",
    name: "Kafka",
    description: "Import Topics and Schemas from Kafka.",
    category: "Streaming",
    supports: { form: false, yaml: true },
    icon: "/icons/sources/svg/kafka.svg"
  },

  // ============================
  // FILE / CUSTOM
  // ============================
  {
    id: "csv",
    name: "CSV",
    description: "Import metadata from a formatted CSV.",
    category: "File",
    supports: { form: true, yaml: true },
    icon: "/icons/logo.png"
  },
  {
    id: "other",
    name: "Other (YAML)",
    description: "Use a custom recipe via YAML.",
    category: "Custom",
    supports: { form: false, yaml: true },
    icon: "/icons/logo.png"
  }
];

const MOCK_SOURCES: DataSource[] = [
  {
    id: 'sas-1',
    urn: 'urn:li:dataHubIngestionSource:sas-1',
    name: 'sas',
    type: 'postgres',
    platform: 'postgres',
    schedule: { enabled: true, frequency: 'daily', time: '00:00', timezone: 'UTC', cronExpression: '0 0 * * *' },
    status: 'failed',
    lastRun: '2025-08-12T00:00:00Z',
    config: { recipe: 'source:\n  type: postgres\n  config:\n    host: localhost', version: '1' }
  },
  {
    id: 'mongo-1',
    urn: 'urn:li:dataHubIngestionSource:mongo-1',
    name: 'mongo',
    type: 'mongodb',
    platform: 'mongodb',
    schedule: { enabled: true, frequency: 'daily', time: '00:00', timezone: 'UTC', cronExpression: '0 0 * * *' },
    status: 'succeeded',
    lastRun: '2025-08-12T00:00:00Z',
    config: { recipe: 'source:\n  type: mongodb\n  config:\n    connect_uri: null', version: '1' }
  }
];

const MOCK_RUN_HISTORY: Record<string, RunHistory[]> = {
  'mongo-1': [
    {
      id: 'run-1',
      requestedAt: '2025-04-12T10:48:23Z',
      startedAt: '2025-04-12T10:48:23Z',
      duration: '52.1 s',
      status: 'succeeded',
      source: 'Manual',
      logs: '~~~~ Execution Summary - RUN_INGEST ~~~~\nExecution finished with errors.\n{"exec_id": "019c9b8d-7e1c-441d-95dd-9402ba689145"',
      recipe: 'run_id: "urn:li:dataHubExecutionRequest:019c9b8d-7e1c-441d-95dd-9402ba689145"\nsource:\n  type: mongodb\n  config:\n    connect_uri: null'
    }
  ]
};

const generateYamlFromConfig = (sourceId: string, connection: ConnectionConfig, filters: FilterConfig, settings: SettingsConfig): string => {
  const lines = ['source:', `  type: ${sourceId}`, '  config:'];

  // MongoDB specific config
  if (sourceId === 'mongodb') {
    if (connection.connectionUri) lines.push(`    connect_uri: ${connection.connectionUri}`);
    if (connection.username) lines.push(`    username: ${connection.username}`);
    if (connection.password) lines.push(`    password: ${connection.password}`);
    lines.push('    enableSchemaInference: true');
    lines.push('    useRandomSampling: true');
    lines.push('    maxSchemaSize: 300');
    lines.push('    stateful_ingestion:');
    lines.push('      enabled: true');
  } else {
    // Other sources
    if (connection.host) lines.push(`    host: ${connection.host}${connection.port ? ':' + connection.port : ''}`);
    if (connection.username) lines.push(`    username: ${connection.username}`);
    if (connection.password) lines.push(`    password: '${connection.password}'`);
    if (connection.database) lines.push(`    database: ${connection.database}`);
    if (connection.connectionUri) lines.push(`    connect_uri: ${connection.connectionUri}`);

    if (filters.schemas.allow.length > 0 || filters.schemas.deny.length > 0) {
      lines.push('    schema_pattern:');
      if (filters.schemas.allow.length > 0) lines.push(`      allow: [${filters.schemas.allow.map(s => `"${s}"`).join(', ')}]`);
      if (filters.schemas.deny.length > 0) lines.push(`      deny: [${filters.schemas.deny.map(s => `"${s}"`).join(', ')}]`);
    }

    if (settings.includeTables !== undefined) lines.push(`    include_tables: ${settings.includeTables}`);
    if (settings.includeViews !== undefined) lines.push(`    include_views: ${settings.includeViews}`);
    if (settings.enableTableProfiling) lines.push(`    profiling:\n      enabled: true`);
  }

  return lines.join('\n');
};

// GraphQL mutation to create ingestion source
const createIngestionSource = async (
  type: string,
  name: string,
  config: ConnectionConfig,
  recipe: string
): Promise<string> => {
  const recipeJson = {
    source: {
      type: type,
      config: {
        ...(type === 'mongodb' ? {
          connect_uri: config.connectionUri || '',
          username: config.username || '',
          password: config.password || '',
          enableSchemaInference: true,
          useRandomSampling: true,
          maxSchemaSize: 300,
          stateful_ingestion: {
            enabled: true
          }
        } : {})
      }
    },
    sink: {
      type: 'datahub-rest',
      config: {
        server: 'http://datahub-gms:8080'
      }
    }
  };

  const mutation = `
    mutation CreateIngestionSource {
      urn: createIngestionSource(input: {
        type: "${type}"
        name: "${name}"
        config: {
          recipe: """${JSON.stringify(recipeJson, null, 2)}"""
          executorId: "default"
        }
      })
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.urn;
};

// GraphQL query to fetch ingestion sources
const fetchIngestionSources = async (): Promise<DataSource[]> => {
  const query = `
    query ListAllIngestionSources {
      listIngestionSources(input: { start: 0, count: 100 }) {
        start
        count
        total
        ingestionSources {
          urn
          name
          type
          schedule {
            interval
            timezone
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    // Transform the API response to match our DataSource type
    const ingestionSources = result.data.listIngestionSources.ingestionSources;
    return ingestionSources.map((source: any) => ({
      id: source.urn.split(':').pop() || source.urn,
      urn: source.urn,
      name: source.name,
      type: source.type,
      platform: source.type,
      schedule: source.schedule ? {
        enabled: true,
        frequency: 'daily',
        time: '00:00',
        timezone: source.schedule.timezone || 'UTC',
        cronExpression: source.schedule.interval
      } : undefined,
      status: 'succeeded' as const,
      lastRun: new Date().toISOString(),
      config: {
        recipe: `source:\n  type: ${source.type}\n  config:\n    # Configuration details`,
        version: '1'
      }
    }));
  } catch (error) {
    toast.error('Failed to fetch ingestion sources.');
    return [];
  }
};

// GraphQL mutation to run an ingestion source
const runIngestionSource = async (sourceUrn: string): Promise<string> => {
  const mutation = `
    mutation createIngestionExecutionRequest {
      createIngestionExecutionRequest(
        input: {ingestionSourceUrn: "${sourceUrn}"}
      )
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.createIngestionExecutionRequest;
};

const deleteIngestionSource = async (sourceUrn: string): Promise<string> => {
  const mutation = `
    mutation DeleteSource {
      deleteIngestionSource(urn: "${sourceUrn}")
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mutation }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.deleteIngestionSource;
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};


export default function DataSourcesModule() {
  const [sources, setSources] = useState<DataSource[]>(MOCK_SOURCES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'UI' | 'CLI'>('All');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
  const [currentStep, setCurrentStep] = useState(1);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  // Step 1: Choose Source
  const [selectedSource, setSelectedSource] = useState<SourceDefinition | null>(null);
  const [sourceSearchTerm, setSourceSearchTerm] = useState('');

  // Step 2: Configure
  const [configMode, setConfigMode] = useState<'form' | 'yaml'>('form');
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({});
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    schemas: { allow: [], deny: [] },
    tables: { allow: [], deny: [] },
    views: { allow: [], deny: [] }
  });
  const [settingsConfig, setSettingsConfig] = useState<SettingsConfig>({
    includeTables: true,
    includeViews: true,
    enableTableProfiling: false,
    enableColumnProfiling: false,
    enableStatefulIngestion: false
  });
  const [yamlContent, setYamlContent] = useState('');

  // Step 3: Schedule
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'daily',
    time: '00:00',
    timezone: 'Asia/Calcutta'
  });

  // Step 4: Finish
  const [sourceName, setSourceName] = useState('');
  const [owners, setOwners] = useState<string[]>([]);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    executorId: 'default',
    cliVersion: '',
    debugMode: false,
    extraEnvVars: [],
    extraPlugins: [],
    extraPipLibs: []
  });

  // Modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRunId, setConfirmRunId] = useState<string | null>(null);
  const [runDetailsId, setRunDetailsId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    connection: true,
    filter: false,
    settings: false,
    advanced: false
  });
  const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!;

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const fetchedSources = await fetchIngestionSources();
      if (fetchedSources.length > 0) {
        setSources(fetchedSources);
      }
    } catch (error) {
      toast.error('Failed to load sources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleCopyToClipboard = async (text: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const handleCreateSource = () => {
    setWizardMode('create');
    setCurrentStep(1);
    setSelectedSource(null);
    setConfigMode('form');
    setConnectionConfig({});
    setFilterConfig({ schemas: { allow: [], deny: [] }, tables: { allow: [], deny: [] }, views: { allow: [], deny: [] } });
    setSettingsConfig({ includeTables: true, includeViews: true, enableTableProfiling: false, enableColumnProfiling: false, enableStatefulIngestion: false });
    setScheduleConfig({ enabled: false, frequency: 'daily', time: '00:00', timezone: 'Asia/Calcutta' });
    setSourceName('');
    setOwners([]);
    setAdvancedConfig({ executorId: 'default', cliVersion: '', debugMode: false, extraEnvVars: [], extraPlugins: [], extraPipLibs: [] });
    setIsWizardOpen(true);
  };

  const handleEditSource = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setWizardMode('edit');
    setEditingSourceId(sourceId);
    setCurrentStep(2);

    const sourceDef = SOURCE_REGISTRY.find(s => s.id === source.type);
    setSelectedSource(sourceDef || null);

    setSourceName(source.name);
    setConfigMode(sourceDef?.supports.form ? 'form' : 'yaml');
    setYamlContent(source.config.recipe);
    setScheduleConfig(source.schedule || { enabled: false, frequency: 'daily', time: '00:00', timezone: 'UTC' });

    setIsWizardOpen(true);
  };

  const handleDeleteSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setIsDeleting(true);
    try {
      await deleteIngestionSource(source.urn);
      toast.success('Ingestion source deleted successfully');
      await loadSources();
      setConfirmDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete ingestion source.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRunSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setIsRunning(true);
    try {
      const executionRequestUrn = await runIngestionSource(source.urn);
      setConfirmRunId(null);
      await loadSources();
    } catch (error) {
      toast.error('Failed to run ingestion source.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveSource = async (shouldRun: boolean = false) => {
    if (!selectedSource) return;

    const yaml = configMode === 'yaml' ? yamlContent : generateYamlFromConfig(selectedSource.id, connectionConfig, filterConfig, settingsConfig);

    const newSource: DataSource = {
      id: editingSourceId || `source-${Date.now()}`,
      urn: `urn:li:dataHubIngestionSource:${editingSourceId || sourceName.toLowerCase().replace(/\s+/g, '-')}`,
      name: sourceName,
      type: selectedSource.id,
      platform: selectedSource.id,
      schedule: scheduleConfig.enabled ? scheduleConfig : undefined,
      status: 'succeeded',
      lastRun: new Date().toISOString(),
      config: { recipe: yaml, version: '1' }
    };

    // If Save & Run is clicked, call the GraphQL mutation
    if (shouldRun) {
      try {
        await createIngestionSource(selectedSource.id, sourceName, connectionConfig, yaml);
        toast.success('Ingestion source created successfully');
        await loadSources();
      } catch (error) {
        toast.error('Failed to create ingestion source.');
        return;
      }
    }

    setIsWizardOpen(false);
  };

  const handleNextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredSources = useMemo(() => {
    return SOURCE_REGISTRY.filter(source => {
      const matchesSearch = source.name.toLowerCase().includes(sourceSearchTerm.toLowerCase()) ||
        source.description.toLowerCase().includes(sourceSearchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [sourceSearchTerm]);

  // ============================================================================
  // RENDER: MAIN LIST PAGE
  // ============================================================================

  if (!isWizardOpen) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Manage Data Sources</h1>
              <p className="text-gray-600">Configure and schedule syncs to import data from your data sources</p>
            </div>
            <button
              onClick={handleCreateSource}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create new source
            </button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="border border-gray-300 rounded-lg">
                  <option>All</option>
                  <option>UI</option>
                  <option>CLI</option>
                </select>
              </div>
            </div>
            <button
              onClick={loadSources}
              disabled={isLoading}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mr-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="w-12"></th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Name</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Schedule</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="w-48"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-gray-600">Loading ingestion sources...</p>
                      </div>
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Info className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600">No ingestion sources found</p>
                        <button
                          onClick={handleCreateSource}
                          className="mt-2 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4" />
                          Create your first source
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sources.map((source) => (
                    <React.Fragment key={source.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <button onClick={() => toggleRow(source.id)} className="text-gray-400 hover:text-gray-600">
                            {expandedRows.has(source.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <div className="w-4 h-4 bg-green-600" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                            </div>
                            <span className="text-sm text-gray-700">{source.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{source.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-600 font-mono">{source.schedule?.cronExpression || '-'}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${source.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                              source.status === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {source.status === 'succeeded' && <CheckCircle2 className="w-3 h-3" />}
                              {source.status === 'failed' && <XCircle className="w-3 h-3" />}
                              {source.status === 'running' && <Clock className="w-3 h-3" />}
                              {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                            </div>
                            {source.lastRun && (
                              <div className="text-xs text-gray-500 mt-1">Last run {formatRelativeTime(source.lastRun)}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyToClipboard(source.urn, 'URN')}
                              className="p-2 hover:bg-gray-100 rounded"
                              title="Copy URN"
                            >
                              <Copy className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={() => handleEditSource(source.id)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                              EDIT
                            </button>
                            <button onClick={() => setConfirmRunId(source.id)} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                              RUN
                            </button>
                            <button onClick={() => setConfirmDeleteId(source.id)} className="p-2 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Run History */}
                      {expandedRows.has(source.id) && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 p-4">
                            <div className="bg-white rounded border border-gray-200">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Requested At</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Started At</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Duration</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-2 px-4 font-medium text-gray-700">Source</th>
                                    <th className="w-32"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(MOCK_RUN_HISTORY[source.id] || []).map((run) => (
                                    <tr key={run.id} className="border-t border-gray-100">
                                      <td className="py-3 px-4">{new Date(run.requestedAt).toLocaleString()}</td>
                                      <td className="py-3 px-4">{new Date(run.startedAt).toLocaleString()}</td>
                                      <td className="py-3 px-4">{run.duration}</td>
                                      <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${run.status === 'succeeded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                          {run.status === 'succeeded' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">{run.source} Execution by</td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                          <button className="p-1 hover:bg-gray-100 rounded">
                                            <Copy className="w-3 h-3 text-gray-600" />
                                          </button>
                                          <button
                                            onClick={() => setRunDetailsId(run.id)}
                                            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                                          >
                                            DETAILS
                                          </button>
                                          <button className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs">
                                            ROLLBACK
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination for run history */}
                            <div className="flex justify-center items-center gap-2 mt-4">
                              <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-50">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                              </button>
                              <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
                              <button className="p-2 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>

            {/* Main table pagination */}
            <div className="flex justify-end items-center gap-2 p-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">1 - 1 of 1</span>
              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 hover:bg-gray-100 rounded disabled:opacity-50">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded">1</button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Confirm Ingestion Source Removal</h3>
                  <p className="text-gray-600 text-sm">
                    Are you sure you want to remove this ingestion source? Removing will terminate any scheduled ingestion runs.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSource(confirmDeleteId)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmRunId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Confirm Source Execution</h3>
                  <p className="text-gray-600 text-sm">
                    Click 'Execute' to run this ingestion source.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmRunId(null)}
                  disabled={isRunning}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRunSource(confirmRunId)}
                  disabled={isRunning}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isRunning && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isRunning ? 'Executing...' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        )}

        {runDetailsId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Execution Run Details</h2>
                <button onClick={() => setRunDetailsId(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">Failed</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Ingestion failed to complete, or completed with errors.</p>
                </div>

                {/* Logs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Logs</h3>
                    <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">View logs that were collected during the sync.</p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto">
                    <button className="text-indigo-400 hover:text-indigo-300 mt-2">Show More</button>
                  </div>
                </div>

                {/* Recipe */}
                <div>
                  <h3 className="font-semibold mb-2">Recipe</h3>
                  <p className="text-sm text-gray-600 mb-2">The configurations used for this sync with the data source.</p>
                  <div className="bg-gray-50 p-4 rounded font-mono text-xs overflow-x-auto">
                    <pre>run_id: "urn:li:dataHubExecutionRequest:019c9b8d-7e1c-441d-95dd-9402ba689145"{'\n'}source:{'\n'}  type: mongodb{'\n'}  config:{'\n'}    connect_uri: null</pre>
                    <button className="text-indigo-600 hover:text-indigo-700 mt-2">Show More</button>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setRunDetailsId(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: WIZARD
  // ============================================================================

  const canProceedStep1 = selectedSource !== null;
  const canProceedStep2 = configMode === 'yaml' ? yamlContent.trim().length > 0 :
    (selectedSource?.id === 'postgres' ? connectionConfig.host && connectionConfig.username && connectionConfig.database :
      selectedSource?.id === 'mongodb' ? connectionConfig.connectionUri && connectionConfig.username && connectionConfig.password :
        true);
  const canProceedStep3 = true;
  const canProceedStep4 = sourceName.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{wizardMode === 'edit' ? 'Edit Data Source' : 'Connect Data Source'}</h2>
          <button onClick={() => setIsWizardOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="py-3 px-2 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Choose Data Source', disabled: wizardMode === 'edit' },
              { num: 2, label: 'Configure Connection' },
              { num: 3, label: 'Sync Schedule' },
              { num: 4, label: 'Finish up' }
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-4">
                  <div className={`text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold ${currentStep === step.num ? 'bg-indigo-600 text-white' :
                    currentStep > step.num ? 'bg-indigo-100 text-indigo-600' :
                      'bg-gray-200 text-gray-600'
                    } ${step.disabled ? 'opacity-50' : ''}`}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <span className={`text-xs font-medium ${currentStep === step.num ? 'text-gray-900' : 'text-gray-600'
                    } ${step.disabled ? 'opacity-50' : ''}`}>
                    {step.label}
                  </span>
                </div>
                {idx < 3 && <div className="flex-1 h-px bg-gray-300 mx-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4">
          {/* STEP 1: Choose Source */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data sources..."
                  value={sourceSearchTerm}
                  onChange={(e) => setSourceSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[250px] overflow-y-auto">
                {(filteredSources).map((source) => {
                  const Icon = source.icon;

                  const isSvg = typeof Icon === "string" && Icon.endsWith(".svg");

                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedSource(source)}
                      className={`p-3 border rounded-lg text-left transition-all hover:border-indigo-500 hover:shadow-md ${selectedSource?.id === source.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-gray-200"
                        }`}
                    >
                      {/* ICON — unified rendering */}
                      <div>{isSvg ? (
                        <img
                          src={Icon}
                          alt={source.name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Image
                          src={Icon ?? "/icons/sources/default.png"}
                          alt={source.name}
                          width={30}
                          height={30}
                          className="object-contain"
                        />
                      )}</div>

                      {/* <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded mb-3"></div> */}

                      <h3 className="font-semibold text-sm my-1">{source.name}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{source.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Configure Connection */}
          {currentStep === 2 && selectedSource && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Let's get connected! 🎉</h4>
                    <p className="text-sm text-blue-800">
                      To import from {selectedSource.name}, we'll need some more information to connect to your instance.
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode Toggle */}
              {selectedSource.supports.form && selectedSource.supports.yaml && (
                <div className="flex justify-end">
                  <div className="inline-flex rounded-lg border border-gray-300 p-1">
                    <button
                      onClick={() => setConfigMode('form')}
                      className={`px-4 py-1.5 text-sm rounded ${configMode === 'form' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      Form
                    </button>
                    <button
                      onClick={() => setConfigMode('yaml')}
                      className={`px-4 py-1.5 text-sm rounded ${configMode === 'yaml' ? 'bg-gray-700 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      YAML
                    </button>
                  </div>
                </div>
              )}

              {configMode === 'form' ? (
                <div className="space-y-6">
                  {/* Connection Section */}
                  <div>
                    <button
                      onClick={() => setExpandedSections({ ...expandedSections, connection: !expandedSections.connection })}
                      className="flex items-center gap-2 w-full text-left font-semibold text-gray-900 mb-4"
                    >
                      {expandedSections.connection ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      🔗 Connection
                    </button>

                    {expandedSections.connection && (
                      <div className="space-y-4 pl-7">
                        {selectedSource.id === 'postgres' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Host and Port <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="postgres:5432"
                                value={`${connectionConfig.host || ''}${connectionConfig.port ? ':' + connectionConfig.port : ''}`}
                                onChange={(e) => {
                                  const [host, port] = e.target.value.split(':');
                                  setConnectionConfig({ ...connectionConfig, host, port });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="postgres"
                                value={connectionConfig.username || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, username: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                placeholder="password"
                                value={connectionConfig.password || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Database <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="my_db"
                                value={connectionConfig.database || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, database: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </>
                        )}

                        {selectedSource.id === 'mongodb' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Connection URI <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="mongodb+srv://cluster0.abc.mongodb.net/Database_name"
                                value={connectionConfig.connectionUri || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, connectionUri: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="username"
                                value={connectionConfig.username || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, username: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                placeholder="password"
                                value={connectionConfig.password || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </>
                        )}

                        {selectedSource.id === 'azure-ad' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={connectionConfig.clientId || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tenant ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={connectionConfig.tenantId || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, tenantId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Secret <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                value={connectionConfig.clientSecret || ''}
                                onChange={(e) => setConnectionConfig({ ...connectionConfig, clientSecret: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Filter Section */}
                  {selectedSource.id === 'postgres' && (
                    <div>
                      <button
                        onClick={() => setExpandedSections({ ...expandedSections, filter: !expandedSections.filter })}
                        className="flex items-center gap-2 w-full text-left font-semibold text-gray-900 mb-4"
                      >
                        {expandedSections.filter ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        🔍 Filter
                      </button>

                      {expandedSections.filter && (
                        <div className="space-y-6 pl-7">
                          {['schemas', 'tables', 'views'].map((type) => (
                            <div key={type}>
                              <h4 className="font-medium text-sm text-gray-700 mb-3 capitalize">{type}</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Allow Patterns</label>
                                  {filterConfig[type as keyof FilterConfig].allow.map((pattern, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                      <input
                                        type="text"
                                        value={pattern}
                                        onChange={(e) => {
                                          const newAllow = [...filterConfig[type as keyof FilterConfig].allow];
                                          newAllow[idx] = e.target.value;
                                          setFilterConfig({
                                            ...filterConfig,
                                            [type]: { ...filterConfig[type as keyof FilterConfig], allow: newAllow }
                                          });
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      />
                                      <button
                                        onClick={() => {
                                          const newAllow = filterConfig[type as keyof FilterConfig].allow.filter((_, i) => i !== idx);
                                          setFilterConfig({
                                            ...filterConfig,
                                            [type]: { ...filterConfig[type as keyof FilterConfig], allow: newAllow }
                                          });
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      setFilterConfig({
                                        ...filterConfig,
                                        [type]: { ...filterConfig[type as keyof FilterConfig], allow: [...filterConfig[type as keyof FilterConfig].allow, ''] }
                                      });
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                  >
                                    + Add pattern
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Deny Patterns</label>
                                  <button
                                    onClick={() => {
                                      setFilterConfig({
                                        ...filterConfig,
                                        [type]: { ...filterConfig[type as keyof FilterConfig], deny: [...filterConfig[type as keyof FilterConfig].deny, ''] }
                                      });
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                  >
                                    + Add pattern
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Settings Section */}
                  {selectedSource.id === 'postgres' && (
                    <div>
                      <button
                        onClick={() => setExpandedSections({ ...expandedSections, settings: !expandedSections.settings })}
                        className="flex items-center gap-2 w-full text-left font-semibold text-gray-900 mb-4"
                      >
                        {expandedSections.settings ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        ⚙️ Settings
                      </button>

                      {expandedSections.settings && (
                        <div className="space-y-3 pl-7">
                          {[
                            { key: 'includeTables', label: 'Include Tables' },
                            { key: 'includeViews', label: 'Include Views' },
                            { key: 'enableTableProfiling', label: 'Enable Table Profiling' },
                            { key: 'enableColumnProfiling', label: 'Enable Column Profiling' },
                            { key: 'enableStatefulIngestion', label: 'Enable Stateful Ingestion' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={settingsConfig[key as keyof SettingsConfig]}
                                onChange={(e) => setSettingsConfig({ ...settingsConfig, [key]: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Configure {selectedSource.name} Recipe</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    For more information about how to configure a recipe, see the{' '}
                    <a href="#" className="text-indigo-600 hover:underline">{selectedSource.name} source docs</a>.
                  </p>
                  <textarea
                    value={yamlContent}
                    onChange={(e) => setYamlContent(e.target.value)}
                    placeholder="source:&#10;  type: mongodb&#10;  config:&#10;    connect_uri: null"
                    className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Configure an Ingestion Schedule</h3>

              <div>
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.enabled}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, enabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="font-medium">Run on a schedule (Recommended)</span>
                </label>
              </div>

              {scheduleConfig.enabled && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="text-red-500">*</span> Schedule
                    </label>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Every</span>
                      <select
                        value={scheduleConfig.frequency}
                        onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value as any })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="daily">day</option>
                        <option value="weekly">week</option>
                        <option value="monthly">month</option>
                      </select>
                      <span className="text-sm text-gray-600">at</span>
                      <input
                        type="time"
                        value={scheduleConfig.time}
                        onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">:</span>
                      <input
                        type="text"
                        value={scheduleConfig.time.split(':')[1] || '00'}
                        onChange={(e) => {
                          const [hour] = scheduleConfig.time.split(':');
                          setScheduleConfig({ ...scheduleConfig, time: `${hour}:${e.target.value}` });
                        }}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="00"
                      />
                      <label className="flex items-center gap-2 ml-4">
                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm text-gray-600">Show Advanced</span>
                      </label>
                    </div>
                    <p className="text-sm text-indigo-600 mt-2 flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      Runs at {scheduleConfig.time.split(':')[0].padStart(2, '0')}:{scheduleConfig.time.split(':')[1]?.padStart(2, '0') || '00'} AM.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500">*</span> Timezone
                    </label>
                    <p className="text-sm text-gray-600 mb-2">Choose a timezone for the schedule.</p>
                    <select
                      value={scheduleConfig.timezone}
                      onChange={(e) => setScheduleConfig({ ...scheduleConfig, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Asia/Calcutta">Asia/Calcutta</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Finish */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> Name
                </label>
                <p className="text-sm text-gray-600 mb-2">Give this data source a name</p>
                <input
                  type="text"
                  placeholder="My Redshift Source #2"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Owners</label>
                <input
                  type="text"
                  placeholder="Search for users or groups"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <button
                  onClick={() => setExpandedSections({ ...expandedSections, advanced: !expandedSections.advanced })}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  {expandedSections.advanced ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  Advanced
                </button>

                {expandedSections.advanced && (
                  <div className="mt-4 space-y-6 pl-7">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Executor ID</label>
                      <p className="text-sm text-gray-600 mb-2">
                        Provide the ID of the executor that should execute this ingestion recipe. This ID is used to route execution requests of the recipe to the executor of the same ID. The built-in DataHub executor ID is 'default'. Do not change this unless you have configured a custom executor via actions framework.
                      </p>
                      <input
                        type="text"
                        value={advancedConfig.executorId}
                        onChange={(e) => setAdvancedConfig({ ...advancedConfig, executorId: e.target.value })}
                        placeholder="default"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CLI Version</label>
                      <p className="text-sm text-gray-600 mb-2">Advanced: Provide a custom CLI version to use for ingestion.</p>
                      <input
                        type="text"
                        value={advancedConfig.cliVersion}
                        onChange={(e) => setAdvancedConfig({ ...advancedConfig, cliVersion: e.target.value })}
                        placeholder="(e.g. 0.15.0)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={advancedConfig.debugMode}
                          onChange={(e) => setAdvancedConfig({ ...advancedConfig, debugMode: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Debug Mode</span>
                          <p className="text-sm text-gray-600">Advanced: Turn on debug mode in order to get more verbose logs.</p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extra Environment Variables</label>
                      <p className="text-sm text-gray-600 mb-2">Advanced: Set extra environment variables to an ingestion execution</p>
                      <input
                        type="text"
                        placeholder='["MY_CUSTOM_ENV": "my_custom_value"]'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extra DataHub plugins</label>
                      <p className="text-sm text-gray-600 mb-2">Advanced: Set extra DataHub plugins for an ingestion execution</p>
                      <input
                        type="text"
                        placeholder='["debug"]'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Extra Pip Libraries</label>
                      <p className="text-sm text-gray-600 mb-2">Advanced: Add extra pip libraries for an ingestion execution</p>
                      <input
                        type="text"
                        placeholder='["sqlparse==0.4.3"]'
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1 || (currentStep === 2 && wizardMode === 'edit')}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentStep === 4 ? (
              <>
                <button
                  onClick={() => handleSaveSource(false)}
                  disabled={!canProceedStep4}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => handleSaveSource(true)}
                  disabled={!canProceedStep4}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save & Run
                </button>
              </>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2) ||
                  (currentStep === 3 && !canProceedStep3)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}