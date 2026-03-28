"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/Fallbacks";
import { logger } from "@/lib/logger";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Uncaught route error:", error, { digest: error.digest });
  }, [error]);

  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
