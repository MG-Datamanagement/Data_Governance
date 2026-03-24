"use client";

import React from "react";
import { Trash2, Eye } from "lucide-react";
import { ApiQuery } from "@/types/dashboardTypes";
import QuerySqlPreview from "./QuerySqlPreview";

interface QueryGridViewProps {
  queries: ApiQuery[];
  onDelete: (queryId: string) => void;
  datasetName: string;
}

const QueryGridView: React.FC<QueryGridViewProps> = ({
  queries,
  onDelete,
  datasetName,
}) => {
  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">No highlighted queries found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {queries.map((query) => (
        <div 
          key={query.id} 
          className="bg-white border border-gray-100 rounded-lg p-4 transition-all flex flex-col justify-start group space-y-3"
        >
          {/* Card Header: Title & Actions */}
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-medium text-gray-900 transition-colors">
              {query.title}
            </h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-4px] group-hover:translate-y-0">
              <button
                className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                title="Preview Query"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onDelete(query.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Delete Query"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-2">
            {query.description}
          </p>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase border border-gray-200">
              {query.owner_name ? query.owner_name.substring(0, 2) : "U"}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span>{query.owner_name}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>{new Date(query.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Embedded SQL Preview */}
          <div className="mt-auto">
            <QuerySqlPreview 
               sql={query.query_text} 
               tags={[datasetName]}
               maxHeight="200px" 
               className="border-none"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueryGridView;
