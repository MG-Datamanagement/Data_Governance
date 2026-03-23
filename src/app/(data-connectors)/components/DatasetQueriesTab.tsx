"use client";

import React, { useState, useEffect } from "react";
import { LayoutGrid, List, Plus, X, Info, Terminal } from "lucide-react";
import { datasourceApiServices } from "@/services/datasourceApiServices";
import { ApiQuery, CreateQueryRequest } from "@/types/dashboardTypes";
import QueryListView from "./QueryListView";
import QueryGridView from "./QueryGridView";
import NewQueryModal from "./NewQueryModal";
import QuerySqlPreview from "./QuerySqlPreview";

interface DatasetQueriesTabProps {
  catalogId: string;
  datasetName: string;
}

const DatasetQueriesTab: React.FC<DatasetQueriesTabProps> = ({ catalogId, datasetName }) => {
  const [queries, setQueries] = useState<ApiQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuery, setPreviewQuery] = useState<ApiQuery | null>(null);

  // Fetch queries (Mocked for now)
  const fetchQueries = async () => {
    setIsLoading(true);
    try {
      // In a real scenario, we'd use datasourceApiServices.fetchDatasetQueries(catalogId)
      // For now, we'll use mock data as requested
      const mockQueries: ApiQuery[] = [
        {
          id: "q1",
          catalog_id: catalogId,
          title: "Revenue by Customer",
          description: "Aggregates total revenue per customer with LTV scoring",
          sql_text: "SELECT\n  c.customer_id,\n  c.email,\n  c.ltv_score,\n  SUM(t.amount) AS total_revenue,\n  COUNT(t.id) AS transaction_count\nFROM customers c\nJOIN transactions t ON c.id = t.customer_id\nGROUP BY 1, 2, 3\nORDER BY 4 DESC",
          created_by: { id: "u1", name: "Rajkumar S", avatar: "" },
          created_at: "2026-03-16T10:00:00Z",
          tags: ["customers", "transactions"],
        },
        {
          id: "q2",
          catalog_id: catalogId,
          title: "PII Exposure Check",
          description: "Identifies rows where SSN or email might be exposed without masking",
          sql_text: "SELECT\n  customer_id,\n  email,\n  ssn,\n  CASE\n    WHEN ssn NOT LIKE '***%' THEN 'EXPOSED'\n    ELSE 'MASKED'\n  END AS status\nFROM customers\nWHERE ssn IS NOT NULL",
          created_by: { id: "u2", name: "Sarah Chen", avatar: "" },
          created_at: "2026-03-14T14:30:00Z",
          tags: ["customers"],
        }
      ];

      setQueries(mockQueries);
    } catch (error) {
      console.error("Failed to fetch queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [catalogId]);

  const handleCreateQuery = async (data: Omit<CreateQueryRequest, "catalog_id">) => {
    try {
      // Mock create
      const newQuery: ApiQuery = {
        id: `q${Date.now()}`,
        catalog_id: catalogId,
        ...data,
        created_by: { id: "u_curr", name: "Current User", avatar: "", email: "[EMAIL_ADDRESS]" },
        created_at: new Date().toISOString(),
      };
      setQueries(prev => [newQuery, ...prev]);
    } catch (error) {
      console.error("Failed to create query:", error);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm("Are you sure you want to delete this highlighted query?")) return;
    try {
      // Mock delete
      setQueries(prev => prev.filter(q => q.id !== queryId));
    } catch (error) {
      console.error("Failed to delete query:", error);
    }
  };


  return (
    <div>
      {/* Tab Header Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="text-indigo-600 font-bold text-xl leading-none"><Terminal size={20} className="text-indigo-400" /></div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Highlighted Queries</h2>
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] cursor-help border border-gray-200" title="Queries that help users understand or audit this dataset">?</div>
          </div>
          <p className="text-sm text-gray-500 font-medium ml-8">
            Saved queries that reference the <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono text-xs">{datasetName}</span> dataset
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggles */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list"
                  ? "bg-gray-50 text-indigo-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
                }`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all ${viewMode === "grid"
                  ? "bg-gray-50 text-indigo-600 font-bold"
                  : "text-gray-400 hover:text-gray-600"
                }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-base font-semibold transition-all whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} />
            Add Highlighted Query
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Loading queries...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          {viewMode === "list" ? (
            <QueryListView
              queries={queries}
              onDelete={handleDeleteQuery}
              datasetName={datasetName}
            />
          ) : (
            <QueryGridView
              queries={queries}
              onDelete={handleDeleteQuery}
              datasetName={datasetName}
            />
          )}

          {/* Pagination Footer (Mock) */}
          <div className="flex items-center justify-between bg-white px-4 py-2 rounded-md border border-gray-100 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Showing 1-{queries.length} of {queries.length} Queries
            </div>
            <div className="flex items-center gap-2">
              <button disabled className="p-2 rounded-lg border border-gray-100 text-gray-300 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">1</button>
              </div>
              <button disabled className="p-2 rounded-lg border border-gray-100 text-gray-300 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Query */}
      <NewQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateQuery}
      />

      {/* Modal: Preview SQL */}
      {previewQuery && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Info size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{previewQuery.title}</h2>
                  <p className="text-xs text-gray-400 line-clamp-1">{previewQuery.description}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewQuery(null)}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <QuerySqlPreview sql={previewQuery.sql_text} maxHeight="500px" className="border-none shadow-inner" />

              <div className="mt-6 flex flex-wrap gap-2">
                {previewQuery.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 uppercase tracking-widest"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-end">
              <button
                onClick={() => setPreviewQuery(null)}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetQueriesTab;
