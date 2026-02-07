/**
 * Hook for AI improve-text: returns improve() and loading/error state.
 */

import { useState, useCallback } from "react";
import { improveText, type ImproveTextMode } from "./ai-service";

export interface UseImproveTextResult {
  improve: (text: string, mode?: ImproveTextMode) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export function useImproveText(): UseImproveTextResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const improve = useCallback(
    async (text: string, mode: ImproveTextMode = "default"): Promise<string | null> => {
      if (!text?.trim()) return null;
      setError(null);
      setLoading(true);
      try {
        const res = await improveText({ text: text.trim(), mode });
        return res.improvedText ?? null;
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Failed to improve text";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { improve, loading, error };
}
