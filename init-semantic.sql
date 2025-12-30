-- -- init-semantic.sql
-- -- All objects are created in the default database: semantic_search


-- init-semantic.sql
-- All objects are created in the default database: semantic_search

------------------------------------------------------------
-- Domains (from listAllDomains, dataset.domain.domain)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_domain (
  id             BIGSERIAL PRIMARY KEY,
  urn            TEXT NOT NULL UNIQUE,          -- domain.urn
  domain_id      TEXT,                          -- id (short id in listAllDomains)
  name           TEXT NOT NULL,                 -- properties.name
  display_name   TEXT,                          -- optional UI-friendly name if you later use it
  description    TEXT,                          -- properties.description
  created_actor  TEXT,                          -- properties.createdOn.actor.username
  created_at     TIMESTAMPTZ,                   -- optional, if you enrich with timestamps
  is_soft_deleted BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Datasets / Data Catalog (from DataCatalog + dataset() query)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_dataset (
  id                BIGSERIAL PRIMARY KEY,
  urn               TEXT NOT NULL UNIQUE,       -- dataset.urn
  platform_urn      TEXT NOT NULL,              -- dataset.platform.urn
  platform_name     TEXT NOT NULL,              -- dataset.platform.name
  name              TEXT NOT NULL,              -- dataset.name
  full_name         TEXT,                       -- could store fully qualified name if you build it
  description       TEXT,                       -- properties.description
  domain_urn        TEXT,                       -- dataset.domain.domain.urn
  domain_name       TEXT,                       -- dataset.domain.domain.properties.name
  created_at        TIMESTAMPTZ,                -- properties.created (epoch ms -> timestamptz)
  created_actor     TEXT,                       -- properties.createdActor
  last_modified_at  TIMESTAMPTZ,                -- properties.lastModified.time (epoch ms -> timestamptz)
  glossary_summary  TEXT,                       -- free text summary of attached terms (if you build it)
  is_soft_deleted   BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Dataset fields / schema (from dataset().schemaMetadata.fields)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_dataset_field (
  id               BIGSERIAL PRIMARY KEY,
  dataset_urn      TEXT NOT NULL,               -- FK to dh_dataset.urn (logical)
  field_path       TEXT NOT NULL,               -- schemaMetadata.fields.fieldPath
  native_data_type TEXT,                        -- schemaMetadata.fields.nativeDataType
  description      TEXT,                        -- schemaMetadata.fields.description
  nullable         BOOLEAN,                     -- schemaMetadata.fields.nullable
  is_primary_key   BOOLEAN DEFAULT FALSE,       -- schemaMetadata.fields.isPartOfKey
  label            TEXT,                        -- schemaMetadata.fields.label
  is_partition_key BOOLEAN DEFAULT FALSE        -- keep for future enrichment if needed
);

------------------------------------------------------------
-- Tags (from createTag + ListAllTags)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_tag (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,            -- tag urn from searchAcrossEntities
  name         TEXT NOT NULL,                   -- Tag.name / properties.name
  description  TEXT,                            -- Tag.description / properties.description
  color_hex    TEXT                             -- properties.colorHex
);

------------------------------------------------------------
-- Entity–Tag mapping (from Dataset.tags.tags.tag)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_entity_tag (
  id           BIGSERIAL PRIMARY KEY,
  entity_urn   TEXT NOT NULL,                   -- dataset.urn (or any entity urn)
  tag_urn      TEXT NOT NULL,                   -- tag.urn
  subresource  TEXT,                            -- column-level etc if you ever use it
  UNIQUE (entity_urn, tag_urn, subresource)
);

------------------------------------------------------------
-- Glossary terms (from createGlossaryTerm, SearchGlossaryTerms)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_glossary_term (
  id            BIGSERIAL PRIMARY KEY,
  urn           TEXT NOT NULL UNIQUE,           -- GlossaryTerm.urn
  name          TEXT NOT NULL,                  -- GlossaryTerm.name
  display_name  TEXT,                           -- glossaryTermInfo.name if you query it later
  description   TEXT,                           -- glossaryTermInfo.definition
  parent_urn    TEXT,                           -- parentNode / node urn if you store hierarchy
  deprecated    BOOLEAN DEFAULT FALSE
);

------------------------------------------------------------
-- Entity–GlossaryTerm mapping (dataset ↔ glossary term)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_entity_glossary_term (
  id           BIGSERIAL PRIMARY KEY,
  entity_urn   TEXT NOT NULL,                   -- dataset.urn (or any entity urn)
  term_urn     TEXT NOT NULL,                   -- glossaryTerm.urn
  subresource  TEXT,                            -- column-level etc
  UNIQUE (entity_urn, term_urn, subresource)
);

------------------------------------------------------------
-- Users & groups (for domain ownership, stewardship, privileges)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_user (
  id         BIGSERIAL PRIMARY KEY,
  urn        TEXT NOT NULL UNIQUE,              -- CorpUser urn if you use it
  username   TEXT NOT NULL,                     -- CorpUser.username
  email      TEXT,
  full_name  TEXT,
  active     BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dh_group (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,            -- CorpGroup urn
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
  principal_type  TEXT NOT NULL,                -- 'USER' or 'GROUP'
  privilege       TEXT NOT NULL,                -- e.g. 'EDIT', 'VIEW'
  granted         BOOLEAN NOT NULL
);

------------------------------------------------------------
-- Data sources / ingestion sources (from listIngestionSources, createIngestionSource)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dh_ingestion_source (
  id           BIGSERIAL PRIMARY KEY,
  urn          TEXT NOT NULL UNIQUE,            -- ingestionSource.urn
  name         TEXT NOT NULL,                   -- ingestionSource.name
  type         TEXT NOT NULL,                   -- ingestionSource.type (e.g. 'mongodb')
  executor_id  TEXT,                            -- input.executorId
  config_json  JSONB,                           -- raw config / recipe if you want to store it
  schedule_interval TEXT,                       -- schedule.interval
  schedule_timezone TEXT,                       -- schedule.timezone
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ
);


-- CREATE TABLE IF NOT EXISTS dh_domain (
--   id           BIGSERIAL PRIMARY KEY,
--   urn          TEXT NOT NULL UNIQUE,
--   name         TEXT NOT NULL,
--   display_name TEXT,
--   description  TEXT
-- );

-- CREATE TABLE IF NOT EXISTS dh_dataset (
--   id               BIGSERIAL PRIMARY KEY,
--   urn              TEXT NOT NULL UNIQUE,
--   platform         TEXT NOT NULL,
--   name             TEXT NOT NULL,
--   full_name        TEXT,
--   description      TEXT,
--   domain_urn       TEXT,
--   glossary_summary TEXT,
--   is_soft_deleted  BOOLEAN DEFAULT FALSE,
--   created_at       TIMESTAMPTZ,
--   updated_at       TIMESTAMPTZ
-- );

-- CREATE TABLE IF NOT EXISTS dh_dataset_field (
--   id               BIGSERIAL PRIMARY KEY,
--   dataset_urn      TEXT NOT NULL,
--   field_path       TEXT NOT NULL,
--   data_type        TEXT,
--   description      TEXT,
--   is_primary_key   BOOLEAN DEFAULT FALSE,
--   is_partition_key BOOLEAN DEFAULT FALSE
-- );

-- CREATE TABLE IF NOT EXISTS dh_tag (
--   id          BIGSERIAL PRIMARY KEY,
--   urn         TEXT NOT NULL UNIQUE,
--   name        TEXT NOT NULL,
--   description TEXT
-- );

-- CREATE TABLE IF NOT EXISTS dh_entity_tag (
--   id          BIGSERIAL PRIMARY KEY,
--   entity_urn  TEXT NOT NULL,
--   tag_urn     TEXT NOT NULL,
--   subresource TEXT,
--   UNIQUE (entity_urn, tag_urn, subresource)
-- );

-- CREATE TABLE IF NOT EXISTS dh_glossary_term (
--   id           BIGSERIAL PRIMARY KEY,
--   urn          TEXT NOT NULL UNIQUE,
--   name         TEXT NOT NULL,
--   display_name TEXT,
--   description  TEXT,
--   parent_urn   TEXT,
--   deprecated   BOOLEAN DEFAULT FALSE
-- );

-- CREATE TABLE IF NOT EXISTS dh_entity_glossary_term (
--   id          BIGSERIAL PRIMARY KEY,
--   entity_urn  TEXT NOT NULL,
--   term_urn    TEXT NOT NULL,
--   subresource TEXT,
--   UNIQUE (entity_urn, term_urn, subresource)
-- );

-- CREATE TABLE IF NOT EXISTS dh_user (
--   id        BIGSERIAL PRIMARY KEY,
--   urn       TEXT NOT NULL UNIQUE,
--   username  TEXT NOT NULL,
--   email     TEXT,
--   full_name TEXT,
--   active    BOOLEAN DEFAULT TRUE
-- );

-- CREATE TABLE IF NOT EXISTS dh_group (
--   id          BIGSERIAL PRIMARY KEY,
--   urn         TEXT NOT NULL UNIQUE,
--   name        TEXT NOT NULL,
--   description TEXT
-- );

-- CREATE TABLE IF NOT EXISTS dh_group_member (
--   id        BIGSERIAL PRIMARY KEY,
--   group_urn TEXT NOT NULL,
--   user_urn  TEXT NOT NULL,
--   UNIQUE (group_urn, user_urn)
-- );

-- CREATE TABLE IF NOT EXISTS dh_entity_privilege (
--   id             BIGSERIAL PRIMARY KEY,
--   entity_urn     TEXT NOT NULL,
--   principal_urn  TEXT NOT NULL,
--   principal_type TEXT NOT NULL,
--   privilege      TEXT NOT NULL,
--   granted        BOOLEAN NOT NULL
-- );
