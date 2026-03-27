"use client";

import { X, Brain } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Model name must be at least 2 characters").max(120),
  version: z.string().min(1, "Version is required"),
  source: z.string().min(1, "Source is required"),
  task: z.string().min(1, "Task type is required"),
  owner: z.string().min(2, "Owner is required").max(120),
  description: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof schema>;

interface RegisterModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (data: FormValues) => void;
}

export function RegisterModelModal({ isOpen, onClose, onRegister }: RegisterModelModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { version: "v1.0", source: "Internal", task: "Classification" },
  });

  if (!isOpen) return null;

  const onValid = (data: FormValues) => {
    onRegister?.(data);
    reset();
    onClose();
  };

  const FieldError = ({ name }: { name: keyof FormValues }) =>
    errors[name] ? (
      <p role="alert" className="text-xs text-red-500 mt-1">
        {errors[name]?.message as string}
      </p>
    ) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-model-title"
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1.5 mt-1">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 id="register-model-title" className="text-xl font-semibold text-gray-900 leading-none">
              Register Model
            </h2>
          </div>
          <p className="text-[15px] text-gray-500">
            Add a new model to the registry for governance and discovery.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onValid)} noValidate className="overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Model Name */}
            <div>
              <label htmlFor="model-name" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Model Name <span className="text-red-500">*</span>
              </label>
              <input
                id="model-name"
                type="text"
                {...register("name")}
                placeholder="e.g. Customer Churn Predictor"
                aria-invalid={!!errors.name}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400 aria-[invalid=true]:border-red-400"
              />
              <FieldError name="name" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Version */}
              <div>
                <label htmlFor="model-version" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                  Version
                </label>
                <input
                  id="model-version"
                  type="text"
                  {...register("version")}
                  aria-invalid={!!errors.version}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors aria-[invalid=true]:border-red-400"
                />
                <FieldError name="version" />
              </div>
              {/* Source */}
              <div>
                <label htmlFor="model-source" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                  Source
                </label>
                <select
                  id="model-source"
                  {...register("source")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option>Internal</option>
                  <option>Hugging Face</option>
                  <option>AWS SageMaker</option>
                  <option>OpenAI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Task Type */}
              <div>
                <label htmlFor="model-task" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                  Task Type
                </label>
                <select
                  id="model-task"
                  {...register("task")}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option>Classification</option>
                  <option>Anomaly Detection</option>
                  <option>Text Generation</option>
                  <option>Time Series</option>
                </select>
              </div>
              {/* Owner */}
              <div>
                <label htmlFor="model-owner" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                  Owner <span className="text-red-500">*</span>
                </label>
                <input
                  id="model-owner"
                  type="text"
                  {...register("owner")}
                  placeholder="e.g. Data Science Team"
                  aria-invalid={!!errors.owner}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400 aria-[invalid=true]:border-red-400"
                />
                <FieldError name="owner" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="model-desc" className="block text-[15px] font-medium text-gray-900 mb-1.5">
                Description
              </label>
              <textarea
                id="model-desc"
                {...register("description")}
                rows={4}
                placeholder="Describe what this model does, its inputs and outputs..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[15px] font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-[15px] font-medium text-white bg-[#9b8df0] hover:bg-[#8a7aeb] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Register Model"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
