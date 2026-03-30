"use client";

import React from "react";
import { Trash2, Eye, Terminal } from "lucide-react";
import { ApiQuery } from "@/types/dashboardTypes";
import QuerySqlPreview from "./QuerySqlPreview";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { cn } from "@/lib/utils";

interface QueryListViewProps {
  queries: ApiQuery[];
  onDelete: (queryId: string) => void;
  datasetName: string;
  className?: string;
}

const QueryListView: React.FC<QueryListViewProps> = ({
  queries,
  onDelete,
  datasetName,
  className,
}) => {
  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Terminal size={32} className="text-gray-300" />
        </div>
        <p className="text-gray-400 font-medium">No highlighted queries found</p>
      </div>
    );
  }

  const columns: DataGridColumn<ApiQuery>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <span className="text-sm font-medium text-gray-900 transition-colors block">
          {row.title}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      wrapText: true,
      render: (row) => (
        <p className="text-sm text-gray-500 max-w-[250px] whitespace-normal">
          {row.description}
        </p>
      ),
    },
    {
      key: "queryText",
      header: "Query Text",
      render: (row) => (
        <div className="min-w-[400px] max-w-[400px]">
          <QuerySqlPreview
            sql={row.query_text}
            tags={[datasetName]}
            maxHeight="150px"
            showLineNumbers={true}
            className="border border-gray-100"
          />
        </div>
      ),
    },
    {
      key: "owner",
      header: "Created By",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500 border border-indigo-100">
            {row.owner_name
              ? row.owner_name.substring(0, 2).toUpperCase()
              : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-700">
              {row.owner_name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date Created",
      render: (row) => (
        <span className="text-sm font-semibold text-gray-700">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
            title="Preview Query"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onDelete(row.id)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            title="Delete Query"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataGrid
      data={queries}
      columns={columns}
      keyExtractor={(row) => row.id}
      className={cn("border-none shadow-none", className)}
    />
  );
};

export default QueryListView;
