#!/bin/bash

solrUri="http://localhost:8983/solr/suggestions_core/schema"

echo "Configuring Solr schema at $solrUri..."

# Function to check if a field exists
field_exists() {
    local field_name=$1
    curl -s "$solrUri" | grep -q "\"$field_name\""
    return $?
}

# Function to add or replace field
add_or_replace_field() {
    local field_name=$1
    local field_type=$2
    local stored=$3
    
    if field_exists "$field_name"; then
        echo "Field '$field_name' already exists, replacing..."
        body="{
          \"replace-field\":{
            \"name\":\"$field_name\",
            \"type\":\"$field_type\",
            \"stored\":$stored }
        }"
    else
        echo "Adding '$field_name' field..."
        body="{
          \"add-field\":{
            \"name\":\"$field_name\",
            \"type\":\"$field_type\",
            \"stored\":$stored }
        }"
    fi
    
    curl -X POST -H "Content-Type: application/json" -d "$body" "$solrUri"
    echo ""
}

# Configure the fields
add_or_replace_field "display_text" "string" "true"
add_or_replace_field "search_text" "text_general" "true"
add_or_replace_field "doc_type" "string" "true"
add_or_replace_field "source_id" "pint" "true"

# Add copy field (this should work as it succeeded in your output)
echo "Adding copy field from 'display_text' to 'search_text'..."
body5='{
  "add-copy-field":{
    "source":"display_text",
    "dest":"search_text"}
}'
curl -X POST -H "Content-Type: application/json" -d "$body5" "$solrUri"
echo ""

echo "Solr schema configuration complete."