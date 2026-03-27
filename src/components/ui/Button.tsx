import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "transparent" | "danger" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: React.ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm border border-transparent",
  secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100",
  outline: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm",
  transparent: "text-gray-700 hover:bg-gray-100 border border-transparent",
  danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100",
  ghost: "text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-9 px-4 text-sm rounded-lg",
  lg: "h-11 px-6 text-sm rounded-xl font-bold",
  icon: "h-9 w-9 flex items-center justify-center rounded-lg px-0",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={isLoading || disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!isLoading && icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
}
