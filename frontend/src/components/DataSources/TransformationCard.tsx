import React, { useEffect, useState, useMemo } from "react";
import {
  Wand2,
  Plus,
  Trash2,
  Play,
  Loader2,
  Loader,
  Database,
  X,
} from "lucide-react";
import {
  TableSelection,
  TransformationRequest,
  Connector,
} from "./types/types";
import { useNotifications } from "./hooks/useNotifications";

interface TransformationCardProps {
  availableSources?: string[];
  initialTables?: TableSelection[];
  onQueryGenerated?: (query: string, preview?: any) => void;
  onTablesChange?: (tables: TableSelection[]) => void;
  selectedConnectorId?: string;
  connectors?: Connector[];
  onTransformationExecute?: (request: TransformationRequest) => Promise<{
    success: boolean;
    query: string;
    preview: never[];
    columns: never[];
  }>;
  exploreData?: any; // Structure: { source: { db: { table: [...columns] } } }
}

export const TransformationCard: React.FC<TransformationCardProps> = ({
  availableSources = [],
  initialTables,
  onQueryGenerated,
  onTablesChange,
  selectedConnectorId,
  connectors = [],
  onTransformationExecute,
  exploreData,
}: TransformationCardProps) => {
  // ===== STATE =====
  const [tables, setTables] = useState<TableSelection[]>([
    { source: "", db: "", table: "" },
  ]);
  const [operation, setOperation] = useState<
    "join" | "groupby" | "union" | undefined
  >();
  const [joinType, setJoinType] = useState<
    "inner" | "left" | "right" | "outer"
  >("inner");
  const [onCondition, setOnCondition] = useState("");
  const [columns, setColumns] = useState("");
  const [userRole, setUserRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [maskPii, setMaskPii] = useState<"Yes" | "No">("No");
  const [piiFields, setPiiFields] = useState("");

  const { addNotification } = useNotifications();

  useEffect(() => {
    if (initialTables && initialTables.length > 0) {
      console.log("📥 Syncing initialTables:", initialTables);
      setTables(initialTables);
    }
  }, [initialTables]);

  // ===== DYNAMIC DATA FROM EXPLOREDATA =====

  /**
   * Extract available databases for a selected source
   */
  const getAvailableDatabases = (source: string): string[] => {
    if (!exploreData || !source) {
      console.log("No explore data or source for databases");
      return [];
    }

    if (!exploreData[source]) {
      console.log("Source not found in explore data:", source);
      return [];
    }

    const dbs = Object.keys(exploreData[source]);
    console.log(`Found ${dbs.length} databases for ${source}:`, dbs);
    return dbs;
  };

  /**
   * Extract available tables for a selected source + database
   */
  const getAvailableTables = (source: string, db: string): string[] => {
    if (!exploreData || !source || !db) {
      console.log("Missing data for tables:", {
        source,
        db,
        hasExploreData: !!exploreData,
      });
      return [];
    }

    if (!exploreData[source]) {
      console.log("Source not found:", source);
      return [];
    }

    if (!exploreData[source][db]) {
      console.log("Database not found:", db, "in source:", source);
      return [];
    }

    const tables = Object.keys(exploreData[source][db]);
    console.log(`Found ${tables.length} tables in ${source}/${db}:`, tables);
    return tables;
  };

  // ===== SYNC INITIAL TABLES FROM PARENT =====
  useEffect(() => {
    if (initialTables && initialTables.length > 0) {
      setTables(initialTables);
    }
  }, [initialTables]);

  // ===== VALIDATION =====
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!operation) {
      newErrors.operation = "Please select a operation";
    }

    tables.forEach((table, index) => {
      if (!table.source)
        newErrors[`table-${index}-source`] = "Source is required";
      if (!table.db) newErrors[`table-${index}-db`] = "Database is required";
      if (!table.table)
        newErrors[`table-${index}-table`] = "Table name is required";
    });

    if (operation === "join") {
      if (tables.length < 2)
        newErrors.tables = "Join requires at least 2 tables";
      if (!onCondition.trim())
        newErrors.onCondition =
          "Join condition is required (Enter join key (e.g., id or email))";
    }

    if (operation === "union" && tables.length < 2) {
      newErrors.tables = "Union requires at least 2 tables";
    }

    // Validate PII fields when mask_pii is "Yes"
    if (maskPii === "Yes" && !piiFields.trim()) {
      newErrors.piiFields = "PII fields are required when masking is enabled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== TABLE MANAGEMENT =====
  const addTable = () => {
    const newTables = [...tables, { source: "", db: "", table: "" }];
    setTables(newTables);
    if (onTablesChange) {
      onTablesChange(newTables);
    }
  };

  const removeTable = (index: number) => {
    if (tables.length > 1) {
      const newTables = tables.filter((_, i) => i !== index);
      setTables(newTables);
      if (onTablesChange) {
        onTablesChange(newTables);
      }
    }
  };

  const updateTable = (
    index: number,
    field: keyof TableSelection,
    value: string
  ) => {
    const updated = [...tables];
    updated[index][field] = value;

    // Reset dependent fields when source/db changes
    if (field === "source") {
      updated[index].db = "";
      updated[index].table = "";
    } else if (field === "db") {
      updated[index].table = "";
    }

    setTables(updated);
    if (onTablesChange) {
      onTablesChange(updated);
    }
  };

  // ===== TRANSFORMATION EXECUTION =====

  const handleExecuteTransformation = async () => {
    if (!validate()) {
      console.log("Validation failed");
      return;
    }

    console.log("Executing transformation...", { tables, operation });

    setLoading(true);

    try {
      const request: TransformationRequest = {
        tables,
        operation,
        ...(operation === "join" && { type: joinType, on: onCondition }),
        ...(columns && { columns: columns.split(",").map((c) => c.trim()) }),
        user_role: userRole,
        mask_pii: maskPii,
        pii_fields:
          maskPii === "Yes" ? piiFields.split(",").map((f) => f.trim()) : [],
      };

      console.log("Transformation request:", request);

      if (onTransformationExecute) {
        const result = await onTransformationExecute(request);
        console.log("Transformation result:", result);

        if (result && result.query && onQueryGenerated) {
          onQueryGenerated("", {
            rows: result.preview || [],
            columns: result.columns || [],
          });
          console.log("Query and preview sent to editor");
        }
      } else {
        console.warn("No onTransformationExecute callback");
      }
    } catch (error: any) {
      console.error("Error:", error);
      // alert("Failed: " + (error.message || "Unknown error"));
      addNotification("error", error.message || error.detail || "Failed to create connector");
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-200 p-4">
        <Wand2 className="w-4 h-4" />
        <h3 className="text-sm font-semibold text-gray-900">
          Query Transformation
        </h3>
      </div>

      <div className="space-y-3 p-4">
        {/* ===== TABLES SELECTION ===== */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Tables{" "}
              {errors.tables && (
                <span className="text-red-500 text-xs ml-2">
                  {errors.tables}
                </span>
              )}
            </label>
            <button
              onClick={addTable}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          </div>

          <div className="space-y-3">
            {/* {tables.map((table, index) => (
              <div
                key={`${table.source}-${table.db}-${table.table}-${index}`}
                className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200"
              >
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {table.source}.{table.db}.{table.table}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTables(tables.filter((_, i) => i !== index));
                    addNotification("info", `Removed ${table.table}`);
                  }}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))} */}
            {tables.map((table, index) => {
              const availableDbs = getAvailableDatabases(table.source);
              const availableTbls = getAvailableTables(table.source, table.db);

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-2 space-y-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      Table {index + 1}
                    </span>
                    {tables.length > 1 && (
                      <button
                        onClick={() => removeTable(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={table.source}
                    onChange={(e) =>
                      updateTable(index, "source", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select Source</option>
                    {availableSources.map((src) => (
                      <option key={src} value={src}>
                        {src.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <select
                    value={table.db}
                    onChange={(e) => updateTable(index, "db", e.target.value)}
                    disabled={!table.source}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  >
                    <option value="">Select Database</option>
                    {availableDbs.map((db) => (
                      <option key={db} value={db}>
                        {db}
                      </option>
                    ))}
                  </select>

                  <select
                    value={table.table}
                    onChange={(e) =>
                      updateTable(index, "table", e.target.value)
                    }
                    disabled={!table.db}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
                  >
                    <option value="">Select Table</option>
                    {availableTbls.map((tbl) => (
                      <option key={tbl} value={tbl}>
                        {tbl}
                      </option>
                    ))}
                  </select>

                  {/* Display selected table */}
                  {/* {table.source && table.db && table.table && (
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200 mt-2">
                      <Database className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {table.source}.{table.db}.{table.table}
                      </span>
                    </div>
                  )} */}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== OPERATION TYPE ===== */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operation
          </label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="" disabled selected hidden>
              Select operation
            </option>
            <option value="join">Join</option>
            <option value="groupby">Aggregate</option>
            {/* <option value="union">Union</option> */}
          </select>
          {errors.operation && (
            <span className="text-red-500 text-xs ml-2">
              {errors.operation}
            </span>
          )}
        </div>

        {/* ===== JOIN OPTIONS ===== */}
        {operation === "join" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join Type
              </label>
              <select
                value={joinType}
                onChange={(e) => setJoinType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="inner">Inner Join</option>
                <option value="left">Left Join</option>
                <option value="right">Right Join</option>
                <option value="outer">Full Join</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ON Condition{" "}
              </label>
              <input
                type="text"
                placeholder="Enter join key (e.g., id or email)"
                value={onCondition}
                onChange={(e) => setOnCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.onCondition && (
                <span className="text-red-500 text-xs">
                  {errors.onCondition}
                </span>
              )}
            </div>
          </>
        )}

        {/* ===== COLUMNS ===== */}
        {operation === "groupby" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Columns (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g., id, name, email or * for all"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {/* <p className="text-xs text-gray-500 mt-1">
              Leave empty for SELECT *
            </p> */}
          </div>
        )}

        {/* ===== USER ROLE ===== */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Role
          </label>
          <select
            value={userRole}
            onChange={(e) => {
              const role = e.target.value;
              setUserRole(role);
              // Auto-set maskPii to "Yes" if user role is not admin
              if (role !== "admin") {
                setMaskPii("Yes");
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* ===== MASK PII ===== */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mask PII
          </label>
          <select
            value={maskPii}
            onChange={(e) => setMaskPii(e.target.value as "Yes" | "No")}
            disabled={userRole !== "admin"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {userRole !== "admin" && (
            <span className="text-xs text-amber-600 mt-1">
              Non-admin users must mask PII
            </span>
          )}
        </div>

        {/* ===== PII FIELDS (only show when maskPii is "Yes") ===== */}
        {maskPii === "Yes" && userRole === "admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PII Fields (comma-separated)
            </label>
            <span className="text-xs text-gray-500 my-1">
              Enter field names that contain PII to be masked
            </span>
            <input
              type="text"
              placeholder="e.g., email, phone, ssn"
              value={piiFields}
              onChange={(e) => setPiiFields(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {errors.piiFields && (
              <span className="text-red-500 text-xs">{errors.piiFields}</span>
            )}
          </div>
        )}

        {/* ===== GENERATE BUTTON ===== */}
        <div className="flex gap-2">
          <button
            onClick={handleExecuteTransformation}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? "Executing..." : "Execute Transformation"}
          </button>
        </div>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700 font-medium">
              Please fix the errors above before generating
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

TransformationCard.displayName = "TransformationCard";
