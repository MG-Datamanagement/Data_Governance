"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataSource } from "@/types";
import ConnectorIcon from "@/components/connectors/ConnectorIcon";
import { useGetSourceStats, useGetSourceLogs } from "@/hooks/useDashboardQueries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// ─── Status Badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: DataSource["status"] }> = ({ status }) => {
    const variantMap: Record<string, "success" | "error" | "info"> = {
        success: "success",
        failed: "error",
        running: "info",
    };
    const dotMap: Record<string, string> = {
        success: "bg-green-500",
        failed: "bg-red-500",
        running: "bg-blue-500",
    };
    const s = status || "running";
    const mappedVariant = variantMap[s] || "neutral";
    return (
        <Badge variant={mappedVariant as any} size="sm">
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotMap[s] || "bg-gray-400"}`} />
            {s}
        </Badge>
    );
};

// ─── Log status icon ─────────────────────────────────────────────────────────
export const LogIcon: React.FC<{ status: "success" | "error" | "info" | "warning" }> = ({ status }) => {
    if (status === "success")
        return (
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
        );
    if (status === "error")
        return (
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
        );
    if (status === "warning")
        return (
            <svg className="w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
        );
    return (
        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
    );
};

// ─── Expanded Row ─────────────────────────────────────────────────────────────
const ExpandedRow: React.FC<{ source: DataSource; activeJobId?: string; onLiveError?: (id: string) => void }> = ({ source, activeJobId, onLiveError }) => {
    const router = useRouter();
    const { data: apiStats, isLoading: isStatsLoading } = useGetSourceStats(source.id);
    const { data: logsData, isLoading: isLogsLoading } = useGetSourceLogs(source.id, 5);
    
    const stats = useMemo(() => {
        if (!apiStats) return null;
        return {
            totalTables: apiStats.total_tables_ingested,
            totalColumns: apiStats.total_column_count,
            totalRows: apiStats.total_row_count,
        };
    }, [apiStats]);

    const rowLogs = logsData?.logs || [];
    const isLoading = isStatsLoading;

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <tr>
            <td colSpan={7} className="bg-gray-50 px-6 pb-4 pt-0">
                <div className="flex gap-4 pt-3">
                    {/* Left: stats + logs */}
                    <div className="flex-1 min-w-0">
                        {/* Stat cards */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                                { label: "TOTAL TABLES", value: isLoading ? "..." : (stats?.totalTables.toLocaleString() || "0") },
                                { label: "TOTAL COLUMNS", value: isLoading ? "..." : (formatNumber(stats?.totalColumns || 0)) },
                                { label: "TOTAL ROWS", value: isLoading ? "..." : (stats?.totalRows.toLocaleString()+'k' || "0") },

                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-xl border border-gray-200 px-4 py-3"
                                >
                                    <p className="text-[10px] font-semibold text-gray-400 tracking-wide uppercase mb-1">
                                        {stat.label}
                                    </p>
                                    <p
                                        className="text-2xl font-bold text-gray-900"
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Ingestion logs */}
                        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">
                                    Recent Ingestion Logs
                                </h4>
                                <span className="text-xs text-gray-400">Last 24h</span>
                            </div>
                            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                {isLogsLoading ? (
                                    <div className="py-4 text-center text-xs text-gray-400">Loading logs...</div>
                                ) : rowLogs.length > 0 ? (
                                    rowLogs.map((log: any, i: number) => (
                                        <div key={log.id || i} className="flex items-start gap-3">
                                            <span className="text-[10px] text-gray-400 w-24 flex-shrink-0 mt-0.5">
                                                {new Date(log.logged_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="text-xs text-gray-600 flex-1 leading-relaxed">{log.message}</span>
                                            <LogIcon status={log.level} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center text-xs text-gray-400">No logs found for this source</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Explore Datasets */}
                    <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center p-6 text-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-1">
                                Explore Datasets
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                View detailed metadata, schema, and lineage for all{" "}
                                {isLoading ? "..." : (stats?.totalTables.toLocaleString() || "0")} ingested datasets.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push(`/data-sources/${source.id}/datasets`)}
                            className="w-full"
                        >
                            View All Datasets
                        </Button>
                    </div>
                </div>
            </td>
        </tr>
    );
};

// ─── Source Row ───────────────────────────────────────────────────────────────
export const DataSourceTableRow: React.FC<{
    source: DataSource;
    checked: boolean;
    activeJobId?: string;
    onCheck: (id: string) => void;
    onIngest: (id: string) => void;
    onDelete: (source: DataSource) => void;
    onLiveError: (id: string) => void;
}> = ({ source, checked, activeJobId, onCheck, onIngest, onDelete, onLiveError }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${expanded ? "bg-gray-50" : "bg-white"
                    }`}
            >
                {/* Checkbox */}
                <td className="pl-4 pr-2 py-3 w-10">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onCheck(source.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                </td>

                {/* Expand chevron + icon + name */}
                <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-90" : ""
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <span
                            className={`w-6 h-6 rounded flex items-center justify-center ${source.iconBg}`}
                        >
                            <ConnectorIcon icon={source.icon} className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium text-gray-800">{source.name}</span>
                    </div>
                </td>

                {/* Schedule */}
                <td className="py-3 pr-4 text-sm text-gray-500">{source.schedule}</td>

                {/* Owner */}
                <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                            {source.ownerIcon}
                        </span>
                        <span className="text-sm text-gray-600">{source.owner}</span>
                    </div>
                </td>

                {/* Last Run */}
                <td className="py-3 pr-4 text-sm text-gray-500">{source.lastRun}</td>

                {/* Status */}
                <td className="py-3 pr-4">
                    <StatusBadge status={source.status} />
                </td>

                {/* Actions */}
                <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                        {/* Play button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onIngest(source.id)}
                            className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                        </Button>
                        {/* More options */}
                        <Button variant="ghost" size="icon" className="text-gray-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                            </svg>
                        </Button>
                    </div>
                </td>
            </tr>

            {expanded && <ExpandedRow source={source} activeJobId={activeJobId} onLiveError={onLiveError} />}
        </>
    );
};
