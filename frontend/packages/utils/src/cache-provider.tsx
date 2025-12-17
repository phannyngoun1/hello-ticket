/**
 * Cache Provider for React
 * 
 * Provides cache management context and automatic React Query integration
 *
 * @author Phanny
 */

import { useEffect, ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { cacheManager, initializeCacheRegistry } from './cache-manager';

interface CacheProviderProps {
    children: ReactNode;
    queryClient: QueryClient;
    enableBroadcast?: boolean;
    broadcastUrl?: string;
}

export function CacheProvider({ 
    children, 
    queryClient, 
    enableBroadcast = true,
    broadcastUrl 
}: CacheProviderProps) {
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

    return <>{children}</>;
}

