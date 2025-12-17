import { ReactNode, useState, useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { QUERY_CONFIG } from "@truths/config";
import { cacheManager, initializeCacheRegistry } from "@truths/utils";

interface QueryProviderProps {
  children: ReactNode;
}

// Simple localStorage persister
const localStoragePersister = {
  persistClient: async (client: unknown) => {
    try {
      localStorage.setItem("REACT_QUERY_OFFLINE_CACHE", JSON.stringify(client));
    } catch (error) {
      console.error("Failed to persist query client:", error);
    }
  },
  restoreClient: async () => {
    try {
      const cached = localStorage.getItem("REACT_QUERY_OFFLINE_CACHE");
      return cached ? JSON.parse(cached) : undefined;
    } catch (error) {
      console.error("Failed to restore query client:", error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE");
    } catch (error) {
      console.error("Failed to remove query client:", error);
    }
  },
};

// Export function to clear persisted cache (for use during login/logout)
export async function clearPersistedQueryCache() {
  await localStoragePersister.removeClient();
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        ...QUERY_CONFIG,
        defaultOptions: {
          ...QUERY_CONFIG.defaultOptions,
          queries: {
            ...QUERY_CONFIG.defaultOptions.queries,
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            // Don't retry cancelled errors
            retry: (failureCount, error: any) => {
              if (error?.name === "CancelledError") {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
        logger: {
          log: (...args) => {
            // Suppress specific hydration cancellation warnings
            const message = args[0];
            if (
              typeof message === "string" &&
              message.includes("dehydrated as pending ended up rejecting")
            ) {
              return; // Suppress hydration warnings for pending queries that reject
            }
            console.log(...args);
          },
          warn: (...args) => {
            // Suppress specific hydration cancellation warnings
            const message = args[0];
            if (
              typeof message === "string" &&
              message.includes("dehydrated as pending ended up rejecting")
            ) {
              return; // Suppress hydration warnings for pending queries that reject
            }
            console.warn(...args);
          },
          error: console.error,
        },
      })
  );

  // Initialize cache manager with React Query client
  useEffect(() => {
    cacheManager.setQueryClient(queryClient);
    initializeCacheRegistry();

    // Connect to broadcast service for server-side cache invalidation
    // Only connects if VITE_ENABLE_CACHE_BROADCAST=true is set in .env
    // This prevents console errors when backend doesn't have endpoints
    // Set VITE_ENABLE_CACHE_BROADCAST=true when you implement backend endpoints
    cacheManager.connect();

    return () => {
      cacheManager.disconnect();
    };
  }, [queryClient]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        dehydrateOptions: {
          // Don't persist queries that are in pending state to avoid cancellation/network errors
          shouldDehydrateQuery: (query) => {
            // Only persist queries that have completed (have data or error)
            // Skip queries that are still pending
            if (query.state.status === "pending") {
              return false;
            }
            // Skip queries with CancelledError
            if (
              query.state.status === "error" &&
              query.state.error?.name === "CancelledError"
            ) {
              return false;
            }
            // Skip queries with network errors (Failed to fetch, etc.)
            if (
              query.state.status === "error" &&
              (query.state.error instanceof TypeError ||
                query.state.error?.message?.includes("Failed to fetch") ||
                query.state.error?.message?.includes("NetworkError"))
            ) {
              return false;
            }
            return true;
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
