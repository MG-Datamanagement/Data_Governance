import React, { memo } from "react";
import { Connector } from "./types/types";
import { AlertTriangle, Trash } from "lucide-react";

export interface DeleteConfirmModalProps {
  connector: Connector | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal:React.FC<DeleteConfirmModalProps> = memo(
  ({
    connector,
    onConfirm,
    onCancel,
  }: {
    connector: Connector | null;
    onConfirm: () => void;
    onCancel: () => void;
  }) => {
    if (!connector) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onCancel}
        />
        <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Connector
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <strong>{connector.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
                >
                  <Trash size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default DeleteConfirmModal;

DeleteConfirmModal.displayName = "DeleteConfirmModal";