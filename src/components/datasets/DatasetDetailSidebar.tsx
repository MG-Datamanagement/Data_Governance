"use client";

import React from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Database, PanelRightClose, PanelRightOpen, Tag, User2, Zap } from "lucide-react";
import { ApiTag } from "@/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";

interface DatasetDetailSidebarProps {
  name: string;
  type: string;
  sourceName: string;
  owner: string;
  ownerInitials: string;
  tags: ApiTag[];
  lineageWarning?: string;
}

/**
 * DatasetDetailSidebar
 *
 * Reusable right-hand metadata sidebar shown across the DataCard, Columns,
 * and Queries tabs in DatasetDetailPage. Collapsible via an expand/collapse
 * toggle button — consistent behaviour with nav and chatbot sidebars.
 */
const DatasetDetailSidebar: React.FC<DatasetDetailSidebarProps> = ({
  name,
  type,
  sourceName,
  owner,
  ownerInitials,
  tags,
  lineageWarning,
}) => {
  const { datasetDetailSidebarCollapsed: collapsed, toggleDatasetDetailSidebar: toggle } = useAppStore();

  return (
    <div
      className={cn(
        "flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden self-start transition-all duration-300 relative",
        collapsed ? "w-12" : "w-64",
      )}
    >
      {/* Toggle button — mirrors the nav sidebar chevron style */}
      <button
        onClick={() => toggle()}
        title={collapsed ? "Expand details" : "Collapse details"}
        className={cn(
          "absolute top-2.5 z-10 w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm",
          collapsed ? "left-2" : "right-2",
        )}
      >
        {collapsed ? (
          <PanelRightOpen size={20} />
        ) : (
          <PanelRightClose size={20} />
        )}
      </button>

      {/* Collapsed state — slim strip with icon-only indicators */}
      {collapsed && (
        <div className="flex flex-col items-center pt-12 pb-4 gap-4 mt-2">

          {/* Dataset name */}
          <div
            title={name}
            className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full px-1 w-6 h-6 flex items-center justify-center"
          >
            <Database className="w-4 h-4 text-gray-600" />
          </div>

          {/* Owner avatar */}
          <div
            title={`Owner: ${owner}`}
            className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center"
          >
            {ownerInitials}
          </div>

          {/* Lineage health dot */}
          <div
            title={lineageWarning ?? "All upstreams healthy"}
            className={cn(
              "w-6 h-6 rounded-full", "bg-gray-100",
            )}
          >
            <div className="flex items-center justify-center mt-1">
              <Zap className={cn("w-4 h-4 text-gray-600 stroke-2")} />
            </div>
          </div>

          {/* Tag count badge */}
          {tags.length > 0 && (
            <div
              title={`${tags.length} tag${tags.length !== 1 ? "s" : ""}`}
              className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full px-1 w-6 h-6 flex items-center justify-center"
            >
              {tags.length}
            </div>
          )}
        </div>
      )}

      {/* Expanded state — full detail */}
      {!collapsed && (
        <>
          {/* Identity */}
          <div className="p-4 pt-8 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {type} | {sourceName}
                </p>
              </div>
            </div>
          </div>

          {/* Lineage */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Zap className="w-4 h-4 text-gray-400" />
              Lineage
            </div>
            {lineageWarning ? (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2 text-xs text-red-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lineageWarning}
              </div>
            ) : (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                All upstreams healthy
              </p>
            )}
          </div>

          {/* Owners */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <User2 className="w-4 h-4 text-gray-400" />
              Owners
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {ownerInitials}
              </span>
              <span className="text-xs text-gray-700 truncate">{owner}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Tag className="w-4 h-4 text-gray-400" />
              Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.length > 0 ? (
                tags.map((tag: ApiTag) => (
                  <span
                    key={tag.id}
                    className="inline-block text-[11px] font-medium text-gray-600 bg-gray-100 rounded px-2 py-0.5"
                  >
                    {tag.name}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-gray-300 italic">No tags</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DatasetDetailSidebar;
