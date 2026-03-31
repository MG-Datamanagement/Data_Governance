"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { RefreshCcw, AlertTriangle, Plus } from "lucide-react";

import { dataSources } from "@/lib/mockDataSources";
import { dashboardApiServices } from "@/services/dashboardApi.service";
import { DataSource } from "@/types";

const AddDataSourceModal = dynamic(
    () => import("@/components/modals/AddDataSourceModal"),
    { ssr: false, loading: () => null },
);
const IngestionSidebar = dynamic(
    () => import("@/components/ingestion/IngestionSidebar"),
    { ssr: false, loading: () => null },
);
import ManageSecretsTab from "@/components/tabs/ManageSecretsTab";
import { useAppStore } from "@/store/appStore";
import { useGetDataSources, useGetRunHistory } from "@/hooks/useDashboardQueries";
import { DataSourceTableRow, StatusBadge } from "@/components/data-sources/DataSourceTableRow";
import { TableSkeleton } from "@/components/ui/Skeletons";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SearchInput } from "@/components/ui/SearchInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { logger } from "@/lib/logger";

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
    "Sources",
    "Run History",
    "Secrets"
] as const;
type Tab = (typeof TABS)[number];

const ManageDataSourcesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>("Sources");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [allChecked, setAllChecked] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [sidebarJobId, setSidebarJobId] = useState<string | null>(null);
    const [sidebarSourceName, setSidebarSourceName] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeJobs, setActiveJobs] = useState<Record<string, string>>({});
    const [historyStatus] = useState("All");
    const [historyOffset, setHistoryOffset] = useState(0);
    const [historyLimit, setHistoryLimit] = useState(10);
    const [sourcesOffset, setSourcesOffset] = useState(0);
    const [sourcesLimit, setSourcesLimit] = useState(100);

    const { data: apiDataResponse, isFetching: isSourcesLoading, error: sourcesFetchError, refetch: refetchSources } = useGetDataSources({
        status: filter !== "All" ? filter : undefined,
    });

    const apiData = useMemo(() => {
        if (!apiDataResponse) return [];
        if (Array.isArray(apiDataResponse)) return apiDataResponse;
        return (apiDataResponse as any).results || [];
    }, [apiDataResponse]);

    const sourcesTotal = useMemo(() => {
        if (!apiDataResponse) return 0;
        if (Array.isArray(apiDataResponse)) return apiDataResponse.length;
        return (apiDataResponse as any).total || 0;
    }, [apiDataResponse]);

    const { data: runHistoryData, isFetching: isHistoryFetchLoading, refetch: refetchHistory } = useGetRunHistory(historyLimit, historyOffset, historyStatus);

    const isHistoryLoading = isHistoryFetchLoading;
    const isLoading = isSourcesLoading;

    const allSources = useMemo(() => {
        return apiData.map((apiDs: any) => {
            const sourceId = apiDs.source_id || apiDs.id || "";
            const ownerName = apiDs.owner_name || apiDs.owner_id || "Unknown";
            const original = dataSources.find(ds => ds.id === sourceId);

            let lastRun = "Never";
            if (apiDs.last_ingested_at) {
                const date = new Date(apiDs.last_ingested_at);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays === 0) lastRun = "Today";
                else if (diffDays === 1) lastRun = "Yesterday";
                else lastRun = `${diffDays} days ago`;
            }

            return {
                id: sourceId,
                name: apiDs.name,
                icon: original?.icon || (apiDs.name.toLowerCase().includes('mongo') ? 'mongodb' : 'database'),
                iconBg: original?.iconBg || 'bg-gray-100',
                schedule: apiDs.schedule,
                owner: ownerName,
                ownerIcon: original?.ownerIcon || ownerName.substring(0, 2).toUpperCase(),
                lastRun: lastRun,
                status: apiDs.status,
                stats: original?.stats || { totalDatasets: 0, totalColumns: '0', totalRows: '0', piiDetected: 0 },
                ingestionLogs: original?.ingestionLogs || [],
                totalDatasets: original?.totalDatasets || 0
            };
        });
    }, [apiData]);

    const runHistoryColumns: DataGridColumn<any>[] = [
        {
            key: "marker",
            header: "",
            width: "3rem",
            render: () => <div className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-2" />
        },
        {
            key: "source",
            header: "Source",
            render: (run: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{run.source_name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{run.job_id.substring(0, 8)}...</span>
                </div>
            )
        },
        {
            key: "started",
            header: "Started",
            render: (run: any) => (
                <span className="text-sm text-gray-500">
                    {new Date(run.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
            )
        },
        {
            key: "owner",
            header: "Owner",
            render: (run: any) => (
                <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-600">{run.owner_name}</span>
                </div>
            )
        },
        {
            key: "duration",
            header: "Duration",
            render: (run: any) => (
                <span className="text-sm text-gray-500">
                    {run.duration_seconds ? `${run.duration_seconds}s` : '--'}
                </span>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (run: any) => <StatusBadge status={run.status} />
        },
        {
            key: "details",
            header: "Details",
            render: (run: any) => (
                <span className="text-xs text-gray-400">
                    {run.records_ingested} records
                </span>
            )
        }
    ];

    const sources = useMemo(() => {
        let filtered = allSources;
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = allSources.filter((s: any) => s.name.toLowerCase().includes(q));
        }
        return filtered.slice(sourcesOffset, sourcesOffset + sourcesLimit);
    }, [allSources, search, sourcesOffset, sourcesLimit]);

    const [sourceToDelete, setSourceToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { setAddDsConfig, addToast, updateToast } = useAppStore();

    const toggleAll = () => {
        if (allChecked) {
            setCheckedIds(new Set());
            setAllChecked(false);
        } else {
            setCheckedIds(new Set(sources.map((s: any) => s.id)));
            setAllChecked(true);
        }
    };

    const toggleOne = (id: string) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleIngest = async (id: string) => {
        const sourceName = sources.find((s: any) => s.id === id)?.name || "source";
        const toastId = addToast(`Starting ingestion for ${sourceName}...`, "loading");
        try {
            const response = await dashboardApiServices.ingestSource(id);
            if (response.job_id) {
                setActiveJobs(prev => ({ ...prev, [id]: response.job_id }));
            }
            updateToast(toastId, `Ingestion started for ${sourceName}`, "success");
            refetchSources();
        } catch (err) {
            logger.error("Failed to trigger ingestion", { error: err });
            updateToast(toastId, "Failed to start ingestion", "error");
        }
    };

    const handleDelete = async () => {
        if (!sourceToDelete) return;

        setIsDeleting(true);
        const toastId = addToast(`Deleting source "${sourceToDelete.name}"...`, "loading");
        try {
            await dashboardApiServices.deleteSource(sourceToDelete.id);
            updateToast(toastId, "Source Deleted Successfully", "success");
            setSourceToDelete(null);
            refetchSources();
        } catch (err) {
            logger.error("Failed to delete source", { error: err });
            updateToast(toastId, "Failed to delete source", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {showAddModal && (
                <AddDataSourceModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={(jobId, sourceName) => {
                        setShowAddModal(false);
                        setSidebarJobId(jobId);
                        setSidebarSourceName(sourceName);
                        setShowSidebar(true);
                        refetchSources();
                    }}
                />
            )}

            {sidebarJobId && (
                <IngestionSidebar
                    isOpen={showSidebar}
                    jobId={sidebarJobId}
                    sourceName={sidebarSourceName}
                    onClose={() => {
                        setShowSidebar(false);
                        setAddDsConfig({});
                    }}
                />
            )}

            {sourceToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Data Source</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 font-medium">
                            Are you sure you want to delete <span className="text-gray-900 font-bold">&quot;{sourceToDelete.name}&quot;</span>?
                            This action cannot be undone and will remove all associated metadata.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSourceToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Spinner size={14} className="text-white" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-8 py-8">
                <Breadcrumb items={[
                    { label: 'Home', href: '/' },
                    { label: 'Governance' },
                    { label: 'Data Sources' },
                ]} />

                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Manage Data Sources
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure and schedule syncs to import data from your data sources
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Data Source
                    </button>
                </div>

                <div className="flex items-center gap-0 border-b border-gray-200 mb-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab !== "Secrets" && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {activeTab === "Sources" && (
                                <div className="flex items-center gap-2">
                                    <SearchInput
                                        value={search}
                                        onChange={setSearch}
                                        placeholder="Search..."
                                        wrapperClassName="w-52"
                                    />
                                </div>
                            )}

                            {activeTab === "Run History" && (
                                <div className="text-xs text-gray-500 font-medium">
                                    View past ingestion and reingestion runs across all data sources
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => activeTab === "Sources" ? refetchSources() : refetchHistory()}
                            disabled={isLoading || isHistoryLoading}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                )}

                {activeTab === "Secrets" ? (
                    <ManageSecretsTab />
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        {activeTab === "Sources" && (
                            <>
                                <div className="overflow-auto max-h-[500px]">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-white z-10">
                                            <tr className="border-b border-gray-100 shadow-sm">
                                                <th className="pl-4 pr-1 py-3 w-10 text-left">
                                                    <Checkbox
                                                        checked={allChecked}
                                                        onChange={toggleAll}
                                                    />
                                                </th>
                                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Schedule</th>
                                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Run</th>
                                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                                <th className="py-3 pr-4 w-10 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={7} className="p-0 border-0">
                                                        <TableSkeleton columns={7} rows={5} />
                                                    </td>
                                                </tr>
                                            ) : sources.length > 0 ? (
                                                sources.map((source: any) => (
                                                    <DataSourceTableRow
                                                        key={source.id}
                                                        source={source}
                                                        checked={checkedIds.has(source.id)}
                                                        activeJobId={activeJobs[source.id]}
                                                        onCheck={toggleOne}
                                                        onIngest={handleIngest}
                                                        onDelete={(s) => setSourceToDelete(s)}
                                                        onLiveError={(id) => {
                                                            setActiveJobs(prev => {
                                                                const next = { ...prev };
                                                                delete next[id];
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                                                        {sourcesFetchError ? "Error loading sources" : "No data sources found"}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {sourcesTotal > 0 && (
                                    <div className="border-t border-gray-100">
                                        <Pagination
                                            currentPage={Math.floor(sourcesOffset / sourcesLimit) + 1}
                                            totalItems={sourcesTotal}
                                            pageSize={sourcesLimit}
                                            pageSizeOptions={[10, 20, 50, 100]}
                                            showCount
                                            onPageChange={(page) => setSourcesOffset((page - 1) * sourcesLimit)}
                                            onPageSizeChange={(size) => {
                                                setSourcesLimit(size);
                                                setSourcesOffset(0);
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "Run History" && (
                            <DataGrid
                                data={runHistoryData?.results || []}
                                columns={runHistoryColumns}
                                isLoading={isHistoryFetchLoading}
                                keyExtractor={(run: any) => run.job_id}
                                emptyStateMessage="No run history found"
                                className="w-full border-none shadow-none rounded-none"
                                maxHeight="500px"
                                pagination={
                                    runHistoryData && runHistoryData.total > 0 ? (
                                        <Pagination
                                            currentPage={Math.floor(historyOffset / historyLimit) + 1}
                                            totalItems={runHistoryData.total}
                                            pageSize={historyLimit}
                                            pageSizeOptions={[10, 20, 50, 100]}
                                            showCount
                                            onPageChange={(page) => setHistoryOffset((page - 1) * historyLimit)}
                                            onPageSizeChange={(size) => {
                                                setHistoryLimit(size);
                                                setHistoryOffset(0);
                                            }}
                                        />
                                    ) : undefined
                                }
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageDataSourcesPage;
