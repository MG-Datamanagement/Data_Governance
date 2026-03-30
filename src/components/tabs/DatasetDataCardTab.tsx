"use client";

import React from "react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { cn, formatTimeAgo } from "@/lib/utils";
import { SectionCard } from "@/components/ui/SectionCard";
import { KeyField } from "@/types";
import { Sparkle } from "lucide-react";

interface DatasetDataCardTabProps {
  detail: any;
}

const DatasetDataCardTab: React.FC<DatasetDataCardTabProps> = ({ detail }) => {
  return (
    <div className="space-y-3">
      {detail.dataCardContent ? (
        <SectionCard showSectionHeader={false} bodyClassName="p-2 bg-none" className="border-none shadow-none bg-transparent">
          <div className="flex items-start gap-2 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg">
            <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkle className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900">
                AI-Generated Summary
              </p>
              <p className="text-[11px] text-indigo-700/80 mt-0.5">
                This data card was automatically generated
                by AI based on schema analysis, column patterns,
                and metadata. Review and edit as needed.
              </p>
            </div>
          </div>
          <MarkdownRenderer content={detail.dataCardContent} />
        </SectionCard>
      ) : (
        <SectionCard showSectionHeader={false} bodyClassName="p-2 bg-none" className="border-none shadow-none bg-transparent">
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            {detail.overview}
          </p>

          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Key Fields
          </h3>
          <ul className="space-y-1.5">
            {detail.keyFields.map((field: KeyField) => (
              <li key={field.name} className="flex items-baseline gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 mt-[5px]" />
                <span>
                  <span className="font-medium text-gray-800">{field.name}:</span>{" "}
                  <span className="text-gray-500">{field.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Data Quality */}
      <SectionCard title="Data Quality" bodyClassName="p-2 bg-none" className="border-none shadow-none bg-transparent" headerClassName="px-4 py-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "FRESHNESS",
              value: detail?.freshness,
              color: "text-green-900",
            },
            {
              label: "VOLUME",
              value: detail.volume,
              color: "text-green-900",
            },
            {
              label: "QUALITY SCORE",
              value: detail.qualityScore,
              color: "text-green-900",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col justify-center items-start"
            >
              <p className="text-xs font-semibold text-green-600 tracking-wide uppercase mb-1 text-center">
                {metric.label}
              </p>
              <p className={cn(`text-xl font-extrabold ${metric.color}`)}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default DatasetDataCardTab;
