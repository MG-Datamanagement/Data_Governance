#!/bin/bash
set -e

CORE=dh_search_core
SOLR_URI="http://localhost:8983/solr/${CORE}/schema"

echo "Configuring Solr schema at ${SOLR_URI}..."

field_exists() {
  local field_name=$1
  curl -s "${SOLR_URI}" | grep -q "\"${field_name}\""
  return $?
}

add_or_replace_field() {
  local name=$1
  local type=$2
  local stored=$3
  local multi=${4:-false}

  if field_exists "$name"; then
    echo "Replacing field ${name}"
    body="{
      \"replace-field\": {
        \"name\": \"${name}\",
        \"type\": \"${type}\",
        \"stored\": ${stored},
        \"multiValued\": ${multi}
      }
    }"
  else
    echo "Adding field ${name}"
    body="{
      \"add-field\": {
        \"name\": \"${name}\",
        \"type\": \"${type}\",
        \"stored\": ${stored},
        \"multiValued\": ${multi}
      }
    }"
  fi

  curl -X POST -H "Content-Type: application/json" -d "${body}" "${SOLR_URI}"
  echo
}

# Core fields for all documents
add_or_replace_field "id"            "string"        true  false
add_or_replace_field "entity_type"   "string"        true  false   # DATASET, DOMAIN, TAG, GLOSSARY_TERM, COLUMN, SOURCE
add_or_replace_field "urn"          "string"        true  false
add_or_replace_field "name"         "string"        true  false
add_or_replace_field "display_name" "string"        true  false
add_or_replace_field "description"  "text_general"  true  false
add_or_replace_field "dataset_urn"  "string"        true  false    # for columns
add_or_replace_field "field_path"   "string"        true  false    # for columns

# Unified search text field
add_or_replace_field "search_text"  "text_general"  true  true

# Copy fields: everything into search_text
copy_body='{
  "add-copy-field": { "source": "name", "dest": "search_text" }
}'
curl -X POST -H "Content-Type: application/json" -d "${copy_body}" "${SOLR_URI}"
echo

copy_body='{
  "add-copy-field": { "source": "display_name", "dest": "search_text" }
}'
curl -X POST -H "Content-Type: application/json" -d "${copy_body}" "${SOLR_URI}"
echo

copy_body='{
  "add-copy-field": { "source": "description", "dest": "search_text" }
}'
curl -X POST -H "Content-Type: application/json" -d "${copy_body}" "${SOLR_URI}"
echo

echo "Solr schema configuration complete."
