import React, { useState, useMemo } from "react";
import { Search, Plus, Tag, Pencil, Trash2 } from "lucide-react";
import AddPropertyModal from "../modals/AddPropertyModal";
import {
  useGetCatalogProperties,
  useCreateCatalogProperty,
  useUpdateCatalogProperty,
  useDeleteCatalogProperty
} from "@/hooks/useDashboardQueries";
import { formatDistanceToNow } from "date-fns";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";
import { DataGrid, DataGridColumn } from "@/components/ui/DataGrid";
import { InlineState } from "@/components/ui/InlineState";
import { Pagination } from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DatasetPropertiesTab({ catalogId }: { catalogId: string }) {
  const { data: propertiesData, isLoading } = useGetCatalogProperties(catalogId);
  const createMutation = useCreateCatalogProperty();
  const updateMutation = useUpdateCatalogProperty();
  const deleteMutation = useDeleteCatalogProperty();

  const properties = useMemo(() => propertiesData?.custom_properties || [], [propertiesData]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<{ id: string; name: string; value: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter and pagination logic
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;
    const lowerQ = searchQuery.toLowerCase();
    return properties.filter(
      (p) => p.key.toLowerCase().includes(lowerQ) || p.value.toLowerCase().includes(lowerQ)
    );
  }, [properties, searchQuery]);

  const totalItems = filteredProperties.length;
  const offset = (page - 1) * limit;
  const paginatedProperties = filteredProperties.slice(offset, offset + limit);

  // CRUD Operations
  const handleAddProperty = () => {
    setEditingProperty(null);
    setIsModalOpen(true);
  };

  const handleEditProperty = (prop: { id?: string; key: string; value: string; last_updated?: string; }) => {
    setEditingProperty({ id: prop.id || prop.key, name: prop.key, value: prop.value });
    setIsModalOpen(true);
  };

  const handleDeleteProperty = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      deleteMutation.mutate({ catalogId, propertyId: confirmDeleteId });
      setConfirmDeleteId(null);
    }
  };

  const handleSaveProperty = (name: string, value: string, id?: string, oldName?: string) => {
    if (id) {
      if (oldName && name !== oldName) {
        deleteMutation.mutate({ catalogId, propertyId: id }, {
          onSuccess: () => {
            createMutation.mutate({
              catalogId,
              data: { key: name, value, value_type: "string" }
            });
          }
        });
      } else {
        updateMutation.mutate({
          catalogId,
          propertyId: id,
          data: { value, value_type: "string" }
        });
      }
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
        <div className="w-full h-96 flex p-16 flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
          <InlineState type="loading" message="Loading properties..." />
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
          <Button
            onClick={handleAddProperty}
            className="mt-6"
            icon={<Plus size={16} />}
          >
            Add First Property
          </Button>
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
            We couldn&apos;t find any properties matching &quot;{searchQuery}&quot;.
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

  const columns: DataGridColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      width: "33%",
      render: (prop) => (
        <span className="text-xs font-bold text-gray-800">{prop.key}</span>
      ),
    },
    {
      key: "value",
      header: "Value",
      width: "33%",
      render: (prop) => (
        <span className="text-xs text-gray-600">{prop.value}</span>
      ),
    },
    {
      key: "lastModified",
      header: "Last Modified",
      width: "25%",
      render: (prop) => {
        let lastUpdatedStr = prop.last_updated;
        try {
          if (lastUpdatedStr) {
            const d = new Date(lastUpdatedStr);
            if (!isNaN(d.getTime())) {
               lastUpdatedStr = formatDistanceToNow(d, { addSuffix: true });
            }
          }
        } catch(e) {}
        return <span className="text-[11px] text-gray-400">{lastUpdatedStr}</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (prop) => (
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleEditProperty(prop)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button 
            onClick={() => handleDeleteProperty(prop.id || prop.key)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      title="Dataset Properties"
      headerClassName="border-none"
      className="bg-transparent border-none shadow-none"
      description="Key-value metadata properties associated with this dataset"
      headerIcon={<Tag size={16} />}
      badgeCount={properties.length > 0 ? `${properties.length} total` : undefined}
      headerAction={
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-1.5 w-64 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <Button
            onClick={handleAddProperty}
            icon={<Plus size={16} />}
          >
            Add Property
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Content area */}
        {renderEmptyState() || (
          <DataGrid
            data={paginatedProperties}
            columns={columns}
            keyExtractor={(prop: any) => prop.id || prop.key}
            emptyStateMessage="No properties found"
            className="border-t border-gray-100 shadow-none border-x-0 border-b-0 rounded-none w-full"
            maxHeight="380px"
            pagination={
              <Pagination
                currentPage={page}
                totalItems={totalItems}
                pageSize={limit}
                pageSizeOptions={[10, 20, 50]}
                showCount
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
              />
            }
          />
        )}
        <AddPropertyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProperty}
          initialData={editingProperty}
        />
        <ConfirmModal
          isOpen={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Property"
          description="Are you sure you want to delete this property? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          isLoading={deleteMutation.isPending}
        />
      </div>
    </SectionCard>
  );
}
