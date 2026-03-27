import React, { useState, useEffect } from 'react';

interface AddSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: string; value: string; description?: string }) => void;
  isLoading?: boolean;
  initialData?: {
    id?: string;
    name: string;
    type: string;
    description?: string;
  } | null;
}

const AddSecretModal: React.FC<AddSecretModalProps> = ({ isOpen, onClose, onSave, isLoading, initialData }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('password');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = !!initialData?.id;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type || 'password');
        setDescription(initialData.description || '');
        setValue(''); // Clear value on edit, as we don't fetch it
      } else {
        setName('');
        setType('password');
        setValue('');
        setDescription('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, value, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {isEditMode ? 'Update Secret' : 'Add New Secret'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Secret Name
            </label>
            <input
              type="text"
              required
              disabled={isEditMode || isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., POSTGRES_PASSWORD"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Type
            </label>
            <select
              required
              disabled={isEditMode || isLoading}
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-gray-50 appearance-none"
            >
              <option value="password">Password</option>
              <option value="connection_string">Connection String</option>
              <option value="api_key">API Key</option>
              <option value="token">Token</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Value {isEditMode && <span className="text-gray-400 font-normal">(Enter new value to update)</span>}
            </label>
            <input
              type="password"
              required={!isEditMode}
              disabled={isLoading}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter secure value"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              disabled={isLoading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this secret used for?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none disabled:opacity-50"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!isEditMode && (!name || !value))}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                isEditMode ? 'Update Secret' : 'Add Secret'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSecretModal;
