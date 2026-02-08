/**
 * UI Builder API - Stub implementations
 * These will be implemented when the backend UI builder endpoints are ready.
 */

import { api } from "./api-client";

export interface UISchema {
  id: string;
  name: string;
  schema_data: Record<string, unknown>;
  version?: number;
}

export interface UIPage {
  id: string;
  schema_id: string;
  route: string;
  name?: string;
}

export interface UIPageCreate {
  schema_id: string;
  route: string;
  name?: string;
}

export const uiBuilderQueryKeys = {
  schema: (id: string) => ["ui-schema", id] as const,
  pages: () => ["ui-pages"] as const,
};

export async function getUISchema(schemaId: string): Promise<UISchema> {
  const response = await api.get<UISchema>(`/api/v1/ui-builder/schemas/${schemaId}`, {
    requiresAuth: true,
  });
  return response;
}

export async function updateUISchema(
  schemaId: string,
  data: { schema_data: Record<string, unknown> }
): Promise<UISchema> {
  const response = await api.patch<UISchema>(
    `/api/v1/ui-builder/schemas/${schemaId}`,
    data,
    { requiresAuth: true }
  );
  return response;
}

export async function publishUISchema(schemaId: string): Promise<UISchema> {
  const response = await api.post<UISchema>(
    `/api/v1/ui-builder/schemas/${schemaId}/publish`,
    {},
    { requiresAuth: true }
  );
  return response;
}

export async function deleteUISchema(schemaId: string): Promise<void> {
  await api.delete(`/api/v1/ui-builder/schemas/${schemaId}`, {
    requiresAuth: true,
  });
}

export async function createUIPage(data: UIPageCreate): Promise<UIPage> {
  const response = await api.post<UIPage>("/api/v1/ui-builder/pages", data, {
    requiresAuth: true,
  });
  return response;
}

export async function deleteUIPage(pageId: string): Promise<void> {
  await api.delete(`/api/v1/ui-builder/pages/${pageId}`, {
    requiresAuth: true,
  });
}

export async function listUIPages(): Promise<UIPage[]> {
  const response = await api.get<{ items: UIPage[] }>("/api/v1/ui-builder/pages", {
    requiresAuth: true,
  });
  return response?.items ?? [];
}
