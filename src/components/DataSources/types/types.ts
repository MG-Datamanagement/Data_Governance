import { LucideIcon } from "lucide-react";
import { ScreensEnum } from "../constants";

export interface NavigationItem {
  id: ScreensEnum;
  name: string;
  icon: LucideIcon;
  label: string;
}

export interface Connector {
  id: string;
  name: string;
  source:string;
  type: string;
  category: "database" | "cloud" | "api" | "file";
  status: "active" | "inactive" | "error" | "testing";
  lastSync?: string;
  lastUpdated: string;
  recordsProcessed?: number;
  errorCount?: number;
  config: ConnectorConfig;
  tables?: string[];
  tags?: string[];
  schedule?: string;
}

export interface ConnectorConfig {
  source:string;
  host?: string;
  port?: string | number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  ssl_mode?: string | null;
  ssh_tunnel_method?: string | null;
  cdc_method?: "cdc" | "full_load";
  data_cleaning_enabled?: "yes" | "no";
  deduplication?: "yes" | "no";
}

export interface Query {
  id: string;
  query: string;
  connector: string;
  executedAt: string;
  duration: number;
  rows: number;
  status: "success" | "error" | "running";
}

export interface QueryState {
  selectedConnector: string;
  query: string;
  results: QueryResults | null;
  isExecuting: boolean;
  selectedTable: string | null;
  isConnecting?: boolean,
}

export interface QueryResults {
  columns: string[];
  rows: any[];
  executionTime: number;
}

export interface NotificationType {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
}

export interface DatabaseType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "database" | "cloud" | "api" | "file";
  description: string;
  defaultPort: string;
}

export interface CreateConnectorData {
  name: string;
  type: string;
  category: DatabaseType["category"];
  config: ConnectorConfig;
  tags: string[];
  schedule: string;
}

export interface UseNotificationsReturn {
  notifications: NotificationType[];
  addNotification: (type: NotificationType["type"], message: string) => void;
  dismissNotification: (id: string) => void;
}

export interface UseConnectorsReturn {
  connectors: Connector[];
  isLoading: boolean;
  createConnector: (data: CreateConnectorData) => Promise<void>;
  updateConnector: (id: string, data: Partial<Connector>) => Promise<void>;
  deleteConnector: (id: string) => Promise<void>;
  syncConnector: (id: string) => Promise<void>;
  testConnection: (config: ConnectorConfig) => Promise<{
    success: boolean;
    message: string;
  }>;
}

export interface UseQueryEngineReturn {
  queryState: QueryState;
  queryHistory: Query[];
  tables: TableInfo[];
  executeQuery: () => Promise<void>;
  updateQuery: (query: string) => void;
  selectConnector: (connectorId: string) => void;
  selectTable: (tableName: string) => void;
  saveQuery: () => void;
  clearQuery: () => void;
  formatQuery: () => void;
}

export interface QueryExecutionResult {
  columns: string[];
  rows: any[];
  executionTime: number;
}

export interface DatabaseType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "database" | "cloud" | "api" | "file";
  description: string;
  defaultPort: string;
}

export interface ConnectorStats {
  total: number;
  active: number;
  inactive: number;
  errors: number;
  totalRecords: number;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  connector: string;
  executedAt: string; // ISO timestamp as string
  duration: number; // in milliseconds or seconds depending on context
  rows: number;
  status: "success" | "error" | "pending"; // Extend as needed
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface TransformationRequest {
  tables: TableSelection[];
  operation: OperationType;
  type?: JoinType;
  on?: string;
  // columns?: string[];
  // agg?: Record<string, string>;
  mask_pii?: string;
  pii_fields?: string[];
  user_role?: string;
}

export interface TableInfo {
  name: string;
  rows: number;
  size: string;
  source: string;   
  database: string;
}

export interface TableSelection {
  source: string;
  db: string;
  table: string;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface TableMetadata {
  table: string;
  columns: ColumnInfo[];
  rowCount?: number;
  indexes?: string[];
}

export interface ExploreResponse {
  [source: string]: {
    [database: string]: {
      [table: string]: Array<{
        Field: string;
        Type: string;
        Key: string;
      }>;
    };
  };
}

export interface CreateConnectorRequest {
  source: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl_mode: string | null;
  ssh_tunnel_method: string | null;
  cdc_method: "cdc" | "full_load";
  data_cleaning_enabled: "yes" | "no";
  deduplication: "yes" | "no";
}

export interface UpdateConnectorRequest {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl_mode?: string | null;
  ssh_tunnel_method?: string | null;
  cdc_method?: "cdc" | "full_load";
  data_cleaning_enabled?: "yes" | "no";
  deduplication?: "yes" | "no";
}

export interface ConnectorApiResponse {
  connector_id: string;
  source: string;
  host: string;
  port: number;
  database: string;
  username: string;
  cdc_method: "cdc" | "full_load";
  data_cleaning_enabled: "yes" | "no";
  deduplication: "yes" | "no";
  ssl_mode: string | null;
  ssh_tunnel_method: string | null;
  status: string;
  message: string;
  created_at: string;
  updated_at?: string;
  last_sync?: string;
  records_processed?: number;
  error_count?: number;
  tables?: string[];
  tags?: string[];
  schedule?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Analytics types
export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  period: string;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface PerformanceMetrics {
  avgQueryTime: ChartDataPoint[];
  queriesPerHour: ChartDataPoint[];
  dataThroughput: ChartDataPoint[];
  errorRate: ChartDataPoint[];
}

export interface ConnectorHealth {
  connectorId: string;
  connectorName: string;
  status: "healthy" | "warning" | "critical";
  uptime: string;
  responseTime: number;
  errorCount: number;
  lastCheck: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  performanceMetrics: PerformanceMetrics;
  connectorHealth: ConnectorHealth[];
  topQueries: Array<{
    query: string;
    executionCount: number;
    avgTime: number;
  }>;
}

export type OperationType = "select" | "join" | "groupby" | "union";
export type JoinType = "inner" | "left" | "right" | "outer";