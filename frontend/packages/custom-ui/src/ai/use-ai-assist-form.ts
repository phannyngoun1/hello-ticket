/**
 * Hook for AI form suggestions: returns suggest() and loading/error state.
 * Extracts backend error messages from API responses (e.g. FastAPI detail).
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
  | "employee"
  | "show";

export interface UseAIAssistFormOptions {
  formType: FormType;
  currentValues: Record<string, string>;
  fieldHints?: Record<string, string>;
}

export interface UseAIAssistFormResult {
  suggest: (userPrompt?: string) => Promise<Record<string, string>>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/** Extract a single user-facing message from backend/API error. */
function getErrorMessage(e: unknown): string {
  // Standard Error (includes ApiError from api-client, which already parses detail)
  if (e instanceof Error && e.message) {
    return e.message;
  }
  if (e && typeof e === "object" && "message" in e && (e as { message: unknown }).message) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map((m) => (typeof m === "string" ? m : String(m))).join(" ");
  }
  // Some clients attach response body (e.g. axios: error.response?.data)
  const err = e as Record<string, unknown> | null;
  const data = (err?.response as Record<string, unknown> | undefined)?.data ?? err?.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (Array.isArray(d.detail)) {
      const parts = (d.detail as unknown[]).map((item) => {
        if (item && typeof item === "object" && "msg" in item) return String((item as { msg: unknown }).msg);
        return String(item);
      });
      return parts.filter(Boolean).join(" ") || "Validation error";
    }
    if (typeof d.message === "string") return d.message;
  }
  return "Failed to get suggestions";
}

export function useAIAssistForm({
  formType,
  currentValues,
  fieldHints,
}: UseAIAssistFormOptions): UseAIAssistFormResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

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
      setError(getErrorMessage(e));
      return {};
    } finally {
      setLoading(false);
    }
  }, [formType, currentValues, fieldHints]);

  return { suggest, loading, error, clearError };
}
