import {
  TableIcon,
  Terminal,
  Copy,
  Loader,
  Play,
  Download,
  Clock,
  Code,
  Columns,
  ChevronDown,
  ChevronRight,
  Database,
  Loader2Icon,
  RefreshCwIcon,
  X,
  CheckCircle,
} from "lucide-react";
import { memo, useCallback, useEffect, useRef } from "react";
import StatusBadge from "./StatusBadge";
import { Connector, TableSelection } from "./types/types";
import { TransformationCard } from "./TransformationCard";
import { useQueryEngine } from "./hooks/useQueryEngine";
import { useTableBrowser } from "./hooks/useTableBrowser";
import { useTransformation } from "./hooks/useTransformation";
import { useExploreData } from "./hooks/useExploreData";
import { useNotifications } from "./hooks/useNotifications";
import { SAMPLE_QUERIES } from "./constants";
import { normalizeSourceType } from "./utils/normalizers/connectorNormalizer";

interface QueryEngineScreenProps {
  connectors: Connector[];
}

const QueryEngineScreen: React.FC<QueryEngineScreenProps> = memo(
  ({ connectors }) => {
    console.log(connectors);

    const resultsRef = useRef<HTMLDivElement>(null);
    // ===== CUSTOM HOOKS =====
    const {
      queryData,
      queryHistory,
      updateQueryField,
      executeQuery,
      formatQuery,
      clearQuery,
      loadHistoryItem,
      exportCSV,
      setQueryResults,
      isConnectorReady,
      selectConnector,
    } = useQueryEngine(connectors);

    const {
      exploreData,
      isLoading: isLoadingExplore,
      refreshExploreData,
    } = useExploreData();

    const { tables, setTables, selectedSource, executeTransformation } =
      useTransformation(queryData.selectedConnector, connectors);

    const { addNotification } = useNotifications();

    useEffect(() => {
      if (queryData?.results) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }, [queryData?.results]);

    const handleTableSelectedFromBrowser = useCallback(
      (tableSelection: TableSelection) => {
        console.log("📥 Received table selection:", tableSelection);

        // Normalize source to match availableSources format
        const normalizedSource = tableSelection.source.toLowerCase();

        console.log("Normalized source:", normalizedSource);
        console.log(
          "Available sources:",
          connectors.map((c) => c.type)
        );

        // Check if table already exists in transformation card
        const alreadyAdded = tables.some(
          (t) =>
            t.source === normalizedSource &&
            t.db === tableSelection.db &&
            t.table === tableSelection.table
        );

        if (alreadyAdded) {
          addNotification(
            "info",
            `Table ${tableSelection.table} already added`
          );
          return;
        }

        // Add to transformation card with normalized source
        const normalizedSelection = {
          ...tableSelection,
          source: normalizedSource,
        };

        setTables((prev) => {
          // If there's an empty table entry, replace it instead of adding
          if (
            prev.length === 1 &&
            !prev[0].source &&
            !prev[0].db &&
            !prev[0].table
          ) {
            return [normalizedSelection];
          }
          return [...prev, normalizedSelection];
        });

        addNotification(
          "success",
          `Table ${tableSelection.table} added to transformation`
        );
        console.log("Table added to transformation card:", normalizedSelection);
      },
      [tables, setTables, addNotification, connectors]
    );

    // UPDATE THIS: Pass the callback to useTableBrowser
    const {
      searchTerm,
      setSearchTerm,
      filteredTables,
      expandedTable,
      metadata,
      isLoadingMetadata,
      selectedTable,
      loadTableMetadata,
    } = useTableBrowser(exploreData, handleTableSelectedFromBrowser);

    // ===== HANDLERS =====
    const handleTableSelect = (tableName: string) => {
      const connector = connectors.find(
        (c) => c.id === queryData.selectedConnector
      );
      if (!connector) return;

      const query = `SELECT * FROM ${tableName} LIMIT 100;`;
      updateQueryField("query", query);
      // addNotification("info", `Query generated for ${tableName}`);
    };

    const handleQueryGenerated = (query: string, preview?: any) => {
      updateQueryField("query", query);

      // If preview data exists, show it in results
      if (preview && preview.rows && preview.columns) {
        setQueryResults({
          rows: preview.rows,
          columns: preview.columns,
          executionTime: 0,
        });
        // addNotification("success", "Query generated with preview results");
      } else {
        // addNotification("success", "Query generated from transformation");
      }
    };

    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Query Engine
          </h1>
          <p className="text-sm text-gray-500">
            Execute SQL queries and explore your data
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* ===== LEFT COLUMN: Table Browser + Transformation ===== */}
          <div className="col-span-5 space-y-6">
            {/* TABLE BROWSER */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <TableIcon size={16} />
                    Table Browser
                  </h3>
                  <button
                    onClick={refreshExploreData}
                    disabled={isLoadingExplore}
                    className="text-gray-600 hover:bg-gray-100 p-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh database structure"
                  >
                    <RefreshCwIcon
                      size={16}
                      className={isLoadingExplore ? "animate-spin" : ""}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Search Tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>

                {/* Connector Selection */}
                {isLoadingExplore ? (
                  <div className="text-center py-8">
                    <Loader2Icon className="animate-spin text-purple-600 mx-auto" />
                  </div>
                ) : filteredTables.length > 0 ? (
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {filteredTables.map((table) => {
                      const isSelected = selectedTable === table.name;
                      const isExpanded = expandedTable === table.name;
                      const isLoading = isSelected && isLoadingMetadata;

                      return (
                        <div
                          key={`${table.source}-${table.database}-${table.name}`}
                          className="border border-gray-200 rounded-lg"
                        >
                          <button
                            onClick={() => {
                              loadTableMetadata(table, isSelected);
                              handleTableSelect(table.name);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors rounded-lg"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                            <Database className="w-3 h-3 text-purple-600 flex-shrink-0" />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="font-medium text-sm text-gray-900 truncate w-full">
                                {table.name}
                              </span>
                              <span className="text-sm font-normal text-gray-500 truncate w-full">
                                {table.source} • {table.database}
                              </span>
                            </div>
                            {isLoading && (
                              <Loader2Icon className="w-3 h-3 animate-spin text-purple-600 flex-shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                              {isLoadingMetadata ? (
                                <div className="text-center py-4">
                                  <Loader2Icon className="animate-spin text-purple-600 mx-auto mb-2 w-4 h-4" />
                                  <p className="text-xs text-gray-500">
                                    Loading...
                                  </p>
                                </div>
                              ) : metadata ? (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Columns className="w-3 h-3 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-700">
                                      {metadata.columns.length} columns
                                    </span>
                                  </div>

                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {metadata.columns.map((col) => (
                                      <div
                                        key={col.name}
                                        className="flex items-center gap-2 p-1.5 bg-gray-50 rounded text-xs"
                                      >
                                        <span className="font-mono text-gray-900 truncate flex-1">
                                          {col.name}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                                          {col.dataType}
                                        </span>
                                        {col.isPrimaryKey && (
                                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                            PK
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-xs text-red-600">
                                    Failed to load
                                  </p>
                                  <button
                                    onClick={() =>
                                      loadTableMetadata(table, false)
                                    }
                                    className="mt-1 text-xs text-purple-600 hover:underline"
                                  >
                                    Retry
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-8">
                    {exploreData
                      ? "No tables found"
                      : "Loading database structure..."}
                  </div>
                )}
              </div>
            </div>

            {/* TRANSFORMATION CARD */}
            <TransformationCard
              availableSources={
                exploreData ? Object.keys(exploreData) : []
                // Array.from(new Set(connectors.map((c) => c.type)))
              }
              initialTables={tables}
              onQueryGenerated={handleQueryGenerated}
              onTablesChange={setTables}
              selectedConnectorId={queryData.selectedConnector}
              connectors={connectors}
              onTransformationExecute={executeTransformation}
              exploreData={exploreData}
            />
          </div>

          {/* ===== RIGHT COLUMN: Query Editor + Results + History ===== */}
          <div className="col-span-7 space-y-6">
            {/* SQL EDITOR */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Terminal size={16} />
                    SQL Editor
                  </h3>

                  {/* Editor Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={formatQuery}
                      disabled={!queryData.query.trim() || !isConnectorReady}
                      className="text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Format Query"
                    >
                      <Code size={16} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(queryData.query);
                        addNotification("success", "Query copied to clipboard");
                      }}
                      className="text-gray-600 hover:bg-gray-100 rounded transition"
                      title="Copy Query"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  {/* Connector selector */}
                  {/* <select
                    value={queryData.selectedConnector}
                    onChange={(e) =>
                      updateQueryField("selectedConnector", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm"
                  >
                    <option value="">Select a connector to run queries</option>
                    {connectors
                      .filter((c: Connector) => c.status === "active")
                      .map((c: Connector) => (
                        <>
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        </>
                      ))}
                  </select> */}
                  <div className="relative">
                    <select
                      value={queryData.selectedConnector}
                      onChange={(e) => selectConnector(e.target.value)}
                      disabled={queryData.isConnecting}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        Select a connector to run queries
                      </option>
                      {connectors
                        .filter((c: Connector) => c.status === "active")
                        .map((c: Connector) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                    </select>

                    {/* Loading indicator */}
                    {queryData.isConnecting && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Loader2Icon className="w-4 h-4 animate-spin text-purple-600" />
                      </div>
                    )}
                  </div>

                  {/* Connection status indicator */}
                  {queryData.selectedConnector && isConnectorReady && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle size={12} />
                      <span>Connected and ready</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Query Textarea */}
              <div className="p-0">
                <textarea
                  value={queryData.query}
                  onChange={(e) => updateQueryField("query", e.target.value)}
                  disabled={!isConnectorReady}
                  placeholder={
                    isConnectorReady
                      ? "Write your SQL query here\nEx: SELECT * FROM users WHERE active = 1 LIMIT 100;"
                      : "Select a connector first to write queries..."
                  }
                  // placeholder="Write your SQL query here&#10;Ex: SELECT * FROM users WHERE active = 1 LIMIT 100;"
                  rows={12}
                  className="w-full px-6 py-4 font-mono text-sm focus:outline-none resize-none border-0"
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={executeQuery}
                    disabled={
                      queryData.isExecuting ||
                      !queryData.selectedConnector ||
                      !isConnectorReady ||
                      !queryData.query.trim()
                    }
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm text-sm"
                  >
                    {queryData.isExecuting ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Run Query
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearQuery}
                    className="px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition font-medium text-sm"
                  >
                    Clear
                  </button>
                </div>

                <button
                  onClick={exportCSV}
                  disabled={!queryData.results}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* QUERY RESULTS */}
            {queryData?.results && (
              <div
                ref={resultsRef}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Query Results
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {queryData.results.rows.length} rows returned in{" "}
                      {queryData.results.executionTime}ms
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      title="Copy to Clipboard"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(queryData?.results?.rows, null, 2)
                        );
                        addNotification(
                          "success",
                          "Results copied to clipboard"
                        );
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setQueryResults(null);
                      }}
                      title="Dismiss"
                      className="text-gray-400 p-2 border border-gray-300 rounded-md hover:text-red-600 hover:border-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        {queryData.results.columns.map((col: string) => (
                          <th
                            key={col}
                            className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queryData.results.rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {queryData?.results?.columns.map((col: string) => (
                            <td key={col} className="px-4 py-3 text-gray-700">
                              {row[col]?.toString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* QUERY HISTORY */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Clock size={16} />
                  Query History
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {queryHistory.length > 0 ? (
                  queryHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-mono text-gray-700 mb-1 line-clamp-2">
                            {item.query}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.connector}</span>
                            <span>•</span>
                            <span>{item.executedAt}</span>
                            <span>•</span>
                            <span>{item.duration}ms</span>
                            <span>•</span>
                            <span>{item.rows} rows</span>
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No query history yet. Execute a query to see it here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default QueryEngineScreen;

QueryEngineScreen.displayName = "QueryEngineScreen";