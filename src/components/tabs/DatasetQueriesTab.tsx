"use client";

import React, { useState, useMemo } from "react";
import { LayoutGrid, List, Plus, X, Info } from "lucide-react";
import { datasourceApiServices } from "@/services/datasourceApi.service";
import { ApiQuery, CreateQueryRequest, QueryOwner } from "@/types/dashboardTypes";
import QueryListView from "../queries/QueryListView";
import QueryGridView from "../queries/QueryGridView";
import dynamic from 'next/dynamic';
const NewQueryModal = dynamic(() => import('../modals/NewQueryModal'), { ssr: false });
import QuerySqlPreview from "../queries/QuerySqlPreview";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useGetDatasourceQueries, useGetOwnersList } from "@/hooks/useDashboardQueries";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { InlineState } from "@/components/ui/InlineState";
import { Pagination } from "@/components/ui/Pagination";
import { logger } from "@/lib/logger";

interface DatasetQueriesTabProps {
  catalogId: string;
  datasetName: string;
}

const DatasetQueriesTab: React.FC<DatasetQueriesTabProps> = ({ catalogId, datasetName }) => {
  const { data: queriesData, isLoading: isQueriesLoading, refetch: refetchQueries } = useGetDatasourceQueries(catalogId);
  const { data: ownersData, isLoading: isOwnersLoading } = useGetOwnersList();

  const queries = useMemo(() => queriesData?.user_queries || [], [queriesData]);
  const ownersList = (ownersData as QueryOwner[]) || [];
  const isLoading = isQueriesLoading || isOwnersLoading;

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuery, setPreviewQuery] = useState<ApiQuery | null>(null);
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const paginatedQueries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return queries.slice(start, start + pageSize);
  }, [queries, page, pageSize]);

  const handleCreateQuery = async (data: CreateQueryRequest) => {
    try {
      await datasourceApiServices.createDatasetQuery(catalogId, data);
      refetchQueries();
    } catch (error) {
      logger.error("Failed to create query", { error });
    }
  };

  const handleDeleteQuery = async () => {
    if (!queryToDelete) return;
    setIsDeleting(true);
    try {
      await datasourceApiServices.deleteDatasetQuery(catalogId, queryToDelete);
      refetchQueries();
      setQueryToDelete(null);
    } catch (error) {
      logger.error("Failed to delete query", { error });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SectionCard
      title="Highlighted Queries"
      description={
        <span>
          Saved queries that reference the{" "}
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono text-xs border border-gray-200">
            {datasetName}
          </span>{" "}
          dataset
        </span>
      }
      bodyClassName="bg-gray-50/30"
      headerAction={
        <>
          <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm mr-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "list" ? "bg-gray-100 text-indigo-600 font-bold" : "text-gray-400 hover:text-gray-600"
              }`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid" ? "bg-gray-100 text-indigo-600 font-bold" : "text-gray-400 hover:text-gray-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={16} strokeWidth={3} />}>
            Add Highlighted Query
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="p-5">
          <InlineState type="loading" message="Loading queries..." />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 p-5">
          {viewMode === "list" ? (
            <QueryListView queries={paginatedQueries} onDelete={setQueryToDelete} datasetName={datasetName} />
          ) : (
            <QueryGridView queries={paginatedQueries} onDelete={setQueryToDelete} datasetName={datasetName} />
          )}

          {queries.length > pageSize && (
            <div className="border-t border-gray-100 mt-3">
              <Pagination
                currentPage={page}
                totalItems={queries.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                showCount
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!queryToDelete}
        onClose={() => setQueryToDelete(null)}
        onConfirm={handleDeleteQuery}
        title="Delete Highlighted Query"
        description="Are you sure you want to delete this query? This action cannot be undone and will remove it from the catalog."
        confirmText="Delete Query"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />

      <NewQueryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateQuery}
        ownersList={ownersList}
      />

      {previewQuery && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Info size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{previewQuery?.title}</h2>
                  <p className="text-xs text-gray-400 line-clamp-1">{previewQuery?.description}</p>
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
              <QuerySqlPreview sql={previewQuery?.query_text || ""} maxHeight="500px" className="border-none shadow-inner" />
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 uppercase tracking-widest">
                  {datasetName}
                </span>
                {previewQuery?.is_lineage_query && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-200 uppercase tracking-widest">
                    Lineage
                  </span>
                )}
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
    </SectionCard>
  );
};

export default DatasetQueriesTab;
