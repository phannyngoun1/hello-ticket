import { useQuery } from "@tanstack/react-query";
import { NavigationService, NavigationItemDTO } from "../services/navigation-service";

const QUERY_KEY = ["navigation", "v2"]; // bump to invalidate stale caches after backend changes

export function useNavigation(service: NavigationService, options?: { enabled?: boolean }) {
  return useQuery<NavigationItemDTO[]>({
    queryKey: QUERY_KEY,
    queryFn: () => service.fetchNavigation(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}


