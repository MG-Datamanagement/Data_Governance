"use client";

/**
 * QueryErrorBoundary.tsx — React Query-aware Error Boundary (Phase 9.2)
 *
 * Wraps any tab or page section that uses React Query data fetching.
 * On error: shows a card with the error message and a Retry button that:
 *   1. Calls queryClient.resetQueries() on the provided keys to re-fetch
 *   2. Resets the error boundary state so children re-mount
 *
 * Usage:
 *   <QueryErrorBoundary queryKeys={[["datasets"]]} label="Dataset List">
 *     <DatasetListPage />
 *   </QueryErrorBoundary>
 */

import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Human-readable label shown in the error card (e.g. "Lineage Graph") */
  label?: string;
  /** Called on retry — pass queryClient.resetQueries or similar */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(`QueryErrorBoundary [${this.props.label ?? "section"}] caught error`, error, {
      componentStack: info.componentStack ?? undefined,
      retryCount: this.state.retryCount,
    });
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = "this section" } = this.props;

    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] px-6 py-8">
        <div className="max-w-sm w-full bg-white border border-red-200 rounded-xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Failed to load {label}
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            {process.env.NODE_ENV === "development" && this.state.error
              ? this.state.error.message
              : "Something went wrong. Please try again."}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
          {this.state.retryCount > 0 && (
            <p className="text-[10px] text-gray-400 mt-3">
              Retried {this.state.retryCount} time{this.state.retryCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    );
  }
}
