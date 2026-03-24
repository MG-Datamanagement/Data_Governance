import React from "react";
import { ApiTag } from "@/types";

interface DatasetDetail {
  name: string;
  type: string;
  sourceName: string;
  lineageWarning?: string;
  ownerInitials: string;
  owner: string;
  tags: ApiTag[];
}

interface DatasetRightSidebarProps {
  detail: DatasetDetail;
}

export function DatasetRightSidebar({ detail }: DatasetRightSidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start">
      {/* Identity */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0 border border-green-100">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
              />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900 leading-tight">
              {detail.name}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {detail.type} | {detail.sourceName}
            </p>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Documentation
          </div>
          <button className="text-gray-400 hover:text-indigo-600 transition-colors">
            <span className="text-lg leading-none">+</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 italic">No documentation yet.</p>
      </div>

      {/* Lineage */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900 mb-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Lineage
        </div>
        {detail.lineageWarning ? (
          <div className="flex items-start gap-1.5 bg-red-50/50 border border-red-100 rounded-lg px-2.5 py-2.5 text-xs text-red-600">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="leading-snug">{detail.lineageWarning}</span>
          </div>
        ) : (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            All upstreams healthy
          </p>
        )}
      </div>

      {/* Owners */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900 mb-3">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Owners
        </div>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
            {detail.ownerInitials}
          </span>
          <span className="text-[13px] text-gray-700">{detail.owner}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-900 mb-3">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Tags
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.tags.map((tag: ApiTag) => (
            <span
              key={tag.id}
              className="inline-block text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
