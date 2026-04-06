import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Sparkles, Settings2, Filter, Download } from "lucide-react";
import { ApiColumn, ApiTag } from "@/types";
import { useAiReclassification } from "@/hooks/useAiReclassification";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";

interface DatasetColumnsTabProps {
  catalogData: any;
  datasetId: string;
}

const DatasetColumnsTab: React.FC<DatasetColumnsTabProps> = ({
  catalogData,
  datasetId,
}) => {
  const {
    reclassifyAiScanPhase,
    setReclassifyAiScanPhase,
    aiResults,
    handleReclassificationActionWithAI,
  } = useAiReclassification(datasetId);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const allColumns = useMemo(
    () => (catalogData?.columns || []).map((col: ApiColumn, idx: number) => ({ ...col, _index: idx + 1 })),
    [catalogData?.columns]
  );

  const paginatedColumns = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allColumns.slice(start, start + pageSize);
  }, [allColumns, page, pageSize]);

  return (
    <SectionCard
      title="Schema Definition"
      badgeCount={`${catalogData?.columns?.length || 0} Columns`}
      headerAction={
        <>
          {reclassifyAiScanPhase === "never" && (
            <Button
              onClick={handleReclassificationActionWithAI}
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              className="border-indigo-200 text-indigo-600"
            >
              Reclassify with AI
            </Button>
          )}
          {reclassifyAiScanPhase === "scanning" && (
            <Button
              variant="secondary"
              size="sm"
              isLoading
            >
              Reclassifying...
            </Button>
          )}
          {["re-scan", "complete"].includes(reclassifyAiScanPhase) && (
            <Button
              onClick={() => {
                setReclassifyAiScanPhase("re-scan");
                handleReclassificationActionWithAI();
              }}
              variant="secondary"
              size="sm"
              icon={<CheckCircle2 size={16} className="text-green-500" />}
            >
              Reclassified
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 h-8">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
            </div>
            Filter
          </Button>
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 h-8">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
            </div>
            Export
          </Button>
        </>
      }
    >
      <div className="flex flex-col w-full">
        {reclassifyAiScanPhase === "scanning" && (
          <div className={cn("p-4 flex items-center w-full gap-2", "bg-indigo-50")}>
            <div>
              <Loader2 className="text-indigo-400 animate-spin" size={16} />
            </div>
            <div>
              <h3 className="text-sm text-indigo-600">AI Reclassification in progress...</h3>
              <p className="text-xs text-indigo-500">
                Analyzing column patterns, data types, and semantic context
              </p>
            </div>
          </div>
        )}

        {["complete", "re-scan"].includes(reclassifyAiScanPhase) && (
          <div className={cn("p-4 flex items-center w-full gap-2 bg-green-50")}>
            <div>
              <CheckCircle2 size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-700">
                Reclassification complete — confidence scores updated. Review any changes below.
              </p>
            </div>
          </div>
        )}

        <DataGrid
          data={paginatedColumns}
          columns={[
            {
              key: "index",
              header: "#",
              width: "4rem",
              render: (row: any) => <span className="text-xs text-gray-400">{row._index}</span>,
            },
            {
              key: "name",
              header: "Column Name",
              render: (col: any) => (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">{col.name}</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                    {col.is_nullable ? "NULLABLE" : "NOT NULL"}
                  </span>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (col: any) => (
                <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                  {(col.type || col.data_type || "UNKNOWN").toUpperCase()}
                </span>
              ),
            },
            {
              key: "description",
              header: "Description",
              render: (col: any) => (
                <div className="overflow-y-auto min-h-10 max-h-16 text-sm text-gray-500 italic whitespace-normal max-w-sm">
                  {col?.description || "No description yet."}
                </div>
              ),
            },
            {
              key: "classification",
              header: "Classification",
              render: (col: any) => {
                const ai = aiResults[col.name];
                return (
                  <div className="flex flex-col justify-center items-start gap-1">
                    {ai ? (
                      <>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="px-2 py-1.5 bg-indigo-100 text-indigo-700 font-bold text-[9px] rounded-lg uppercase items-center flex gap-1 border border-indigo-200 shadow-sm leading-none h-4">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI
                          </span>
                          <span className="px-3 py-0 bg-purple-50 text-purple-700 font-semibold text-[10px] rounded-md border border-purple-200">
                            {ai.suggested_tag || "General"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-90">
                          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${(ai.confidence_score || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500 font-medium">
                            {((ai.confidence_score || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {col.tags?.length ? col.tags.map(
                          (tag: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] rounded shadow-sm font-semibold"
                            >
                              {tag.name || String(tag)}
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 text-gray-600 text-sm">
                            -
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            },
          ]}
          keyExtractor={(row: any) => row.name}
          emptyStateMessage="No columns found"
          className="border-none shadow-none"
          pagination={
            allColumns.length > pageSize ? (
              <Pagination
                currentPage={page}
                totalItems={allColumns.length}
                pageSize={pageSize}
                pageSizeOptions={[20, 50, 100]}
                showCount
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            ) : undefined
          }
        />
      </div>
    </SectionCard>
  );
};

export default DatasetColumnsTab;
