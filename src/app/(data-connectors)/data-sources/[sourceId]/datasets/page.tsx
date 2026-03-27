"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClassificationResponse,
  SourceCatalogResponse,
} from "@/services/dashboardApiServices";
import { Dataset, ApiTag } from "@/types";
import { downloadFileFromResponse, formatDateTime } from "@/lib/utils";
import { Check, CheckCircle2, Clock11, Loader2, XIcon, ArrowLeft, ChevronRight, RefreshCw, Download, Search, Filter, Table2, LayoutGrid, Sparkles } from "lucide-react";
import { ClassifyScanPhase } from "@/types/datasourcesTypes";
import { CONSTANTS } from "@/lib/constants";
import { useGetSourceStats } from "@/hooks/useDashboardQueries";
import { logger } from "@/lib/logger";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Select } from "@/components/ui/Select";

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Dataset["status"] }> = ({ status }) => {
  const variantMap: Record<string, "success" | "warning" | "error" | "neutral"> = {
    healthy: "success",
    warning: "warning",
    error: "error",
  };
  const variant = variantMap[status] || "neutral";
  return (
    <Badge variant={variant} size="md">
      {status}
    </Badge>
  );
};

// ─── Dataset Type Icon ────────────────────────────────────────────────────────
// const TypeIcon: React.FC<{ type: Dataset["type"] }> = ({ type }) => {
//   if (type === "View" || type === "Materialized View") {
//     return (
//       <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
//         <svg
//           className="w-4 h-4 text-purple-500"
//           fill="none"
//           viewBox="0 0 24 24"
//           stroke="currentColor"
//           strokeWidth={1.5}
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
//           />
//         </svg>
//       </div>
//     );
//   }
//   return (
//     <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
//       <svg
//         className="w-4 h-4 text-blue-500"
//         fill="none"
//         viewBox="0 0 24 24"
//         stroke="currentColor"
//         strokeWidth={1.5}
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125"
//         />
//       </svg>
//     </div>
//   );
// };

const TypeIcon: React.FC<{
  type: Dataset["type"];
  piiResult?: "scanning" | "pii" | "clean";
}> = ({ type, piiResult }) => {
  const bgColor =
    piiResult === "pii"
      ? "bg-yellow-100"
      : piiResult === "clean"
        ? "bg-green-100"
        : piiResult === "scanning"
          ? "bg-indigo-50"
          : "bg-blue-100";

  const iconColor =
    piiResult === "pii"
      ? "text-yellow-500"
      : piiResult === "clean"
        ? "text-green-500"
        : piiResult === "scanning"
          ? "text-indigo-300"
          : "bg-blue-100";

  if (type === "view" || type === "Materialized View") {
    return (
      <div
        className={`w-7 h-7 rounded-md ${bgColor} flex items-center justify-center flex-shrink-0`}
      >
        <LayoutGrid className={`w-4 h-4 ${iconColor}`} />
      </div>
    );
  }

  return (
    <div
      className={`w-7 h-7 rounded-md ${bgColor} flex items-center justify-center flex-shrink-0`}
    >
      <Table2 className={`w-4 h-4 ${iconColor}`} />
    </div>
  );
};

interface DatasetListPageProps {
  params: { sourceId: string };
}

export type ScanState = "idle" | "queued" | "scanning" | "completed" | "error";

export interface DatasetScanState {
  datasetId: string;
  scanState: ScanState;
  progress?: number;
  tag?: string;
  confidence?: number;
}

const DatasetListPage: React.FC<DatasetListPageProps> = ({ params: { sourceId } }) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [piiFilter, setPIIFilter] = useState(false);

  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [sourceName, setSourceName] = useState<string>(sourceId);
  const [isExportListLoading, setIsExportListLoading] = useState(false);
  const [isPiiScanLoading, setIsPiiScanLoading] = useState(false);
  const [piiScanPhase, setPiiScanPhase] = useState<ClassifyScanPhase>("never");
  const [scannedDatasets, setScannedDatasets] = useState<
    Record<string, "scanning" | "pii" | "clean">
  >({});
  const [scanCount, setScanCount] = useState(0);

  const { data: stats, isLoading: isStatsLoading } = useGetSourceStats(sourceId);

  const isLoading = isStatsLoading;

  React.useEffect(() => {
      if (stats?.source_name) setSourceName(stats.source_name);
  }, [stats?.source_name]);

  React.useEffect(() => {
      if (!stats?.catalogs) {
          setAllDatasets([]);
          return;
      }
      const mapped = stats.catalogs.map((cat: any) => {
          const filteredTags =
            cat.tags?.filter((tag: ApiTag) =>
              ["pii", "phi", "financial","sensitive"].includes((tag.name || "").toLowerCase())
            ) || [];

          return {
            id: cat.catalog_id,
            name: cat.table_name || cat.full_name,
            hasPII: filteredTags.length > 0,
            type: cat.type || "table",
            rows: cat.row_count ? cat.row_count.toString() : null,
            columns: cat.column_count || 0,
            size: null,
            lastSync: formatDateTime(cat.last_sync),
            status: cat.status || "healthy",
            tags: filteredTags
          };
      });
      setAllDatasets(mapped);
  }, [stats]);

  const exportList = async () => {
    setIsExportListLoading(true);
    try {
      const { dashboardApiServices } = await import("@/services/dashboardApiServices");

      const response: any = await dashboardApiServices.downloadSourceStats(
        sourceId,
        // typeFilter?.toLowerCase(),
        // statusFilter?.toLowerCase()
      );
      await downloadFileFromResponse(response);
    } catch (err) {
      logger.error("Error exporting catalogs", { error: err });
    } finally {
      setIsExportListLoading(false);
    }
  };

  const handleInitPiiClassification = async () => {
    setIsPiiScanLoading(true);
    setPiiScanPhase("scanning");
    setScanCount(0);

    // Mark all datasets as scanning
    const initialScanMap: Record<string, "scanning" | "pii" | "clean"> = {};
    allDatasets.forEach((d) => {
      initialScanMap[d.id] = "scanning";
    });
    setScannedDatasets(initialScanMap);

    try {
      const { dashboardApiServices } = await import("@/services/dashboardApiServices");

      const payload = {
        source_id: sourceId,
        Require_human_approval: CONSTANTS.RequireHumanApproval,
        assigned_by: CONSTANTS.assignedBy,
        min_confidence: CONSTANTS.minConfidence,
      };


      const response: ClassificationResponse =
        await dashboardApiServices.initPiiClassification(payload);


      const classificationMap: Record<string, "pii" | "clean"> = {};
      (response?.results || []).forEach((r) => {
        const tag = (r.suggested_tag || "").toLowerCase();

        classificationMap[r.catalog_id] = ["pii", "phi", "financial","sensitive"].includes(tag)
          ? "pii"
          : "clean";
      });

      // Preserve staggered animation but use real results
      const results = allDatasets.map((d) => ({
        id: d.id,
        result: classificationMap[d.id] || "clean",
      }));

      for (let i = 0; i < results.length; i++) {
        await new Promise((res) => setTimeout(res, 600));

        setScannedDatasets((prev) => ({
          ...prev,
          [results[i].id]: results[i].result,
        }));

        setScanCount(i + 1);
      }

      // Update dataset PII flag
      setAllDatasets((prev: Dataset[]) =>
        prev.map((d: Dataset) => {
          const result = classificationMap[d.id];
          return result ? { ...d, hasPII: ["pii", "phi","financial","sensitive"].includes(result.toLowerCase()) } : d;
        }),
      );

      setPiiScanPhase("complete");
    } catch (err) {
      logger.error("Error during PII classification", { error: err });
      setPiiScanPhase("never");
      setScannedDatasets({});
    } finally {
      setIsPiiScanLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = allDatasets;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    if (typeFilter !== "All") {
      list = list.filter((d) => d.type === typeFilter);
    }
    if (statusFilter !== "All") {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (piiFilter) {
      list = list.filter((d) => d.hasPII);
    }
    return list;
  }, [search, typeFilter, statusFilter, piiFilter, allDatasets]);

  const goToDetail = (datasetId: string) => {
    router.push(`/data-sources/${sourceId}/datasets/${datasetId}`);
  };

  const columns: DataGridColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      render: (dataset: any) => (
        <div className="flex items-start gap-2.5">
          <TypeIcon
            type={dataset.type}
            piiResult={scannedDatasets[dataset.id]}
          />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {dataset.name}
            </p>
            {scannedDatasets[dataset.id] === "scanning" && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-indigo-500">
                <Loader2 size={10} className="animate-spin" />
                Scanning for PII...
              </span>
            )}
            {(scannedDatasets[dataset.id] === "pii" ||
              (piiScanPhase !== "scanning" &&
                dataset.hasPII &&
                !scannedDatasets[dataset.id])) && (
              <Badge variant="warning" size="sm" className="mt-0.5">
                PII Detected
              </Badge>
            )}
            {scannedDatasets[dataset.id] === "clean" && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-green-600">
                <Check size={10} />
                No PII found
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      render: (dataset: any) => <span className="text-sm text-gray-500">{dataset.type}</span>
    },
    {
      key: "columns",
      header: "Columns",
      render: (dataset: any) => <span className="text-sm text-gray-600">{dataset.columns}</span>
    },
    {
      key: "lastSync",
      header: "Last Sync",
      render: (dataset: any) => <span className="text-sm text-gray-500">{dataset.lastSync}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (dataset: any) => <StatusBadge status={dataset.status} />
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (dataset: any) => (
        <Button
          variant="ghost"
          onClick={() => goToDetail(dataset.id)}
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs px-2"
          icon={<ChevronRight className="w-4 h-4 ml-1" />}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-gray-600 transition-colors">
            Home
          </a>
          <ChevronRight className="w-4 h-4" />
          <a
            href="/data-sources"
            className="hover:text-gray-600 transition-colors"
          >
            Data Sources
          </a>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-600 font-medium">{sourceName}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {sourceName} Datasets
              </h1>
              <p className="text-gray-400 mt-0.5 text-sm">
                Browse and manage all datasets ingested from this source
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              onClick={exportList}
              isLoading={isExportListLoading}
              icon={
                !isExportListLoading ? (
                  <Download className="w-4 h-4" />
                ) : undefined
              }
            >
              Export List
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-start justify-between mb-4 gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-start gap-2">
            {/* Type filter */}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-32 bg-white"
              options={[
                { value: "All", label: "All Types" },
                { value: "Table", label: "Table" },
                { value: "View", label: "View" }
              ]}
            />

            {/* Status filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 bg-white"
              options={[
                { value: "All", label: "All Statuses" },
                { value: "Healthy", label: "Healthy" },
                { value: "Warning", label: "Warning" },
                { value: "Risk", label: "Risk" }
              ]}
            />

            {/* PII filter */}
            {/* <button
              onClick={() => setPIIFilter((v) => !v)}
              className={`flex items-center gap-1.5 pl-8 pr-3 py-2 border rounded-lg text-sm transition-colors relative ${
                piiFilter
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                />
              </svg>
              PII
            </button> */}

            {/* Initiate PII classification */}
            <div className="flex flex-col items-end gap-0.5">
              <>
                {piiScanPhase === "never" && (
                  <Button
                    onClick={handleInitPiiClassification}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Initiate PII Classification
                  </Button>
                )}

                {piiScanPhase === "re-scan" && (
                  <Button
                    variant="outline"
                    onClick={handleInitPiiClassification}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Reclassify PII
                  </Button>
                )}
              </>

              {piiScanPhase === "scanning" && (
                <Button variant="outline" disabled className="border-indigo-300 text-indigo-600">
                  <Loader2 size={16} className="animate-spin text-indigo-500 mr-2" />
                  Scanning {scanCount}/{allDatasets.length} datasets...
                </Button>
              )}

              {piiScanPhase === "complete" && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-2 text-sm text-green-700 border border-green-300 bg-green-50 rounded-lg font-medium whitespace-nowrap">
                    <CheckCircle2 size={16} className="text-green-600" />
                    PII scan complete
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPiiScanPhase("re-scan");
                      setScannedDatasets({});
                      setScanCount(0);
                      setAllDatasets((prev: Dataset[]) =>
                        prev.map((d: Dataset) => ({ ...d, hasPII: false })),
                      );
                    }}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    Re-run
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table & Footer Wrapper */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <DataGrid
            data={filtered}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(dataset: any) => dataset.id}
            emptyStateMessage="No datasets found"
            className="border-none shadow-none rounded-none"
          />

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
            <span className="text-xs text-gray-400">
              Showing {filtered.length} dataset
              {filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                disabled
              >
                Previous
              </button>
              <button
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                disabled
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DatasetListPage;
