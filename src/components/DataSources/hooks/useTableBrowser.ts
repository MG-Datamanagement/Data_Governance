import { useState, useCallback, useMemo, useEffect } from "react";
import {
  TableInfo,
  Connector,
  TableSelection,
  TableMetadata,
} from "../types/types";
import { transformationApi } from "../services/transformationApi";
import { useDebounce } from "./useDebounce";
import { useNotifications } from "./useNotifications";

export const useTableBrowser = (
  // selectedConnectorId: string,
  // connectors: Connector[],
  exploreData: any,
  onTableSelected?: (tableSelection: TableSelection) => void // ADD THIS
) => {
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TableMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // new based in updated response
  const availableTables = useMemo(() => {
    if (!exploreData) return [];

    let allTables: TableInfo[] = [];

    Object.entries(exploreData).forEach(
      ([source, databases]: [string, any]) => {
        if (typeof databases === "object" && databases !== null) {
          Object.entries(databases).forEach(
            ([dbName, tables]: [string, any]) => {
              if (typeof tables === "object" && tables !== null) {
                Object.keys(tables).forEach((tableName) => {
                  allTables.push({
                    name: tableName,
                    source: source,
                    database: dbName,
                    rows: 0,
                    size: "Unknown",
                  });
                });
              }
            }
          );
        }
      }
    );

    return allTables;
  }, [exploreData]);

  // Filter tables by search (search across name, source, database)
  const filteredTables = useMemo(() => {
    return availableTables.filter((t) => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        t.name.toLowerCase().includes(searchLower) ||
        t.source.toLowerCase().includes(searchLower) ||
        t.database.toLowerCase().includes(searchLower)
      );
    });
  }, [availableTables, debouncedSearch]);

  // new based on updated response
  const loadTableMetadata = useCallback(
    async (table: TableInfo, isSelected: boolean) => {
      if (isSelected) {
        setExpandedTable(null);
        setSelectedTable(null);
        setMetadata(null);
        return;
      }

      setExpandedTable(table.name);
      setSelectedTable(table.name);
      setIsLoadingMetadata(true);
      setMetadata(null);

      try {
        if (!exploreData?.[table.source]?.[table.database]) {
          addNotification("error", "Database structure not loaded");
          throw new Error("Database structure not loaded");
        }

        const tableData = exploreData[table.source][table.database][table.name];
        if (!tableData) {
          addNotification("error", "Table data not found");
          throw new Error("Table data not found");
        }

        const columns = tableData.map((col: any) => ({
          name: col.Field,
          dataType: col.Type,
          nullable: true,
          isPrimaryKey: col.Key === "PRI",
        }));

        const meta: TableMetadata = {
          columns,
          rowCount: null,
          indexes: [],
        };

        setMetadata(meta);
        // addNotification("success", `Table ${table.name} metadata loaded`);

        if (onTableSelected) {
          onTableSelected({
            source: table.source,
            db: table.database,
            table: table.name,
          });
        }
      } catch (err: any) {
        addNotification("error", err.message || "Failed to load metadata");
        setMetadata(null);
      } finally {
        setIsLoadingMetadata(false);
      }
    },
    [exploreData, addNotification, onTableSelected]
  );

  return {
    searchTerm,
    setSearchTerm,
    filteredTables,
    expandedTable,
    metadata,
    isLoadingMetadata,
    selectedTable,
    loadTableMetadata,
  };
};
