
import React from "react";
import { UseFormRegister, FieldError } from "react-hook-form";

interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  register: UseFormRegister<any>;
  error?: FieldError;
  disabled?: boolean;
  helpText?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  options,
  required = false,
  register,
  error,
  disabled = false,
  helpText,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        disabled={disabled}
        {...register(name)}
        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <span>⚠</span> {error.message}
        </p>
      )}
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
};