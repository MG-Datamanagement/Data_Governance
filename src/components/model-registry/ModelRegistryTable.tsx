"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ModelListItem } from "@/types";
import { BrainCircuit, Edit2, Trash2 } from "lucide-react";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { Pagination } from "@/components/ui/Pagination";

interface ModelRegistryTableProps {
  models: ModelListItem[];
  onModelClick?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  Approved: { bg: "bg-green-100", text: "text-green-700", icon: "✓" },
  "Pending Review": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "◎" },
  Deprecated: { bg: "bg-red-100", text: "text-red-700", icon: "✕" },
};

const tagColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

export function ModelRegistryTable({ models, onModelClick }: ModelRegistryTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when filter results change
  useEffect(() => { setPage(1); }, [models.length]);

  const paginatedModels = useMemo(() => {
    const safePage = Math.min(page, Math.max(1, Math.ceil(models.length / pageSize)));
    const start = (safePage - 1) * pageSize;
    return models.slice(start, start + pageSize);
  }, [models, page, pageSize]);
  const columns: DataGridColumn<ModelListItem>[] = [
    {
      key: "name",
      header: "Model Name",
      render: (model) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{model.name}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {model.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.name}
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    tagColorMap[tag.color]
                  }`}
                >
                  {tag.name}
                </span>
              ))}
              {model.tags.length > 2 && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  +{model.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    { key: "version", header: "Version", render: (m) => <span className="text-sm font-medium text-gray-900">{m.version}</span> },
    { key: "source", header: "Source", render: (m) => <span className="text-sm text-gray-600">{m.source}</span> },
    { key: "task", header: "Task", render: (m) => <span className="text-sm text-gray-600">{m.task}</span> },
    {
      key: "status",
      header: "Status",
      render: (model) => {
        const statusStyle = statusColors[model.status] || { bg: "bg-gray-100", text: "text-gray-700", icon: "•" };
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg}`}>
            <span className={statusStyle.text}>{statusStyle.icon} {model.status}</span>
          </span>
        );
      },
    },
    { key: "owner", header: "Owner", render: (m) => <span className="text-sm text-gray-600">{m.owner}</span> },
    { key: "lastUpdated", header: "Updated", render: (m) => <span className="text-sm text-gray-600">{m.lastUpdated}</span> },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (model) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onModelClick?.();
            }}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Edit model"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete model"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataGrid
      data={paginatedModels}
      columns={columns}
      keyExtractor={(row) => row.id}
      onRowClick={onModelClick}
      emptyStateMessage="No models registered."
      emptyStateIcon={<BrainCircuit className="w-12 h-12 text-gray-300" strokeWidth={1.5} />}
      pagination={
        models.length > pageSize ? (
          <Pagination
            currentPage={page}
            totalItems={models.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            showCount
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        ) : undefined
      }
    />
  );
}
