/**
 * User Preferences API Client
 * 
 * API functions for managing user preferences.
 */

import { api } from './api-client';

// ============================================================================
// Types
// ============================================================================

export interface UserPreferenceResponse {
  preferences: Record<string, unknown>;
}

export interface UserPreferenceUpdateRequest {
  preferences: Record<string, unknown>;
}

export interface UserPreferenceSetRequest {
  path: string[];
  value: unknown;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get all user preferences
 */
export async function getUserPreferences(): Promise<UserPreferenceResponse> {
  return api.get<UserPreferenceResponse>(
    '/api/v1/user-preferences/',
    { requiresAuth: true }
  );
}

/**
 * Get a specific preference value by path
 * @param path - Path to preference (e.g., ['ui', 'dataListView', 'roles'])
 */
export async function getPreference(
  path: string[] = []
): Promise<{ value: unknown }> {
  const queryParams = path.length > 0 
    ? `?${path.map(p => `path=${encodeURIComponent(p)}`).join('&')}`
    : '';
  
  return api.get<{ value: unknown }>(
    `/api/v1/user-preferences/get${queryParams}`,
    { requiresAuth: true }
  );
}

/**
 * Update user preferences (merge with existing)
 */
export async function updatePreferences(
  preferences: Record<string, unknown>
): Promise<UserPreferenceResponse> {
  return api.put<UserPreferenceResponse>(
    '/api/v1/user-preferences/',
    { preferences },
    { requiresAuth: true }
  );
}

/**
 * Set a specific preference value by path
 */
export async function setPreference(
  path: string[],
  value: unknown
): Promise<UserPreferenceResponse> {
  return api.post<UserPreferenceResponse>(
    '/api/v1/user-preferences/set',
    { path, value },
    { requiresAuth: true }
  );
}

/**
 * Remove a preference by path
 */
export async function removePreference(
  path: string[]
): Promise<{ message: string; preferences: Record<string, unknown> }> {
  const queryParams = path.map(p => `path=${encodeURIComponent(p)}`).join('&');
  
  return api.delete<{ message: string; preferences: Record<string, unknown> }>(
    `/api/v1/user-preferences/remove?${queryParams}`,
    { requiresAuth: true }
  );
}

/**
 * Clear all user preferences
 */
export async function clearPreferences(): Promise<{ message: string }> {
  return api.delete<{ message: string }>(
    '/api/v1/user-preferences/clear',
    { requiresAuth: true }
  );
}
