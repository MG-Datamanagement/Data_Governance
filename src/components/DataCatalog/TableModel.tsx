import React, { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, Loader2, ChevronDown } from "lucide-react";

export interface TableDetails {
  id?: number | string;
  urn: string;
  name: string;
  schema_name: string;
  description?: string;
  data_source: { id?: number; name: string; type: string };
  domain: { id?: number; name: string; color: string };
  owner?: { id?: number; name: string; email?: string } | undefined;
  table_type: string;
  sensitivity_level: string;
  is_active: boolean;
  is_certified: boolean;
  certification_notes?: string;
  created_at: string;
  updated_at: string;
  columns: any[];
  tags?: Array<{ id: number | string; name: string; color: string }>;
  stats?: any;
}

export enum SensitivityLevelEnum {
  PUBLIC = "public",
  INTERNAL = "internal",
  CONFIDENTIAL = "confidential",
  RESTRICTED = "restricted",
}

export interface TableFormData {
  name: string;
  schema_name: string;
  description: string;
  table_type: string;
  sensitivity_level: string;
  is_active: boolean;
  is_certified: boolean;
  certification_notes: string;
  data_source_id?: number | "";
  domain_id?: number | "";
  owner_id?: number | "";
}

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TableFormData, "id">) => void;
  isLoading: boolean;
  sourceList?: any[];
  domainList?: any[];
  userList?: any[];
  table?: TableDetails | null;
}

const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  table,
}) => {
  const [formData, setFormData] = useState<TableFormData>({
    name: "",
    schema_name: "",
    description: "",
    table_type: "collection",
    sensitivity_level: "internal",
    is_active: true,
    is_certified: false,
    certification_notes: "",
    data_source_id: "",
    domain_id: "",
    owner_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (table) {
      setFormData({
        name: table.name || "",
        schema_name: table.schema_name || "",
        description: table.description || "No description available",
        table_type: table.table_type || "collection",
        sensitivity_level: table.sensitivity_level || "internal",
        is_active: table.is_active ?? true,
        is_certified: table.is_certified ?? false,
        certification_notes: table.certification_notes || "",
        data_source_id: "",
        domain_id: "",
        owner_id: "",
      });
    } else {
      setFormData({
        name: "",
        schema_name: "",
        description: "",
        table_type: "table",
        sensitivity_level: "internal",
        is_active: true,
        is_certified: false,
        certification_notes: "",
        data_source_id: "",
        domain_id: "",
        owner_id: "",
      });
    }
    setErrors({});
  }, [table, isOpen]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Table name is required";
    if (!formData.schema_name.trim()) newErrors.schema_name = "Schema/database name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.sensitivity_level) newErrors.sensitivity_level = "Select a sensitivity level";
    if (formData.is_certified && !formData.certification_notes.trim())
      newErrors.certification_notes = "Certification notes are required when certified";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        onSubmit({
          name: formData.name.trim(),
          schema_name: formData.schema_name.trim(),
          description: formData.description.trim(),
          table_type: formData.table_type,
          sensitivity_level: formData.sensitivity_level,
          is_active: formData.is_active,
          is_certified: formData.is_certified,
          certification_notes: formData.certification_notes.trim(),
        });
      }
    },
    [formData, validate, onSubmit]
  );

  if (!isOpen) return null;

  const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  const isEditMode = !!table;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? "Edit Table Metadata" : "Create New Table"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode
                ? "Update description, sensitivity, and governance"
                : "Register a new table in the catalog"}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Name + Schema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Table Name {isEditMode && <span className="text-gray-400 text-xs">(from DataHub)</span>}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                placeholder="Ailment_BP"
                disabled={isLoading || isEditMode}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Database / Schema {isEditMode && <span className="text-gray-400 text-xs">(from DataHub)</span>}
              </label>
              <input
                type="text"
                value={formData.schema_name}
                onChange={(e) => setFormData({ ...formData, schema_name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.schema_name ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                placeholder="Patient360DB"
                disabled={isLoading || isEditMode}
              />
              {errors.schema_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.schema_name}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-slate-300"
                }`}
              rows={3}
              placeholder="Describe what this table contains..."
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {errors.description}
              </p>
            )}
          </div>

          {/* Sensitivity Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sensitivity Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.sensitivity_level}
                  onChange={(e) => setFormData({ ...formData, sensitivity_level: e.target.value })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${errors.sensitivity_level ? "border-red-300 bg-red-50" : "border-slate-300"
                    }`}
                  disabled={isLoading}
                >
                  <option value="">Select sensitivity level</option>
                  {Object.values(SensitivityLevelEnum).map((level) => (
                    <option key={level} value={level}>
                      {capitalize(level)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.sensitivity_level && (
                <p className="mt-1 text-sm text-red-600">{errors.sensitivity_level}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Table Type
              </label>
              <input
                type="text"
                value={formData.table_type}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>
          </div>

          {/* Governance Flags */}
          <div className="flex items-center gap-8 py-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-slate-700">Active Table</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_certified}
                onChange={(e) => setFormData({ ...formData, is_certified: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-slate-700">Certified Table</span>
            </label>
          </div>

          {/* Certification Notes */}
          {formData.is_certified && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certification Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.certification_notes}
                onChange={(e) => setFormData({ ...formData, certification_notes: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.certification_notes ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                rows={3}
                placeholder="Why is this table certified? Who reviewed it?"
                disabled={isLoading}
              />
              {errors.certification_notes && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.certification_notes}
                </p>
              )}
            </div>
          )}
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
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditMode ? "Update Metadata" : "Create Table"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableModal;