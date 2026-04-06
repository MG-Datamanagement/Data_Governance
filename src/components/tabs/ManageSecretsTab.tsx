import React, { useState, useMemo } from 'react';
import {
  useGetSecrets,
  useCreateSecret,
  useUpdateSecret,
  useDeleteSecret
} from '@/hooks/useDashboardQueries';
import dynamic from 'next/dynamic';
const AddSecretModal = dynamic(() => import('../modals/AddSecretModal'), { ssr: false });
import { format } from 'date-fns';
import { useAppStore } from '@/store/appStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/Button';
import { logger } from '@/lib/logger';
import { DataGrid, DataGridColumn } from '@/components/ui/DataGrid';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const ManageSecretsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<any>(null);
  const [secretToDelete, setSecretToDelete] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { addToast, updateToast } = useAppStore();
  const { data: secretsData, isLoading: isFetching, refetch } = useGetSecrets(pageSize, (page - 1) * pageSize);
  const createMutation = useCreateSecret();
  const updateMutation = useUpdateSecret();
  const deleteMutation = useDeleteSecret();

  // Robust data extraction: handles both paginated objects and plain arrays
  const secrets = useMemo(() => {
    if (!secretsData) return [];
    if (Array.isArray(secretsData)) return secretsData;
    return secretsData.results || [];
  }, [secretsData]);

  const totalSecrets = useMemo(() => {
    if (!secretsData) return 0;
    if (Array.isArray(secretsData)) return secretsData.length;
    return secretsData.total || 0;
  }, [secretsData]);
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      password: 'Password',
      connection_string: 'Connection String',
      api_key: 'API Key',
    };
    return map[type] || type;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const handleSave = async (data: { name: string; type: string; value: string; description?: string }) => {
    const isUpdate = !!editingSecret;
    const toastId = addToast(isUpdate ? "Updating secret..." : "Adding secret...", "loading");
    try {
      if (editingSecret) {
        // Update
        await updateMutation.mutateAsync({
          secretId: editingSecret.id,
          data: {
            value: data.value,
            description: data.description,
          }
        });
        updateToast(toastId, "Secret updated successfully", "success");
      } else {
        // Create
        await createMutation.mutateAsync(data);
        updateToast(toastId, "Secret created successfully", "success");
      }
      setIsModalOpen(false);
      setEditingSecret(null);
      refetch();
    } catch (err) {
      logger.error("Failed to save secret", { error: err });
      updateToast(toastId, "Failed to save secret. Please try again.", "error");
    }
  };

  const handleDelete = async () => {
    if (!secretToDelete) return;
    const toastId = addToast(`Deleting secret "${secretToDelete.name}"...`, "loading");
    try {
      await deleteMutation.mutateAsync(secretToDelete.id);
      updateToast(toastId, "Secret deleted successfully", "success");
      setSecretToDelete(null);
      refetch();
    } catch (err) {
      logger.error("Failed to delete secret", { error: err });
      updateToast(toastId, "Failed to delete secret", "error");
    }
  };

  const columns: DataGridColumn<any>[] = [
    {
      key: "name",
      header: "Secret Name",
      render: (row) => <span className="text-sm font-bold text-gray-800">{row.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (row) => <span className="text-sm text-gray-500">{formatType(row.type)}</span>,
    },
    {
      key: "usedBy",
      header: "Used By",
      render: () => <span className="text-sm text-gray-500">-</span>,
    },
    {
      key: "lastRotated",
      header: "Last Rotated",
      render: (row) => <span className="text-sm text-gray-500">{formatDate(row.last_rotated || row.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditingSecret(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Edit Secret"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={() => setSecretToDelete(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Secret"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.78 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-0.059.68-0.114 1.022-0.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <SectionCard
        title=""
        description="Manage secrets used by data source connections"
        className={cn('bg-transparent border-none shadow-none')}
        headerAction={
          <Button
            onClick={() => {
              setEditingSecret(null);
              setIsModalOpen(true);
            }}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Secret
          </Button>
        }
      >
        <DataGrid
          data={secrets}
          columns={columns}
          keyExtractor={(row) => row.id}
          isLoading={isFetching}
          emptyStateMessage="No secrets found"
          emptyStateIcon={
            <div className="flex flex-col items-center justify-center text-gray-50">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900 mb-1">No secrets found</p>
              <p className="text-sm text-gray-500">Add a new secret to manage your data source connections securely.</p>
            </div>
          }
          className="shadow-none"
          pagination={
            totalSecrets > 0 ? (
              <Pagination
                currentPage={page}
                totalItems={totalSecrets}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                showCount
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              />
            ) : undefined
          }
        />
      </SectionCard>

      {isModalOpen && (
        <AddSecretModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSecret(null);
          }}
          onSave={handleSave}
          isLoading={isMutating}
          initialData={editingSecret}
        />
      )}

      {secretToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Secret</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Are you sure you want to delete <span className="text-gray-900 font-bold">&quot;{secretToDelete.name}&quot;</span>? 
              This action cannot be undone and may break connections relying on this secret.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSecretToDelete(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isMutating ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    Saving...
                  </>
                ) : (
                  'Save Secret'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageSecretsTab;
