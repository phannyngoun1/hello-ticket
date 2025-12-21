import { useState, useEffect, useCallback, useRef } from "react";
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
  type LucideIcon,
  Menu,
  GripVertical,
} from "lucide-react";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@truths/ui";

const TABS_STORAGE_KEY = "app_tabs";
const ENABLE_TABS_STORAGE_KEY = "enable_tabs";

export interface AppTab {
  id: string;
  path: string;
  title: string;
  iconName?: string;
  data?: unknown;
}

interface TabManagerProps {
  onTabChange?: (tab: AppTab) => void;
  inline?: boolean;
}

export function TabManager({ onTabChange, inline = false }: TabManagerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabs, setTabs] = useState<AppTab[]>(() => {
    // Load saved tabs from localStorage
    const saved = storage.get<AppTab[]>(TABS_STORAGE_KEY);
    return saved || [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [maxVisibleTabs, setMaxVisibleTabs] = useState(10);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [hoveredGripTabId, setHoveredGripTabId] = useState<string | null>(null);
  const [tabPosition, setTabPosition] = useState<"separate" | "inline">(() => {
    const saved = storage.get<"separate" | "inline">("tab_position");
    return saved ?? "separate";
  });

  // Clean up tabs on mount to remove any undefined/null entries (from corrupted localStorage)
  useEffect(() => {
    setTabs((prevTabs) => {
      const cleanedTabs = prevTabs.filter(
        (tab): tab is AppTab => tab != null && !!tab.id && !!tab.path
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
      (tab): tab is AppTab => tab != null && !!tab.id && !!tab.path
    );
    storage.set(TABS_STORAGE_KEY, validTabs);
  }, [tabs]);

  // Get or create tab for current route
  useEffect(() => {
    // For seat designer route, include layoutId in path to create separate tabs per layout
    const isSeatDesignerRoute = location.pathname.includes("/seats/designer");
    const searchParams = new URLSearchParams(location.search);
    const layoutId = searchParams.get("layoutId");
    const currentPath = isSeatDesignerRoute && layoutId
      ? `${location.pathname}?layoutId=${layoutId}`
      : location.pathname;

    setTabs((prevTabs) => {
      const currentTab = prevTabs.find((tab) => tab.path === currentPath);

      if (!currentTab) {
        // Create new tab for current route
        const { title, iconName } = getTitleAndIconFromPath(location.pathname);
        const newTab: AppTab = {
          id: generateTabId(),
          path: currentPath,
          title,
          iconName,
        };
        setActiveTabId(newTab.id);
        if (onTabChange) {
          onTabChange(newTab);
        }

        const combined = [...prevTabs, newTab];
        const pinnedPaths = ["/", "/dashboard"];
        const pinnedTabs = combined.filter((tab) => pinnedPaths.includes(tab.path));
        const otherTabs = combined.filter((tab) => !pinnedPaths.includes(tab.path));
        return [...pinnedTabs.sort((a, b) => pinnedPaths.indexOf(a.path) - pinnedPaths.indexOf(b.path)), ...otherTabs];
      } else {
        // Switch to existing tab
        setActiveTabId(currentTab.id);
        if (onTabChange) {
          onTabChange(currentTab);
        }
        const pinnedPaths = ["/", "/dashboard"];
        const pinnedTabs = prevTabs.filter((tab) => pinnedPaths.includes(tab.path));
        const otherTabs = prevTabs.filter((tab) => !pinnedTabs.includes(tab));
        return [...pinnedTabs.sort((a, b) => pinnedPaths.indexOf(a.path) - pinnedPaths.indexOf(b.path)), ...otherTabs];
      }
    });
  }, [location.pathname, location.search, onTabChange]);

  // Listen for dynamic tab title updates from pages (e.g., after data load)
  useEffect(() => {
    const handleUpdateTitle = (e: Event) => {
      const { path, title, iconName } = (e as CustomEvent).detail || {};
      if (!path || !title) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.path === path
            ? { ...t, title, iconName: iconName ?? t.iconName }
            : t
        )
      );
    };

    window.addEventListener(
      "update-tab-title",
      handleUpdateTitle as EventListener
    );
    return () => {
      window.removeEventListener(
        "update-tab-title",
        handleUpdateTitle as EventListener
      );
    };
  }, []);

  const generateTabId = () =>
    `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getTitleAndIconFromPath = (
    path: string
  ): { title: string; iconName: string } => {
    const routeMap: Record<string, { title: string; iconName: string }> = {
      "/": { title: "Home", iconName: "Home" },
      "/dashboard": { title: "Dashboard", iconName: "LayoutDashboard" },
      "/users": { title: "Users", iconName: "Users" },
      "/profile": { title: "Profile", iconName: "User" },
      "/settings": { title: "Settings", iconName: "Settings" },
      "/settings/profile": { title: "Profile Settings", iconName: "User" },
      "/settings/account": { title: "Account Settings", iconName: "User" },
      "/settings/notifications": { title: "Notifications", iconName: "User" },
      "/settings/appearance": { title: "Appearance", iconName: "Settings" },
      "/settings/language": { title: "Language", iconName: "User" },
      "/settings/security": { title: "Security", iconName: "User" },
    };

    if (routeMap[path]) {
      return routeMap[path];
    }

    // Detail routes: provide friendlier defaults rather than raw IDs
    if (/^\/users\/[^/]+$/.test(path)) {
      return { title: "User", iconName: "User" };
    }

    // Fallback: Capitalize last segment
    const segment = path.split("/").pop() || "Page";
    const safe = segment.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : "Page";
    return { title: safe, iconName: "FileText" };
  };

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, LucideIcon> = {
      Home,
      LayoutDashboard,
      Users,
      User,
      Settings,
      FileText,
      Package,
    };
    return iconName ? iconMap[iconName] : null;
  };

  // Helper to navigate to a tab path (handles query strings)
  const navigateToTabPath = useCallback((path: string) => {
    const [pathname, search] = path.split("?");
    const searchParams = search ? new URLSearchParams(search) : undefined;
    navigate({ 
      to: pathname as any,
      search: searchParams ? Object.fromEntries(searchParams) : undefined
    });
  }, [navigate]);

  const handleTabClick = useCallback(
    (tab: AppTab) => {
      setActiveTabId(tab.id);
      navigateToTabPath(tab.path);
      if (onTabChange) {
        onTabChange(tab);
      }
    },
    [navigateToTabPath, onTabChange]
  );

  const handleTabClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
      const newTabs = tabs.filter((tab) => tab.id !== tabId);

      setTabs(newTabs);

      // If closing active tab, switch to another tab or home
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          const nextTab = newTabs[Math.min(tabIndex, newTabs.length - 1)];
          navigate({ to: nextTab.path });
        } else {
          navigate({ to: "/" });
        }
      }
    },
    [tabs, activeTabId, navigate]
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
          (tab) => tab.id === draggedTabId
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
    [draggedTabId]
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
        handlePreferenceChange
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
        handleTabPositionChange
      );
    };
  }, []);

  // Calculate how many tabs can fit dynamically
  useEffect(() => {
    if (!tabsContainerRef.current) return;

    const calculateMaxTabs = () => {
      if (!tabsContainerRef.current) return;

      if (inline) {
        // For inline mode, calculate based on actual container width
        const containerWidth = tabsContainerRef.current.offsetWidth;
        const menuButtonWidth = 50; // Menu button + gap
        const avgTabWidth = 90; // Balanced tab width for inline

        // Calculate how many tabs can fit, but be more generous
        const availableWidth = containerWidth - menuButtonWidth;
        const newMaxVisible = Math.max(
          2, // Always show at least 2 tabs in inline mode
          Math.floor(availableWidth / avgTabWidth)
        );

        // Don't hide tabs unless we really need to (more than 4 tabs)
        const finalMaxVisible = tabs.length <= 4 ? tabs.length : newMaxVisible;
        setMaxVisibleTabs(finalMaxVisible);
        return;
      }

      // For separate mode, calculate dynamically
      const containerWidth = tabsContainerRef.current.offsetWidth;
      const menuButtonWidth = 50; // Menu button + gap
      const avgTabWidth = 120; // Average tab width
      const newMaxVisible = Math.max(
        1,
        Math.floor((containerWidth - menuButtonWidth) / avgTabWidth)
      );

      setMaxVisibleTabs(newMaxVisible);
    };

    calculateMaxTabs();
    window.addEventListener("resize", calculateMaxTabs);

    return () => window.removeEventListener("resize", calculateMaxTabs);
  }, [tabs, inline]);

  // Hide tabs if disabled by user preference or if there's only one tab (but not in inline mode)
  // Also hide if inline mode is requested but tab position is separate
  if (
    !tabsEnabled ||
    (tabs.length <= 1 && !inline) ||
    (inline && tabPosition !== "inline")
  ) {
    return null;
  }

  // Filter out any undefined/null tabs (safety check for corrupted data)
  const validTabs = tabs.filter((tab): tab is AppTab => tab != null);

  // Keep tabs in their original order but ensure active tab is visible
  let visibleTabs = validTabs.slice(0, maxVisibleTabs);
  let hiddenTabs = validTabs.slice(maxVisibleTabs);

  // If active tab is hidden, swap it with the last visible tab
  const activeTab = validTabs.find((tab) => tab.id === activeTabId);
  if (activeTab && hiddenTabs.includes(activeTab) && hiddenTabs.length > 0) {
    const activeIndex = validTabs.indexOf(activeTab);
    const reorderedTabs = [...validTabs];
    // Swap active tab with last visible tab
    [reorderedTabs[activeIndex], reorderedTabs[maxVisibleTabs - 1]] = [
      reorderedTabs[maxVisibleTabs - 1],
      reorderedTabs[activeIndex],
    ];
    visibleTabs = reorderedTabs.slice(0, maxVisibleTabs);
    hiddenTabs = reorderedTabs.slice(maxVisibleTabs);
  }

  return (
    <div
      className={
        inline
          ? ""
          : "sticky-tabs border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
      }
    >
      <div
        ref={tabsContainerRef}
        className={
          inline
            ? "flex items-center gap-1.5 overflow-hidden"
            : "flex items-center gap-0.5 overflow-hidden h-8 px-4 sm:px-6"
        }
      >
        {visibleTabs
          .filter((tab): tab is AppTab => tab != null)
          .map((tab) => (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger asChild>
                <div
                  draggable={hoveredGripTabId === tab.id}
                  onDragStart={(e) => handleDragStart(e, tab.id)}
                  onDragOver={(e) => handleDragOver(e, tab.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, tab.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleTabClick(tab)}
                  className={`
                group relative flex items-center gap-1.5 px-2 py-1 rounded-md
                transition-all duration-200 whitespace-nowrap text-xs border
                flex-shrink-0 min-w-0
                ${inline ? "max-w-[140px] text-[11px]" : ""}
                ${
                  hoveredGripTabId === tab.id ? "cursor-grab" : "cursor-pointer"
                }
                ${
                  activeTabId === tab.id
                    ? "bg-accent text-accent-foreground border-border shadow-sm"
                    : "bg-transparent hover:bg-accent/50 border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground"
                }
                ${draggedTabId === tab.id ? "opacity-50 scale-95" : ""}
                ${
                  dragOverTabId === tab.id && draggedTabId !== tab.id
                    ? "ring-2 ring-primary/50 bg-primary/10"
                    : ""
                }
              `}
                >
                  <GripVertical
                    className="h-2.5 w-2.5 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity duration-200"
                    onMouseEnter={() => handleGripMouseEnter(tab.id)}
                    onMouseLeave={handleGripMouseLeave}
                  />
                  {(() => {
                    const IconComponent = getIconComponent(tab.iconName);
                    return IconComponent ? (
                      <IconComponent className="h-3 w-3 flex-shrink-0" />
                    ) : null;
                  })()}
                  <span className="font-medium truncate">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleTabClose(e, tab.id)}
                      className={`
                    opacity-0 group-hover:opacity-100 transition-all duration-150
                    hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded p-0.5 -mr-0.5
                    shrink-0
                    ${activeTabId === tab.id ? "opacity-100" : ""}
                  `}
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
          ))}
        {hiddenTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-[26px] px-2 text-xs border border-border rounded-md hover:bg-accent/50 shrink-0"
                aria-label="Open menu"
                title={`${hiddenTabs.length} more tabs`}
              >
                <Menu className="h-3 w-3 mr-1" />
                <span className="text-[10px] font-medium">
                  {hiddenTabs.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {hiddenTabs
                .filter((tab): tab is AppTab => tab != null)
                .map((tab) => {
                  const IconComponent = getIconComponent(tab.iconName);
                  return (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => navigateToTabPath(tab.path)}
                      className="text-xs"
                    >
                      {IconComponent && (
                        <IconComponent className="mr-2 h-3.5 w-3.5" />
                      )}
                      {tab.title}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
