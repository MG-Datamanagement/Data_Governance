import { useState, useCallback, useMemo, useRef } from "react";
import { QueryState, QueryHistoryItem, Connector } from "../types/types";
import { transformationApi } from "../services/transformationApi";
import { formatSQL } from "../utils/utilFns";
import { useNotifications } from "./useNotifications";
import { MOCK_QUERY_RESULTS } from "../constants";

export const useQueryEngine = (
  connectors: Connector[],
  onResultsReady?: () => void
) => {
  const { addNotification } = useNotifications();

  const defaultQueryData: QueryState = {
    selectedConnector: "",
    query: "",
    results: null,
    isExecuting: false,
    selectedTable: null,
    isConnecting: false,
  };

  const [queryData, setQueryData] = useState<QueryState>(defaultQueryData);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isConnectorReady, setIsConnectorReady] = useState(false);

  const selectingRef = useRef(false);

  // Update query field
  const updateQueryField = useCallback((field: string, value: any) => {
    setQueryData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const selectConnector = useCallback(
    async (connectorId: string) => {
      if (!connectorId) {
        setQueryData((prev) => ({ ...prev, selectedConnector: "" }));
        setIsConnectorReady(false);
        return;
      }

      // Prevent duplicate calls
      if (selectingRef.current) {
        console.log("Already selecting a connector, skipping...");
        return;
      }

      const connector = connectors.find((c) => c.id === connectorId);
      if (!connector) {
        addNotification("error", "Connector not found");
        return;
      }

      selectingRef.current = true;
      // Set loading state
      setQueryData((prev) => ({
        ...prev,
        isConnecting: true,
        selectedConnector: connectorId,
      }));
      setIsConnectorReady(false);

      try {
        // Normalize source type for backend
        const normalizedSource =
          connector.type.toLowerCase() === "postgresql"
            ? "postgres"
            : connector.type.toLowerCase() === "mongodb"
              ? "mongo"
              : connector.type.toLowerCase();

        console.log("Calling /select-source with:", normalizedSource);
        const response = await transformationApi.selectSource(normalizedSource);
        // const response = await new Promise((resolve) => setTimeout(resolve, 10000));  //Mock purpose
        console.log("Select source response:", response);

        if (response?.success) {
          setIsConnectorReady(true);
          addNotification("success", `Connected to ${connector.name}`);
        } else {
          setQueryData((prev) => ({ ...prev, selectedConnector: "" }));
          setIsConnectorReady(false);
          addNotification(
            "error",
            response?.detail || "Failed to select source"
          );
        }
      } catch (error: any) {
        console.error("Failed to select source:", error);
        setQueryData((prev) => ({ ...prev, selectedConnector: "" }));
        setIsConnectorReady(false);
        addNotification("error", "Failed to connect to source");
      } finally {
        setQueryData((prev) => ({ ...prev, isConnecting: false }));
        selectingRef.current = false;
      }
    },
    [connectors, addNotification]
  );

  // Execute query
  const executeQuery = useCallback(async () => {
    if (!queryData.selectedConnector || !queryData.query.trim()) {
      addNotification("warning", "Please select a connector and enter a query");
      return;
    }

    setQueryData((prev) => ({ ...prev, isExecuting: true, results: null }));

    try {
      // ========== MOCK START ==========
      // await new Promise((resolve) => setTimeout(resolve, 800));

      // const query = queryData.query.toLowerCase();
      // let result;

      // if (query.includes("users")) {
      //   result = { success: true, ...MOCK_QUERY_RESULTS.users };
      // } else if (query.includes("orders")) {
      //   result = { success: true, ...MOCK_QUERY_RESULTS.orders };
      // } else if (query.includes("products")) {
      //   result = { success: true, ...MOCK_QUERY_RESULTS.products };
      // } else {
      //   result = { success: true, ...MOCK_QUERY_RESULTS.users };
      // }
      // ========== MOCK END ==========

      // ========== PRODUCTION  ==========
      const result = await transformationApi.executeQuery(queryData.query);
      // ========== PRODUCTION END ==========

      if (!result.success) {
        // addNotification("error", result.message || result.detail || "Failed to delete connector");
        throw new Error("Query execution failed");
      }

      setQueryData((prev) => ({
        ...prev,
        results: {
          rows: result.rows,
          columns: result.columns,
          executionTime: result.executionTime || 0,
        },
        isExecuting: false,
      }));

      if (onResultsReady) {
        setTimeout(() => onResultsReady(), 100);
      }

      const newHistoryItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query: queryData.query,
        connector:
          connectors.find((c) => c.id === queryData.selectedConnector)?.name ||
          "Unknown",
        executedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        duration: result.executionTime || 0,
        rows: result.rows.length,
        status: "success",
      };

      setQueryHistory((prev) => [newHistoryItem, ...prev]);
      addNotification(
        "success",
        `Query executed! ${result.rows.length} rows returned`
      );
    } catch (error: any) {
      console.error("Query execution error:", error);
      setQueryData((prev) => ({ ...prev, isExecuting: false }));

      const failedHistoryItem: QueryHistoryItem = {
        id: Date.now().toString(),
        query: queryData.query,
        connector:
          connectors.find((c) => c.id === queryData.selectedConnector)?.name ||
          "Unknown",
        executedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        duration: 0,
        rows: 0,
        status: "error",
      };

      setQueryHistory((prev) => [failedHistoryItem, ...prev]);
      addNotification("error", error.message || "Query execution failed");
    }
  }, [queryData, connectors, addNotification]);

  // Format query
  const formatQuery = useCallback(() => {
    if (!queryData.query.trim()) {
      addNotification("warning", "No query to format");
      return;
    }

    const formatted = formatSQL(queryData.query);
    setQueryData((prev) => ({ ...prev, query: formatted }));
    addNotification("success", "Query formatted successfully");
  }, [queryData.query, addNotification]);

  // Clear query
  const clearQuery = useCallback(() => {
    setQueryData((prev) => ({
      ...prev,
      query: "",
      results: null,
    }));
  }, []);

  // Load history item
  const loadHistoryItem = useCallback(
    (historyItem: QueryHistoryItem) => {
      setQueryData((prev) => ({
        ...prev,
        query: historyItem.query,
      }));
      addNotification("info", "Query loaded from history");
    },
    [addNotification]
  );

  // Export CSV
  const exportCSV = useCallback(() => {
    if (!queryData.results) return;

    const csv = [
      queryData.results.columns.join(","),
      ...queryData.results.rows.map((row) =>
        queryData.results!.columns.map((col) => row[col]).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification("success", "CSV exported successfully");
  }, [queryData.results, addNotification]);

  const setQueryResults = useCallback((results: any) => {
    setQueryData((prev) => ({
      ...prev,
      results: results,
    }));
  }, []);

  return {
    queryData,
    queryHistory,
    updateQueryField,
    executeQuery,
    formatQuery,
    clearQuery,
    loadHistoryItem,
    exportCSV,
    setQueryResults,
    selectConnector,
    isConnectorReady,
  };
};
