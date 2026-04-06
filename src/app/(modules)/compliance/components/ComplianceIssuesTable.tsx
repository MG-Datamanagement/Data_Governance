import { ApiComplianceIssue } from "@/types";
import { getSeverityColor } from "@/lib/utils";
import { AlertCircle, ChevronDown, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { InlineState } from "@/components/ui/InlineState";
import { Button } from "@/components/ui/Button";
import { DataTableToolbar } from "@/components/ui/DataTableToolbar";
import { Badge } from "@/components/ui/Badge";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";

interface ComplianceIssuesTableProps {
  issues: ApiComplianceIssue[];
}

export function ComplianceIssuesTable({ issues }: ComplianceIssuesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFramework, setSelectedFramework] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");

  const frameworkOptions = useMemo(() => {
    const frameworks = Array.from(new Set(issues.map(i => i.framework))).filter(Boolean);
    return [
      { label: "All Frameworks", value: "all" },
      ...frameworks.map(f => ({ label: f, value: f }))
    ];
  }, [issues]);

  const severityOptions = [
    { label: "All Severities", value: "all" },
    { label: "High", value: "HIGH" },
    { label: "Medium", value: "MEDIUM" },
    { label: "Low", value: "LOW" },
  ];

  const filteredIssues = useMemo(() => issues.filter(
    (issue) => {
      const matchesSearch = issue.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            issue.dataset.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFramework = selectedFramework === "all" || issue.framework === selectedFramework;
      const matchesSeverity = selectedSeverity === "all" || issue.severity === selectedSeverity;
      return matchesSearch && matchesFramework && matchesSeverity;
    }
  ), [issues, searchTerm, selectedFramework, selectedSeverity]);

  const paginatedIssues = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredIssues.slice(start, start + pageSize);
  }, [filteredIssues, page, pageSize]);

  const columns: DataGridColumn<ApiComplianceIssue>[] = [
    {
      key: "issue",
      header: "Issue",
      wrapText: true,
      render: (issue) => <div className="text-xs font-medium text-gray-800">{issue.issue}</div>
    },
    {
      key: "framework",
      header: "Framework",
      render: (issue) => <Badge variant="framework" size="xs">{issue.framework}</Badge>
    },
    {
      key: "severity",
      header: "Severity",
      render: (issue) => (
        <Badge
          size="xs"
          variant={
            issue.severity === "HIGH" ? "error" :
              issue.severity === "MEDIUM" ? "warning" : "info"
          }
        >
          {issue.severity}
        </Badge>
      )
    },
    {
      key: "dataset",
      header: "Dataset",
      wrapText: true,
      render: (issue) => (
        <div className="text-xs text-gray-500 font-medium font-mono">
          {issue.dataset}
        </div>
      )
    },
    {
      key: "assignee",
      header: "Assignee",
      render: (issue) => <div className="text-xs text-gray-800">{issue.assignee}</div>
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (issue) => <div className="text-xs text-gray-500 font-medium">{issue.due_date}</div>
    }
  ];

  return (
    <div className="card p-6 border border-gray-200 rounded-xl bg-white shadow-sm space-y-6">
      {/* Header & Search/Filter Row */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              Open Compliance Issues
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {filteredIssues.length} items requiring attention
            </p>
          </div>
        </div>

        <DataTableToolbar
          search={{
            value: searchTerm,
            onChange: (val) => { setSearchTerm(val); setPage(1); },
            onClear: () => { setSearchTerm(""); setPage(1); },
            placeholder: "Search issues or datasets",
          }}
          filters={[
            {
              key: "framework",
              label: "Framework",
              options: frameworkOptions,
              value: selectedFramework,
              onChange: (val) => { setSelectedFramework(val); setPage(1); },
              width: "w-36",
            },
            {
              key: "severity",
              label: "Severity",
              options: severityOptions,
              value: selectedSeverity,
              onChange: (val) => { setSelectedSeverity(val); setPage(1); },
              width: "w-36",
            },
          ]}
        />
      </div>

      <div className="hidden md:block">
        <DataGrid
          data={paginatedIssues}
          columns={columns}
          keyExtractor={(issue: ApiComplianceIssue) => `${issue.framework}-${issue.issue}-${issue.dataset}`}
          emptyStateMessage={searchTerm ? "No issues match your search." : "No open compliance issues."}
          pagination={
            filteredIssues.length > pageSize ? (
              <Pagination
                currentPage={page}
                totalItems={filteredIssues.length}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                showCount
                onPageChange={(p) => { setPage(p); }}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            ) : undefined
          }
        />
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden divide-y divide-gray-200 max-h-[420px] overflow-y-auto">
        {filteredIssues.map((issue, idx) => (
          <div key={`${issue.framework}-${idx}`} className="p-4 hover:bg-gray-50">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {issue.issue}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {issue.framework}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}
                  >
                    {issue.severity}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-mono mb-1">{issue.dataset}</div>
                <div>
                  {issue.assignee} • {issue.due_date}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
