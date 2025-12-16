'use client';

import { X, Search, Plus, Minus, CheckCircle } from 'lucide-react';
import { useMemo } from 'react';
import { TableDetails } from './TableModel';

interface Tag {
  id: number;
  urn: string;
  name: string;
  color: string;
  description?: string;
  is_system_tag: boolean;
}

interface AddTagModalProps {
  open: boolean;
  onClose: () => void;
  table: TableDetails;
  availableTags: Tag[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  search: string;
  setSearch: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function AddTagModal({
  open,
  onClose,
  table,
  availableTags,
  selectedTags,
  setSelectedTags,
  search,
  setSearch,
  onSubmit,
  isSubmitting = false,
}: AddTagModalProps) {
  const filteredTags = useMemo(
    () =>
      availableTags.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
      ),
    [availableTags, search]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Tags</h3>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-none space-y-2">
            {filteredTags.map(tag => {
              const isAlreadyAttached = table?.tags?.some(existingTag => existingTag.urn === tag.urn);
              const isSelected = selectedTags.includes(tag.urn);

              return (
                <label key={tag.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isAlreadyAttached ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
                  }`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isAlreadyAttached}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.urn]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.urn));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      border: `1px solid ${tag.color}40`
                    }}
                  >
                    {tag.name}
                    {isAlreadyAttached && (
                      <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                    )}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">{tag.description}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!selectedTags.length || isSubmitting}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Tags'}
          </button>
        </div>
      </div>
    </div>
  );
}
