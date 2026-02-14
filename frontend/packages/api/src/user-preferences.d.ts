/**
 * User Preferences API Client
 *
 * API functions for managing user preferences.
 */
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
/**
 * Get all user preferences
 */
export declare function getUserPreferences(): Promise<UserPreferenceResponse>;
/**
 * Get a specific preference value by path
 * @param path - Path to preference (e.g., ['ui', 'dataListView', 'roles'])
 */
export declare function getPreference(path?: string[]): Promise<{
    value: unknown;
}>;
/**
 * Update user preferences (merge with existing)
 */
export declare function updatePreferences(preferences: Record<string, unknown>): Promise<UserPreferenceResponse>;
/**
 * Set a specific preference value by path
 */
export declare function setPreference(path: string[], value: unknown): Promise<UserPreferenceResponse>;
/**
 * Remove a preference by path
 */
export declare function removePreference(path: string[]): Promise<{
    message: string;
    preferences: Record<string, unknown>;
}>;
/**
 * Clear all user preferences
 */
export declare function clearPreferences(): Promise<{
    message: string;
}>;
//# sourceMappingURL=user-preferences.d.ts.map