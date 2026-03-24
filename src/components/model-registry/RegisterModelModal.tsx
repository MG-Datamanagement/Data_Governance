"use client";

import { X, Brain } from "lucide-react";

interface RegisterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterModelModal({ isOpen, onClose }: RegisterModelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1.5 mt-1">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900 leading-none">Register Model</h2>
          </div>
          <p className="text-[15px] text-gray-500">
            Add a new model to the registry for governance and discovery.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Model Name */}
          <div>
            <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
              Model Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Customer Churn Predictor"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Version */}
            <div>
              <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Version
              </label>
              <input
                type="text"
                defaultValue="v1.0"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
            {/* Source */}
            <div>
              <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Source
              </label>
              <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none">
                <option>Internal</option>
                <option>Hugging Face</option>
                <option>AWS SageMaker</option>
                <option>OpenAI</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Task Type */}
            <div>
              <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Task Type
              </label>
              <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none">
                <option>Classification</option>
                <option>Anomaly Detection</option>
                <option>Text Generation</option>
                <option>Time Series</option>
              </select>
            </div>
            {/* Owner */}
            <div>
              <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Owner *
              </label>
              <input
                type="text"
                placeholder="e.g. Data Science Team"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[15px] font-medium text-gray-900 mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="Describe what this model does, its inputs and outputs..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[15px] font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
           onClick={onClose}
           className="px-5 py-2.5 text-[15px] font-medium text-white bg-[#9b8df0] hover:bg-[#8a7aeb] rounded-lg transition-colors"
          >
            Register Model
          </button>
        </div>
      </div>
    </div>
  );
}
