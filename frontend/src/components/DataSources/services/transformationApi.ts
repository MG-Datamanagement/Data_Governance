import {
  TransformationRequest,
  TableMetadata,
  ColumnInfo,
} from "../types/types";
import apiClient, { API_BASE_URL } from "./client";

export const transformationApi = {
  // Get all databases and tables structure
  exploreAllSources: async (): Promise<any> => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/explore`);
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch sources",
        code: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  // Select a database source
  selectSource: async (source: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/select-source`, {
        source,
      });
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to select source",
        code: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  // Execute SQL query
  executeQuery: async (query: string): Promise<any> => {
    try {
      const response = await apiClient.post(`${API_BASE_URL}/execute-query`, {
        query,
      });
      const result = response.data;

      return {
        success: result.success,
        rows: result.data || [],
        columns: result.columns || [],
        executionTime: 0, // API doesn’t return this
        rowsAffected: result.rows_affected || 0,
        error: result.error,
      };
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Query execution failed",
        code: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  // Transform data (JOIN, UNION, AGGREGATE)
  transformData: async (request: TransformationRequest): Promise<any> => {
    try {
      const formattedRequest = {
        // tables: request.tables,
        // operation: request.operation,
        // type: request.type,
        // on: request.on,
        // mask_pii: request.mask_pii || "No",
        // pii_fields: request.pii_fields || [],
        // user_role: request.user_role || "admin",
        ...request
      };

      const response = await apiClient.post(
        `${API_BASE_URL}/transform`,
        formattedRequest
      );
      const result = response.data;

      // Extract columns from preview data (API response format)
      const columns =
        result.preview && result.preview.length > 0
          ? Object.keys(result.preview[0])
          : [];

      // Generate SQL query for display => if required/neccesary uncomment and pass below
      const generatedQuery = transformationApi.generateQueryFromTransform(
        request.operation,
        request.tables,
        request.type,
        request.on,
        columns
      );
console.log(generatedQuery)
      return {
        success: true,
        query: generatedQuery,
        preview: result.preview || [],
        columns: columns,
      };
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Transformation failed",
        code: error.response?.status,
        details: error.response?.data,
      };
    }
  },

  generateQueryFromTransform: (
    operation: string,
    tables: any[],
    type?: string,
    on?: string,
    columns?: string[]
  ): string => {
    const columnList = columns && columns.length > 0 ? columns.join(", ") : "*";

    if (operation === "join" && tables.length >= 2) {
      const t1 = tables[0];
      const t2 = tables[1];
      const joinType = (type || "inner").toUpperCase();
      return `SELECT ${columnList}\nFROM ${t1.table} t1\n${joinType} JOIN ${t2.table} t2\n  ON t1.${on} = t2.${on}\nLIMIT 100;`;
    } else if (operation === "union" && tables.length >= 2) {
      return (
        tables.map((t) => `SELECT * FROM ${t.table}`).join("\nUNION ALL\n") +
        "\nLIMIT 100;"
      );
    } else if (operation === "groupby" && tables.length > 0) {
      return `SELECT ${columnList}\nFROM ${tables[0].table}\nGROUP BY ${columns?.[0] || "id"};`;
    } else if (tables.length > 0) {
      return `SELECT ${columnList}\nFROM ${tables[0].table}\nLIMIT 100;`;
    }

    return "-- No query generated";
  },

  // Parse explore response into structured table metadata
  parseExploreData: (
    exploreData: any,
    connectorId: string,
    db: string,
    table: string
  ): TableMetadata => {
    try {
      const sourceData = exploreData[connectorId];
      if (!sourceData) throw new Error(`Source ${connectorId} not found`);

      const dbData = sourceData[db];
      if (!dbData) throw new Error(`Database ${db} not found`);

      const tableData = dbData[table];
      if (!tableData) throw new Error(`Table ${table} not found`);

      const columns: ColumnInfo[] = tableData.map((col: any) => ({
        name: col.Field,
        dataType: col.Type,
        nullable: col.Key !== "PRI",
        isPrimaryKey: col.Key === "PRI",
      }));

      return {
        table,
        columns,
        rowCount: undefined,
        indexes: tableData
          .filter((c: any) => c.Key)
          .map((c: any) => `${c.Key} (${c.Field})`),
      };
    } catch (error) {
      console.error("Error parsing explore data:", error);
      throw error;
    }
  },

  // Helper: generate SQL from preview data
  generateQueryFromPreview: (result: any): string => {
    if (!result.preview || result.preview.length === 0) {
      return "-- No preview data available";
    }

    const columns = Object.keys(result.preview[0]);
    return `-- Query executed successfully\n-- ${result.preview.length} rows returned\nSELECT ${columns.join(
      ", "
    )}\nFROM [your_table]\nLIMIT ${result.preview.length};`;
  },
};
