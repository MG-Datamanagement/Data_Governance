import { IntegrationCategory, IntegrationType } from "@/components/DataSources/types/integrations";
import { Connector, DatabaseType, TableInfo } from "../types/types";

export enum ScreensEnum {
  connectors = "connectors",
  query = "query",
}

export const DATABASE_TYPES: DatabaseType[] = [
  {
    id: "mysql",
    name: "MySQL",
    icon: "🐬",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    category: "database",
    description: "Open-source relational database",
    defaultPort: "3306",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: "🐘",
    color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400",
    category: "database",
    description: "Advanced open-source database",
    defaultPort: "5432",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    icon: "🍃",
    color: "bg-green-50 border-green-200 hover:border-green-400",
    category: "database",
    description: "NoSQL document database",
    defaultPort: "27017",
  },
  {
    id: "redis",
    name: "Redis",
    icon: "📮",
    color: "bg-red-50 border-red-200 hover:border-red-400",
    category: "database",
    description: "In-memory data structure store",
    defaultPort: "6379",
  },
  {
    id: "s3",
    name: "Amazon S3",
    icon: "☁️",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    category: "cloud",
    description: "Cloud object storage",
    defaultPort: "",
  },
  {
    id: "snowflake",
    name: "Snowflake",
    icon: "❄️",
    color: "bg-sky-50 border-sky-200 hover:border-sky-400",
    category: "cloud",
    description: "Cloud data warehouse",
    defaultPort: "",
  },
];

// export const MOCK_CONNECTORS: Connector[] = [
//   {
//     id: "conn_pg_1",
//     name: "PostgreSQL",
//     type: "postgres",
//     category: "database",
//     status: "active",
//     config: {
//       source: "Production PostgreSQL",
//       host: "prod-db.company.com",
//       port: 5432,
//       database: "production_db",
//       username: "admin_user",
//       password: "••••••••",
//       ssl_mode: "require",
//       ssh_tunnel_method: "",
//       cdc_method: "cdc",
//       data_cleaning_enabled: "yes",
//       deduplication: "yes",
//     },
//     tables: ["users", "orders", "products"],
//     recordsProcessed: 1250000,
//     lastSync: "2025-10-23 09:15:00",
//     lastUpdated: "2025-10-22 14:30:00",
//     errorCount: 0,
//     schedule: "Every 15 minutes",
//   },
//   {
//     id: "conn_mysql_1",
//     name: "MySQL",
//     type: "mysql",
//     category: "database",
//     status: "active",
//     config: {
//       source: "Analytics MySQL",
//       host: "analytics.company.com",
//       port: 3306,
//       database: "default_db",
//       username: "analyst",
//       password: "••••••••",
//       ssl_mode: "verify-ca",
//       ssh_tunnel_method: "password",
//       cdc_method: "full_load",
//       data_cleaning_enabled: "no",
//       deduplication: "yes",
//     },
//     tables: ["customers", "invoices"],
//     recordsProcessed: 890000,
//     lastSync: "2025-10-23 08:30:00",
//     lastUpdated: "2025-10-20 10:15:00",
//     errorCount: 2,
//     schedule: "Hourly",
//   },
//   {
//     id: "conn_mongo_1",
//     name: "MongoDB",
//     type: "mongodb",
//     category: "database",
//     status: "active",
//     config: {
//       source: "MongoDB Logs",
//       host: "mongo.company.com",
//       port: 27017,
//       database: "app_db",
//       username: "log_reader",
//       password: "••••••••",
//       ssl_mode: "",
//       ssh_tunnel_method: "",
//       cdc_method: "cdc",
//       data_cleaning_enabled: "yes",
//       deduplication: "no",
//     },
//     tables: ["logs"],
//     recordsProcessed: 3450000,
//     lastSync: "2025-10-23 10:00:00",
//     lastUpdated: "2025-10-23 09:45:00",
//     errorCount: 0,
//     schedule: "Real-time",
//   },
// ];

export const MOCK_EXPLORE_DATA = {
  postgresql: {
    production_db: {
      users: [
        { Field: "id", Type: "integer", Key: "PRI" },
        { Field: "email", Type: "varchar(255)", Key: "" },
        { Field: "name", Type: "varchar(100)", Key: "" },
        { Field: "created_at", Type: "timestamp", Key: "" },
        { Field: "is_active", Type: "boolean", Key: "" },
      ],
      orders: [
        { Field: "id", Type: "integer", Key: "PRI" },
        { Field: "user_id", Type: "integer", Key: "" },
        { Field: "total_amount", Type: "decimal(10,2)", Key: "" },
        { Field: "status", Type: "varchar(50)", Key: "" },
        { Field: "order_date", Type: "timestamp", Key: "" },
      ],
      products: [
        { Field: "id", Type: "integer", Key: "PRI" },
        { Field: "name", Type: "varchar(200)", Key: "" },
        { Field: "price", Type: "decimal(10,2)", Key: "" },
        { Field: "category_id", Type: "integer", Key: "" },
        { Field: "stock_quantity", Type: "integer", Key: "" },
      ],
    },
  },
  mysql: {
    default_db: {
      customers: [
        { Field: "id", Type: "int", Key: "PRI" },
        { Field: "customer_name", Type: "varchar(150)", Key: "" },
        { Field: "email", Type: "varchar(255)", Key: "" },
        { Field: "phone", Type: "varchar(20)", Key: "" },
        { Field: "address", Type: "text", Key: "" },
      ],
      invoices: [
        { Field: "id", Type: "int", Key: "PRI" },
        { Field: "customer_id", Type: "int", Key: "" },
        { Field: "invoice_number", Type: "varchar(50)", Key: "" },
        { Field: "amount", Type: "decimal(12,2)", Key: "" },
        { Field: "due_date", Type: "date", Key: "" },
        { Field: "paid", Type: "tinyint(1)", Key: "" },
      ],
    },
  },
  mongodb: {
    app_db: {
      logs: [
        { Field: "_id", Type: "ObjectId", Key: "PRI" },
        { Field: "timestamp", Type: "ISODate", Key: "" },
        { Field: "level", Type: "string", Key: "" },
        { Field: "message", Type: "string", Key: "" },
        { Field: "service", Type: "string", Key: "" },
        { Field: "metadata", Type: "object", Key: "" },
      ],
    },
  },
  snowflake: {
    enterprise_dw: {
      sales_summary: [
        { Field: "SALE_ID", Type: "NUMBER", Key: "PRI" },
        { Field: "DATE", Type: "DATE", Key: "" },
        { Field: "PRODUCT_ID", Type: "NUMBER", Key: "" },
        { Field: "QUANTITY", Type: "NUMBER", Key: "" },
        { Field: "REVENUE", Type: "NUMBER(15,2)", Key: "" },
        { Field: "REGION", Type: "VARCHAR(50)", Key: "" },
      ],
      customer_dim: [
        { Field: "CUSTOMER_KEY", Type: "NUMBER", Key: "PRI" },
        { Field: "CUSTOMER_ID", Type: "VARCHAR(50)", Key: "" },
        { Field: "NAME", Type: "VARCHAR(200)", Key: "" },
        { Field: "SEGMENT", Type: "VARCHAR(50)", Key: "" },
        { Field: "LIFETIME_VALUE", Type: "NUMBER(15,2)", Key: "" },
      ],
    },
  },
};

export const MOCK_QUERY_RESULTS = {
  users: {
    columns: ["id", "email", "name", "created_at", "is_active"],
    rows: [
      {
        id: 1,
        email: "john@example.com",
        name: "John Doe",
        created_at: "2025-01-15 10:30:00",
        is_active: true,
      },
      {
        id: 2,
        email: "jane@example.com",
        name: "Jane Smith",
        created_at: "2025-02-20 14:22:00",
        is_active: true,
      },
      {
        id: 3,
        email: "bob@example.com",
        name: "Bob Wilson",
        created_at: "2025-03-10 09:15:00",
        is_active: false,
      },
      {
        id: 4,
        email: "alice@example.com",
        name: "Alice Brown",
        created_at: "2025-04-05 16:45:00",
        is_active: true,
      },
      {
        id: 5,
        email: "charlie@example.com",
        name: "Charlie Davis",
        created_at: "2025-05-12 11:00:00",
        is_active: true,
      },
    ],
    executionTime: 145,
  },
  orders: {
    columns: ["id", "user_id", "total_amount", "status", "order_date"],
    rows: [
      {
        id: 101,
        user_id: 1,
        total_amount: 299.99,
        status: "completed",
        order_date: "2025-08-15 10:30:00",
      },
      {
        id: 102,
        user_id: 2,
        total_amount: 149.5,
        status: "pending",
        order_date: "2025-09-20 14:22:00",
      },
      {
        id: 103,
        user_id: 1,
        total_amount: 599.0,
        status: "completed",
        order_date: "2025-10-10 09:15:00",
      },
      {
        id: 104,
        user_id: 3,
        total_amount: 89.99,
        status: "cancelled",
        order_date: "2025-10-15 16:45:00",
      },
      {
        id: 105,
        user_id: 4,
        total_amount: 1299.99,
        status: "completed",
        order_date: "2025-10-20 11:00:00",
      },
    ],
    executionTime: 89,
  },
  products: {
    columns: ["id", "name", "price", "category_id", "stock_quantity"],
    rows: [
      {
        id: 1,
        name: "Laptop Pro 15",
        price: 1299.99,
        category_id: 1,
        stock_quantity: 45,
      },
      {
        id: 2,
        name: "Wireless Mouse",
        price: 29.99,
        category_id: 2,
        stock_quantity: 230,
      },
      {
        id: 3,
        name: "USB-C Cable",
        price: 19.99,
        category_id: 2,
        stock_quantity: 500,
      },
      {
        id: 4,
        name: 'Monitor 27"',
        price: 399.99,
        category_id: 1,
        stock_quantity: 78,
      },
      {
        id: 5,
        name: "Keyboard Mechanical",
        price: 149.99,
        category_id: 2,
        stock_quantity: 120,
      },
    ],
    executionTime: 67,
  },
};

// Sample SQL Queries for testing
export const SAMPLE_QUERIES = {
  simple: "SELECT * FROM users LIMIT 10;",
  join: "SELECT u.name, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nORDER BY order_count DESC\nLIMIT 20;",
  aggregate:
    "SELECT \n  DATE(order_date) as date,\n  COUNT(*) as total_orders,\n  SUM(total_amount) as revenue\nFROM orders\nWHERE status = 'completed'\nGROUP BY DATE(order_date)\nORDER BY date DESC;",
  filter:
    "SELECT * FROM products\nWHERE price > 100 AND stock_quantity > 0\nORDER BY price DESC;",
};
