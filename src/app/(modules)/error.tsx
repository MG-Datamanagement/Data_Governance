"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/Fallbacks";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
