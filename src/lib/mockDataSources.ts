// ─── Manage Data Sources ────────────────────────────────────────────────────

export type DataSourceStatus = "success" | "failed" | "running";

export interface IngestionLog {
  time: string;
  message: string;
  status: "success" | "error" | "info";
}

export interface DataSourceStats {
  totalDatasets: number;
  totalColumns: string; // e.g. "15.4k"
  totalRows: string; // e.g. "450M"
  piiDetected: number;
}

export interface DataSource {
  id: string;
  name: string;
  icon: string; // reuse ConnectorIcon keys
  iconBg: string;
  schedule: string;
  owner: string;
  ownerIcon: string;
  lastRun: string;
  status: DataSourceStatus;
  stats: DataSourceStats;
  ingestionLogs: IngestionLog[];
  totalDatasets: number;
}

export const dataSources: DataSource[] = [
  {
    id: "mongo_db",
    name: "mongo_db",
    icon: "mongodb",
    iconBg: "bg-green-100",
    schedule: "12:00 am (GMT+5:30)",
    owner: "DataHub",
    ownerIcon: "DH",
    lastRun: "2 days ago",
    status: "success",
    totalDatasets: 1245,
    stats: {
      totalDatasets: 984,
      totalColumns: "11.2k",
      totalRows: "320M",
      piiDetected: 74,
    },
    ingestionLogs: [
      {
        time: "10:45 AM",
        message: "Schema extraction completed",
        status: "success",
      },
      {
        time: "10:44 AM",
        message: "Connection established successfully",
        status: "success",
      },
      {
        time: "10:42 AM",
        message: "Starting incremental sync",
        status: "info",
      },
    ],
  },
  {
    id: "my_cust_2_db",
    name: "My_cust_2_DB",
    icon: "mysql",
    iconBg: "bg-blue-100",
    schedule: "12:00 am (GMT+5:30)",
    owner: "DataHub",
    ownerIcon: "DH",
    lastRun: "2 days ago",
    status: "success",
    totalDatasets: 1245,
    stats: {
      totalDatasets: 1245,
      totalColumns: "15.4k",
      totalRows: "450M",
      piiDetected: 128,
    },
    ingestionLogs: [
      {
        time: "10:45 AM",
        message: "Schema extraction completed for customers",
        status: "success",
      },
      {
        time: "10:44 AM",
        message: "Connection established successfully",
        status: "success",
      },
      {
        time: "10:42 AM",
        message: "Starting incremental sync",
        status: "info",
      },
      {
        time: "Yesterday",
        message: "Failed to sync view sales_materialized",
        status: "error",
      },
    ],
  },
  {
    id: "postgres_db",
    name: "postgres_db",
    icon: "postgresql",
    iconBg: "bg-gray-100",
    schedule: "12:00 am (GMT+5:30)",
    owner: "DataHub",
    ownerIcon: "DH",
    lastRun: "2 days ago",
    status: "success",
    totalDatasets: 876,
    stats: {
      totalDatasets: 876,
      totalColumns: "9.8k",
      totalRows: "210M",
      piiDetected: 56,
    },
    ingestionLogs: [
      { time: "10:40 AM", message: "Full sync completed", status: "success" },
      {
        time: "10:38 AM",
        message: "Connection established",
        status: "success",
      },
      { time: "10:36 AM", message: "Starting full sync", status: "info" },
    ],
  },
  {
    id: "my_cust_warehouse",
    name: "My_cust_warehouse",
    icon: "snowflake",
    iconBg: "bg-blue-100",
    schedule: "12:00 am (GMT+5:30)",
    owner: "DataHub",
    ownerIcon: "DH",
    lastRun: "2 days ago",
    status: "failed",
    totalDatasets: 432,
    stats: {
      totalDatasets: 432,
      totalColumns: "5.1k",
      totalRows: "87M",
      piiDetected: 22,
    },
    ingestionLogs: [
      {
        time: "Yesterday",
        message: "Failed to connect to warehouse cluster",
        status: "error",
      },
      {
        time: "Yesterday",
        message: "Retrying connection (attempt 3/3)",
        status: "error",
      },
      { time: "Yesterday", message: "Starting sync", status: "info" },
    ],
  },
];

// ─── Dataset List ─────────────────────────────────────────────────────────────

export type DatasetType = "Table" | "View" | "Materialized View";
export type DatasetStatus = "Healthy" | "Warning" | "Error";

export interface Dataset {
  id: string;
  name: string;
  hasPII: boolean;
  type: DatasetType;
  rows: string | null; // null for views
  columns: number;
  size: string | null;
  lastSync: string;
  status: DatasetStatus;
}

export interface DatasetsBySource {
  [sourceId: string]: Dataset[];
}

export const datasetsBySource: DatasetsBySource = {
  postgres_db: [
    {
      id: "customers",
      name: "customers",
      hasPII: true,
      type: "Table",
      rows: "12.4k",
      columns: 18,
      size: "2.4 MB",
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "orders",
      name: "orders",
      hasPII: false,
      type: "Table",
      rows: "450.2k",
      columns: 24,
      size: "156 MB",
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "transactions",
      name: "transactions",
      hasPII: true,
      type: "Table",
      rows: "1.2M",
      columns: 32,
      size: "450 MB",
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "products",
      name: "products",
      hasPII: false,
      type: "Table",
      rows: "850",
      columns: 12,
      size: "1.2 MB",
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "inventory_logs",
      name: "inventory_logs",
      hasPII: false,
      type: "Table",
      rows: "89k",
      columns: 8,
      size: "12 MB",
      lastSync: "2 hours ago",
      status: "Warning",
    },
    {
      id: "customer_ltv_view",
      name: "customer_ltv_view",
      hasPII: true,
      type: "View",
      rows: null,
      columns: 5,
      size: null,
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "daily_sales_report",
      name: "daily_sales_report",
      hasPII: false,
      type: "View",
      rows: null,
      columns: 10,
      size: null,
      lastSync: "2 hours ago",
      status: "Healthy",
    },
    {
      id: "audit_logs",
      name: "audit_logs",
      hasPII: false,
      type: "Table",
      rows: "2.5M",
      columns: 15,
      size: "890 MB",
      lastSync: "10 mins ago",
      status: "Healthy",
    },
  ],
  mongo_db: [
    {
      id: "users",
      name: "users",
      hasPII: true,
      type: "Table",
      rows: "5.2k",
      columns: 14,
      size: "1.1 MB",
      lastSync: "2 days ago",
      status: "Healthy",
    },
    {
      id: "sessions",
      name: "sessions",
      hasPII: false,
      type: "Table",
      rows: "180k",
      columns: 8,
      size: "42 MB",
      lastSync: "2 days ago",
      status: "Healthy",
    },
    {
      id: "events",
      name: "events",
      hasPII: false,
      type: "Table",
      rows: "3.4M",
      columns: 20,
      size: "780 MB",
      lastSync: "2 days ago",
      status: "Warning",
    },
  ],
  my_cust_2_db: [
    {
      id: "customers",
      name: "customers",
      hasPII: true,
      type: "Table",
      rows: "38k",
      columns: 22,
      size: "8.1 MB",
      lastSync: "2 days ago",
      status: "Healthy",
    },
    {
      id: "sales",
      name: "sales",
      hasPII: false,
      type: "Table",
      rows: "1.1M",
      columns: 15,
      size: "230 MB",
      lastSync: "2 days ago",
      status: "Healthy",
    },
  ],
  my_cust_warehouse: [
    {
      id: "fact_sales",
      name: "fact_sales",
      hasPII: false,
      type: "Table",
      rows: "2.2M",
      columns: 28,
      size: "512 MB",
      lastSync: "2 days ago",
      status: "Error",
    },
  ],
};

// ─── Dataset Detail ───────────────────────────────────────────────────────────

export interface KeyField {
  name: string;
  description: string;
}

export interface DatasetDetail {
  id: string;
  sourceId: string;
  name: string;
  type: string;
  overview: string;
  keyFields: KeyField[];
  freshness: string;
  volume: string;
  qualityScore: string;
  columnCount: number;
  owner: string;
  ownerInitials: string;
  tags: string[];
  lineageWarning?: string;
}

export const datasetDetails: Record<string, DatasetDetail> = {
  customers: {
    id: "customers",
    sourceId: "postgres_db",
    name: "customers",
    type: "Dataset",
    overview:
      "The customers dataset contains structured records related to customer profiles, contact information, and account status. It is designed to support CRM operations, marketing analytics, and customer lifetime value calculations.",
    keyFields: [
      { name: "customer_id", description: "Unique identifier" },
      { name: "email", description: "Primary contact email" },
      { name: "ltv_score", description: "Lifetime value metric" },
      { name: "ssn", description: "Social security number (encrypted)" },
    ],
    freshness: "2h ago",
    volume: "12.4k",
    qualityScore: "98.5%",
    columnCount: 18,
    owner: "Analytics Team",
    ownerInitials: "AT",
    tags: ["PII", "Tier 1", "CRM"],
    lineageWarning:
      "Warning: 3 downstream dashboards depend on `ltv_score` which was recently modified.",
  },
  orders: {
    id: "orders",
    sourceId: "postgres_db",
    name: "orders",
    type: "Dataset",
    overview:
      "Contains granular order events, including order status, amounts, and tracking information. Essential for fulfillment and revenue reporting.",
    keyFields: [
      { name: "order_id", description: "Unique order identifier" },
      { name: "customer_id", description: "Foreign key to customers" },
      { name: "total_amount", description: "Order total in USD" },
      { name: "status", description: "Current order state" },
    ],
    freshness: "1h ago",
    volume: "450.2k",
    qualityScore: "99.1%",
    columnCount: 24,
    owner: "Fulfillment Team",
    ownerInitials: "FT",
    tags: ["Financial", "Production"],
  },
};
