"use client";

import React from "react";
import { useAppStore } from "@/store/appStore";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";

export const GlobalToastProvider: React.FC = () => {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 transform transition-all"
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : toast.type === "warning" ? "bg-orange-500" : toast.type === "loading" ? "bg-indigo-500" : "bg-blue-500"}`}
          >
            {toast.type === "success" && (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
            {toast.type === "error" && (
              <X className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
            {(toast.type === "info" || toast.type === "warning") && (
              <AlertTriangle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
            {toast.type === "loading" && (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            )}
          </div>
          <p className="text-sm font-medium tracking-wide">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>
      ))}
    </div>
  );
};
