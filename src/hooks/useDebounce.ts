import { useEffect, useState } from "react";

/**
 * Debounces a value — waits for delay ms after the last change before updating.
 */

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler); // cleanup timeout
  }, [value, delay]);

  return debouncedValue;
}
