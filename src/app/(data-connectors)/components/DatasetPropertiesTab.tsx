import React, { useState, useMemo } from "react";
import { Search, Plus, Tag, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import AddPropertyModal from "./AddPropertyModal";
import { 
  useGetCatalogProperties, 
  useCreateCatalogProperty, 
  useUpdateCatalogProperty, 
  useDeleteCatalogProperty 
} from "@/hooks/useDashboardQueries";
import { format, parseISO } from "date-fns";
import { formatDistanceToNow } from "date-fns";

export default function DatasetPropertiesTab({ catalogId }: { catalogId: string }) {
  const { data: propertiesData, isLoading } = useGetCatalogProperties(catalogId);
  const createMutation = useCreateCatalogProperty();
  const updateMutation = useUpdateCatalogProperty();
  const deleteMutation = useDeleteCatalogProperty();

  const properties = propertiesData?.custom_properties || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<{ id: string; name: string; value: string } | null>(null);

  // Filter and pagination logic
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const lowerQ = searchQuery.toLowerCase();
    return properties.filter(
      (p) => p.key.toLowerCase().includes(lowerQ) || p.value.toLowerCase().includes(lowerQ)
    );
  }, [properties, searchQuery]);

  const totalItems = filteredProperties.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const offset = (page - 1) * limit;
  const paginatedProperties = filteredProperties.slice(offset, offset + limit);

  // CRUD Operations
  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleEditProperty = (prop: any) => {
    setEditingProperty({ id: prop.id, name: prop.key, value: prop.value });
    setIsModalOpen(true);
  };

  const handleDeleteProperty = (id: string) => {
    if(confirm("Are you sure you want to delete this property?")) {
      deleteMutation.mutate({ catalogId, propertyId: id });
    }
  };

  const handleSaveProperty = (name: string, value: string, id?: string) => {
    if (id) {
      updateMutation.mutate({
        catalogId,
        propertyId: id,
        data: { value, value_type: "string" }
      });
    } else {
      createMutation.mutate({
        catalogId,
        data: { key: name, value, value_type: "string" }
      });
    }
  };

  // Handle Empty State
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading properties...</p>
        </div>
      );
    }

    if (properties.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No properties added</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Add custom key-value metadata to help categorize and document this dataset.
          </p>
          <button
            onClick={handleAddProperty}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Add First Property
          </button>
        </div>
      );
    }

    if (filteredProperties.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No results found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            We couldn't find any properties matching "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-6 text-indigo-600 text-sm font-semibold hover:underline"
          >
            Clear search
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-md font-bold text-gray-900">Dataset Properties</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
              {properties.length} total
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 sm:hidden">
          Key-value metadata properties associated with this dataset
        </p>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={handleAddProperty}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 hidden sm:block -mt-2">
        Key-value metadata properties associated with this dataset
      </p>

      {/* Content area */}
      {renderEmptyState() || (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 shadow-sm">
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Name</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Value</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/4">Last Modified</th>
                  <th className="py-3 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProperties.map((prop: any) => {
                  let lastUpdatedStr = prop.last_updated;
                  try {
                    // Usually DD/MM/YYYY HH:mm:ss, but may vary so we parse gracefully
                    const dateObj = new Date(prop.last_updated);
                    if (!isNaN(dateObj.getTime())) {
                       lastUpdatedStr = formatDistanceToNow(dateObj, { addSuffix: true });
                    }
                  } catch(e) {}

                  return (
                  <tr key={prop.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-100 last:border-0">
                    <td className="py-2.5 px-4 align-middle">
                      <span className="text-xs font-bold text-gray-800">{prop.key}</span>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className="text-xs text-gray-600">{prop.value}</span>
                    </td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className="text-[11px] text-gray-400">{lastUpdatedStr}</span>
                    </td>
                    <td className="py-2.5 px-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditProperty(prop)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs bg-gray-50/50">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-500 uppercase tracking-widest">
                Showing {offset + 1} to {Math.min(offset + limit, totalItems)} of {totalItems} properties
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Rows per page:</span>
                <select 
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-200 rounded text-gray-600 bg-white py-0.5 px-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-6 h-6 border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 mx-1 font-medium">
                <span className="text-gray-900">
                  Page {page} of {totalPages}
                </span>
              </div>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center w-6 h-6 border border-gray-200 text-gray-500 bg-white hover:bg-gray-50 rounded disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AddPropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProperty}
        initialData={editingProperty}
      />
    </div>
  );
}
