"use client";

import React, { useState } from "react";
import ConnectorIcon from "@/components/connectors/ConnectorIcon";
import { CONNECTORS } from "@/lib/connectors";

interface Step1Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export const Step1: React.FC<Step1Props> = ({ selected, onSelect }) => {
  const [search, setSearch] = useState("");
  const filtered = CONNECTORS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search data sources..."
          className="pl-9 pr-4 py-2.5 border border-indigo-400 rounded-lg text-sm bg-white w-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((c) => {
          const isSelected = selected === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50"
                }`}
            >
              <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                <ConnectorIcon icon={c.icon} className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? "text-indigo-700" : "text-gray-800"}`}>{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{c.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
