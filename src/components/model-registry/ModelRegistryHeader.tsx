"use client";

import { Brain } from "lucide-react";

export function ModelRegistryHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-semibold text-gray-900">Model Registry</h1>
        </div>
        <p className="text-gray-600">
          Central governance and discovery for all machine learning models across the organization.
        </p>
      </div>
      <button className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
        <span className="text-lg">+</span>
        Register Model
      </button>
    </div>
  );
}
