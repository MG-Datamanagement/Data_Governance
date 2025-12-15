import {
  IntegrationCategory,
  IntegrationType,
} from "@/components/DataSources/types/integrations";

import {
  Server,
  Cloud,
  Database,
  Layers,
  BarChart2,
  Shield,
  Cpu,
  GitBranch,
  Activity,
  CheckCircle,
  Brain,
  Key,
  Search,
  Book,
  Box,
} from "lucide-react";

// ----------------------------------------------------------
// COLORS
// ----------------------------------------------------------
const COLOR_PALETTE = [
  "blue",
  "indigo",
  "green",
  "red",
  "amber",
  "purple",
  "teal",
  "sky",
];

let colorIndex = 0;

export const getNextColor = () => {
  const c = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  colorIndex++;
  return `bg-${c}-50 border-${c}-200 hover:border-${c}-400`;
};

// ----------------------------------------------------------
// ICON EXTENSIONS (final clean list)
// ----------------------------------------------------------
export const ICON_EXTENSIONS: Record<string, string> = {
  // DATABASES
  clickhouse: "svg",
  cockroachdb: "png",
  mssql: "svg",
  mongodb: "svg",
  mysql: "svg",
  neo4j: "png",
  oracle: "svg",
  postgres: "svg",
  sap_hana: "svg",
  teradata: "svg",
  vertica: "svg",
  cassandra: "png",

  // CLOUD
  athena: "svg",
  bigquery: "svg",
  databricks: "png",
  dremio: "png",
  dynamodb: "png",
  redshift: "svg",
  snowflake: "svg",
  vertex_ai: "svg",

  // STORAGE
  azure: "svg",
  delta_lake: "svg",
  gcs: "svg",
  iceberg: "png",
  hudi: "png",
  json_schemas: "svg",
  protobuf_schemas: "png",
  s3: "svg",

  // STREAMING
  kafka: "svg",
  kafka_connect: "png",
  nifi: "svg",
  pulsar: "png",

  // ORCHESTRATION
  airflow: "svg",
  dagster: "svg",
  dbt: "svg",
  snaplogic: "png",

  // BI
  grafana: "svg",
  hex: "png",
  looker: "svg",
  metabase: "svg",
  mode: "png",
  powerbi: "png",
  preset: "svg",
  qlik_sense: "png",
  redash: "svg",
  sap_analytics_cloud: "svg",
  sigma: "png",
  superset: "svg",
  tableau: "png",

  // GOVERNANCE
  business_glossary: "svg",
  datahub: "svg",
  file_based_lineage: "svg",

  // PROCESSING
  presto: "svg",
  spark: "svg",
  trino: "png",

  // ETL
  fivetran: "png",
  glue: "svg",
  sqlalchemy: "png",

  // QUALITY
  great_expectations: "png",

  // ML
  feast: "svg",
  sagemaker: "svg",

  // IAM
  ldap: "svg",
  okta: "png",

  // SEARCH
  elasticsearch: "svg",

  // METADATA
  hive_metastore: "svg",

  // SOURCE
  demo_data: "svg",
  salesforce: "png",
};

// ----------------------------------------------------------
// iconPath builder
// ----------------------------------------------------------
export const iconPath = (id: string) => {
  const ext = ICON_EXTENSIONS[id];
  return `/icons/integrations/${id}.${ext}`;
};

// ----------------------------------------------------------
// CATEGORY DEFINITIONS
// ----------------------------------------------------------
export const CATEGORIES: IntegrationCategory[] = [
  "database",
  "cloud",
  "storage",
  "streaming",
  "orchestration",
  "bi",
  "governance",
  "processing",
  "etl",
  "quality",
  "ml",
  "iam",
  "search",
  "metadata",
  "source",
];

// ----------------------------------------------------------
// DATABASES
// ----------------------------------------------------------
export const DATABASES: IntegrationType[] = [
  {
    id: "mysql",
    name: "MySQL",
    icon: iconPath("mysql"),
    color: getNextColor(),
    category: "database",
    description: "Open-source relational database",
    defaultPort: "3306",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: iconPath("postgres"),
    color: getNextColor(),
    category: "database",
    description: "Advanced open-source database",
    defaultPort: "5432",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    icon: iconPath("mongodb"),
    color: getNextColor(),
    category: "database",
    description: "NoSQL document database",
    defaultPort: "27017",
  },
  {
    id: "clickhouse",
    name: "ClickHouse",
    icon: iconPath("clickhouse"),
    color: getNextColor(),
    category: "database",
    description: "Column-oriented OLAP database",
  },
  {
    id: "cockroachdb",
    name: "CockroachDB",
    icon: iconPath("cockroachdb"),
    color: getNextColor(),
    category: "database",
    description: "Distributed SQL database",
  },
  {
    id: "mssql",
    name: "Microsoft SQL Server",
    icon: iconPath("mssql"),
    color: getNextColor(),
    category: "database",
    description: "Enterprise relational database",
    defaultPort: "1433",
  },
  {
    id: "neo4j",
    name: "Neo4j",
    icon: iconPath("neo4j"),
    color: getNextColor(),
    category: "database",
    description: "Graph database",
  },
  {
    id: "oracle",
    name: "Oracle",
    icon: iconPath("oracle"),
    color: getNextColor(),
    category: "database",
    description: "Enterprise relational database",
    defaultPort: "1521",
  },
  {
    id: "sap_hana",
    name: "SAP HANA",
    icon: iconPath("sap_hana"),
    color: getNextColor(),
    category: "database",
    description: "In-memory relational database",
  },
  {
    id: "teradata",
    name: "Teradata",
    icon: iconPath("teradata"),
    color: getNextColor(),
    category: "database",
    description: "Enterprise data warehouse",
  },
  {
    id: "vertica",
    name: "Vertica",
    icon: iconPath("vertica"),
    color: getNextColor(),
    category: "database",
    description: "Columnar analytics database",
  },
  {
    id: "cassandra",
    name: "Cassandra",
    icon: iconPath("cassandra"),
    color: getNextColor(),
    category: "database",
    description: "Distributed NoSQL database",
  },
];

// ----------------------------------------------------------
// CLOUD DATA PLATFORMS
// ----------------------------------------------------------
export const CLOUD: IntegrationType[] = [
  {
    id: "snowflake",
    name: "Snowflake",
    icon: iconPath("snowflake"),
    color: getNextColor(),
    category: "cloud",
    description: "Cloud data warehouse",
  },
  {
    id: "athena",
    name: "Athena",
    icon: iconPath("athena"),
    color: getNextColor(),
    category: "cloud",
    description: "Serverless interactive query service",
  },
  {
    id: "bigquery",
    name: "BigQuery",
    icon: iconPath("bigquery"),
    color: getNextColor(),
    category: "cloud",
    description: "Google Cloud data warehouse",
  },
  {
    id: "databricks",
    name: "Databricks",
    icon: iconPath("databricks"),
    color: getNextColor(),
    category: "cloud",
    description: "Unified data & AI platform",
  },
  {
    id: "dremio",
    name: "Dremio",
    icon: iconPath("dremio"),
    color: getNextColor(),
    category: "cloud",
    description: "Cloud data lake engine",
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    icon: iconPath("dynamodb"),
    color: getNextColor(),
    category: "cloud",
    description: "Managed NoSQL database",
  },
  {
    id: "redshift",
    name: "Redshift",
    icon: iconPath("redshift"),
    color: getNextColor(),
    category: "cloud",
    description: "Cloud data warehouse",
  },
  {
    id: "vertex_ai",
    name: "Vertex AI",
    icon: iconPath("vertex_ai"),
    color: getNextColor(),
    category: "cloud",
    description: "Managed ML platform",
  },
];

// ----------------------------------------------------------
// STORAGE & FILE FORMATS
// ----------------------------------------------------------
export const STORAGE: IntegrationType[] = [
  {
    id: "azure_blob",
    name: "Azure Blob Storage",
    icon: iconPath("azure"),
    color: getNextColor(),
    category: "storage",
    description: "Cloud object storage",
  },
  {
    id: "delta_lake",
    name: "Delta Lake",
    icon: iconPath("delta_lake"),
    color: getNextColor(),
    category: "storage",
    description: "Storage layer for data lakes",
  },
  {
    id: "gcs",
    name: "Google Cloud Storage",
    icon: iconPath("gcs"),
    color: getNextColor(),
    category: "storage",
    description: "Cloud object storage",
  },
  {
    id: "iceberg",
    name: "Iceberg",
    icon: iconPath("iceberg"),
    color: getNextColor(),
    category: "storage",
    description: "Open table format for analytics",
  },
  {
    id: "hudi",
    name: "Apache Hudi",
    icon: iconPath("hudi"),
    color: getNextColor(),
    category: "storage",
    description: "Streaming data lake storage layer",
  },
  {
    id: "json_schemas",
    name: "JSON Schemas",
    icon: iconPath("json_schemas"),
    color: getNextColor(),
    category: "storage",
    description: "JSON schema definitions",
  },
  {
    id: "protobuf_schemas",
    name: "Protobuf Schemas",
    icon: iconPath("protobuf_schemas"),
    color: getNextColor(),
    category: "storage",
    description: "Protocol Buffers schema definitions",
  },
  {
    id: "s3",
    name: "S3 Data Lake",
    icon: iconPath("s3"),
    color: getNextColor(),
    category: "storage",
    description: "S3-based data lake storage",
  },
];

// ----------------------------------------------------------
// STREAMING
// ----------------------------------------------------------
export const STREAMING: IntegrationType[] = [
  {
    id: "kafka",
    name: "Kafka",
    icon: iconPath("kafka"),
    color: getNextColor(),
    category: "streaming",
    description: "Distributed streaming platform",
  },
  {
    id: "kafka_connect",
    name: "Kafka Connect",
    icon: iconPath("kafka_connect"),
    color: getNextColor(),
    category: "streaming",
    description: "Kafka integration framework",
  },
  {
    id: "nifi",
    name: "NiFi",
    icon: iconPath("nifi"),
    color: getNextColor(),
    category: "streaming",
    description: "Flow-based data orchestration",
  },
  {
    id: "pulsar",
    name: "Pulsar",
    icon: iconPath("pulsar"),
    color: getNextColor(),
    category: "streaming",
    description: "Distributed pub-sub messaging",
  },
];

// ----------------------------------------------------------
// ORCHESTRATION
// ----------------------------------------------------------
export const ORCHESTRATION: IntegrationType[] = [
  {
    id: "airflow",
    name: "Airflow",
    icon: iconPath("airflow"),
    color: getNextColor(),
    category: "orchestration",
    description: "Workflow orchestrator",
  },
  {
    id: "dagster",
    name: "Dagster",
    icon: iconPath("dagster"),
    color: getNextColor(),
    category: "orchestration",
    description: "Data orchestrator",
  },
  {
    id: "dbt",
    name: "dbt",
    icon: iconPath("dbt"),
    color: getNextColor(),
    category: "orchestration",
    description: "Data transformation framework",
  },
  {
    id: "snaplogic",
    name: "SnapLogic",
    icon: iconPath("snaplogic"),
    color: getNextColor(),
    category: "orchestration",
    description: "ETL & integration automation",
  },
];

// ----------------------------------------------------------
// BI / ANALYTICS
// ----------------------------------------------------------
export const BI: IntegrationType[] = [
  {
    id: "grafana",
    name: "Grafana",
    icon: iconPath("grafana"),
    color: getNextColor(),
    category: "bi",
    description: "Observability & dashboards",
  },
  {
    id: "hex",
    name: "Hex",
    icon: iconPath("hex"),
    color: getNextColor(),
    category: "bi",
    description: "Collaborative analytics workspace",
  },
  {
    id: "looker",
    name: "Looker",
    icon: iconPath("looker"),
    color: getNextColor(),
    category: "bi",
    description: "Business intelligence platform",
  },
  {
    id: "metabase",
    name: "Metabase",
    icon: iconPath("metabase"),
    color: getNextColor(),
    category: "bi",
    description: "Open-source BI tool",
  },
  {
    id: "mode",
    name: "Mode",
    icon: iconPath("mode"),
    color: getNextColor(),
    category: "bi",
    description: "Collaborative data platform",
  },
  {
    id: "powerbi",
    name: "Power BI",
    icon: iconPath("powerbi"),
    color: getNextColor(),
    category: "bi",
    description: "Business analytics",
  },
  {
    id: "preset",
    name: "Preset",
    icon: iconPath("preset"),
    color: getNextColor(),
    category: "bi",
    description: "Managed Superset platform",
  },
  {
    id: "qlik_sense",
    name: "Qlik Sense",
    icon: iconPath("qlik_sense"),
    color: getNextColor(),
    category: "bi",
    description: "Data visualization platform",
  },
  {
    id: "redash",
    name: "Redash",
    icon: iconPath("redash"),
    color: getNextColor(),
    category: "bi",
    description: "Query & visualization tool",
  },
  {
    id: "sap_analytics_cloud",
    name: "SAP Analytics Cloud",
    icon: iconPath("sap_analytics_cloud"),
    color: getNextColor(),
    category: "bi",
    description: "Cloud analytics SaaS",
  },
  {
    id: "sigma",
    name: "Sigma",
    icon: iconPath("sigma"),
    color: getNextColor(),
    category: "bi",
    description: "Cloud analytics",
  },
  {
    id: "superset",
    name: "Apache Superset",
    icon: iconPath("superset"),
    color: getNextColor(),
    category: "bi",
    description: "Open-source BI exploration",
  },
  {
    id: "tableau",
    name: "Tableau",
    icon: iconPath("tableau"),
    color: getNextColor(),
    category: "bi",
    description: "Data visualization software",
  },
];

// ----------------------------------------------------------
// GOVERNANCE
// ----------------------------------------------------------
export const GOVERNANCE: IntegrationType[] = [
  {
    id: "business_glossary",
    name: "Business Glossary",
    icon: iconPath("business_glossary"),
    color: getNextColor(),
    category: "governance",
    description: "Data governance glossary",
  },
  {
    id: "datahub",
    name: "DataHub",
    icon: iconPath("datahub"),
    color: getNextColor(),
    category: "governance",
    description: "Metadata platform",
  },
  {
    id: "file_based_lineage",
    name: "File Based Lineage",
    icon: iconPath("file_based_lineage"),
    color: getNextColor(),
    category: "governance",
    description: "Lineage extraction from files",
  },
];

// ----------------------------------------------------------
// PROCESSING
// ----------------------------------------------------------
export const PROCESSING: IntegrationType[] = [
  {
    id: "presto",
    name: "Presto",
    icon: iconPath("presto"),
    color: getNextColor(),
    category: "processing",
    description: "Distributed SQL engine",
  },
  {
    id: "spark",
    name: "Apache Spark",
    icon: iconPath("spark"),
    color: getNextColor(),
    category: "processing",
    description: "Unified analytics engine",
  },
  {
    id: "trino",
    name: "Trino",
    icon: iconPath("trino"),
    color: getNextColor(),
    category: "processing",
    description: "Distributed SQL engine",
  },
];

// ----------------------------------------------------------
// ETL
// ----------------------------------------------------------
export const ETL: IntegrationType[] = [
  {
    id: "fivetran",
    name: "Fivetran",
    icon: iconPath("fivetran"),
    color: getNextColor(),
    category: "etl",
    description: "Automated data pipelines",
  },
  {
    id: "glue",
    name: "AWS Glue",
    icon: iconPath("glue"),
    color: getNextColor(),
    category: "etl",
    description: "Managed ETL service",
  },
  {
    id: "sqlalchemy",
    name: "SQLAlchemy",
    icon: iconPath("sqlalchemy"),
    color: getNextColor(),
    category: "etl",
    description: "SQL toolkit & ORM",
  },
];

// ----------------------------------------------------------
// QUALITY
// ----------------------------------------------------------
export const QUALITY: IntegrationType[] = [
  {
    id: "great_expectations",
    name: "Great Expectations",
    icon: iconPath("great_expectations"),
    color: getNextColor(),
    category: "quality",
    description: "Data quality framework",
  },
];

// ----------------------------------------------------------
// MACHINE LEARNING
// ----------------------------------------------------------
export const ML: IntegrationType[] = [
  {
    id: "feast",
    name: "Feast",
    icon: iconPath("feast"),
    color: getNextColor(),
    category: "ml",
    description: "Feature store",
  },
  {
    id: "sagemaker",
    name: "SageMaker",
    icon: iconPath("sagemaker"),
    color: getNextColor(),
    category: "ml",
    description: "Managed ML platform",
  },
];

// ----------------------------------------------------------
// IAM
// ----------------------------------------------------------
export const IAM: IntegrationType[] = [
  {
    id: "azure_ad",
    name: "Azure AD",
    icon: iconPath("azure"),
    color: getNextColor(),
    category: "iam",
    description: "Identity service",
  },
  {
    id: "ldap",
    name: "LDAP",
    icon: iconPath("ldap"),
    color: getNextColor(),
    category: "iam",
    description: "Directory service",
  },
  {
    id: "okta",
    name: "Okta",
    icon: iconPath("okta"),
    color: getNextColor(),
    category: "iam",
    description: "Identity and access management",
  },
];

// ----------------------------------------------------------
// SEARCH
// ----------------------------------------------------------
export const SEARCH: IntegrationType[] = [
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    icon: iconPath("elasticsearch"),
    color: getNextColor(),
    category: "search",
    description: "Search engine",
  },
];

// ----------------------------------------------------------
// METADATA
// ----------------------------------------------------------
export const METADATA: IntegrationType[] = [
  {
    id: "hive_metastore",
    name: "Hive Metastore",
    icon: iconPath("hive_metastore"),
    color: getNextColor(),
    category: "metadata",
    description: "Metadata service for Hive",
  },
];

// ----------------------------------------------------------
// SOURCE SYSTEMS
// ----------------------------------------------------------
export const SOURCE: IntegrationType[] = [
  {
    id: "demo_data",
    name: "Demo Data",
    icon: iconPath("demo_data"),
    color: getNextColor(),
    category: "source",
    description: "Sample data source",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: iconPath("salesforce"),
    color: getNextColor(),
    category: "source",
    description: "CRM platform",
  },
];

// ----------------------------------------------------------
// ALL INTEGRATIONS
// ----------------------------------------------------------
export const ALL_INTEGRATIONS: IntegrationType[] = [
  ...DATABASES,
  ...CLOUD,
  ...STORAGE,
  ...STREAMING,
  ...ORCHESTRATION,
  ...BI,
  ...GOVERNANCE,
  ...PROCESSING,
  ...ETL,
  ...QUALITY,
  ...ML,
  ...IAM,
  ...SEARCH,
  ...METADATA,
  ...SOURCE,
];
