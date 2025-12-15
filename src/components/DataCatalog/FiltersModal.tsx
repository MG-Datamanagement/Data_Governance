// import { X, Filter, ChevronDown } from "lucide-react";
// import React, { useState, useEffect } from "react";

// export interface FilterState {
//   domain_ids: number[];
//   data_source_ids: number[];
//   owner_ids: number[];
//   sensitivity_levels: string[];
//   is_certified: boolean | null;
// }

// export interface FiltersModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onApply: (filters: FilterState) => void;
//   initialFilters: FilterState;
//   domains: Array<{ id: number; name: string }>;
//   dataSources: Array<{ id: number; name: string; type: string }>;
//   owners: Array<{ id: number; name: string; email: string }>;
// }

// const SENSITIVITY_LEVELS = ["public", "internal", "confidential", "restricted"];

// export const FiltersModal: React.FC<FiltersModalProps> = ({
//   isOpen,
//   onClose,
//   onApply,
//   initialFilters,
//   domains = [],
//   dataSources = [],
//   owners = [],
// }: FiltersModalProps) => {
//   const [filters, setFilters] = useState<FilterState>(initialFilters);

//   useEffect(() => {
//     setFilters(initialFilters);
//   }, [initialFilters, isOpen]);

//   if (!isOpen) return null;

//   const handleToggleArray = <T,>(arr: T[], value: T): T[] => {
//     return arr.includes(value)
//       ? arr.filter((v) => v !== value)
//       : [...arr, value];
//   };

//   const handleClearAll = () => {
//     const clearedFilters: FilterState = {
//       domain_ids: [],
//       data_source_ids: [],
//       owner_ids: [],
//       sensitivity_levels: [],
//       is_certified: null,
//     };
//     setFilters(clearedFilters);
//   };

//   const handleApply = () => {
//     onApply(filters);
//     onClose();
//   };

//   const getActiveFilterCount = () => {
//     let count = 0;
//     if (filters.domain_ids.length > 0) count++;
//     if (filters.data_source_ids.length > 0) count++;
//     if (filters.owner_ids.length > 0) count++;
//     if (filters.sensitivity_levels.length > 0) count++;
//     if (filters.is_certified !== null) count++;
//     return count;
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div
//         className="absolute inset-0 bg-black bg-opacity-50"
//         onClick={onClose}
//       />

//       <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center gap-2">
//             <Filter className="h-5 w-5 text-gray-700 dark:text-gray-300" />
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//               Advanced Filters
//             </h2>
//             {getActiveFilterCount() > 0 && (
//               <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
//                 {getActiveFilterCount()} active
//               </span>
//             )}
//           </div>
//           <button
//             onClick={onClose}
//             className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//           >
//             <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto px-6 py-6">
//           <div className="grid grid-cols-2 gap-6">
//             {/* Domains */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Domains
//                 {filters.domain_ids.length > 0 && (
//                   <span className="ml-2 text-blue-600 dark:text-blue-400">
//                     ({filters.domain_ids.length} selected)
//                   </span>
//                 )}
//               </label>
//               <select
//                 multiple
//                 value={filters.domain_ids.map(String)}
//                 onChange={(e) => {
//                   const selectedOptions = Array.from(
//                     e.target.selectedOptions,
//                     (option) => Number(option.value)
//                   );
//                   setFilters((prev) => ({
//                     ...prev,
//                     domain_ids: selectedOptions,
//                   }));
//                 }}
//                 className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 {domains.map((domain) => (
//                   <option key={domain.id} value={domain.id}>
//                     {domain.name}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//                 Hold Ctrl/Cmd to select multiple
//               </p>
//             </div>

//             {/* Data Sources */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Data Sources
//                 {filters.data_source_ids.length > 0 && (
//                   <span className="ml-2 text-blue-600 dark:text-blue-400">
//                     ({filters.data_source_ids.length} selected)
//                   </span>
//                 )}
//               </label>
//               <select
//                 multiple
//                 value={filters.data_source_ids.map(String)}
//                 onChange={(e) => {
//                   const selectedOptions = Array.from(
//                     e.target.selectedOptions,
//                     (option) => Number(option.value)
//                   );
//                   setFilters((prev) => ({
//                     ...prev,
//                     data_source_ids: selectedOptions,
//                   }));
//                 }}
//                 className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 {dataSources.map((source) => (
//                   <option key={source.id} value={source.id}>
//                     {source.name} ({source.type})
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//                 Hold Ctrl/Cmd to select multiple
//               </p>
//             </div>

//             {/* Owners */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Owners
//                 {filters.owner_ids.length > 0 && (
//                   <span className="ml-2 text-blue-600 dark:text-blue-400">
//                     ({filters.owner_ids.length} selected)
//                   </span>
//                 )}
//               </label>
//               <select
//                 multiple
//                 value={filters.owner_ids.map(String)}
//                 onChange={(e) => {
//                   const selectedOptions = Array.from(
//                     e.target.selectedOptions,
//                     (option) => Number(option.value)
//                   );
//                   setFilters((prev) => ({
//                     ...prev,
//                     owner_ids: selectedOptions,
//                   }));
//                 }}
//                 className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 {owners.map((owner) => (
//                   <option key={owner.id} value={owner.id}>
//                     {owner.name}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//                 Hold Ctrl/Cmd to select multiple
//               </p>
//             </div>

//             {/* Sensitivity Levels */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Sensitivity Level
//                 {filters.sensitivity_levels.length > 0 && (
//                   <span className="ml-2 text-blue-600 dark:text-blue-400">
//                     ({filters.sensitivity_levels.length} selected)
//                   </span>
//                 )}
//               </label>
//               <select
//                 multiple
//                 value={filters.sensitivity_levels}
//                 onChange={(e) => {
//                   const selectedOptions = Array.from(
//                     e.target.selectedOptions,
//                     (option) => option.value
//                   );
//                   setFilters((prev) => ({
//                     ...prev,
//                     sensitivity_levels: selectedOptions,
//                   }));
//                 }}
//                 className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 {SENSITIVITY_LEVELS.map((level) => (
//                   <option key={level} value={level}>
//                     {level.charAt(0).toUpperCase() + level.slice(1)}
//                   </option>
//                 ))}
//               </select>
//               <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//                 Hold Ctrl/Cmd to select multiple
//               </p>
//             </div>
//           </div>

//           {/* Certification Status - Full Width */}
//           <div className="mt-6">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Certification Status
//             </label>
//             <select
//               value={
//                 filters.is_certified === null
//                   ? "all"
//                   : filters.is_certified.toString()
//               }
//               onChange={(e) => {
//                 const value =
//                   e.target.value === "all" ? null : e.target.value === "true";
//                 setFilters((prev) => ({ ...prev, is_certified: value }));
//               }}
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">Select a value</option>
//               <option value="true">Certified Only</option>
//               <option value="false">Not Certified</option>
//             </select>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
//           <button
//             onClick={handleClearAll}
//             className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//           >
//             Clear All
//           </button>
//           <div className="flex items-center gap-3">
//             <button
//               onClick={onClose}
//               className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleApply}
//               className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
//             >
//               Apply Filters
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };


import { X, Filter, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export interface FilterState {
  domain_ids: number[];
  data_source_ids: number[];
  owner_ids: number[];
  sensitivity_levels: string[];
  is_certified: boolean | null;
}

export interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  domains: Array<{ id: number; name: string }>;
  dataSources: Array<{ id: number; name: string; type: string }>;
  owners: Array<{ id: number; name: string; email: string }>;
}

const SENSITIVITY_LEVELS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Confidential' },
  { value: 'restricted', label: 'Restricted' }
];

interface MultiSelectProps {
  label: string;
  options: Array<{ id: number; name: string; type?: string }>;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

function MultiSelect({ label, options, selectedIds, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = options
    .filter(opt => selectedIds.includes(opt.id))
    .map(opt => opt.name)
    .join(', ');

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {selectedIds.length > 0 && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            ({selectedIds.length} selected)
          </span>
        )}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <span className="truncate">
          {selectedIds.length === 0 
            ? (placeholder || `Select ${label}`) 
            : selectedNames || `${selectedIds.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <label
              key={option.id}
              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => handleToggle(option.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate">
                  {option.name}
                </span>
                {option.type && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.type}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface MultiSelectStringProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

function MultiSelectString({ label, options, selectedValues, onChange, placeholder }: MultiSelectStringProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectedLabels = options
    .filter(opt => selectedValues.includes(opt.value))
    .map(opt => opt.label)
    .join(', ');

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {selectedValues.length > 0 && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            ({selectedValues.length} selected)
          </span>
        )}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <span className="truncate">
          {selectedValues.length === 0 
            ? (placeholder || `Select ${label}`) 
            : selectedLabels || `${selectedValues.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map(option => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export const FiltersModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  domains = [],
  dataSources = [],
  owners = []
}: FiltersModalProps) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    const clearedFilters: FilterState = {
      domain_ids: [],
      data_source_ids: [],
      owner_ids: [],
      sensitivity_levels: [],
      is_certified: null
    };
    setFilters(clearedFilters);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.domain_ids.length > 0) count++;
    if (filters.data_source_ids.length > 0) count++;
    if (filters.owner_ids.length > 0) count++;
    if (filters.sensitivity_levels.length > 0) count++;
    if (filters.is_certified !== null) count++;
    return count;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 !m-0">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Filters
            </h2>
            {getActiveFilterCount() > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Domains */}
            <MultiSelect
              label="Domains"
              options={domains}
              selectedIds={filters.domain_ids}
              onChange={(ids) => setFilters(prev => ({ ...prev, domain_ids: ids }))}
              placeholder="Select domains"
            />

            {/* Data Sources */}
            <MultiSelect
              label="Data Sources"
              options={dataSources}
              selectedIds={filters.data_source_ids}
              onChange={(ids) => setFilters(prev => ({ ...prev, data_source_ids: ids }))}
              placeholder="Select data sources"
            />

            {/* Owners */}
            <MultiSelect
              label="Owners"
              options={owners}
              selectedIds={filters.owner_ids}
              onChange={(ids) => setFilters(prev => ({ ...prev, owner_ids: ids }))}
              placeholder="Select owners"
            />

            {/* Sensitivity Levels */}
            <MultiSelectString
              label="Sensitivity Level"
              options={SENSITIVITY_LEVELS}
              selectedValues={filters.sensitivity_levels}
              onChange={(values) => setFilters(prev => ({ ...prev, sensitivity_levels: values }))}
              placeholder="Select sensitivity levels"
            />
          </div>

          {/* Certification Status - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Certification Status
            </label>
            <select
              value={filters.is_certified === null ? 'all' : filters.is_certified.toString()}
              onChange={(e) => {
                const value = e.target.value === 'all' ? null : e.target.value === 'true';
                setFilters(prev => ({ ...prev, is_certified: value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tables</option>
              <option value="true">Certified Only</option>
              <option value="false">Not Certified</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-xl">
          <button
            onClick={handleClearAll}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Clear All
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}