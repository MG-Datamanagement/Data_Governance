import React, { useState, useMemo } from "react";
import { useGetCatalogAuditTrail } from "@/hooks/useDashboardQueries";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";

interface DatasetAuditTabProps {
  catalogId: string;
}

export default function DatasetAuditTab({ catalogId }: DatasetAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Reset to page 1 whenever search query changes
  React.useEffect(() => { setPage(1); }, [searchQuery]);

  const offset = (page - 1) * limit;

  const { data: auditData, isLoading } = useGetCatalogAuditTrail(catalogId, limit, offset);

  const { summary, activity_log: rawActivityLog, total_log_count } = auditData || {};

  const activity_log = useMemo(() => {
    if (!rawActivityLog) return [];
    if (!searchQuery.trim()) return rawActivityLog;
    const q = searchQuery.toLowerCase();
    return rawActivityLog.filter(
      (log: any) =>
        log.who_name?.toLowerCase().includes(q) ||
        log.what_action?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        log.where_location?.toLowerCase().includes(q)
    );
  }, [rawActivityLog, searchQuery]);

  const totalPages = total_log_count ? Math.ceil(total_log_count / limit) : 1;

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const name = nameStr.split(" ")[0];
    if (name.length >= 2) return name.slice(0, 2).toUpperCase();
    return name.charAt(0).toUpperCase();
  };

  const parseAction = (actionStr: string) => {
    if (!actionStr) return { badge: "UNKNOWN", text: "Unknown action" };
    const parts = actionStr.split(" - ");
    if (parts.length > 1) {
      return { badge: parts[0].toUpperCase(), text: parts.slice(1).join(" - ") };
    }
    return { badge: "SYSTEM", text: actionStr };
  };

  const parseLocation = (locStr: string) => {
    if (!locStr) return { primary: "System", secondary: "" };
    const parts = locStr.split(" - ");
    if (parts.length > 1) {
      return { primary: parts[1].trim(), secondary: parts[0].trim() };
    }
    return { primary: locStr, secondary: "" };
  };

  const parseWho = (whoStr: string) => {
    if (!whoStr) return { name: "System", role: "Automated" };
    const match = whoStr.match(/(.*?)\s*\((.*?)\)/);
    if (match) {
      return { name: match[1].trim(), role: match[2].trim() };
    }
    return { name: whoStr, role: "User" };
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case "CLASSIFICATION": return "bg-blue-100 text-blue-800 border-blue-200";
      case "POLICY": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SCHEMA": return "bg-slate-100 text-slate-800 border-slate-200";
      case "INGESTION": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ACCESS": return "bg-zinc-800 text-zinc-100 border-zinc-900";
      case "QUALITY": return "bg-gray-100 text-gray-800 border-gray-200";
      case "VIEWED": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplay = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("done") || s.includes("success")) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </span>
      );
    }
    if (s.includes("review")) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" /> Review
        </span>
      );
    }
    if (s.includes("alert") || s.includes("fail")) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" /> Alert
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full">
        {status}
      </span>
    );
  };


  const columns: DataGridColumn<any>[] = [
    {
      key: "when",
      header: "When",
      render: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900">
            {formatDistanceToNow(new Date(log.when_time), { addSuffix: true })}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            {format(new Date(log.when_time), "MMM d, yyyy HH:mm:ss")}
          </span>
        </div>
      ),
    },
    {
      key: "who",
      header: "Who",
      render: (log) => {
        const { name, role } = parseWho(log.who_name);
        return (
          <div className="flex items-center gap-2.5">
            {role.toLowerCase() === "automated" || role.toLowerCase() === "bot" ? (
              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-600">
                {getInitials(name)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900">{name}</span>
              <span className="text-[10px] text-gray-500">{role}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "what",
      header: "What",
      wrapText: true,
      render: (log) => {
        const { badge, text } = parseAction(log.what_action);
        return (
          <div className="flex flex-col items-start gap-1">
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border", getBadgeColor(badge))}>
              {badge}
            </span>
            <p className="text-xs text-gray-700 whitespace-normal">{text}</p>
          </div>
        );
      },
    },
    {
      key: "where",
      header: "Where",
      render: (log) => {
        const { primary: locPrimary, secondary: locSecondary } = parseLocation(log.where_location);
        return (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900">{locPrimary}</span>
            {locSecondary && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-gray-400">{locSecondary}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "details",
      header: "Details",
      wrapText: true,
      render: (log) => (
        <p className="text-xs text-gray-500 italic whitespace-normal">
          {log.details}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => getStatusDisplay(log.status),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-md font-bold text-gray-900">Audit Trail</h2>
          <p className="text-xs text-gray-500 mt-1">
            Complete history of all actions performed on this dataset
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <Button variant="outline" icon={<Filter size={16} />}>
            Filter
          </Button>
          <Button variant="outline" icon={<Download size={16} />}>
            Export
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center min-h-[70px]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Events</h3>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold text-gray-900">{summary?.total_events || 0}</span>
          </div>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center min-h-[70px]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Metadata Updates</h3>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold text-amber-600">{summary?.metadata_updates || 0}</span>
          </div>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center min-h-[70px]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Access Events</h3>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold text-indigo-600">{summary?.access_events || 0}</span>
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center min-h-[70px]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lineage Updates</h3>
          <div className="flex items-baseline">
            <span className="text-xl font-extrabold text-emerald-600">{summary?.lineage_events || 0}</span>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <SectionCard
        title="Activity Log"
        headerIcon={<Activity size={16} />}
        badgeCount={`${total_log_count} events`}
        infotext="Showing all event types"
      >
        <DataGrid
          data={activity_log || []}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(log: any) => log.id}
          emptyStateMessage="No activity events found."
          className="border-none shadow-none rounded-none"
          maxHeight="460px"
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total_log_count || 0}
              pageSize={limit}
              pageSizeOptions={[10, 20, 50, 100]}
              showCount
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
            />
          }
        />
      </SectionCard>
    </div>
  );
}
