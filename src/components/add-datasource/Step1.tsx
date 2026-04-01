"use client";

import React, { useState } from "react";
import ConnectorIcon from "@/components/connectors/ConnectorIcon";
import { CONNECTORS } from "@/lib/connectors";
import { SearchInput } from "@/components/ui/SearchInput";

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
      <div className="mb-5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search data sources..."
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
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <ConnectorIcon icon={c.icon} className="w-8 h-8" />
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
