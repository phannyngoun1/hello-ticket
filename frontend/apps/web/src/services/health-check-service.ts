import { API_CONFIG } from '@truths/config'

export interface HealthCheckResponse {
    status: string
    message: string
}

export class HealthCheckError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(message)
        this.name = 'HealthCheckError'
    }
}

/**
 * Extract user-friendly error message from various error types
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        const errorName = error.name.toLowerCase()
        
        // Check error name first (TypeError, DOMException, etc.)
        if (errorName === 'typeerror' || errorName === 'domexception') {
            // Network connection errors - these typically occur when backend is unreachable
            if (message.includes('failed to fetch') || 
                message.includes('networkerror') ||
                message.includes('network request failed') ||
                message.includes('load failed') ||
                message === '' || // Some browsers throw empty message for connection errors
                error.message === '') {
                return 'Connection refused. The backend server may be down or unreachable.'
            }
        }
        
        // Check message content for various error patterns
        if (message.includes('failed to fetch') || 
            message.includes('networkerror') ||
            message.includes('connection refused') ||
            message.includes('err_connection_refused') ||
            message.includes('connection reset') ||
            message.includes('connection closed')) {
            return 'Connection refused. The backend server may be down or unreachable.'
        }
        
        if (message.includes('network request failed')) {
            return 'Network request failed. Please check your internet connection.'
        }
        
        if (message.includes('timeout') || message.includes('aborted')) {
            return 'Request timed out. The backend server is not responding.'
        }
        
        if (message.includes('cors')) {
            return 'CORS error. The backend server may not be configured correctly.'
        }
        
        // Return the original message if it's already user-friendly
        return error.message || 'Failed to connect to backend server.'
    }
    
    return 'Unknown error occurred while checking backend health.'
}

/**
 * Check backend health status
 * @returns Promise resolving to health check response
 * @throws HealthCheckError if backend is unreachable
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
    const url = `${API_CONFIG.BASE_URL}/health/`
    
    // Create abort controller for timeout (fallback for browsers that don't support AbortSignal.timeout)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new HealthCheckError(`Backend returned status ${response.status}`)
        }

        const data = await response.json()
        return data as HealthCheckResponse
    } catch (error) {
        clearTimeout(timeoutId)
        
        // Handle abort/timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
            throw new HealthCheckError(
                'Backend health check timed out. The server is not responding.',
                error
            )
        }
        
        // Re-throw if already a HealthCheckError
        if (error instanceof HealthCheckError) {
            throw error
        }
        
        // Extract user-friendly error message
        const friendlyMessage = getErrorMessage(error)
        throw new HealthCheckError(friendlyMessage, error instanceof Error ? error : undefined)
    }
}

