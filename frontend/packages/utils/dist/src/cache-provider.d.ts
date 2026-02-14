/**
 * Cache Provider for React
 *
 * Provides cache management context and automatic React Query integration
 *
 * @author Phanny
 */
import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
interface CacheProviderProps {
    children: ReactNode;
    queryClient: QueryClient;
    enableBroadcast?: boolean;
    broadcastUrl?: string;
}
export declare function CacheProvider({ children, queryClient, enableBroadcast, broadcastUrl }: CacheProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=cache-provider.d.ts.map