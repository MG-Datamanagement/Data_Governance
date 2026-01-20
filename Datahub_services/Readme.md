***TO START THE APPLCATION***

command : docker-compose up -d

check these containers are running: 
  datahub-gms
  datahub-frontend-react
  datahub-actions
  broker  
  zookeeper

  schema-registry
  neo4j
  mysql 
  elasticsearch  
  nginx-proxy


(these containers  run once and exited)
  datahub-upgrade
  elastic-search setup
  mysql-setup
  kafka-setup


to ensure all containers are running
command:

docker ps



***SAMPLE DATA SOURCE INGESTION:***

for mongodb:(YML file)

source:
    type: mongodb
    config:
        connect_uri: 'uri'
        username: your username 
        password: your pass
        enableSchemaInference: true
        useRandomSampling: true
        maxSchemaSize: 300
        stateful_ingestion:
            enabled: true
 
 
 
 
 for postgres:
 
source:
    type: postgres
    config:
        host_port: 'host.docker.internal:5433'
        database: IG_DB
        username: postgres
        include_tables: true
        include_views: false
        profiling:
            enabled: true
            profile_table_level_only: true
        stateful_ingestion:
            enabled: true
        password: postgres
 
 
 
 for snowflake:
 
source:
    type: snowflake
    config:
        account_id: NOWBAOL-IQ35661
        include_table_lineage: true
        include_view_lineage: true
        include_tables: true
        include_views: false
        profiling:
            enabled: false
            profile_table_level_only: true
        stateful_ingestion:
            enabled: true
        warehouse: COMPUTE_WH
        username: username
        password: password
        role: PUBLIC
        database_pattern:
            allow:
                - SAMPLE_DB
        schema_pattern:
            allow:
                - PUBLIC
 
 
*** add tags, domains, glossary terms, etc ***
