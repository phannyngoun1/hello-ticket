import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { storage } from "@truths/utils";
import {
  X,
  Home,
  LayoutDashboard,
  Users,
  User,
  Settings,
  FileText,
  Package,
  Calendar,
  CreditCard,
  Search,
  MapPin,
  LayoutGrid,
  Play,
  Palette,
  Bell,
  Globe,
  Shield,
  type LucideIcon,
  ChevronDown,
  GripVertical,
  Layers, // For "Group Tabs" icon
  Pin,
  PinOff,
} from "lucide-react";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { tabConfiguration, moduleOrder } from "../../config/tab-config";
import {
  getTitleAndIconFromConfig,
  getModuleFromConfig,
  getTabMetadata,
  type TabMetadata,
} from "@truths/custom-ui";

const TABS_STORAGE_KEY = "app_tabs";
const ENABLE_TABS_STORAGE_KEY = "enable_tabs";
const TABS_LAST_USED_STORAGE_KEY = "app_tabs_last_used";

export interface AppTab {
  id: string;
  path: string;
  title: string;
  iconName?: string;
  data?: unknown;
  pinned?: boolean;
  grouped?: boolean;
}

interface TabManagerProps {
  onTabChange?: (tab: AppTab) => void;
  inline?: boolean;
}

export function TabManager({ onTabChange, inline = false }: TabManagerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  // Track last-used time per tab for MRU (Most Recently Used) - like VS Code/Cursor
  const lastUsedByTabIdRef = useRef<Record<string, number>>(
    storage.get<Record<string, number>>(TABS_LAST_USED_STORAGE_KEY) ?? {},
  );

  const [tabs, setTabs] = useState<AppTab[]>(() => {
    // Load saved tabs from localStorage
    const saved = storage.get<AppTab[]>(TABS_STORAGE_KEY);
    return saved || [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [hoveredGripTabId, setHoveredGripTabId] = useState<string | null>(null);
  const [userInitiatedTabChange, setUserInitiatedTabChange] = useState(false);
  const [tabPosition, setTabPosition] = useState<"separate" | "inline">(() => {
    const saved = storage.get<"separate" | "inline">("tab_position");
    return saved ?? "separate";
  });

  const getTabMetadataForPath = useCallback(
    (path: string): TabMetadata | null => {
      return getTabMetadata(tabConfiguration, path);
    },
    [],
  );

  // Clean up tabs on mount to remove any undefined/null entries (from corrupted localStorage)
  useEffect(() => {
    setTabs((prevTabs) => {
      const cleanedTabs = prevTabs.filter(
        (tab): tab is AppTab => tab != null && !!tab.id && !!tab.path,
      );
      // Only update if we actually removed some tabs
      if (cleanedTabs.length !== prevTabs.length) {
        return cleanedTabs;
      }
      return prevTabs;
    });
  }, []); // Only run on mount

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    // Only save valid tabs
    const validTabs = tabs.filter(
      (tab): tab is AppTab => tab != null && !!tab.id && !!tab.path,
    );
    storage.set(TABS_STORAGE_KEY, validTabs);
  }, [tabs]);

  const getTitleAndIconFromPath = useCallback(
    (path: string): { title: string; iconName: string } => {
      return getTitleAndIconFromConfig(tabConfiguration, path);
    },
    [],
  );

  // Get or create tab for current route
  useEffect(() => {
    // For seat designer route, include layoutId in path to create separate tabs per layout
    const isSeatDesignerRoute = location.pathname.includes("/seats/designer");
    const searchParams = new URLSearchParams(location.search);
    const layoutId = searchParams.get("layoutId");
    const currentPath =
      isSeatDesignerRoute && layoutId
        ? `${location.pathname}?layoutId=${layoutId}`
        : location.pathname;

    setTabs((prevTabs) => {
      const currentTab = prevTabs.find((tab) => tab.path === currentPath);

      if (!currentTab) {
        // Create new tab for current route
        const { title, iconName } = getTitleAndIconFromPath(location.pathname);
        const newTabMetadata = getTabMetadataForPath(currentPath);

        // Use loading title if loadingOnAdded is true
        const finalTitle = newTabMetadata?.loadingOnAdded
          ? "Loading..."
          : title;

        const newTab: AppTab = {
          id: generateTabId(),
          path: currentPath,
          title: finalTitle,
          iconName,
        };

        // Check if there are any grouped tabs in the same group - if so, auto-group this new tab
        if (newTabMetadata?.group) {
          const hasGroupedTabsInSameGroup = prevTabs.some((tab) => {
            if (tab.grouped) {
              const tabMetadata = getTabMetadataForPath(tab.path);
              return tabMetadata?.group === newTabMetadata.group;
            }
            return false;
          });

          if (hasGroupedTabsInSameGroup) {
            newTab.grouped = true;
          }
        }

        lastUsedByTabIdRef.current[newTab.id] = Date.now();
        storage.set(TABS_LAST_USED_STORAGE_KEY, {
          ...lastUsedByTabIdRef.current,
        });
        setActiveTabId(newTab.id);
        if (onTabChange) {
          onTabChange(newTab);
        }

        const combined = [...prevTabs, newTab];
        return sortTabsWithPins(combined);
      } else {
        // Switch to existing tab
        lastUsedByTabIdRef.current[currentTab.id] = Date.now();
        storage.set(TABS_LAST_USED_STORAGE_KEY, {
          ...lastUsedByTabIdRef.current,
        });
        setActiveTabId(currentTab.id);
        if (onTabChange) {
          onTabChange(currentTab);
        }
        return prevTabs;
      }
    });
  }, [
    location.pathname,
    location.search,
    onTabChange,
    getTitleAndIconFromPath,
    getTabMetadataForPath,
  ]);

  // Scroll active tab into view when it changes (including when user selects off-screen tab from dropdown)
  // Use scrollTo + getBoundingClientRect instead of scrollIntoView to avoid double-scroll
  // (scroll-smooth + scrollIntoView can cause: scroll to 0 first, then to target)
  useLayoutEffect(() => {
    const viewport = scrollViewportRef.current;
    const tabEl = activeTabRef.current;
    if (!viewport || !tabEl) return;

    const runScroll = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const tabRect = tabEl.getBoundingClientRect();
      const tabLeftRelative = tabRect.left - viewportRect.left;
      const targetScrollLeft =
        viewport.scrollLeft +
        tabLeftRelative -
        viewportRect.width / 2 +
        tabRect.width / 2;
      const scrollLeft = Math.max(
        0,
        Math.min(targetScrollLeft, viewport.scrollWidth - viewport.clientWidth),
      );
      // Use "instant" to avoid smooth-scroll conflicts that cause double-scroll
      viewport.scrollTo({ left: scrollLeft, behavior: "instant" });
    };

    // Defer to next frame so layout is fully complete (avoids race with other effects)
    const rafId = requestAnimationFrame(runScroll);
    return () => cancelAnimationFrame(rafId);
  }, [activeTabId, tabs]);

  // Listen for dynamic tab title updates from pages (e.g., after data load)
  useEffect(() => {
    const handleUpdateTitle = (e: Event) => {
      const { path, title, iconName } = (e as CustomEvent).detail || {};
      if (!path || !title) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.path === path
            ? { ...t, title, iconName: iconName ?? t.iconName }
            : t,
        ),
      );
    };

    window.addEventListener(
      "update-tab-title",
      handleUpdateTitle as EventListener,
    );
    return () => {
      window.removeEventListener(
        "update-tab-title",
        handleUpdateTitle as EventListener,
      );
    };
  }, []);

  const generateTabId = () =>
    `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, LucideIcon> = {
      Home,
      LayoutDashboard,
      Users,
      User,
      Settings,
      FileText,
      Package,
      Calendar,
      CreditCard,
      Search,
      MapPin,
      LayoutGrid,
      Play,
      Palette,
      Bell,
      Globe,
      Shield,
    };
    return iconName ? iconMap[iconName] : null;
  };

  // Helper to navigate to a tab path (handles query strings)
  const navigateToTabPath = useCallback(
    (path: string) => {
      const [pathname, search] = path.split("?");
      const searchParams = search ? new URLSearchParams(search) : undefined;
      navigate({
        to: pathname,
        search: searchParams ? Object.fromEntries(searchParams) : undefined,
      });
    },
    [navigate],
  );

  const recordTabUsed = useCallback((tabId: string) => {
    const now = Date.now();
    lastUsedByTabIdRef.current[tabId] = now;
    storage.set(TABS_LAST_USED_STORAGE_KEY, { ...lastUsedByTabIdRef.current });
  }, []);

  const handleTabClick = useCallback(
    (tab: AppTab) => {
      setUserInitiatedTabChange(true);
      recordTabUsed(tab.id);
      setActiveTabId(tab.id);
      navigateToTabPath(tab.path);
      if (onTabChange) {
        onTabChange(tab);
      }
      // Reset the flag after a short delay
      setTimeout(() => setUserInitiatedTabChange(false), 100);
    },
    [navigateToTabPath, onTabChange, recordTabUsed],
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
      const isClosingActiveTab = activeTabId === tabId;
      const newTabs = tabs.filter((tab) => tab.id !== tabId);

      // Clean up lastUsed for closed tab to avoid storage bloat
      delete lastUsedByTabIdRef.current[tabId];
      storage.set(TABS_LAST_USED_STORAGE_KEY, { ...lastUsedByTabIdRef.current });

      setTabs(newTabs);

      // Smart tab selection when closing the active tab (VS Code/Cursor behavior)
      if (isClosingActiveTab) {
        if (newTabs.length > 0) {
          // 1. MRU: pick tab with highest lastUsed (persisted across reloads)
          const mruTab = newTabs.reduce(
            (best, tab) => {
              const bestTime = lastUsedByTabIdRef.current[best.id] ?? 0;
              const tabTime = lastUsedByTabIdRef.current[tab.id] ?? 0;
              return tabTime > bestTime ? tab : best;
            },
            newTabs[0],
          );
          const mruTime = lastUsedByTabIdRef.current[mruTab.id] ?? 0;

          // 2. When no usage data: prefer tab to the right, else left - like VS Code
          const nextTab =
            mruTime > 0
              ? mruTab
              : tabIndex < newTabs.length
                ? newTabs[tabIndex]
                : newTabs[tabIndex - 1];

          // Update active tab immediately and navigate (handles query params correctly)
          setActiveTabId(nextTab.id);
          recordTabUsed(nextTab.id);
          navigateToTabPath(nextTab.path);
        } else {
          // No more tabs, go to home
          setActiveTabId(null);
          navigate({ to: "/" });
        }
      }
    },
    [tabs, activeTabId, navigate, navigateToTabPath, recordTabUsed],
  );

  const handleCloseOthers = useCallback(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab) {
      setTabs([activeTab]);
    }
  }, [tabs, activeTabId]);

  const handleCloseAll = useCallback(() => {
    setTabs([]);
    navigate({ to: "/" });
  }, [navigate]);

  // Keyboard shortcuts for tab management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + W: Close current tab
      if (modKey && e.key === "w") {
        e.preventDefault();
        if (activeTabId) {
          const event = new MouseEvent("click");
          handleTabClose(event as any, activeTabId);
        }
      }

      // Ctrl/Cmd + Tab: Next tab
      if (modKey && e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
        if (currentIndex < tabs.length - 1) {
          navigate({ to: tabs[currentIndex + 1].path });
        } else if (tabs.length > 0) {
          navigate({ to: tabs[0].path });
        }
      }

      // Ctrl/Cmd + Shift + Tab: Previous tab
      if (modKey && e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
        if (currentIndex > 0) {
          navigate({ to: tabs[currentIndex - 1].path });
        } else if (tabs.length > 0) {
          navigate({ to: tabs[tabs.length - 1].path });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabs, activeTabId, navigate, handleTabClose]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", tabId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTabId(tabId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTabId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropTabId: string) => {
      e.preventDefault();

      if (!draggedTabId || draggedTabId === dropTabId) {
        setDraggedTabId(null);
        setDragOverTabId(null);
        return;
      }

      setTabs((prevTabs) => {
        const draggedIndex = prevTabs.findIndex(
          (tab) => tab.id === draggedTabId,
        );
        const dropIndex = prevTabs.findIndex((tab) => tab.id === dropTabId);

        if (draggedIndex === -1 || dropIndex === -1) return prevTabs;

        const newTabs = [...prevTabs];
        const [draggedTab] = newTabs.splice(draggedIndex, 1);
        newTabs.splice(dropIndex, 0, draggedTab);

        return newTabs;
      });

      setDraggedTabId(null);
      setDragOverTabId(null);
    },
    [draggedTabId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  }, []);

  // Grip hover handlers
  const handleGripMouseEnter = useCallback((tabId: string) => {
    setHoveredGripTabId(tabId);
  }, []);

  const handleGripMouseLeave = useCallback(() => {
    setHoveredGripTabId(null);
  }, []);

  // Check if tabs are enabled by user preference
  const [tabsEnabled, setTabsEnabled] = useState(() => {
    const saved = storage.get<boolean>(ENABLE_TABS_STORAGE_KEY);
    return saved !== false; // Default to enabled if not set
  });

  // Listen for preference changes
  useEffect(() => {
    const handlePreferenceChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTabsEnabled(customEvent.detail.enabled);
    };

    window.addEventListener("tabs-preference-changed", handlePreferenceChange);
    return () => {
      window.removeEventListener(
        "tabs-preference-changed",
        handlePreferenceChange,
      );
    };
  }, []);

  // Listen for tab position changes
  useEffect(() => {
    const handleTabPositionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setTabPosition(customEvent.detail.position);
    };

    window.addEventListener("tab-position-changed", handleTabPositionChange);
    return () => {
      window.removeEventListener(
        "tab-position-changed",
        handleTabPositionChange,
      );
    };
  }, []);

  const getModuleInfo = useCallback((path: string) => {
    return getModuleFromConfig(tabConfiguration, path);
  }, []);

  const sortTabsWithPins = (tabsList: AppTab[]) => {
    const homePaths = ["/"];
    return [...tabsList].sort((a, b) => {
      const aIsHome = homePaths.includes(a.path);
      const bIsHome = homePaths.includes(b.path);

      // 1. Home always first
      if (aIsHome && !bIsHome) return -1;
      if (!aIsHome && bIsHome) return 1;
      if (aIsHome && bIsHome) return 0; // Maintain relative order of home paths

      // 2. Then Pinned tabs
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 3. Then Grouped tabs
      if (a.grouped && !b.grouped) return -1;
      if (!a.grouped && b.grouped) return 1;

      // 4. Keep existing order
      return 0;
    });
  };

  const handleTogglePin = useCallback((tab: AppTab) => {
    setTabs((prev) => {
      const updated = prev.map((t) =>
        t.id === tab.id ? { ...t, pinned: !t.pinned } : t,
      );
      return sortTabsWithPins(updated);
    });
  }, []);

  const handleToggleGroup = useCallback(
    (tab: AppTab) => {
      setTabs((prev) => {
        // When toggling group mode on, apply it to all tabs in the same group
        if (!tab.grouped) {
          const tabMetadata = getTabMetadataForPath(tab.path);
          if (tabMetadata?.group) {
            // Group mode ON: Mark all tabs in the same group as grouped
            const updated = prev.map((t) => {
              const tMetadata = getTabMetadataForPath(t.path);
              return tMetadata?.group === tabMetadata.group
                ? { ...t, grouped: true }
                : t;
            });
            return sortTabsWithPins(updated);
          }
        } else {
          // Group mode OFF: Remove group mode from all tabs in the same group
          const tabMetadata = getTabMetadataForPath(tab.path);
          if (tabMetadata?.group) {
            const updated = prev.map((t) => {
              const tMetadata = getTabMetadataForPath(t.path);
              return tMetadata?.group === tabMetadata.group
                ? { ...t, grouped: false }
                : t;
            });
            return sortTabsWithPins(updated);
          }
        }
        return prev;
      });
    },
    [getTabMetadataForPath],
  );

  const handleGroupTabs = useCallback(() => {
    setTabs((prevTabs) => {
      const sorted = [...prevTabs].sort((a, b) => {
        // Pinned tabs always first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.pinned && b.pinned) return 0;

        const moduleA = getModuleInfo(a.path);
        const moduleB = getModuleInfo(b.path);
        if (moduleA === moduleB) {
          // Within the same module, use configuration-based grouping and sequencing
          const metadataA = getTabMetadataForPath(a.path);
          const metadataB = getTabMetadataForPath(b.path);

          if (metadataA && metadataB) {
            // Sort by group first (custom group names, with undefined groups at the end)
            const groupA = metadataA.group;
            const groupB = metadataB.group;

            // If one has a group and the other doesn't, prioritize the one with a group
            if (groupA && !groupB) return -1;
            if (!groupA && groupB) return 1;

            // If both have groups, sort alphabetically by group name
            if (groupA && groupB && groupA !== groupB) {
              return groupA.localeCompare(groupB);
            }

            // Within the same group (or both undefined), sort by sequence
            const sequenceDiff = metadataA.sequence - metadataB.sequence;
            if (sequenceDiff !== 0) return sequenceDiff;
          }

          // Fallback: sort by title, keep home tab at top
          if (a.path === "/") return -1;
          if (b.path === "/") return 1;
          return a.title.localeCompare(b.title);
        }

        // Sort by module order
        return moduleOrder.indexOf(moduleA) - moduleOrder.indexOf(moduleB);
      });
      return sorted;
    });
  }, [getModuleInfo, getTabMetadataForPath]);

  // Group tabs for the dropdown
  const groupedTabs = tabs.reduce(
    (acc, tab) => {
      const module = tab.pinned ? "Pinned" : getModuleInfo(tab.path);
      if (!acc[module]) acc[module] = [];
      acc[module].push(tab);
      return acc;
    },
    {} as Record<string, AppTab[]>,
  );

  // Hide tabs if disabled by user preference
  // Also hide if inline mode is requested but tab position is separate
  if (!tabsEnabled || (inline && tabPosition !== "inline")) {
    return null;
  }

  // Filter out any undefined/null tabs (safety check for corrupted data)
  const validTabs = tabs.filter((tab): tab is AppTab => tab != null);

  return (
    <div
      className={
        inline
          ? ""
          : "sticky-tabs border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
      }
    >
      <div
        className={cn(
          "flex items-center",
          inline ? "gap-1.5" : "container gap-0.5 h-8 px-4 sm:px-6",
        )}
      >
        <div className="flex-1 min-w-0 overflow-hidden relative group/tabs-container">
          <div
            className={cn(
              "flex items-center tab-container",
              inline ? "gap-1.5" : "gap-0.5",
            )}
            ref={scrollViewportRef}
          >
            {validTabs.map((tab) => {
              const activeTab = validTabs.find((t) => t.id === activeTabId);
              const activeTabMetadata = activeTab
                ? getTabMetadataForPath(activeTab.path)
                : null;
              const currentTabMetadata = getTabMetadataForPath(tab.path);
              const isInSameGroup =
                activeTabMetadata?.group &&
                currentTabMetadata?.group &&
                activeTabMetadata.group === currentTabMetadata.group &&
                tab.id !== activeTabId;

              return (
                <ContextMenu key={tab.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      ref={activeTabId === tab.id ? activeTabRef : null}
                      draggable={hoveredGripTabId === tab.id}
                      onDragStart={(e) => handleDragStart(e, tab.id)}
                      onDragOver={(e) => handleDragOver(e, tab.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, tab.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        "group relative flex items-center justify-between gap-1.5 px-2 py-1 rounded-md",
                        "transition-all duration-200 whitespace-nowrap text-xs border",
                        "flex-shrink-0 select-none",
                        tab.pinned
                          ? "w-8 px-0 justify-center min-w-[32px]"
                          : cn(
                              "min-w-0",
                              inline
                                ? "max-w-[140px] text-[11px]"
                                : "max-w-[200px]",
                            ),
                        hoveredGripTabId === tab.id
                          ? "cursor-grab"
                          : "cursor-pointer",
                        activeTabId === tab.id
                          ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/50 shadow-sm ring-1 ring-primary/20 dark:ring-primary/30"
                          : "bg-transparent hover:bg-accent/50 border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground",
                        draggedTabId === tab.id ? "opacity-50 scale-95" : "",
                        dragOverTabId === tab.id && draggedTabId !== tab.id
                          ? "ring-2 ring-primary/50 bg-primary/10"
                          : "",
                        // Group highlighting for tabs in the same group as active tab
                        isInSameGroup
                          ? "bg-accent/90 text-accent-foreground border-border shadow-sm"
                          : "",
                      )}
                      title={tab.title}
                    >
                      {/* Main content area */}
                      {tab.pinned ? (
                        // Pinned tabs: just centered icon
                        (() => {
                          const IconComponent = getIconComponent(tab.iconName);
                          return IconComponent ? (
                            <IconComponent className="h-3.5 w-3.5 flex-shrink-0 mx-auto" />
                          ) : null;
                        })()
                      ) : (
                        // Regular tabs: left side content with flexible layout
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {(() => {
                            const IconComponent = getIconComponent(
                              tab.iconName,
                            );
                            return IconComponent ? (
                              <div className="relative h-3.5 w-3.5 flex-shrink-0">
                                <IconComponent className="h-3.5 w-3.5 opacity-100 group-hover:opacity-0 transition-opacity duration-300" />
                                <GripVertical
                                  className="h-3.5 w-3.5 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-grab active:cursor-grabbing"
                                  onMouseEnter={() =>
                                    handleGripMouseEnter(tab.id)
                                  }
                                  onMouseLeave={handleGripMouseLeave}
                                />
                              </div>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="font-medium truncate">
                              {tab.title}
                            </span>
                            {tab.grouped && (
                              <Layers className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground opacity-60" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right side - Close button */}
                      {!tab.pinned && tabs.length > 1 && (
                        <button
                          onClick={(e) => handleTabClose(e, tab.id)}
                          className={cn(
                            "opacity-0 group-hover:opacity-100 transition-all duration-150",
                            "hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded p-0.5 -mr-0.5",
                            "shrink-0 ml-1",
                            activeTabId === tab.id ? "opacity-100" : "",
                          )}
                          aria-label={`Close ${tab.title}`}
                          title={`Close ${tab.title}`}
                        >
                          <X className="h-3 w-3 transition-all duration-150 hover:text-red-500 hover:scale-110 active:scale-95" />
                        </button>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="min-w-[120px]">
                    {tabs.length > 1 && (
                      <>
                        <ContextMenuItem
                          onClick={() => handleTogglePin(tab)}
                          className="text-xs"
                        >
                          {tab.pinned ? (
                            <PinOff className="mr-2 h-3.5 w-3.5" />
                          ) : (
                            <Pin className="mr-2 h-3.5 w-3.5" />
                          )}
                          {tab.pinned ? "Unpin Tab" : "Pin Tab"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleToggleGroup(tab)}
                          className="text-xs"
                        >
                          <Layers className="mr-2 h-3.5 w-3.5" />
                          {tab.grouped ? "Ungroup Tab" : "Group Related Tabs"}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={handleGroupTabs}
                          className="text-xs"
                        >
                          <Layers className="mr-2 h-3.5 w-3.5" />
                          Sort by Groups
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={handleCloseOthers}
                          className="text-xs"
                        >
                          Close Others
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={handleCloseAll}
                          className="text-xs"
                        >
                          Close All
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>

        {/* Permanent List All Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-[26px] w-[26px] p-0 border border-transparent rounded-md hover:bg-accent/50 shrink-0 ml-1",
                "text-muted-foreground hover:text-foreground",
              )}
              aria-label="List all tabs"
              title="List all tabs"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[400px] overflow-y-auto min-w-[200px]"
          >
            {moduleOrder.map((module) => {
              const moduleTabs = groupedTabs[module];
              if (!moduleTabs || moduleTabs.length === 0) return null;
              return (
                <div key={module}>
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground px-2 py-1.5 font-bold tracking-wider opacity-70">
                    {module}
                  </DropdownMenuLabel>
                  {moduleTabs.map((tab) => {
                    const IconComponent = getIconComponent(tab.iconName);
                    return (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => handleTabClick(tab)}
                        className={cn(
                          "text-xs flex items-center justify-between gap-2 pl-4",
                          activeTabId === tab.id &&
                            "bg-accent text-accent-foreground font-medium",
                        )}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {tab.pinned && (
                            <Pin className="h-3 w-3 text-muted-foreground shrink-0 rotate-45" />
                          )}
                          {tab.grouped && (
                            <Layers className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          {IconComponent && (
                            <IconComponent className="mr-2 h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate" title={tab.title}>
                            {tab.title}
                          </span>
                        </div>
                        {!tab.pinned && tabs.length > 1 && (
                          <div
                            role="button"
                            onClick={(e) => handleTabClose(e, tab.id)}
                            className="opacity-50 hover:opacity-100 p-1 hover:bg-background/80 rounded"
                            aria-label={`Close ${tab.title}`}
                            title={`Close ${tab.title}`}
                          >
                            <X className="h-3 w-3" />
                          </div>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator className="my-1" />
                </div>
              );
            })}

            {tabs.length > 1 && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    const activeTab = tabs.find((t) => t.id === activeTabId);
                    if (activeTab) handleToggleGroup(activeTab);
                  }}
                  className="text-xs"
                >
                  <Layers className="mr-2 h-3.5 w-3.5" />
                  {tabs.find((t) => t.id === activeTabId)?.grouped
                    ? "Ungroup Tabs"
                    : "Group Related Tabs"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGroupTabs} className="text-xs">
                  <Layers className="mr-2 h-3.5 w-3.5" />
                  Sort by Groups
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={handleCloseAll}
                  className="text-xs text-red-500 focus:text-red-600"
                >
                  Close All Tabs
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
