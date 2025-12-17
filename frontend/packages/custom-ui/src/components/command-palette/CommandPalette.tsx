import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandDialog } from "@truths/ui";
import { storage } from "@truths/utils";

// Import extracted components and utilities
import {
  CommandPaletteErrorBoundary,
  CommandInputWithBadges,
  CommandPaletteContent,
} from "./components";
import { useNetworkStatus } from "./hooks";
import { getNavigationItems, getQuickActions } from "./config";
import { CommandPaletteProps, SearchScope, RecentSearch } from "./types";

// Storage keys for recent searches
const RECENT_SEARCHES_KEY = "command-palette-recent";
const MAX_RECENT_SEARCHES = 5;

// Debounce delay for server requests
const SEARCH_DEBOUNCE_MS = 300;

export function CommandPalette({
  open,
  onOpenChange,
  dataTypes,
  userId,
  navigationItems: navigationItemsProp,
  quickActions: quickActionsProp,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const [search, setSearch] = React.useState("");
  const [scope, setScope] = React.useState<SearchScope>("all");
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>(
    []
  );
  const [autocomplete, setAutocomplete] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  // Get user-specific storage key
  const getStorageKey = React.useCallback(() => {
    if (userId) {
      return `command-palette-recent-${userId}`;
    }
    return RECENT_SEARCHES_KEY; // Fallback to global key if no userId
  }, [userId]);

  // Debounce search input to avoid excessive API calls
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Immediately sync debounced value when input is exactly a scope prefix like "users:"
  // This prevents a fetch with stale pre-scope text (e.g., "users") right after typing ':'
  React.useEffect(() => {
    const lower = search.toLowerCase().trim();
    const isExactScopePrefix = dataTypes.some((dt) => lower === `${dt.key}:`);
    if (isExactScopePrefix && debouncedSearch !== search) {
      setDebouncedSearch(search);
    }
  }, [search, dataTypes, debouncedSearch]);

  // Load recent searches on mount
  React.useEffect(() => {
    if (open) {
      const storageKey = getStorageKey();
      const recent = storage.get<RecentSearch[]>(storageKey) || [];
      setRecentSearches(recent);
    }
  }, [open, getStorageKey]);

  // Parse search query for scope modifiers
  React.useEffect(() => {
    const lowerSearch = search.toLowerCase();

    // Check for navigation and action scopes first
    if (lowerSearch.startsWith("nav:")) {
      setScope("navigation");
    } else if (lowerSearch.startsWith("action:")) {
      setScope("actions");
    } else {
      // Check for dynamic data type scopes
      const matchedDataType = dataTypes.find((dataType) =>
        lowerSearch.startsWith(`${dataType.key}:`)
      );

      if (matchedDataType) {
        setScope(matchedDataType.scope);
      } else {
        setScope("all");
      }
    }
  }, [search, dataTypes]);

  // Get clean search term (without scope prefix)
  const cleanSearch = React.useMemo(() => {
    const lowerSearch = search.toLowerCase();

    // Check for navigation and action prefixes first
    const staticPrefixes = ["nav:", "action:"];
    for (const prefix of staticPrefixes) {
      if (lowerSearch.startsWith(prefix)) {
        return search.slice(prefix.length).trim();
      }
    }

    // Check for dynamic data type prefixes
    for (const dataType of dataTypes) {
      const prefix = `${dataType.key}:`;
      if (lowerSearch.startsWith(prefix)) {
        return search.slice(prefix.length).trim();
      }
    }

    // No scope prefix, return as-is
    return search.trim();
  }, [search, dataTypes]);

  // Save to recent searches
  const saveToRecent = React.useCallback(
    (query: string, searchScope?: SearchScope) => {
      if (!query.trim()) return;

      const newSearch: RecentSearch = {
        query,
        timestamp: Date.now(),
        scope: searchScope,
      };

      const updated = [
        newSearch,
        ...recentSearches.filter((r) => r.query !== query),
      ].slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      const storageKey = getStorageKey();
      storage.set(storageKey, updated);
    },
    [recentSearches, getStorageKey]
  );

  // Get clean search term from debounced search
  const cleanDebouncedSearch = React.useMemo(() => {
    const lowerSearch = debouncedSearch.toLowerCase();

    // Check for navigation and action prefixes first
    const staticPrefixes = ["nav:", "action:"];
    for (const prefix of staticPrefixes) {
      if (lowerSearch.startsWith(prefix)) {
        return debouncedSearch.slice(prefix.length).trim();
      }
    }

    // Check for dynamic data type prefixes
    for (const dataType of dataTypes) {
      const prefix = `${dataType.key}:`;
      if (lowerSearch.startsWith(prefix)) {
        return debouncedSearch.slice(prefix.length).trim();
      }
    }

    // No scope prefix, return as-is
    return debouncedSearch.trim();
  }, [debouncedSearch, dataTypes]);

  // Manual data fetching for dynamic data types
  const [queryResults, setQueryResults] = React.useState<Record<string, any>>(
    {}
  );

  React.useEffect(() => {
    const fetchData = async () => {
      const results: Record<string, any> = {};

      // First, set loading states for active data types
      for (const dataType of dataTypes) {
        if (dataType.fetcher && scope === dataType.scope && isOnline) {
          results[dataType.key] = {
            data: [],
            isLoading: true,
            error: null,
            isError: false,
          };
        } else if (dataType.fetcher) {
          results[dataType.key] = {
            data: [],
            isLoading: false,
            error: null,
            isError: false,
          };
        }
      }

      // Update with loading states immediately
      setQueryResults(results);

      // Then fetch data for active scopes
      for (const dataType of dataTypes) {
        if (dataType.fetcher && scope === dataType.scope && isOnline) {
          const searchTerm = cleanDebouncedSearch.trim();

          // Skip calling the fetcher when there is no query after the scope prefix
          if (!searchTerm) {
            setQueryResults((prev) => ({
              ...prev,
              [dataType.key]: {
                data: [],
                isLoading: false,
                error: null,
                isError: false,
              },
            }));
            continue;
          }

          try {
            const data = await dataType.fetcher(searchTerm);
            setQueryResults((prev) => ({
              ...prev,
              [dataType.key]: {
                data: data.slice(0, 10),
                isLoading: false,
                error: null,
                isError: false,
              },
            }));
          } catch (error) {
            console.error(`Error fetching ${dataType.key}:`, error);
            setQueryResults((prev) => ({
              ...prev,
              [dataType.key]: {
                data: [],
                isLoading: false,
                error: error,
                isError: true,
              },
            }));
          }
        }
      }
    };

    fetchData();
  }, [dataTypes, cleanDebouncedSearch, scope, isOnline]);

  // Get navigation items and quick actions (prefer props; fallback to defaults)
  const navigationItems = React.useMemo(
    () => navigationItemsProp ?? getNavigationItems(),
    [navigationItemsProp]
  );
  const quickActions = React.useMemo(
    () => quickActionsProp ?? getQuickActions(navigate),
    [quickActionsProp, navigate]
  );

  // Dynamic data filtering for all configured types
  const filteredDataTypes = React.useMemo(() => {
    return dataTypes.map((dataType) => {
      const query = queryResults[dataType.key];
      const data = query?.data || [];
      const isLoading = query?.isLoading || false;
      const error = query?.error;
      const isError = query?.isError || false;

      return {
        ...dataType,
        // Show data when explicitly scoped OR when in 'all' scope with no search text
        data:
          scope === dataType.scope || (scope === "all" && !cleanSearch)
            ? data.slice(0, 10)
            : [],
        isLoading:
          scope === dataType.scope || (scope === "all" && !cleanSearch)
            ? isLoading
            : false,
        error:
          scope === dataType.scope || (scope === "all" && !cleanSearch)
            ? error
            : null,
        isError:
          scope === dataType.scope || (scope === "all" && !cleanSearch)
            ? isError
            : false,
      };
    });
  }, [dataTypes, queryResults, scope, cleanSearch]);

  // Filter navigation items based on scope
  const filteredNavigation = React.useMemo(() => {
    if (scope !== "all" && scope !== "navigation") return [];
    if (scope === "navigation" && !cleanSearch) return navigationItems;
    if (!cleanSearch) return navigationItems;

    const term = cleanSearch.toLowerCase();

    return navigationItems.filter((item) => {
      // Build searchable text from all relevant fields
      const haystack = [
        item.label,
        item.description,
        item.parentLabel,
        item.path,
        item.value, // Also search in value (e.g., "nav-sales-customers")
        ...(item.keywords || []), // Include keywords if provided
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Check if term matches anywhere in the haystack
      // This allows partial matches like "cust" matching "customers"
      if (haystack.includes(term)) return true;

      // Also check if any keyword matches the term (bidirectional)
      if (item.keywords) {
        const matchesKeyword = item.keywords.some(
          (keyword) =>
            keyword.toLowerCase().includes(term) ||
            term.includes(keyword.toLowerCase())
        );
        if (matchesKeyword) return true;
      }

      return false;
    });
  }, [cleanSearch, scope, navigationItems]);

  // Filter actions based on scope
  const filteredActions = React.useMemo(() => {
    if (scope !== "all" && scope !== "actions") return [];
    if (scope === "actions" && !cleanSearch) return quickActions;
    if (!cleanSearch && scope === "all") return quickActions;

    const term = cleanSearch.toLowerCase();

    return quickActions.filter((item) => {
      // Search in label
      if (item.label.toLowerCase().includes(term)) return true;

      // Search in keywords if provided
      if (item.keywords) {
        const matchesKeyword = item.keywords.some(
          (keyword) =>
            keyword.toLowerCase().includes(term) ||
            term.includes(keyword.toLowerCase())
        );
        if (matchesKeyword) return true;
      }

      // Search in value (e.g., "action-add-customer" matches "cust")
      if (item.value.toLowerCase().includes(term)) return true;

      return false;
    });
  }, [cleanSearch, scope, quickActions]);

  // Autocomplete logic
  React.useEffect(() => {
    if (!search) {
      setAutocomplete("");
      return;
    }

    const lower = search.toLowerCase();

    // Suggest scope prefixes dynamically
    const scopePrefixes = [
      { prefix: "nav:", full: "nav:" },
      { prefix: "action:", full: "action:" },
      ...dataTypes.map((dataType) => ({
        prefix: `${dataType.key}:`,
        full: `${dataType.key}:`,
      })),
    ];

    for (const { prefix, full } of scopePrefixes) {
      if (prefix.startsWith(lower) && lower.length < prefix.length) {
        setAutocomplete(full);
        return;
      }
    }

    // Suggest from navigation items
    if (!scope || scope === "all" || scope === "navigation") {
      for (const item of navigationItems) {
        const labelLower = item.label.toLowerCase();
        if (labelLower.startsWith(lower) && lower.length >= 2) {
          setAutocomplete(item.label);
          return;
        }
      }
    }

    // Suggest from data items (only when explicitly in data scope)
    // If multiple items match, avoid suggesting an aggregated value
    const currentDataType = dataTypes.find((dt) => dt.scope === scope);
    if (
      currentDataType &&
      queryResults[currentDataType.key] &&
      cleanDebouncedSearch.length >= 2
    ) {
      const query = queryResults[currentDataType.key];
      const matches = (query.data || []).filter((item: any) => {
        const searchValue = currentDataType.getSearchValue(item);
        return searchValue
          .toLowerCase()
          .startsWith(cleanDebouncedSearch.toLowerCase());
      });

      if (matches.length === 1) {
        const only = matches[0];
        const searchValue = currentDataType.getSearchValue(only);
        const prefix = search.slice(
          0,
          search.length - cleanDebouncedSearch.length
        );
        setAutocomplete(prefix + searchValue);
        return;
      }
      // When 0 or many matches, do not propose a potentially confusing combined suggestion
    }

    setAutocomplete("");
  }, [
    search,
    cleanDebouncedSearch,
    scope,
    navigationItems,
    dataTypes,
    queryResults,
  ]);

  // Handle Tab key for autocomplete
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && autocomplete && autocomplete !== search) {
        e.preventDefault();
        setSearch(autocomplete);
        // Keep debounced value in sync on autocomplete to avoid using stale text
        setDebouncedSearch(autocomplete);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, autocomplete, search]);

  // Suggestions based on current search
  const suggestions = React.useMemo(() => {
    if (search.length > 0) return [];

    return [
      { text: "nav:dashboard", description: "Navigate to dashboard" },
      { text: "action:add", description: "Show add actions" },
      ...dataTypes.slice(0, 4).map((dataType) => ({
        text: `${dataType.key}:example`,
        description: `Search ${dataType.name.toLowerCase()} for 'example'`,
      })),
    ];
  }, [search, dataTypes]);

  const handleSelect = (callback: () => void) => {
    saveToRecent(search, scope);
    setSearch("");
    onOpenChange(false);
    callback();
  };

  const handleRecentSelect = (recent: RecentSearch) => {
    setSearch(recent.query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    const storageKey = getStorageKey();
    storage.remove(storageKey);
  };

  return (
    <CommandPaletteErrorBoundary>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInputWithBadges
          search={search}
          onValueChange={setSearch}
          scope={scope}
          autocomplete={autocomplete}
          isOnline={isOnline}
        />

        <CommandPaletteContent
          search={search}
          scope={scope}
          isOnline={isOnline}
          recentSearches={recentSearches}
          suggestions={suggestions}
          filteredNavigation={filteredNavigation}
          filteredActions={filteredActions}
          filteredDataTypes={filteredDataTypes}
          dataTypes={dataTypes}
          dataQueries={queryResults}
          onRecentSelect={handleRecentSelect}
          onClearRecentSearches={clearRecentSearches}
          onSearchChange={setSearch}
          onSelect={handleSelect}
        />
      </CommandDialog>
    </CommandPaletteErrorBoundary>
  );
}
