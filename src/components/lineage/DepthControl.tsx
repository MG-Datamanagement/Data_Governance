"use client";

import React from "react";

interface DepthControlProps {
  depth: number;
  direction: "upstream" | "downstream" | "both";
  onChange: (d: number, dir: "upstream" | "downstream" | "both") => void;
}

export function DepthControl({ depth, direction, onChange }: DepthControlProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-gray-500 font-medium">Depth</span>
      {[1, 2, 3, 4, 5].map((d: number) => (
        <button
          key={d}
          onClick={() => onChange(d, direction)}
          className={`w-6 h-6 rounded-md text-[11px] font-bold border transition-colors ${
            depth === d
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}
        >
          {d}
        </button>
      ))}
      <span className="ml-2 text-[11px] text-gray-500 font-medium">Direction</span>
      {(["both", "upstream", "downstream"] as const).map((d) => (
        <button
          key={d}
          onClick={() => onChange(depth, d)}
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize transition-colors ${
            direction === d
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
