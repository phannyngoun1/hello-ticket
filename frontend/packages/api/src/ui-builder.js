/**
 * UI Builder API - Stub implementations
 * These will be implemented when the backend UI builder endpoints are ready.
 */
import { api } from "./api-client";
export const uiBuilderQueryKeys = {
    schema: (id) => ["ui-schema", id],
    pages: () => ["ui-pages"],
};
export async function getUISchema(schemaId) {
    const response = await api.get(`/api/v1/ui-builder/schemas/${schemaId}`, {
        requiresAuth: true,
    });
    return response;
}
export async function updateUISchema(schemaId, data) {
    const response = await api.patch(`/api/v1/ui-builder/schemas/${schemaId}`, data, { requiresAuth: true });
    return response;
}
export async function publishUISchema(schemaId) {
    const response = await api.post(`/api/v1/ui-builder/schemas/${schemaId}/publish`, {}, { requiresAuth: true });
    return response;
}
export async function deleteUISchema(schemaId) {
    await api.delete(`/api/v1/ui-builder/schemas/${schemaId}`, {
        requiresAuth: true,
    });
}
export async function createUIPage(data) {
    const response = await api.post("/api/v1/ui-builder/pages", data, {
        requiresAuth: true,
    });
    return response;
}
export async function deleteUIPage(pageId) {
    await api.delete(`/api/v1/ui-builder/pages/${pageId}`, {
        requiresAuth: true,
    });
}
export async function listUIPages() {
    const response = await api.get("/api/v1/ui-builder/pages", {
        requiresAuth: true,
    });
    return response?.items ?? [];
}
