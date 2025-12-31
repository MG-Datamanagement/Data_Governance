-- -- init-semantic.sql


------------------------------------------------------------
-- Domains (from listAllDomains, dataset.domain.domain)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_domain (
  id             BIGSERIAL PRIMARY KEY,
  urn            TEXT NOT NULL UNIQUE,        
  domain_id      TEXT,                          
  name           TEXT NOT NULL,                 -
  display_name   TEXT,                          
  description    TEXT,                         
  created_actor  TEXT,                          
  created_at     TIMESTAMPTZ,                   
  is_soft_deleted BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Datasets / Data Catalog (from DataCatalog + dataset() query)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_dataset (
  id                BIGSERIAL PRIMARY KEY,
  urn               TEXT NOT NULL UNIQUE,     
  platform_urn      TEXT NOT NULL,              
  platform_name     TEXT NOT NULL,            
  name              TEXT NOT NULL,              
  full_name         TEXT,                      
  description       TEXT,                       
  domain_urn        TEXT,                       
  created_at        TIMESTAMPTZ,               
  created_actor     TEXT,                       
  last_modified_at  TIMESTAMPTZ,     
  glossary_summary  TEXT,                       
  is_soft_deleted   BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Dataset fields / schema (from dataset().schemaMetadata.fields)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_dataset_field (
  id               BIGSERIAL PRIMARY KEY,
  dataset_urn      TEXT NOT NULL,              
  field_path       TEXT NOT NULL,              
  native_data_type TEXT,                       
  description      TEXT,                       
  nullable         BOOLEAN,                     
  is_primary_key   BOOLEAN DEFAULT FALSE,       
  label            TEXT,                        
  is_partition_key BOOLEAN DEFAULT FALSE        
);

------------------------------------------------------------
-- Tags (from createTag + ListAllTags)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_tag (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,           
  name         TEXT NOT NULL,                  
  description  TEXT,                           
  color_hex    TEXT     
);                        

------------------------------------------------------------
-- Entity–Tag mapping (from Dataset.tags.tags.tag)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_entity_tag (
  id           BIGSERIAL PRIMARY KEY,
  entity_urn   TEXT NOT NULL,                  
  tag_urn      TEXT NOT NULL,                   
  subresource  TEXT,                            
  UNIQUE (entity_urn, tag_urn, subresource)
);

------------------------------------------------------------
-- Glossary terms (from createGlossaryTerm, SearchGlossaryTerms)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_glossary_term (
  id            BIGSERIAL PRIMARY KEY,
  urn           TEXT NOT NULL UNIQUE,           
  name          TEXT NOT NULL,                 
  display_name  TEXT,                          
  description   TEXT,                          
  parent_urn    TEXT,                           
  deprecated    BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Entity–GlossaryTerm mapping (dataset ↔ glossary term)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_entity_glossary_term (
  id           BIGSERIAL PRIMARY KEY,
  entity_urn   TEXT NOT NULL,                   
  term_urn     TEXT NOT NULL,                   
  subresource  TEXT,                           
  UNIQUE (entity_urn, term_urn, subresource)
);

------------------------------------------------------------
-- Users & groups (for domain ownership, stewardship, privileges)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_user (
  id         BIGSERIAL PRIMARY KEY,
  urn        TEXT NOT NULL UNIQUE,              
  username   TEXT NOT NULL,                    
  full_name  TEXT,
  active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dh_group (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,            
  name         TEXT NOT NULL,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS dh_group_member (
  id         BIGSERIAL PRIMARY KEY,
  group_urn  TEXT NOT NULL,
  user_urn   TEXT NOT NULL,
  UNIQUE (group_urn, user_urn)
);

------------------------------------------------------------
-- Entity-level privileges (optional, for future ACL modeling)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_entity_privilege (
  id              BIGSERIAL PRIMARY KEY,
  entity_urn      TEXT NOT NULL,
  principal_urn   TEXT NOT NULL,
  principal_type  TEXT NOT NULL,              
  privilege       TEXT NOT NULL,                
  granted         BOOLEAN NOT NULL
);

------------------------------------------------------------
-- Data sources / ingestion sources (from listIngestionSources, createIngestionSource)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_ingestion_source (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,            
  name         TEXT NOT NULL,                   
  type         TEXT NOT NULL,                  
  executor_id  TEXT,                           
  config_json  JSONB,                           
  schedule_interval TEXT,                     
  schedule_timezone TEXT,                       
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ
);