import React, { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import { Domain } from "@/app/domains/page";

export const StewardList = [
  { id: 2, name: "Sarah lee" },
  { id: 4, name: "Lisa Wong" },
  { id: 9, name: "Chris Kim" },
];

export interface DomainFormData {
  name: string;
  description: string;
  steward_id: number | "";
}

interface NewDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DomainFormData, "id">) => void;
  isLoading: boolean;
  domain?: Domain;
}

const NewDomainModal: React.FC<NewDomainModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  domain,
}) => {
  const [formData, setFormData] = useState<DomainFormData>({
    name: "",
    description: "",
    steward_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (domain) {
      setFormData((prev) => ({
        ...prev,
        ...domain
      }));
    } else {
      setFormData({
        name: "",
        description: "",
        steward_id: "",
      });
    }
    setErrors({});
  }, [domain, isOpen]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Domain name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.steward_id) newErrors.steward_id = "Select a Steward";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        onSubmit({
          ...formData,
          steward_id: Number(formData.steward_id),
        });
      }
    },
    [formData, validate, onSubmit]
  );

  if (!isOpen) return null;

  function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {domain ? "Edit Domain" : "Create New Domain"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {domain
                ? "Update the domain’s details"
                : "Add a new domain to the catalog"}
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
          {/* Name / Steward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Domain Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                }`}
                placeholder="Domain name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>
            {/* Steward */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steward <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.steward_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      steward_id: Number(e.target.value),
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    errors.steward_id
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select steward</option>
                  {StewardList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.steward_id && (
                <p className="mt-1 text-sm text-red-600">{errors.steward_id}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300"
                }`}
                rows={2}
                placeholder="Enter description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.description}
                </p>
              )}
            </div>
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
            {domain ? "Update Domain" : "Create Domain"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewDomainModal;
