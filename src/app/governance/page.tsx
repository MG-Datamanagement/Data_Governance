"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/common/ConfirmModalNew";

const mock = {
  rules: [
    {
      rules: "Every dataset has a clearly defined data owner and data steward.",
      status: "Active",
      category: "Ownership",
      priority: "High",
      rule_id: 1,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "Owners are responsible for data quality, access permissions, and compliance.",
      status: "Active",
      category: "Ownership",
      priority: "High",
      rule_id: 2,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Data is accurate, complete, and consistent across all systems.",
      status: "Active",
      category: "Quality",
      priority: "High",
      rule_id: 3,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Duplicate or outdated data is regularly identified and removed.",
      status: "Active",
      category: "Quality",
      priority: "Medium",
      rule_id: 4,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "Each dataset includes metadata such as source, creation date, and last update.",
      status: "Active",
      category: "Metadata",
      priority: "High",
      rule_id: 5,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Data changes are tracked and auditable.",
      status: "Active",
      category: "Quality",
      priority: "High",
      rule_id: 6,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "Access to data is based on role-based permissions (least privilege).",
      status: "Active",
      category: "Security",
      priority: "High",
      rule_id: 7,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Sensitive data is encrypted both at rest and in transit.",
      status: "Active",
      category: "Security",
      priority: "High",
      rule_id: 8,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "Personally Identifiable Information (PII) is managed in compliance with privacy regulations.",
      status: "Active",
      category: "Privacy",
      priority: "High",
      rule_id: 9,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "All data is classified appropriately (e.g., public, internal, confidential).",
      status: "Active",
      category: "Classification",
      priority: "Medium",
      rule_id: 10,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "Each dataset includes metadata describing purpose, structure, and lineage.",
      status: "Active",
      category: "Metadata",
      priority: "High",
      rule_id: 11,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "A business glossary is maintained for consistent terminology.",
      status: "Active",
      category: "Metadata",
      priority: "Medium",
      rule_id: 12,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Data is used only for authorized and ethical purposes.",
      status: "Active",
      category: "Usage",
      priority: "High",
      rule_id: 13,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules: "Confidential data is not shared without proper authorization.",
      status: "Active",
      category: "Security",
      priority: "High",
      rule_id: 14,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
    {
      rules:
        "All analytics and AI models use governed and verified data sources.",
      status: "Active",
      category: "Usage",
      priority: "High",
      rule_id: 15,
      created_at: "2025-10-14T08:04:28.520570Z",
      modified_at: "2025-10-14T08:04:28.520570Z",
    },
  ],
  total: 15,
  page: 1,
  size: 20,
  has_next: false,
};

// ==================== TYPES ====================
interface Rule {
  rule_id: number;
  rules: string;
  status: "Active" | "Inactive" | "Draft";
  category: string;
  priority: "High" | "Medium" | "Low";
  created_at: string;
  modified_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

interface Filters {
  category: string;
  priority: string;
  status: string;
}

// ==================== API SERVICE ====================
const baseUrl = "http://localhost:8000";

// ==================== UTILITY FUNCTIONS ====================
// const getCategoryColor = (category: string): string => {
//     const colors: Record<string, string> = {
//         'Ownership': 'bg-purple-100 text-purple-700',
//         'Quality': 'bg-blue-100 text-blue-700',
//         'Security': 'bg-red-100 text-red-700',
//         'Privacy': 'bg-pink-100 text-pink-700',
//         'Metadata': 'bg-cyan-100 text-cyan-700',
//         'Usage': 'bg-emerald-100 text-emerald-700',
//         'Classification': 'bg-orange-100 text-orange-700'
//     };
//     return colors[category] || 'bg-gray-100 text-gray-700';
// };

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    High: "bg-red-100 text-red-700 border-red-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
  };
  return colors[priority] || "bg-gray-100 text-gray-700 border-gray-200";
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-700",
    Draft: "bg-blue-100 text-blue-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

// ==================== RULE MODAL COMPONENT ====================
const RuleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    rule: Omit<Rule, "rule_id" | "created_at" | "modified_at">
  ) => void;
  rule?: Rule;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSubmit, rule, isLoading }) => {
  const [formData, setFormData] = useState({
    rules: "",
    status: "Active" as Rule["status"],
    category: "",
    priority: "Medium" as Rule["priority"],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        rules: rule.rules,
        status: rule.status,
        category: rule.category,
        priority: rule.priority,
      });
    } else {
      setFormData({
        rules: "",
        status: "Active",
        category: "",
        priority: "Medium",
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.rules.trim()) {
      newErrors.rules = "Rule description is required";
    } else if (formData.rules.length < 10) {
      newErrors.rules = "Rule must be at least 10 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {rule ? "Edit Rule" : "Create New Rule"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {rule
                ? "Update the governance rule details"
                : "Add a new governance rule to the system"}
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

        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-3 overflow-y-auto max-h-[calc(90vh-180px)]"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rules <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) =>
                setFormData({ ...formData, rules: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.rules ? "border-red-300 bg-red-50" : "border-slate-300"
              }`}
              rows={2}
              placeholder="Enter rule description..."
              disabled={isLoading}
            />
            {errors.rules && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errors.rules}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {/* <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${errors.category ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                        }`}
                                    disabled={isLoading}
                                >
                                    <option value="">Select</option>
                                    <option value="Ownership">Ownership</option>
                                    <option value="Quality">Quality</option>
                                    <option value="Security">Security</option>
                                    <option value="Privacy">Privacy</option>
                                    <option value="Metadata">Metadata</option>
                                    <option value="Usage">Usage</option>
                                    <option value="Classification">Classification</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /> */}
                <input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.rules ? "border-red-300 bg-red-50" : "border-slate-300"}`}
                  placeholder="Enter Category"
                  disabled={isLoading}
                />
              </div>
              {errors.category && (
                <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority
              </label>
              <div className="relative">
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Rule["priority"],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as Rule["status"],
                    })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  {/* <option value="Draft">Draft</option> */}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </form>

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
            {rule ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== FILTER MODAL ====================
// const FilterModal: React.FC<{
//     isOpen: boolean;
//     onClose: () => void;
//     filters: Filters;
//     onApply: (filters: Filters) => void;
// }> = ({ isOpen, onClose, filters, onApply }) => {
//     const [localFilters, setLocalFilters] = useState(filters);

//     useEffect(() => {
//         setLocalFilters(filters);
//     }, [filters, isOpen]);

//     const handleApply = useCallback(() => {
//         onApply(localFilters);
//         onClose();
//     }, [localFilters, onApply, onClose]);

//     const handleClear = useCallback(() => {
//         const clearedFilters = { category: '', priority: '', status: '' };
//         setLocalFilters(clearedFilters);
//         onApply(clearedFilters);
//         onClose();
//     }, [onApply, onClose]);

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
//             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
//                 <div className="flex items-center justify-between p-6 border-b border-slate-200">
//                     <div>
//                         <h3 className="text-xl font-bold text-slate-900">Filters</h3>
//                         <p className="text-sm text-slate-500 mt-1">Refine your search results</p>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
//                     >
//                         <X className="w-5 h-5 text-slate-600" />
//                     </button>
//                 </div>

//                 <div className="p-6 space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Category
//                         </label>
//                         <div className="relative">
//                             <select
//                                 value={localFilters.category}
//                                 onChange={(e) => setLocalFilters({ ...localFilters, category: e.target.value })}
//                                 className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
//                             >
//                                 <option value="">All Categories</option>
//                                 <option value="Ownership">Ownership</option>
//                                 <option value="Quality">Quality</option>
//                                 <option value="Security">Security</option>
//                                 <option value="Privacy">Privacy</option>
//                                 <option value="Metadata">Metadata</option>
//                                 <option value="Usage">Usage</option>
//                                 <option value="Classification">Classification</option>
//                             </select>
//                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Priority
//                         </label>
//                         <div className="relative">
//                             <select
//                                 value={localFilters.priority}
//                                 onChange={(e) => setLocalFilters({ ...localFilters, priority: e.target.value })}
//                                 className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
//                             >
//                                 <option value="">All Priorities</option>
//                                 <option value="High">High</option>
//                                 <option value="Medium">Medium</option>
//                                 <option value="Low">Low</option>
//                             </select>
//                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-slate-700 mb-2">
//                             Status
//                         </label>
//                         <div className="relative">
//                             <select
//                                 value={localFilters.status}
//                                 onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
//                                 className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
//                             >
//                                 <option value="">All Statuses</option>
//                                 <option value="Active">Active</option>
//                                 <option value="Inactive">Inactive</option>
//                                 <option value="Draft">Draft</option>
//                             </select>
//                             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>
//                 </div>

//                 <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
//                     <button
//                         onClick={handleClear}
//                         className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-white transition-colors font-medium"
//                     >
//                         Clear All
//                     </button>
//                     <button
//                         onClick={handleApply}
//                         className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//                     >
//                         Apply Filters
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// ==================== MAIN COMPONENT ====================

const GovernanceRules: React.FC = () => {
  const defaultPagination = {
    total: 0,
    page: 1,
    size: 5,
    has_next: false,
  };
  const [rules, setRules] = useState<Rule[]>([]);
  const [paginatedRules, setPaginatedRules] = useState<Rule[]>([]);
  const [pagination, setPagination] =
    useState<PaginationInfo>(defaultPagination);
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(2);
  const [isActionLoading, setIsActionLoading] = useState(false);
  // const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // const [searchQuery, setSearchQuery] = useState('');
  // const [filters, setFilters] = useState<Filters>({ category: '', priority: '', status: '' });

  const fetchRules = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/api/v1/governance-rules/governance-rules`,
        {
          method: "GET",
          signal, // Optional abort signal for cancellation
        }
      );

      if (response.ok) {
        const parsedResponse = await response.json();

        const normalizedData = {
          rules: parsedResponse.rules,
          pagination: {
            total: parsedResponse.total,
            page: parsedResponse.page,
            size: 10,
            has_next: parsedResponse.has_next,
          },
        };

        setRules(normalizedData.rules);
        setPagination(normalizedData.pagination);
        setSelectedRules(new Set());
      } else {
        toast.error("Failed to fetch rules");
      }
    } catch (error: any) {
      // Don't show error for aborted requests
      if (error.name === "AbortError") {
        return;
      }
      toast.error("Failed to fetch rules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    fetchRules(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchRules]);

  useEffect(() => {
    let filtered = [...rules];

    const start = (pagination.page - 1) * pagination.size;
    const paginatedRules = filtered.slice(start, start + pagination.size);
    setPaginatedRules(paginatedRules);
    setPagination((prev) => ({
      ...prev,
      has_next: start + pagination.size < filtered.length,
    }));
  }, [rules, pagination.page]);

  // const handleSearch = useCallback((value: string) => {
  //     setSearchQuery(value);
  //     setPagination(prev => ({ ...prev, page: 1 }));
  // }, []);

  // const handleFilterApply = useCallback((newFilters: Filters) => {
  //     setFilters(newFilters);
  //     setPagination(prev => ({ ...prev, page: 1 }));
  // }, []);

  // const handleSelectRule = useCallback((ruleId: number) => {
  //     setSelectedRules(prev => {
  //         const newSelected = new Set(prev);
  //         if (newSelected.has(ruleId)) {
  //             newSelected.delete(ruleId);
  //         } else {
  //             newSelected.add(ruleId);
  //         }
  //         return newSelected;
  //     });
  // }, []);

  // const handleSelectAll = useCallback(() => {
  //     if (selectedRules.size === rules?.length && rules?.length > 0) {
  //         setSelectedRules(new Set());
  //     } else {
  //         setSelectedRules(new Set(rules?.map(r => r.rule_id)));
  //     }
  // }, [selectedRules.size, rules]);

  const handleCreateRule = useCallback(
    async (ruleData: Omit<Rule, "rule_id" | "created_at" | "modified_at">) => {
      setIsActionLoading(true);
      try {
        const payload = {
          ...ruleData,
        };

        const config = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(payload),
        };

        const response = await fetch(
          `${baseUrl}/api/v1/governance-rules/governance-rules`,
          config
        );
        if (response.ok) {
          toast.success("Rule created successfully");
          setIsModalOpen(false);
          await fetchRules();
        } else {
          toast.error("Failed to create rule");
        }
      } catch (error) {
        toast.error("Failed to create rule");
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchRules]
  );

  const handleUpdateRule = useCallback(
    async (ruleData: Omit<Rule, "rule_id" | "created_at" | "modified_at">) => {
      if (!editingRule) return;
      setIsActionLoading(true);
      try {
        const rule_id = editingRule.rule_id;
        const payload = {
          ...ruleData,
          rule_id: rule_id,
        };

        const config = {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(payload),
        };
        const response = await fetch(
          `${baseUrl}/api/v1/governance-rules/governance-rules/${rule_id}`,
          config
        );

        if (response.ok) {
          toast.success("Rule updated successfully");
          setIsModalOpen(false);
          setEditingRule(undefined);
          await fetchRules();
        } else {
          toast.error("Failed to update rule");
        }
      } catch (error) {
        toast.error("Failed to update rule");
      } finally {
        setIsActionLoading(false);
      }
    },
    [editingRule, fetchRules]
  );

  const handleDeleteConfirm = useCallback(async () => {
    setIsActionLoading(true);
    try {
      // if (Array.isArray(deleteTarget)) {
      // await api.deleteMultipleRules(deleteTarget);
      // toast.success(`${deleteTarget.length} rule(s) deleted successfully`);
      // } else {
      const payload = {
        rule_ids: [deleteTarget],
      };

      const config = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      };
      const response = await fetch(
        `${baseUrl}/api/v1/governance-rules/governance-rules/`,
        config
      );

      // }
      if (response.ok) {
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        toast.success("Rule deleted successfully");
        await fetchRules();
      } else {
        toast.error("Failed to delete rule");
      }
    } catch (error) {
      toast.error("Failed to delete rule");
    } finally {
      setIsActionLoading(false);
    }
  }, [deleteTarget, fetchRules]);

  const openEditModal = useCallback((rule: Rule) => {
    if (selectedRules.size > 0) {
      toast.error("Please deselect rules before editing");
      return;
    }
    setEditingRule(rule);
    setIsModalOpen(true);
  }, []);

  const openDeleteModal = useCallback((ruleId: number) => {
    setDeleteTarget(ruleId);
    setIsDeleteModalOpen(true);
  }, []);

  // const openBulkDeleteModal = useCallback(() => {
  //     if (selectedRules.size === 0) {
  //         toast.error('Please select rules to delete');
  //         return;
  //     }
  //     // setDeleteTarget(Array.from(selectedRules));
  //     setIsDeleteModalOpen(true);
  // }, [selectedRules]);

  const totalPages = useMemo(
    () => Math.ceil(pagination.total / pagination.size),
    [pagination.total, pagination.size]
  );
  // const activeFiltersCount = useMemo(() => Object.values(filters).filter(v => v).length, [filters]);

  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      if (pagination.page <= 3) {
        for (let i = 1; i <= 4; i++) range.push(i);
        range.push("...");
        range.push(totalPages);
      } else if (pagination.page >= totalPages - 2) {
        range.push(1);
        range.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push("...");
        for (let i = pagination.page - 1; i <= pagination.page + 1; i++)
          range.push(i);
        range.push("...");
        range.push(totalPages);
      }
    }

    return range;
  }, [totalPages, pagination.page]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Data Governance Rules
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Centralized rules management for data quality and compliance
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-200 p-3 sm:p-4 bg-white">
            <div className="flex flex-col justify-end sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search and Filter Row */}
              {/* <div className="flex gap-2 sm:gap-3 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search rules..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className="px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium relative transition-colors whitespace-nowrap"
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {activeFiltersCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                            </div> */}

              {/* Action Buttons Row */}
              <div className="flex gap-2 w-full sm:w-auto">
                {/* <button
                                    onClick={openBulkDeleteModal}
                                    disabled={!(selectedRules.size > 0)}
                                    title={selectedRules.size > 0 ? 'Delete rules' : 'Please select any rule to delete'}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors disabled:text-red-200 disabled:border-red-200 disabled:cursor-not-allowed"
                                >
                                    <span className="sm:hidden">Delete ({selectedRules.size})</span>
                                    <span className="hidden sm:inline">Delete ({selectedRules.size})</span>
                                </button> */}
                <button
                  onClick={() => {
                    setEditingRule(undefined);
                    setIsModalOpen(true);
                  }}
                  // title='Coming Soon...!'
                  title="Create New Rule"
                  // disabled={true}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm disabled:bg-blue-200 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Rule</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-900 font-medium text-lg mb-1">
                No rules found
              </p>
              {/* <p className="text-slate-500">Try adjusting your search or filters</p> */}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {/* <th className="w-12 px-6 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedRules.size === rules.length && rules.length > 0}
                                                onChange={handleSelectAll}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </th> */}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Rules
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {paginatedRules.map((rule) => (
                    <tr
                      key={rule.rule_id}
                      className={`hover:bg-slate-50 transition-colors ${
                        selectedRules.has(rule.rule_id) ? "bg-blue-50" : ""
                      }`}
                    >
                      {/* <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRules.has(rule.rule_id)}
                                                    onChange={() => handleSelectRule(rule.rule_id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td> */}
                      <td className="px-6 py-4">
                        <p
                          title={rule.rules}
                          className="text-sm text-slate-900 font-medium line-clamp-2 max-w-lg truncate"
                        >
                          {rule.rules}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium`}
                        >
                          {rule.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rule.priority)}`}
                        >
                          {rule.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(rule.status)}`}
                        >
                          {rule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                            title="Edit rule"
                          >
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(rule.rule_id)}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with Pagination */}
          {rules.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-4 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {(pagination.page - 1) * pagination.size + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(
                      pagination.page * pagination.size,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {pagination.total}
                  </span>{" "}
                  rules
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Previous
                </button>

                {paginationRange.map((page, idx) =>
                  page === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1.5 text-slate-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: page as number,
                        }))
                      }
                      className={`min-w-[2.5rem] px-3 py-1.5 rounded transition-colors text-sm font-medium ${
                        pagination.page === page
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={!pagination.has_next}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(undefined);
        }}
        onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
        rule={editingRule}
        isLoading={isActionLoading}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        count={Array.isArray(deleteTarget) ? deleteTarget.length : 1}
        isLoading={isActionLoading}
      />

      {/* <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={filters}
                onApply={handleFilterApply}
            /> */}
    </div>
  );
};

export default GovernanceRules;
