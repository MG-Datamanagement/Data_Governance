"use client";

import { useState } from "react";
import { Home, Brain } from "lucide-react";
import { ModelRegistryTable } from "@/components/model-registry/ModelRegistryTable";
import { ModelDetailModal } from "@/components/model-registry/ModelDetailModal";
import { MOCK_MODEL_LIST, MOCK_MODEL_METADATA } from "@/lib/mockData";
import SearchInput from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";

export function ModelRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("All Sources");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("All Tasks");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Statuses");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter models based on search and filters
  const filteredModels = MOCK_MODEL_LIST.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSource =
      selectedSourceFilter === "All Sources" || model.source === selectedSourceFilter;
    const matchesTask =
      selectedTaskFilter === "All Tasks" || model.task === selectedTaskFilter;
    const matchesStatus =
      selectedStatusFilter === "All Statuses" || model.status === selectedStatusFilter;

    return matchesSearch && matchesSource && matchesTask && matchesStatus;
  });

  // Get unique values for filters
  const sources = ["All Sources", ...new Set(MOCK_MODEL_LIST.map((m) => m.source))];
  const tasks = ["All Tasks", ...new Set(MOCK_MODEL_LIST.map((m) => m.task))];
  const statuses = ["All Statuses", ...new Set(MOCK_MODEL_LIST.map((m) => m.status))];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Home className="w-4 h-4 text-indigo-600" />
          <span className="text-indigo-600">Home</span>
          <span>&gt;</span>
          <span>Governance</span>
          <span>&gt;</span>
          <span className="text-gray-900">Models</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="flex gap-4 items-center flex-wrap">
            <SearchInput
              placeholder="Search models by name, description, or tags..."
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-1">
                <span>🎛️</span> Filters:
              </span>
              <Select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.currentTarget.value)}
                options={sources.map((source) => ({
                  value: source,
                  label: source,
                }))}
                placeholder="All Sources"
              />
              <Select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.currentTarget.value)}
                options={tasks.map((task) => ({
                  value: task,
                  label: task,
                }))}
                placeholder="All Tasks"
              />
              <Select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.currentTarget.value)}
                options={statuses.map((status) => ({
                  value: status,
                  label: status,
                }))}
                placeholder="All Statuses"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredModels.length}</span> models
            </p>
            <div className="flex items-center gap-2 text-gray-600">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="List view">
                <span className="text-lg">☰</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Grid view">
                <span className="text-lg">⊞</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredModels.length > 0 ? (
            <ModelRegistryTable models={filteredModels} onModelClick={() => setIsDetailModalOpen(true)} />
          ) : (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <p className="text-gray-500 mb-2 text-lg">No models found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <ModelDetailModal
        model={MOCK_MODEL_METADATA}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}

export default ModelRegistryPage;
