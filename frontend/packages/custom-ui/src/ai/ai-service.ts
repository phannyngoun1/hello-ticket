/**
 * AI API client for improve-text and form-suggest.
 */

import { api } from "@truths/api";

const AI_BASE = "/api/v1/ai";

export type ImproveTextMode = "grammar" | "clarity" | "tone" | "default";

export interface ImproveTextRequest {
  text: string;
  mode?: ImproveTextMode;
}

export interface ImproveTextResponse {
  improvedText: string;
}

export interface FormSuggestRequest {
  formType: string;
  currentValues?: Record<string, string>;
  fieldHints?: Record<string, string>;
  /** Optional instructions from the user to guide suggestions (e.g. tone, focus). */
  userPrompt?: string;
}

export interface FormSuggestResponse {
  suggestedValues: Record<string, string>;
}

export interface AIHealthResponse {
  status: string;
  ai_configured: boolean;
  message: string;
}

export async function improveText(
  request: ImproveTextRequest
): Promise<ImproveTextResponse> {
  return api.post<ImproveTextResponse>(`${AI_BASE}/improve-text`, request, {
    requiresAuth: true,
  });
}

export async function formSuggest(
  request: FormSuggestRequest
): Promise<FormSuggestResponse> {
  return api.post<FormSuggestResponse>(`${AI_BASE}/form-suggest`, request, {
    requiresAuth: true,
  });
}

export async function getAIHealth(): Promise<AIHealthResponse> {
  return api.get<AIHealthResponse>(`${AI_BASE}/health`);
}
