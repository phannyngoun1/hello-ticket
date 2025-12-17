import { useState, useEffect, useCallback, useRef } from 'react'
import { checkBackendHealth, type HealthCheckResponse } from '../services/health-check-service'

export interface UseHealthCheckOptions {
    /** Interval in milliseconds between health checks. Default: 30000 (30 seconds) */
    interval?: number
    /** Whether to start checking immediately. Default: true */
    immediate?: boolean
    /** Whether to enable health checking. Default: true */
    enabled?: boolean
}

export interface UseHealthCheckResult {
    /** Whether backend is healthy */
    isHealthy: boolean
    /** Whether health check is in progress */
    isLoading: boolean
    /** Last health check response */
    healthData: HealthCheckResponse | null
    /** Last error encountered */
    error: Error | null
    /** Timestamp when backend went down (null if healthy) */
    downtimeStart: number | null
    /** Manually trigger a health check */
    checkHealth: () => Promise<void>
}

/**
 * Hook to monitor backend health status
 */
export function useHealthCheck(options: UseHealthCheckOptions = {}): UseHealthCheckResult {
    const {
        interval = 30000, // 30 seconds
        immediate = true,
        enabled = true,
    } = options

    const [isHealthy, setIsHealthy] = useState<boolean>(true)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [downtimeStart, setDowntimeStart] = useState<number | null>(null)

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const isMountedRef = useRef<boolean>(true)

    const checkHealth = useCallback(async () => {
        if (!enabled) return

        setIsLoading(true)
        setError(null)

        try {
            const data = await checkBackendHealth()
            if (isMountedRef.current) {
                setIsHealthy(true)
                setHealthData(data)
                setError(null)
                setDowntimeStart(null) // Clear downtime start when backend is healthy
            }
        } catch (err) {
            if (isMountedRef.current) {
                setIsHealthy(false)
                setError(err instanceof Error ? err : new Error('Unknown error'))
                // Set downtime start only if not already set (first failure)
                setDowntimeStart(prev => prev ?? Date.now())
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false)
            }
        }
    }, [enabled])

    useEffect(() => {
        isMountedRef.current = true

        if (enabled) {
            if (immediate) {
                checkHealth()
            }

            // Set up interval
            intervalRef.current = setInterval(() => {
                checkHealth()
            }, interval)
        }

        return () => {
            isMountedRef.current = false
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [enabled, immediate, interval, checkHealth])

    return {
        isHealthy,
        isLoading,
        healthData,
        error,
        downtimeStart,
        checkHealth,
    }
}

