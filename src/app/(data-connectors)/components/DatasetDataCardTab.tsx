"use client";

import React from "react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface DatasetDataCardTabProps {
  detail: any;
}

const qualityColor = "text-green-600";

const DatasetDataCardTab: React.FC<DatasetDataCardTabProps> = ({ detail }) => {
  return (
    <div className="space-y-4">
      {detail.dataCardContent ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <MarkdownRenderer content={detail.dataCardContent} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Dataset Overview
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {detail.overview}
          </p>

          <h3 className="text-sm font-semibold text-gray-900 mt-5 mb-2">
            Key Fields
          </h3>
          <ul className="space-y-1.5">
            {detail.keyFields.map((field: any) => (
              <li key={field.name} className="flex items-baseline gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 mt-[5px]" />
                <span>
                  <span className="font-medium text-gray-800">{field.name}:</span>{" "}
                  <span className="text-gray-500">{field.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Quality */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-2">
          Data Quality
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "FRESHNESS",
              value: detail.freshness,
              color: "text-green-600",
            },
            {
              label: "VOLUME",
              value: detail.volume,
              color: "text-green-600",
            },
            {
              label: "QUALITY SCORE",
              value: detail.qualityScore,
              color: qualityColor,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-green-50 border border-green-100 rounded-xl px-4 py-4 flex flex-col justify-center items-center"
            >
              <p className="text-xs font-semibold text-gray-400 tracking-wide uppercase mb-1 text-center">
                {metric.label}
              </p>
              <p className={cn(`text-2xl font-extrabold ${metric.color} text-center`)}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatasetDataCardTab;
