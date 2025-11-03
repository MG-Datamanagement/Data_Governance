import React, { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, Loader2, ChevronDown } from "lucide-react";
import { TableDetails } from "@/app/catalog/[id]/page";

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
  data_source_id: number | "";
  domain_id: number | "";
  owner_id: number | "";
}

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TableFormData, "id">) => void;
  isLoading: boolean;
  sourceList: any[];
  domainList: any[];
  userList: any[];
  table?: TableDetails;
}

const TableModal: React.FC<TableModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  sourceList,
  domainList,
  userList,
  table,
}) => {
  const [formData, setFormData] = useState<TableFormData>({
    name: "",
    schema_name: "",
    description: "",
    table_type: "table",
    sensitivity_level: "",
    is_active: true,
    is_certified: false,
    certification_notes: "",
    data_source_id: "",
    domain_id: "",
    owner_id: "",
  });
  console.log(table, "tba;le ==>>")

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (table) {
      setFormData((prev) => ({
        ...prev,
        ...table,
        data_source_id: table.data_source.id,
        domain_id: table.domain.id,
        owner_id: table.owner.id,
      }));
    } else {
      setFormData({
        name: "",
        schema_name: "",
        description: "",
        table_type: "table",
        sensitivity_level: "",
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
    if (!formData.schema_name.trim())
      newErrors.schema_name = "Schema name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.data_source_id)
      newErrors.data_source_id = "Select a data source";
    if (!formData.domain_id) newErrors.domain_id = "Select a domain";
    if (!formData.owner_id) newErrors.owner_id = "Select an owner";
    if (!formData.sensitivity_level) newErrors.sensitivity_level = "Select a sensitivity level";
    if (formData.is_certified && !formData.certification_notes) newErrors.certification_notes = "Certification notes is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
        onSubmit({
          name: formData.name,
          schema_name: formData.schema_name,
          description: formData.description,
          table_type: "table",
          sensitivity_level: formData.sensitivity_level,
          is_active: formData.is_active,
          is_certified: formData.is_certified,
          certification_notes: formData.certification_notes,
          data_source_id: Number(formData.data_source_id),
          domain_id: Number(formData.domain_id),
          owner_id: Number(formData.owner_id),
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
              {table ? "Edit Table" : "Create New Table"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {table
                ? "Update the table’s details"
                : "Add a new table to the catalog"}
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
          {/* Name / Schema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Table Name <span className="text-red-500">*</span>
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
                placeholder="Table name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Schema Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.schema_name}
                onChange={(e) =>
                  setFormData({ ...formData, schema_name: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.schema_name
                    ? "border-red-300 bg-red-50"
                    : "border-slate-300"
                }`}
                placeholder="Schema name"
                disabled={isLoading}
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

          {/* Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sensitivity Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sensitivity Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.sensitivity_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sensitivity_level: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    errors.sensitivity_level
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select sensitivity level</option>
                  {[
                    SensitivityLevelEnum.PUBLIC,
                    SensitivityLevelEnum.INTERNAL,
                    SensitivityLevelEnum.CONFIDENTIAL,
                    SensitivityLevelEnum.RESTRICTED,
                  ].map((s) => (
                    <option key={s} value={s}>
                      {capitalize(s)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.sensitivity_level && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.sensitivity_level}
                </p>
              )}
            </div>
            {/* Data Source */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Source <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.data_source_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data_source_id: Number(e.target.value),
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    errors.data_source_id
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select source</option>
                  {(sourceList || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.data_source_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.data_source_id}
                </p>
              )}
            </div>

            {/* Domain */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Domain <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.domain_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      domain_id: Number(e.target.value),
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    errors.domain_id
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select domain</option>
                  {(domainList || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.domain_id && (
                <p className="mt-1 text-sm text-red-600">{errors.domain_id}</p>
              )}
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Owner <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.owner_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      owner_id: Number(e.target.value),
                    })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    errors.owner_id
                      ? "border-red-300 bg-red-50"
                      : "border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <option value="">Select owner</option>
                  {(userList || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.owner_id && (
                <p className="mt-1 text-sm text-red-600">{errors.owner_id}</p>
              )}
            </div>
          </div>

          {/* Boolean flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                disabled={isLoading}
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_certified}
                onChange={(e) =>
                  setFormData({ ...formData, is_certified: e.target.checked })
                }
                disabled={isLoading}
              />
              <span className="text-sm text-slate-700">Certified</span>
            </label>
          </div>

          {/* Certification notes */}
          {formData.is_certified && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Certification Notes
              </label>
              <textarea
                value={formData.certification_notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    certification_notes: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter certification notes..."
                rows={2}
                disabled={isLoading}
              />
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {table ? "Update Table" : "Create Table"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableModal;
