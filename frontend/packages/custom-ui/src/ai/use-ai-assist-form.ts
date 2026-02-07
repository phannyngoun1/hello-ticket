/**
 * Hook for AI form suggestions: returns suggest() and loading/error state.
 */

import { useState, useCallback } from "react";
import { formSuggest } from "./ai-service";

export type FormType =
  | "customer"
  | "venue"
  | "event"
  | "organizer"
  | "user"
  | "group"
  | "employee";

export interface UseAIAssistFormOptions {
  formType: FormType;
  currentValues: Record<string, string>;
  fieldHints?: Record<string, string>;
}

export interface UseAIAssistFormResult {
  suggest: (userPrompt?: string) => Promise<Record<string, string>>;
  loading: boolean;
  error: string | null;
}

export function useAIAssistForm({
  formType,
  currentValues,
  fieldHints,
}: UseAIAssistFormOptions): UseAIAssistFormResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = useCallback(async (userPrompt?: string): Promise<Record<string, string>> => {
    setError(null);
    setLoading(true);
    try {
      const res = await formSuggest({
        formType,
        currentValues: currentValues ?? {},
        fieldHints,
        userPrompt: userPrompt?.trim() || undefined,
      });
      return res.suggestedValues ?? {};
    } catch (e: unknown) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Failed to get suggestions";
      setError(message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [formType, currentValues, fieldHints]);

  return { suggest, loading, error };
}
