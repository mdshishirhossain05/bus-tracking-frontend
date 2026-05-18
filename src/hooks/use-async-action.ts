"use client";

import { useCallback, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/error";

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onError?: (message: string, error: unknown) => void;
        fallbackMessage?: string;
      },
    ) => {
      setLoading(true);

      try {
        const result = await fn();
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          options?.fallbackMessage || "Something went wrong.",
        );
        options?.onError?.(message, error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    run,
  };
}
