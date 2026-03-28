"use client";

import React, { useState } from "react";
import { X, Plus, Terminal, Info, User as UserIcon, Loader2 } from "lucide-react";
import { CreateQueryRequest, QueryOwner } from "@/types/dashboardTypes";
import { Select } from "@/components/ui/Select";

interface NewQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQueryRequest) => Promise<void>;
  ownersList: QueryOwner[];
  isLoading?: boolean;
}

const NewQueryModal: React.FC<NewQueryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ownersList,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateQueryRequest>({
    title: "",
    description: "",
    query_text: "",
    owner_id: "",
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.query_text || !formData.owner_id) return;
    await onSubmit(formData);
    onClose();
    // Reset form
    setFormData({ title: "", description: "", query_text: "", owner_id: "" });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Plus size={14} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add Highlighted Query</h2>
              <p className="text-xs text-gray-400">Save frequent or complex queries for quick access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 py-2 space-y-3">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Query Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Weekly Active Customers"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide context on when to use this query..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all resize-none"
            />
          </div>

          {/* SQL Editor Placeholder */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              SQL Query
            </label>
            <div className="relative group">
              <textarea
                name="query_text"
                value={formData.query_text}
                onChange={handleChange}
                placeholder="SELECT * FROM table WHERE condition..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                required
              />
              <div className="absolute right-3 bottom-3 text-[10px] font-bold text-gray-300 pointer-events-none group-focus-within:text-indigo-300 transition-colors uppercase tracking-widest">
                Read-only in preview
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Owner
            </label>
            <Select
              name="owner_id"
              value={formData.owner_id}
              onChange={handleChange}
              className="bg-white"
              required
              options={[
                { value: "", label: "Select an owner" },
                ...ownersList.map((owner) => ({
                  value: owner.id,
                  label: `${owner.name} (${owner.role})`
                }))
              ]}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.query_text || !formData.owner_id || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? "Saving..." : "Save Query"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewQueryModal;
