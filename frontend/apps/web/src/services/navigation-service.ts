import { apiClient } from "@truths/api";

export interface NavigationItemDTO {
  label: string;
  path: string;
  icon?: string;
  shortcut?: string;
  description?: string;
  keywords?: string[]; // Search keywords for command palette (e.g., ["cust", "client"] for customers)
  children?: NavigationItemDTO[];
}

export class NavigationService {
  async fetchNavigation(): Promise<NavigationItemDTO[]> {
    return apiClient<NavigationItemDTO[]>("/api/v1/navigation", {
      method: "GET",
      requiresAuth: true,
    });
  }
}


