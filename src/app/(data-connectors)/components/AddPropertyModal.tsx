import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, value: string, id?: string) => void;
  initialData?: { id: string; name: string; value: string } | null;
}

export default function AddPropertyModal({ isOpen, onClose, onSave, initialData }: AddPropertyModalProps) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setValue(initialData.value);
      } else {
        setName("");
        setValue("");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !value.trim()) return;
    onSave(name.trim(), value.trim(), initialData?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {initialData ? "Edit Property" : "Add New Property"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {initialData 
                ? "Update the metadata property for this dataset." 
                : "Add a custom metadata property to this dataset."}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Property Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Steward, Region, Cost Center..."
              className="w-full px-3 py-2 border-2 border-indigo-500/30 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter property value..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !value.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-400 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {initialData ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </div>
    </div>
  );
}
