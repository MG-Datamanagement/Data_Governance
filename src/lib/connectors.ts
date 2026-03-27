/**
 * connectors.ts
 *
 * Single source of truth for all supported data connector definitions.
 * Imported by AddDataSourceModal (Step 1 grid) and ConnectorIcon (icon resolver).
 * Never import UI-specific items here — pure config only.
 */

export interface ConnectorDefinition {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  /** Icon key used by ConnectorIcon component */
  icon: string;
  configTitle: string;
  docsLabel: string;
  uriPlaceholder: string;
  defaultName: string;
}

export const CONNECTORS: ConnectorDefinition[] = [
  {
    id: "redshift",
    name: "Redshift",
    description: "Extract and catalog Schemas, Tables, Views, and data lineage from your AWS Redshift data warehouse.",
    iconBg: "bg-white",
    icon: "redshift",
    configTitle: "Configure AWS Redshift Connection",
    docsLabel: "Redshift source docs",
    uriPlaceholder: "e.g. redshift-cluster.abc123.us-east-1.redshift.amazonaws.com",
    defaultName: "My Redshift Source",
  },
  {
    id: "athena",
    name: "Athena",
    description: "Import Schemas, Tables, Views, and lineage to S3 from Athena.",
    iconBg: "bg-white",
    icon: "athena",
    configTitle: "Configure AWS Athena Connection",
    docsLabel: "Athena source docs",
    uriPlaceholder: "e.g. athena.us-east-1.amazonaws.com",
    defaultName: "My Athena Source",
  },
  {
    id: "cockroachdb",
    name: "CockroachDb",
    description: "Import Databases, Schemas, Tables, Views, statistics and lineage from CockroachDb.",
    iconBg: "bg-gray-50",
    icon: "cockroach",
    configTitle: "Configure CockroachDB Connection",
    docsLabel: "CockroachDB source docs",
    uriPlaceholder: "e.g. localhost:26257",
    defaultName: "My CockroachDB Source",
  },
  {
    id: "csv",
    name: "CSV",
    description: "Import metadata from a formatted CSV.",
    iconBg: "bg-green-50",
    icon: "csv",
    configTitle: "Configure CSV Connection",
    docsLabel: "CSV source docs",
    uriPlaceholder: "e.g. /path/to/file.csv",
    defaultName: "My CSV Source",
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    description: "Import Tables and metadata from AWS DynamoDB.",
    iconBg: "bg-blue-50",
    icon: "dynamodb",
    configTitle: "Configure DynamoDB Connection",
    docsLabel: "DynamoDB source docs",
    uriPlaceholder: "e.g. dynamodb.us-east-1.amazonaws.com",
    defaultName: "My DynamoDB Source",
  },
  {
    id: "glue",
    name: "Glue",
    description: "Import Databases, Tables, and metadata from AWS Glue Data Catalog.",
    iconBg: "bg-orange-50",
    icon: "glue",
    configTitle: "Configure AWS Glue Connection",
    docsLabel: "Glue source docs",
    uriPlaceholder: "e.g. glue.us-east-1.amazonaws.com",
    defaultName: "My Glue Source",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Import Databases, Collections, and schema metadata from MongoDB.",
    iconBg: "bg-green-100",
    icon: "mongodb",
    configTitle: "Configure MongoDB Recipe",
    docsLabel: "MongoDB source docs",
    uriPlaceholder: "e.g. mongodb://localhost:27017",
    defaultName: "My MongoDB Source",
  },
  {
    id: "mssql",
    name: "MSSQL",
    description: "Import Databases, Schemas, Tables, Views, and procedures from Microsoft SQL Server.",
    iconBg: "bg-red-50",
    icon: "mssql",
    configTitle: "Configure MSSQL Connection",
    docsLabel: "MSSQL source docs",
    uriPlaceholder: "e.g. mssql://localhost:1433",
    defaultName: "My MSSQL Source",
  },
  {
    id: "mysql",
    name: "MySQL",
    description: "Import Databases, Tables, Views, and stored procedures from MySQL.",
    iconBg: "bg-blue-50",
    icon: "mysql",
    configTitle: "Configure MySQL Connection",
    docsLabel: "MySQL source docs",
    uriPlaceholder: "e.g. mysql://localhost:3306",
    defaultName: "My MySQL Source",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Import Schemas, Tables, Views, Functions, and lineage from PostgreSQL.",
    iconBg: "bg-gray-100",
    icon: "postgresql",
    configTitle: "Configure PostgreSQL Recipe",
    docsLabel: "PostgreSQL source docs",
    uriPlaceholder: "e.g. postgresql://localhost:5432",
    defaultName: "My PostgreSQL Source",
  },
  {
    id: "snowflake",
    name: "Snowflake",
    description: "Import Databases, Schemas, Tables, Views, Stages, and lineage from Snowflake.",
    iconBg: "bg-blue-50",
    icon: "snowflake",
    configTitle: "Configure Snowflake Connection",
    docsLabel: "Snowflake source docs",
    uriPlaceholder: "e.g. account.snowflakecomputing.com",
    defaultName: "My Snowflake Source",
  },
];

/** Convenience lookup by connector id */
export function getConnectorById(id: string): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.id === id);
}
