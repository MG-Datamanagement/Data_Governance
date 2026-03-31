import React, { useEffect } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, "Property name is required").max(100, "Max 100 characters"),
  value: z.string().min(1, "Value is required").max(500, "Max 500 characters"),
});
type FormValues = z.infer<typeof schema>;

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, value: string, id?: string, oldName?: string) => void;
  initialData?: { id: string; name: string; value: string } | null;
}

export default function AddPropertyModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddPropertyModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) {
      reset(initialData ? { name: initialData.name, value: initialData.value } : { name: "", value: "" });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const onValid = (data: FormValues) => {
    onSave(data.name, data.value, initialData?.id, initialData?.name);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-property-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 id="add-property-title" className="text-lg font-bold text-gray-900">
              {initialData ? "Edit Property" : "Add New Property"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {initialData
                ? "Update the metadata property for this dataset."
                : "Add a custom metadata property to this dataset."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onValid)} noValidate>
          <div className="px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="prop-name" className="text-sm font-semibold text-gray-700">
                Property Name
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="prop-name"
                    placeholder="e.g. Data Steward, Region, Cost Center..."
                    error={(errors.name as any)?.message}
                  />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prop-value" className="text-sm font-semibold text-gray-700">
                Value
              </label>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="prop-value"
                    placeholder="Enter property value..."
                    error={(errors.value as any)?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
