import Airflow from "./airflow.svg";
import Athena from "./athena.svg";
import AzureAD from "./azuread.svg";
import BigQuery from "./bigquery.svg";
import Cassandra from "./cassandradb.svg";
import ClickHouse from "./clickhouse.svg";
import CockroachDB from "./cockroachdb.svg";
import CSV from "./csv.svg";
import Dagster from "./dagster.svg";
import Databricks from "./databricks.svg";
import DBT from "./dbt.svg";
import Elasticsearch from "./elasticsearch.svg";
import Kafka from "./kafka.svg";
import MongoDB from "./mongodb.svg";
import MySQL from "./mysql.svg";
import PostgreSQL from "./postgresql.svg";
import Redshift from "./redshift.svg";
import Snowflake from "./snowflake.svg";
import DynamoDB from "./dynamodb-.svg";
import Glue from "./glue.svg";
import MSSQL from "./mssql.svg";

export const SourceIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    airflow: Airflow,
    athena: Athena,
    azure: AzureAD,
    azuread: AzureAD,
    bigquery: BigQuery,
    cassandra: Cassandra,
    cassandradb: Cassandra,
    clickhouse: ClickHouse,
    cockroach: CockroachDB,
    cockroachdb: CockroachDB,
    csv: CSV,
    dagster: Dagster,
    databricks: Databricks,
    dbt: DBT,
    elasticsearch: Elasticsearch,
    kafka: Kafka,
    mongodb: MongoDB,
    mysql: MySQL,
    postgresql: PostgreSQL,
    redshift: Redshift,
    snowflake: Snowflake,
    dynamodb: DynamoDB,
    glue: Glue,
    mssql: MSSQL,
};

export type SourceIconKey = keyof typeof SourceIcons;
