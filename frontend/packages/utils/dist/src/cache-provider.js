import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
/**
 * Cache Provider for React
 *
 * Provides cache management context and automatic React Query integration
 *
 * @author Phanny
 */
import { useEffect } from 'react';
import { cacheManager } from './cache-manager';
import { initializeCacheRegistry } from './cache-registry';
export function CacheProvider({ children, queryClient, enableBroadcast = true, broadcastUrl }) {
    useEffect(() => {
        // Register React Query client
        cacheManager.setQueryClient(queryClient);
        // Initialize cache registry
        initializeCacheRegistry();
        // Connect to broadcast service if enabled
        if (enableBroadcast) {
            cacheManager.connect(broadcastUrl);
        }
        // Cleanup on unmount
        return () => {
            cacheManager.disconnect();
        };
    }, [queryClient, enableBroadcast, broadcastUrl]);
    return _jsx(_Fragment, { children: children });
}
