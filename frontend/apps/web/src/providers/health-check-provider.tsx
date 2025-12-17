import { ReactNode } from 'react'
import { useHealthCheck } from '../hooks/use-health-check'
import { BackendDownOverlay } from '../components/health/backend-down-overlay'

interface HealthCheckProviderProps {
    children: ReactNode
    /** Interval in milliseconds between health checks. Default: 30000 (30 seconds) */
    checkInterval?: number
    /** Whether to enable health checking. Default: true */
    enabled?: boolean
}

/**
 * Provider that monitors backend health and blocks the app when backend is down
 */
export function HealthCheckProvider({
    children,
    checkInterval = 30000,
    enabled = true,
}: HealthCheckProviderProps) {
    const { isHealthy, isLoading, error, downtimeStart, checkHealth } = useHealthCheck({
        interval: checkInterval,
        immediate: true,
        enabled,
    })

    return (
        <>
            {children}
            {!isHealthy && (
                <BackendDownOverlay
                    error={error?.message}
                    isLoading={isLoading}
                    downtimeStart={downtimeStart}
                    onRetry={checkHealth}
                />
            )}
        </>
    )
}

