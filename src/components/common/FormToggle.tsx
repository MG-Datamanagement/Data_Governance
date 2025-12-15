
import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface FormToggleProps {
  label: string;
  name: string;
  description?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const FormToggle: React.FC<FormToggleProps> = ({
  label,
  name,
  description,
  error,
  disabled = false,
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
        {error && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <span>⚠</span> {error.message}
          </p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
      </label>
    </div>
  );
};