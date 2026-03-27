"use client";

import React, { useState, useMemo, useEffect } from "react";

import { useRouter } from "next/navigation";
import { dataSources } from "@/lib/mockDataSources";
import { dashboardApiServices, ApiDataSource, ApiRunHistory, ApiSourceLog } from "@/services/dashboardApiServices";
import { DataSource } from "@/types";

import dynamic from "next/dynamic";
import ConnectorIcon from "@/app/(data-connectors)/components/ConnectorIcon";
// ─── Lazy-loaded heavy modals (Phase 10.2) ────────────────────────────────────
const AddDataSourceModal = dynamic(
  () => import("@/app/(data-connectors)/components/AddDataSourceModal"),
  { ssr: false, loading: () => null },
);
const IngestionSidebar = dynamic(
  () => import("@/app/(data-connectors)/components/IngestionSidebar"),
  { ssr: false, loading: () => null },
);
import LiveIngestionPanel from "@/app/(data-connectors)/components/LiveIngestionPanel";
import ManageSecretsTab from "@/app/(data-connectors)/components/ManageSecretsTab";
import { useAppStore } from "@/store/appStore";
import { useGetDataSources, useGetRunHistory } from "@/hooks/useDashboardQueries";
import { RefreshCcw } from "lucide-react";
import { DataSourceTableRow, StatusBadge } from "@/app/(data-connectors)/components/DataSourceTableRow";



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
    const [historyStatus, setHistoryStatus] = useState("All");
    const [historyOffset, setHistoryOffset] = useState(0);
    const HISTORY_LIMIT = 10;

    const { data: apiData = [], isFetching: isSourcesLoading, error: sourcesFetchError, refetch: refetchSources } = useGetDataSources({
        status: filter !== "All" ? filter : undefined,
        limit: 20
    });

    const { data: runHistoryData, isFetching: isHistoryFetchLoading, refetch: refetchHistory } = useGetRunHistory(HISTORY_LIMIT, historyOffset, historyStatus);

    const runHistory = runHistoryData || null;
    const isHistoryLoading = isHistoryFetchLoading;
    const isLoading = isSourcesLoading;
    const error = sourcesFetchError ? "Failed to fetch data sources" : null;

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

    const sources = useMemo(() => {
        if (!search.trim()) return allSources;
        const q = search.toLowerCase();
        return allSources.filter((s: DataSource) => s.name.toLowerCase().includes(q));
    }, [allSources, search]);

    const [sourceToDelete, setSourceToDelete] = useState<DataSource | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { setAddDsConfig, addToast } = useAppStore();

    const toggleAll = () => {
        if (allChecked) {
            setCheckedIds(new Set());
            setAllChecked(false);
        } else {
            setCheckedIds(new Set(sources.map((s: DataSource) => s.id)));
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
        try {
            const response = await dashboardApiServices.ingestSource(id);
            if (response.job_id) {
                setActiveJobs(prev => ({ ...prev, [id]: response.job_id }));
            }
            // Refresh data to show "running" status if the API updates it
            refetchSources();
        } catch (err) {
            console.error("Failed to trigger ingestion", err);
            alert("Failed to start ingestion");
        }
    };

    const handleDelete = async () => {
        if (!sourceToDelete) return;

        setIsDeleting(true);
        try {
            await dashboardApiServices.deleteSource(sourceToDelete.id);
            addToast("Source Deleted Successfully", "success");
            setSourceToDelete(null);
            refetchSources();
        } catch (err) {
            console.error("Failed to delete source", err);
            addToast("Failed to delete source", "error");
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
                        // Trigger a slight delay refresh or just rely on the sidebar
                        refetchSources();
                    }}
                />
            )}

            {sidebarJobId && (
                <IngestionSidebar
                    isOpen={showSidebar}
                    jobId={sidebarJobId}
                    sourceName={sidebarSourceName}
                    onClose={(viewIngestedDataset: boolean = false) => { 
                        setShowSidebar(false); 
                        setAddDsConfig({});
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {sourceToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Delete Data Source</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 font-medium">
                            Are you sure you want to delete <span className="text-gray-900 font-bold">"{sourceToDelete.name}"</span>? 
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
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
                    <a href="/" className="hover:text-gray-600 transition-colors">Home</a>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-600 font-medium">Data Sources</span>
                </nav>

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Manage Data Sources
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">
                            Configure and schedule syncs to import data from your data sources
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Data Source
                    </button>
                </div>

                {/* Tabs */}
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

                {/* Toolbar */}
                {activeTab !== "Secrets" && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 placeholder-gray-400 w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Filter dropdown for Sources */}
                        {activeTab === "Sources" && (
                            <div className="relative">
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option>All</option>
                                    <option>Success</option>
                                    <option>Failed</option>
                                    <option>Running</option>
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}

                        {/* Filter dropdown for History */}
                        {activeTab === "Run History" && (
                            <div className="relative">
                                <select
                                    value={historyStatus}
                                    onChange={(e) => {
                                        setHistoryStatus(e.target.value);
                                        setHistoryOffset(0); // reset page on filter change
                                    }}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Success">Success</option>
                                    <option value="Failed">Failed</option>
                                    <option value="Running">Running</option>
                                </select>
                                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Refresh */}
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

                {/* Content Layer */}
                {activeTab === "Secrets" ? (
                    <ManageSecretsTab />
                ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pl-4 pr-2 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "Name" : "Source"}
                                </th>
                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "Schedule" : "Started"}
                                </th>
                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "Owner" : "Owner"}
                                </th>
                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "Last Run" : "Duration"}
                                </th>
                                <th className="py-3 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "Status" : "Status"}
                                </th>
                                <th className="py-3 pr-4 w-20 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {activeTab === "Sources" ? "" : "Details"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === "Sources" ? (
                                isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-100 animate-pulse">
                                            <td className="p-4" colSpan={7}>
                                                <div className="h-5 bg-gray-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : sources.length > 0 ? (
                                    sources.map((source) => (
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
                                            {error || "No data sources found"}
                                        </td>
                                    </tr>
                                )
                            ) : activeTab === "Run History" ? (
                                isHistoryLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-gray-100 animate-pulse">
                                            <td className="p-4" colSpan={7}>
                                                <div className="h-5 bg-gray-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : runHistory?.results && runHistory.results.length > 0 ? (
                                    runHistory.results.map((run) => (
                                        <tr key={run.job_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="pl-4 pr-2 py-3 w-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-800">{run.source_name}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{run.job_id.substring(0, 8)}...</span>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-sm text-gray-500">
                                                {new Date(run.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm text-gray-600">{run.owner_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 pr-4 text-sm text-gray-500">
                                                {run.duration_seconds ? `${run.duration_seconds}s` : '--'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <StatusBadge status={run.status} />
                                            </td>
                                            <td className="py-3 pr-4 text-xs text-gray-400">
                                                {run.records_ingested} records
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                                            No run history found
                                        </td>
                                    </tr>
                                )
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                                        Coming Soon...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* Pagination for History */}
                {activeTab === "Run History" && runHistory && runHistory.total > HISTORY_LIMIT && (
                    <div className="mt-4 flex items-center justify-between px-2">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{historyOffset + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(historyOffset + HISTORY_LIMIT, runHistory.total)}</span> of <span className="font-semibold text-gray-900">{runHistory.total}</span> runs
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setHistoryOffset(prev => Math.max(0, prev - HISTORY_LIMIT))}
                                disabled={historyOffset === 0}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setHistoryOffset(prev => prev + HISTORY_LIMIT)}
                                disabled={historyOffset + HISTORY_LIMIT >= runHistory.total}
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageDataSourcesPage;
