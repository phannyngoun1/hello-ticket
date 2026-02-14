/**
 * JWT utility functions for decoding token payload without verification
 * Note: This is safe for reading claims like expiration time.
 * Signature verification should be done server-side.
 */
export interface JWTPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    [key: string]: unknown;
}
/**
 * Decode JWT token payload without verification
 * This is safe for reading expiration time and other claims
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export declare function decodeJWTPayload(token: string): JWTPayload | null;
/**
 * Get token expiration time as a Date object
 *
 * @param token - JWT token string
 * @returns Expiration Date or null if invalid/not found
 */
export declare function getTokenExpiration(token: string): Date | null;
/**
 * Check if token is expired
 *
 * @param token - JWT token string
 * @param bufferSeconds - Optional buffer time in seconds (default: 0)
 * @returns true if expired or will expire within buffer time
 */
export declare function isTokenExpired(token: string, bufferSeconds?: number): boolean;
/**
 * Get time until token expires in milliseconds
 *
 * @param token - JWT token string
 * @returns Milliseconds until expiration, or null if invalid/expired
 */
export declare function getTimeUntilExpiration(token: string): number | null;
//# sourceMappingURL=jwt.d.ts.map