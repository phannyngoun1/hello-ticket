/**
 * User Preferences API Client
 *
 * API functions for managing user preferences.
 */
import { api } from './api-client';
// ============================================================================
// API Functions
// ============================================================================
/**
 * Get all user preferences
 */
export async function getUserPreferences() {
    return api.get('/api/v1/user-preferences/', { requiresAuth: true });
}
/**
 * Get a specific preference value by path
 * @param path - Path to preference (e.g., ['ui', 'dataListView', 'roles'])
 */
export async function getPreference(path = []) {
    const queryParams = path.length > 0
        ? `?${path.map(p => `path=${encodeURIComponent(p)}`).join('&')}`
        : '';
    return api.get(`/api/v1/user-preferences/get${queryParams}`, { requiresAuth: true });
}
/**
 * Update user preferences (merge with existing)
 */
export async function updatePreferences(preferences) {
    return api.put('/api/v1/user-preferences/', { preferences }, { requiresAuth: true });
}
/**
 * Set a specific preference value by path
 */
export async function setPreference(path, value) {
    return api.post('/api/v1/user-preferences/set', { path, value }, { requiresAuth: true });
}
/**
 * Remove a preference by path
 */
export async function removePreference(path) {
    const queryParams = path.map(p => `path=${encodeURIComponent(p)}`).join('&');
    return api.delete(`/api/v1/user-preferences/remove?${queryParams}`, { requiresAuth: true });
}
/**
 * Clear all user preferences
 */
export async function clearPreferences() {
    return api.delete('/api/v1/user-preferences/clear', { requiresAuth: true });
}
