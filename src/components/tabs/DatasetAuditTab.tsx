import React, { useState, useMemo } from "react";
import { useGetCatalogAuditTrail } from "@/hooks/useDashboardQueries";
import { formatDistanceToNow, format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";
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
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";

interface DatasetAuditTabProps {
  catalogId: string;
}

export default function DatasetAuditTab({ catalogId }: DatasetAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Reset to page 1 whenever filters change
  React.useEffect(() => { setPage(1); }, [searchQuery, selectedAction, selectedStatus]);

  const offset = (page - 1) * limit;

  const { data: auditData, isLoading } = useGetCatalogAuditTrail(catalogId, limit, offset);

  const { summary, activity_log: rawActivityLog, total_log_count } = auditData || {};

  const parseAction = (actionStr: string) => {
    if (!actionStr) return { badge: "UNKNOWN", text: "Unknown action" };
    const parts = actionStr.split(" - ");
    if (parts.length > 1) {
      return { badge: parts[0].toUpperCase(), text: parts.slice(1).join(" - ") };
    }
    return { badge: "SYSTEM", text: actionStr };
  };

  const actionOptions = useMemo(() => {
    if (!rawActivityLog) return [{ label: "All Actions", value: "all" }];
    const actions = new Set<string>();
    rawActivityLog.forEach((log: any) => {
      const { badge } = parseAction(log.what_action);
      actions.add(badge);
    });
    return [
      { label: "All Actions", value: "all" },
      ...Array.from(actions).sort().map(a => ({ label: a, value: a }))
    ];
  }, [rawActivityLog]);

  const statusOptions = useMemo(() => {
    if (!rawActivityLog) return [{ label: "All Statuses", value: "all" }];
    const statuses = new Set<string>();
    rawActivityLog.forEach((log: any) => {
      if (log.status) statuses.add(log.status);
    });
    return [
      { label: "All Statuses", value: "all" },
      ...Array.from(statuses).sort().map(s => ({ label: s, value: s }))
    ];
  }, [rawActivityLog]);

  const activity_log = useMemo(() => {
    if (!rawActivityLog) return [];
    
    return rawActivityLog.filter((log: any) => {
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = log.who_name?.toLowerCase().includes(q) ||
          log.what_action?.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q) ||
          log.where_location?.toLowerCase().includes(q);
      }

      let matchesAction = true;
      if (selectedAction !== "all") {
        const { badge } = parseAction(log.what_action);
        matchesAction = badge === selectedAction;
      }

      let matchesStatus = true;
      if (selectedStatus !== "all") {
        matchesStatus = (log.status || "Unknown") === selectedStatus;
      }

      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [rawActivityLog, searchQuery, selectedAction, selectedStatus]);

  const totalPages = total_log_count ? Math.ceil(total_log_count / limit) : 1;




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
      <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-4">
        <div className="shrink-0 max-w-[200px]">
          <h2 className="text-md font-bold text-gray-900">Audit Trail</h2>
          <p className="text-xs text-gray-500 mt-1">
            Complete history of all actions performed on this dataset
          </p>
        </div>
        <div className="flex-2 w-full max-w-3xl ml-auto">
          <DataTableToolbar
            search={{
              value: searchQuery,
              onChange: setSearchQuery,
              onClear: () => setSearchQuery(""),
              placeholder: "Search who, what, where, details",
              className: "w-full rounded-lg",
            }}
            filters={[
              {
                key: "action",
                label: "Action",
                options: actionOptions,
                value: selectedAction,
                onChange: setSelectedAction,
                width: "w-40",
              },
              {
                key: "status",
                label: "Status",
                options: statusOptions,
                value: selectedStatus,
                onChange: setSelectedStatus,
                width: "w-40",
              },
            ]}
            actions={
              <Button variant="outline" size="sm" className="h-9" icon={<Download size={16} />}>
                Export
              </Button>
            }
            filterClass="px-2"
          />
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
