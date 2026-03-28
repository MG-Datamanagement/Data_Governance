import React from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <div className="mt-2 text-sm text-gray-500">{description}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
