/**
 * JWT utility functions for decoding token payload without verification
 * Note: This is safe for reading claims like expiration time.
 * Signature verification should be done server-side.
 */
/**
 * Decode JWT token payload without verification
 * This is safe for reading expiration time and other claims
 *
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWTPayload(token) {
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        // Decode payload (second part)
        const payload = parts[1];
        // Add padding if needed (Base64URL may not have padding)
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        // Decode from base64
        const decoded = atob(padded);
        const parsed = JSON.parse(decoded);
        return parsed;
    }
    catch (error) {
        console.error('Error decoding JWT payload:', error);
        return null;
    }
}
/**
 * Get token expiration time as a Date object
 *
 * @param token - JWT token string
 * @returns Expiration Date or null if invalid/not found
 */
export function getTokenExpiration(token) {
    const payload = decodeJWTPayload(token);
    if (!payload || !payload.exp) {
        return null;
    }
    // exp is Unix timestamp in seconds, convert to milliseconds
    return new Date(payload.exp * 1000);
}
/**
 * Check if token is expired
 *
 * @param token - JWT token string
 * @param bufferSeconds - Optional buffer time in seconds (default: 0)
 * @returns true if expired or will expire within buffer time
 */
export function isTokenExpired(token, bufferSeconds = 0) {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
        return true; // If we can't read expiration, assume expired
    }
    const now = new Date();
    const expirationWithBuffer = new Date(expiration.getTime() - bufferSeconds * 1000);
    return now >= expirationWithBuffer;
}
/**
 * Get time until token expires in milliseconds
 *
 * @param token - JWT token string
 * @returns Milliseconds until expiration, or null if invalid/expired
 */
export function getTimeUntilExpiration(token) {
    const expiration = getTokenExpiration(token);
    if (!expiration) {
        return null;
    }
    const now = new Date();
    const diff = expiration.getTime() - now.getTime();
    return diff > 0 ? diff : null;
}
