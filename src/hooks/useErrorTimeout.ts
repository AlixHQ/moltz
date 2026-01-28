import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to manage error messages with auto-clear timeout
 * Properly cleans up timers to prevent memory leaks
 * 
 * @param defaultDuration - Default timeout duration in milliseconds (default: 10000ms = 10s)
 * @returns Object with error, setError, and clearError functions
 * 
 * @example
 * const { error, setError, clearError } = useErrorTimeout();
 * // Set error with default duration
 * setError("Something went wrong");
 * // Set error with custom duration
 * setError("Quick error", 5000);
 * // Manually clear error
 * clearError();
 */
export function useErrorTimeout(defaultDuration: number = 10000) {
  const [error, setErrorState] = useState<string | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Clear any pending timeout
  const clearPendingTimeout = () => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };

  // Set error with auto-clear timeout
  const setError = (message: string | null, duration?: number) => {
    // Clear any existing timeout
    clearPendingTimeout();

    // Set the error
    setErrorState(message);

    // Schedule auto-clear if message is not null
    if (message !== null) {
      const clearDuration = duration ?? defaultDuration;
      timeoutRef.current = window.setTimeout(() => {
        setErrorState(null);
        timeoutRef.current = undefined;
      }, clearDuration);
    }
  };

  // Manually clear error
  const clearError = () => {
    clearPendingTimeout();
    setErrorState(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, []);

  return {
    error,
    setError,
    clearError,
  };
}
