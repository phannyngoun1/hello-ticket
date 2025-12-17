import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, Clock, Calendar } from 'lucide-react'
import { Button } from '@truths/ui'

interface BackendDownOverlayProps {
    /** Error message to display */
    error?: string | null
    /** Whether health check is in progress */
    isLoading?: boolean
    /** Timestamp when backend went down */
    downtimeStart?: number | null
    /** Callback to retry health check */
    onRetry?: () => void
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
}

/**
 * Format timestamp to readable date and time string
 */
function formatDateTime(timestamp: number): string {
    const date = new Date(timestamp)
    
    // Format: "Jan 15, 2024 at 2:30:45 PM"
    const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
    
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }
    
    const dateStr = date.toLocaleDateString('en-US', dateOptions)
    const timeStr = date.toLocaleTimeString('en-US', timeOptions)
    
    return `${dateStr} at ${timeStr}`
}

/**
 * Overlay component that blocks the app when backend is down
 */
export function BackendDownOverlay({
    error,
    isLoading = false,
    downtimeStart,
    onRetry,
}: BackendDownOverlayProps) {
    const [duration, setDuration] = useState<string>('')

    // Update duration every second
    useEffect(() => {
        if (!downtimeStart) {
            setDuration('')
            return
        }

        const updateDuration = () => {
            const elapsed = Date.now() - downtimeStart
            setDuration(formatDuration(elapsed))
        }

        // Update immediately
        updateDuration()

        // Update every second
        const interval = setInterval(updateDuration, 1000)

        return () => clearInterval(interval)
    }, [downtimeStart])

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="mx-4 max-w-md rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Backend Unavailable</h2>
                        <p className="text-sm text-muted-foreground">
                            Unable to connect to the backend server. Please check your connection
                            and try again.
                        </p>
                        
                        {downtimeStart && (
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Downtime: <span className="font-mono">{duration || '0s'}</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Detected: {formatDateTime(downtimeStart)}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="mt-3 rounded-md bg-destructive/10 p-3">
                                <p className="text-sm font-medium text-destructive">
                                    Error Details:
                                </p>
                                <p className="mt-1 text-xs text-destructive/80">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>

                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            disabled={isLoading}
                            variant="default"
                            className="mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Retry Connection
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

