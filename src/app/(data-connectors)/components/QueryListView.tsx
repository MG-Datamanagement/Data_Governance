"use client";

import React from "react";
import { Trash2, Eye, Code, Terminal } from "lucide-react";
import { ApiQuery } from "@/types/dashboardTypes";
import QuerySqlPreview from "./QuerySqlPreview";

interface QueryListViewProps {
  queries: ApiQuery[];
  onDelete: (queryId: string) => void;
  datasetName: string;
}

const QueryListView: React.FC<QueryListViewProps> = ({
  queries,
  onDelete,
  datasetName,
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

  return (
    <div className="overflow-auto bg-white border border-gray-100 rounded-md">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50/50 border-b border-gray-100">
          <tr>
            <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Query Text</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created By</th>
            <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {queries.map((query) => (
            <tr key={query.id} className="hover:bg-gray-50 transition-all group">
              {/* Title */}
              <td className="px-3 py-2 align-top">
                <span className="text-sm font-medium text-gray-900 transition-colors block">
                  {query.title}
                </span>
              </td>

              {/* Description */}
              <td className="px-3 py-2 align-top">
                <p className="text-sm text-gray-500 max-w-[250px]">
                  {query.description}
                </p>
              </td>

              {/* Embedded SQL Preview */}
              <td className="px-3 py-2 min-w-[400px] max-w-[400px] min-h-[150px] max-h-[150px]">
                <QuerySqlPreview 
                  sql={query.query_text} 
                  tags={[datasetName]}
                  maxHeight="150px" 
                  showLineNumbers={true}
                  className="border border-gray-100"
                />
              </td>

              {/* Created By */}
              <td className="px-3 py-2 align-top whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500 border border-indigo-100">
                    {query.owner_name ? query.owner_name.substring(0, 2).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">{query.owner_name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(query.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </td>

              {/* Actions */}
              <td className="px-3 py-2 align-top text-right">
                 <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QueryListView;
