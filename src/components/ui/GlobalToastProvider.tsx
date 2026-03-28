"use client";

import React from "react";
import { useAppStore } from "@/store/appStore";
import { Loader2 } from "lucide-react";

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
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
            {(toast.type === "info" || toast.type === "warning") && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
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
            <svg className="w-4 h-4 text-gray-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
