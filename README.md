# Infinity Governance - Complete Project Guide

## Project Overview
This project consists of two main components:
1. **Datahub Services** - Data governance and metadata management platform
2. **Microservices** - Chatbot and data card generation services with data synchronization

---

## Part 1: Datahub Services

### Starting the Application

**Command:**
```bash
docker-compose up -d
```

### Containers to Verify (Should be running)
- datahub-gms
- datahub-frontend-react
- datahub-actions
- broker
- zookeeper
- schema-registry
- neo4j
- mysql
- elasticsearch
- nginx-proxy

### Containers that Run Once and Exit
- datahub-upgrade
- elastic-search setup
- mysql-setup
- kafka-setup

### Verify All Containers Running
```bash
docker ps
```

### Sample Data Source Ingestion Configurations


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
 
```

### Adding Metadata
Add tags, domains, glossary terms, etc. through the DataHub UI after ingestion.

---

## Part 2: Microservices (Chatbot & Data Card)

### Overview
This component handles:
1. Data synchronization from DataHub GraphQL to PostgreSQL
2. Data card generation for datasets
3. Chatbot service for data discovery

### Prerequisites
1. Create PostgreSQL database with tables for:
   - Datasets
   - Domains
   - Tags
   - Glossary terms
   - Owners

2. Fetch data from GraphQL endpoint (via sync API)
3. Generate data cards
4. Access chatbot service

### Starting the Microservices

**Command:**
```bash
docker-compose up -d
```

**Verify All Containers Running:**
```bash
docker ps
```

### Service Endpoints

#### Endpoint 8001: DataHub to PostgreSQL Sync Service

**Initialization & Schema:**
- `POST /init-schema` - Create and initialize database tables and schema structure

**Data Synchronization:**
- `POST /sync/full` - Sync and store data from GraphQL endpoint
- `POST /sync/datasets` - (Optional) Sync datasets only

**Health & Statistics:**
- `GET /health` - Check endpoint health
- `GET /stats` - View total entity statistics

#### Endpoint 8005: Data Card & Chatbot Service

**Dataset Synchronization:**
- `POST /sync/blocking` - Sync datasets with their properties

**Sync Status:**
- `POST /sync/status` - Check synchronization status

**Data Card APIs:**
- `POST /generate-datacard/{urn}` - Generate data card for specific dataset using URN
- `GET /datacard/{urn}` - Get existing data card for specific dataset using URN

**Chatbot APIs:**
- `POST /chat` - Chatbot endpoint for data discovery queries
- `GET /history` - View chatbot conversation history
- `DELETE /history` - Delete chatbot conversation history

**Utilities:**
- `GET /health` - Health check endpoint
- `GET /schema` - Get database schema information

---

## Architecture Summary

```
Infinity Governance Project
├── Datahub Services (Port: Default)
│   ├── DataHub GMS
│   ├── Frontend (React)
│   ├── Actions
│   ├── Neo4j (Metadata Store)
│   ├── MySQL (Storage)
│   ├── Elasticsearch (Search)
│   └── Kafka/Zookeeper (Message Queue)
│
└── Microservices (Ports: 8001, 8005)
    ├── Port 8001: DataHub ↔ PostgreSQL Sync
    └── Port 8005: Data Card Generation & Chatbot
```

---

## Quick Start

1. Navigate to either `Datahub_services/` or `Microservices/` directory
2. Run `docker-compose up -d`
3. Verify containers with `docker ps`
4. Access services via configured endpoints
5. (For Microservices) Initialize schema at `/init-schema` before syncing data

---

## Configuration Notes
- All credentials and connection strings shown are examples - update with your actual values
- Ensure all required databases and services are running before starting sync operations
- Check container logs for troubleshooting: `docker logs <container-name>`
