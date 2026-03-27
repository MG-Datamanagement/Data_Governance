import React, { useState, useMemo } from "react";
import { useGetCatalogAuditTrail } from "@/hooks/useDashboardQueries";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Search,
  Filter,
  Download,
  Activity,
  Database,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  DatabaseZap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface DatasetAuditTabProps {
  catalogId: string;
}

export default function DatasetAuditTab({ catalogId }: DatasetAuditTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const offset = (page - 1) * limit;

  const { data: auditData, isLoading } = useGetCatalogAuditTrail(catalogId, limit, offset);

  const { summary, activity_log, total_log_count } = auditData || {};

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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-t-indigo-500 border-indigo-100 animate-spin"></div>
      </div>
    );
  }

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
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
            Export
          </button>
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">Activity Log</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {total_log_count} events
            </span>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Showing all event types
          </button>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">When</th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Who</th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">What</th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Where</th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activity_log?.map((log) => {
                const { name, role } = parseWho(log.who_name);
                const { badge, text } = parseAction(log.what_action);
                const { primary: locPrimary, secondary: locSecondary } = parseLocation(log.where_location);
                
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">
                          {formatDistanceToNow(new Date(log.when_time), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {format(new Date(log.when_time), "MMM d, yyyy HH:mm:ss")}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
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
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border", getBadgeColor(badge))}>
                          {badge}
                        </span>
                        <p className="text-xs text-gray-700 line-clamp-2 max-w-[180px]">{text}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{locPrimary}</span>
                        {locSecondary && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400">{locSecondary}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <p className="text-xs text-gray-500 italic max-w-[200px] line-clamp-2">
                        {log.details}
                      </p>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {getStatusDisplay(log.status)}
                    </td>
                  </tr>
                );
              })}
              {(!activity_log || activity_log.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    No activity events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-500 uppercase tracking-widest">
              Showing {offset + 1}-{Math.min(offset + limit, total_log_count || 0)} of {total_log_count || 0} events
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Rows per page:</span>
              <select 
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="border border-gray-200 rounded text-gray-600 bg-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <span className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-600 font-bold">
                {page}
              </span>
              <span className="text-gray-400 mx-1">of {totalPages}</span>
            </div>
            <button 
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
