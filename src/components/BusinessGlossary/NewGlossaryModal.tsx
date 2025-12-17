import { AlertTriangle, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import DocumentationEditor from "../common/DocumentationEditor";

interface NewGlossaryModalProps {
  isOpen: boolean;
  update?: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Glossary, "id">) => void;
  isLoading: boolean;
}

export interface Glossary {
  name: string;
  documentation: string;
}

const NewGlossaryModal: React.FC<NewGlossaryModalProps> = ({
  isOpen,
  update = false,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Glossary>({
    name: "",
    documentation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        onSubmit(formData);
      }
    },
    [formData, validate, onSubmit]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {update ? "Edit Glossary" : "Create Glossary"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {update
                ? "Update the Glossary’s details"
                : "Add a new Glossary"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg ${errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                }`}
              placeholder="My Business Glossary"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Documentation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Documentation
            </label>

            <DocumentationEditor
              value={formData.documentation}
              onChange={(value) =>
                setFormData({ ...formData, documentation: value })
              }
              disabled={isLoading}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 rounded-lg hover:bg-white transition-colors font-medium text-slate-700"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {update ? "Update Glossary" : "Create Glossary"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewGlossaryModal;
