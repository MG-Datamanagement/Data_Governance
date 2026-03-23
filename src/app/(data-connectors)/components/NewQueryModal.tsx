"use client";

import React, { useState } from "react";
import { X, Plus, Terminal, Info, Tag as TagIcon, Loader2 } from "lucide-react";
import { CreateQueryRequest } from "@/types/dashboardTypes";

interface NewQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateQueryRequest, "catalog_id">) => Promise<void>;
  isLoading?: boolean;
}

const NewQueryModal: React.FC<NewQueryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sql_text: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.sql_text) return;
    await onSubmit(formData);
    onClose();
    // Reset form
    setFormData({ title: "", description: "", sql_text: "", tags: [] });
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
              <Info size={12} className="text-indigo-400" />
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
              <Info size={12} className="text-indigo-400" />
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
              <Terminal size={12} className="text-indigo-400" />
              SQL Query
            </label>
            <div className="relative group">
              <textarea
                name="sql_text"
                value={formData.sql_text}
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

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TagIcon size={12} className="text-indigo-400" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg min-h-[40px] bg-white group-focus-within:border-indigo-600 transition-all">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-default"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={formData.tags.length === 0 ? "Add tags (press Enter)..." : ""}
                className="flex-1 min-w-[120px] outline-none text-sm text-gray-600 bg-transparent py-0.5 placeholder:text-gray-400"
              />
            </div>
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
            disabled={!formData.title || !formData.sql_text || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-md shadow-indigo-200 flex items-center gap-2 active:scale-95"
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
