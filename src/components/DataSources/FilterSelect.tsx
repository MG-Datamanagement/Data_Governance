import React, { memo } from "react";

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const FilterSelect = memo<FilterSelectProps>(
  ({ value, onChange, options, placeholder, className = "" }) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none  ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

FilterSelect.displayName = "FilterSelect";