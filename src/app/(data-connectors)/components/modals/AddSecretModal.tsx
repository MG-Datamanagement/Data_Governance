import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "@/components/ui/Select";

// ─── Schema ───────────────────────────────────────────────────────────────────
const secretTypeValues = ["password", "connection_string", "api_key", "token"] as const;

const createSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .regex(/^[A-Z0-9_]+$/i, "Only letters, numbers, and underscores allowed"),
  type: z.enum(secretTypeValues),
  value: z.string().min(1, "Secret value is required"),
  description: z.string().max(500).optional(),
});

const editSchema = createSchema.extend({
  name: z.string().min(1),
  value: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;
type FormValues = CreateValues | EditValues;

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

const AddSecretModal: React.FC<AddSecretModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
}) => {
  const isEditMode = !!initialData?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditMode ? editSchema : createSchema),
    defaultValues: { type: "password" },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        initialData
          ? { name: initialData.name, type: (initialData.type as any) || "password", description: initialData.description ?? "", value: "" }
          : { name: "", type: "password", value: "", description: "" }
      );
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onValid = (data: FormValues) => {
    onSave({ name: data.name, type: data.type, value: (data as CreateValues).value ?? "", description: data.description });
  };

  const fieldError = (key: keyof FormValues) =>
    errors[key] ? <p role="alert" className="text-xs text-red-500 mt-1">{(errors[key] as any)?.message}</p> : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-secret-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="add-secret-title" className="text-lg font-bold text-gray-900">
            {isEditMode ? "Update Secret" : "Add New Secret"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onValid)} noValidate className="p-6 space-y-4">
          <div>
            <label htmlFor="secret-name" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Secret Name
            </label>
            <input
              id="secret-name"
              type="text"
              {...register("name")}
              disabled={isEditMode || isLoading}
              placeholder="e.g., POSTGRES_PASSWORD"
              aria-invalid={!!errors.name}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:bg-gray-50 aria-[invalid=true]:border-red-400"
            />
            {fieldError("name")}
          </div>

          <div>
            <label htmlFor="secret-type" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Type
            </label>
            <Select
              id="secret-type"
              {...register("type")}
              disabled={isEditMode || isLoading}
              className="w-full bg-white text-gray-900"
              options={[
                { value: "password", label: "Password" },
                { value: "connection_string", label: "Connection String" },
                { value: "api_key", label: "API Key" },
                { value: "token", label: "Token" }
              ]}
            />
            {fieldError("type")}
          </div>

          <div>
            <label htmlFor="secret-value" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Value{" "}
              {isEditMode && <span className="text-gray-400 font-normal">(Enter new value to update)</span>}
            </label>
            <input
              id="secret-value"
              type="password"
              {...register("value")}
              disabled={isLoading}
              placeholder="Enter secure value"
              aria-invalid={!!errors.value}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 aria-[invalid=true]:border-red-400"
            />
            {fieldError("value")}
          </div>

          <div>
            <label htmlFor="secret-desc" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="secret-desc"
              {...register("description")}
              disabled={isLoading}
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
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : isEditMode ? (
                "Update Secret"
              ) : (
                "Add Secret"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSecretModal;
