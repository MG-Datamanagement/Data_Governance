import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Option } from "@/types";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
  placeholder?: string;
  error?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { options, placeholder = "Select", error, className, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        "px-3 py-2 text-gray-900 text-sm font-medium rounded-md border border-gray-200 bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed",
        error && "border-red-500 focus:border-red-500 focus:ring-red-500/40",
        className,
      )}
      {...(props.value !== undefined ? {} : { defaultValue: "" })}
      {...props}
    >
      <option disabled value="">{placeholder}</option>
      {options.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
});
