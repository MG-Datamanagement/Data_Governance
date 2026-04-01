export interface Connector {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  borderColor: string;
  icon: string; // SVG icon key
}

export const connectors: Connector[] = [
  {
    id: "airflow",
    name: "Airflow",
    description: "Import DAGs, Tasks, and lineage from Airflow.",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    icon: "airflow",
  },
  {
    id: "athena",
    name: "Athena",
    description:
      "Import Schemas, Tables, Views, and lineage to S3 from Athena.",
    bgColor: "bg-white",
    borderColor: "border-gray-100",
    icon: "athena",
  },
  {
    id: "azure-ad",
    name: "AzureAD",
    description: "Import Users and Groups from Azure Active Directory.",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    icon: "azure",
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description:
      "Import Projects, Datasets, Tables, Views, lineage, queries, and statistics from BigQuery.",
    bgColor: "bg-white",
    borderColor: "border-gray-100",
    icon: "bigquery",
  },
  {
    id: "cassandradb",
    name: "CassandraDB",
    description: "Import Tables, Keyspaces, and column schemas from Cassandra.",
    bgColor: "bg-white",
    borderColor: "border-gray-100",
    icon: "cassandra",
  },
  {
    id: "clickhouse",
    name: "ClickHouse",
    description:
      "Import Tables, Views, Materialized Views, Dictionaries, statistics, queries, and lineage from ClickHouse.",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-100",
    icon: "clickhouse",
  },
  {
    id: "cockroachdb",
    name: "CockroachDb",
    description:
      "Import Databases, Schemas, Tables, Views, statistics and lineage from CockroachDb.",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-100",
    icon: "cockroach",
  },
  {
    id: "csv",
    name: "CSV",
    description: "Import metadata from a formatted CSV.",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    icon: "csv",
  },
  {
    id: "dagster",
    name: "Dagster",
    description: "Import Pipelines, Jobs, Assets, and lineage from Dagster.",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    icon: "dagster",
  },
  {
    id: "databricks",
    name: "Databricks",
    description:
      "Import Notebooks, Jobs, Clusters, and lineage from Databricks.",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    icon: "databricks",
  },
  {
    id: "dbt",
    name: "dbt",
    description:
      "Import Models, Sources, Tests, and lineage from dbt projects.",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    icon: "dbt",
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    description:
      "Import Indices, Mappings, and cluster metadata from Elasticsearch.",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-100",
    icon: "elasticsearch",
  },
  {
    id: "kafka",
    name: "Kafka",
    description:
      "Import Topics, Schemas, Consumer Groups, and lineage from Kafka.",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-100",
    icon: "kafka",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description:
      "Import Databases, Collections, and schema metadata from MongoDB.",
    bgColor: "bg-green-50",
    borderColor: "border-green-100",
    icon: "mongodb",
  },
  {
    id: "mysql",
    name: "MySQL",
    description:
      "Import Databases, Tables, Views, and stored procedures from MySQL.",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    icon: "mysql",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description:
      "Import Schemas, Tables, Views, Functions, and lineage from PostgreSQL.",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-100",
    icon: "postgresql",
  },
  {
    id: "redshift",
    name: "Redshift",
    description:
      "Import Schemas, Tables, Views, and lineage from Amazon Redshift.",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
    icon: "redshift",
  },
  {
    id: "snowflake",
    name: "Snowflake",
    description:
      "Import Databases, Schemas, Tables, Views, Stages, and lineage from Snowflake.",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    icon: "snowflake",
  },
];
