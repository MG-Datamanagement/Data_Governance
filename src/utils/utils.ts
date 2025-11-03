import { LineageData } from "../components/LineageGraph/types";

export const normalizeLineageData = (apiData: any): LineageData => {
  return {
    center_table: {
      table_id: apiData.center_table.id,           // Map id to table_id - with recent changes
      table_name: apiData.center_table.name,       // Map name to table_name - with recent changes
      schema_name: apiData.center_table.schema_name,
      data_source_name: apiData.center_table.data_source_name,
      data_source_base64_url: apiData.center_table.data_source_base64_url
    },
    upstream_links: apiData.upstream_links || [],
    downstream_links: apiData.downstream_links || [],
    metadata: apiData.metadata
  };
};