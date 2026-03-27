"use client";

import { useState } from "react";
import { Home, BrainCircuit, Search, Filter, X, List, Grid } from "lucide-react";
import { ModelRegistryTable } from "@/components/model-registry/ModelRegistryTable";
import { ModelRegistryGrid } from "@/components/model-registry/ModelRegistryGrid";
import { ModelDetailModal } from "@/components/model-registry/ModelDetailModal";
import { RegisterModelModal } from "@/components/model-registry/RegisterModelModal";
import { MOCK_MODEL_LIST, MOCK_MODEL_METADATA } from "@/lib/mockData";
import { Select } from "@/components/ui/Select";

export default function ModelRegistryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("All Sources");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("All Tasks");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Statuses");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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

  const hasActiveFilters = 
    searchQuery !== "" || 
    selectedSourceFilter !== "All Sources" || 
    selectedTaskFilter !== "All Tasks" || 
    selectedStatusFilter !== "All Statuses";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSourceFilter("All Sources");
    setSelectedTaskFilter("All Tasks");
    setSelectedStatusFilter("All Statuses");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header container */}
        <div className="flex justify-between items-start mb-6">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Home className="w-4 h-4" />
              <span>Home</span>
              <span className="text-gray-400">›</span>
              <span>Governance</span>
              <span className="text-gray-400">›</span>
              <span className="text-gray-900 font-medium">Models</span>
            </nav>

            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="w-8 h-8 text-indigo-600" />
              <h1 className="text-[26px] font-bold text-[#1e1b4b]">Model Registry</h1>
            </div>
            <p className="text-gray-500 text-[15px]">
              Central governance and discovery for all machine learning models across the organization.
            </p>
          </div>
          
          <button 
           onClick={() => setIsRegisterModalOpen(true)}
           className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-[15px]"
          >
            <span className="text-xl leading-none font-light">+</span>
            Register Model
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
          {/* Search Input */}
          <div className="relative mb-5">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search models by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[14px] font-medium text-gray-700 flex items-center gap-1.5 mr-1">
                <Filter className="w-4 h-4 text-gray-500" /> Filters:
              </span>
              <div className="w-40">
                <Select
                  value={selectedSourceFilter}
                  onChange={(e) => setSelectedSourceFilter(e.currentTarget.value)}
                  options={sources.map((source) => ({
                    value: source,
                    label: source,
                  }))}
                  placeholder="All Sources"
                  className="w-full text-[13px] py-1.5 px-3 border-gray-300 rounded-lg font-normal"
                />
              </div>
              <div className="w-40">
                <Select
                  value={selectedTaskFilter}
                  onChange={(e) => setSelectedTaskFilter(e.currentTarget.value)}
                  options={tasks.map((task) => ({
                    value: task,
                    label: task,
                  }))}
                  placeholder="All Tasks"
                  className="w-full text-[13px] py-1.5 px-3 border-gray-300 rounded-lg font-normal"
                />
              </div>
              <div className="w-40">
                <Select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.currentTarget.value)}
                  options={statuses.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  placeholder="All Statuses"
                  className="w-full text-[13px] py-1.5 px-3 border-gray-300 rounded-lg font-normal"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[13px] text-gray-500 flex items-center gap-1 hover:text-gray-900 transition-colors ml-2 font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>

            {/* List/Grid View Toggle */}
            <div className="flex items-center p-1 bg-gray-50 border border-gray-200 rounded-lg shrink-0 gap-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-400 hover:text-gray-700 hover:bg-white/50"
                }`}
                title="List view"
              >
                <List className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-400 hover:text-gray-700 hover:bg-white/50"
                }`}
                title="Grid view"
              >
                <Grid className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <p className="text-[14px] text-gray-600 mb-4 font-medium">
          Showing {filteredModels.length} models
        </p>

        {/* Results Container */}
        <div className="mb-10">
          {filteredModels.length > 0 ? (
            viewMode === "list" ? (
              <ModelRegistryTable models={filteredModels} onModelClick={() => setIsDetailModalOpen(true)} />
            ) : (
              <ModelRegistryGrid models={filteredModels} onModelClick={() => setIsDetailModalOpen(true)} />
            )
          ) : (
            <div className="bg-white rounded-xl py-20 px-4 text-center border border-gray-200 w-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="mb-4 text-gray-300">
                <BrainCircuit className="w-16 h-16 opacity-50 mx-auto" strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 text-[15px]">No models found matching your filters.</p>
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

      {/* Register Modal */}
      <RegisterModelModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}

