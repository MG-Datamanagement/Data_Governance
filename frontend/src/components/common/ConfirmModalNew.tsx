import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: any) => void;
  isLoading: boolean;
  count?: number;
  entityName?: string;
  actionLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count = 0,
  isLoading,
  entityName = "item",
  actionLabel = "Delete",
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  // Determine singular/plural form
  const itemLabel =
    count && count > 1
      ? `${count} ${entityName.toLowerCase()}s`
      : entityName.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
            {actionLabel}{" "}
            {count && count > 1 ? `${count} ${entityName}s` : entityName}?
          </h3>

          <p className="text-center text-slate-600 mb-6">
            {count && count > 1
              ? `These ${count} ${entityName.toLowerCase()}s will be permanently ${actionLabel.toLowerCase()}d. This action cannot be undone.`
              : `This ${entityName.toLowerCase()} will be permanently ${actionLabel.toLowerCase()}d. This action cannot be undone.`}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
