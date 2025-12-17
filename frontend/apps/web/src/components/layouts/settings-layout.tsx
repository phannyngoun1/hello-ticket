import {
  ReactNode,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  cn,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Input,
} from "@truths/ui";
import { ChevronLeft, ChevronRight, ChevronDown, Search } from "lucide-react";
import {
  generateSettingsMenu,
  getSettingsRoutesFromRouter,
} from "../../utils/settings-menu";

interface SettingsMenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children?: SettingsMenuItem[];
}

interface SettingsLayoutProps {
  children: ReactNode;
}

const SETTINGS_MENU_COLLAPSED_KEY = "settings-menu-collapsed";
const EXPANDED_MENU_ITEMS_KEY = "settings-expanded-menu-items";

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const router = useRouter();
  const pathname = routerState.location.pathname;

  // Initialize state from localStorage
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SETTINGS_MENU_COLLAPSED_KEY);
      return saved === "true";
    }
    return false;
  });

  // Track which menu items with children are expanded
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(EXPANDED_MENU_ITEMS_KEY);
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  // Search state for filtering menu items
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [focusedChildIndex, setFocusedChildIndex] = useState<{
    parentIndex: number;
    childIndex: number;
  } | null>(null);

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Ref for sidebar to check if focus is within menu section
  const sidebarRef = useRef<HTMLElement>(null);

  // Persist menu collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        SETTINGS_MENU_COLLAPSED_KEY,
        String(isMenuCollapsed)
      );
    }
  }, [isMenuCollapsed]);

  // Persist expanded items to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        EXPANDED_MENU_ITEMS_KEY,
        JSON.stringify(Array.from(expandedItems))
      );
    }
  }, [expandedItems]);

  // Helper function to translate menu item titles
  // Handles both translation keys and already-translated strings
  const translateTitle = useCallback(
    (title: string): string => {
      // If it looks like a translation key (contains dots), try to translate it
      if (title.includes(".")) {
        const translated = t(title as never);
        // If translation returns the key itself, it might not exist, so return as-is
        // Otherwise return the translated value
        return translated !== title ? translated : title;
      }
      // If it's already a translated string, return as-is
      return title;
    },
    [t]
  );

  // Generate settings menu dynamically from route tree
  const settingsMenu: SettingsMenuItem[] = useMemo(() => {
    // Try to get routes from router instance first
    const routes = getSettingsRoutesFromRouter(
      router as unknown as {
        routesById?: Record<string, { id?: string; fullPath?: string }>;
      } | null
    );
    // Use translation function wrapper to match i18next signature
    const translate = (key: string, defaultValue?: string): string => {
      const result = defaultValue
        ? t(key as never, { defaultValue } as never)
        : t(key as never);
      return typeof result === "string" ? result : defaultValue || key;
    };
    // If router doesn't have routes, fall back to static list from route tree
    return generateSettingsMenu(routes.length > 0 ? routes : null, translate);
  }, [router, t]);

  // Auto-expand parent if child is active or search matches children
  useEffect(() => {
    settingsMenu.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) =>
            pathname === child.href || pathname.startsWith(child.href + "/")
        );
        // Auto-expand if child is active or if search matches children
        const searchMatchesChildren = searchQuery
          ? item.children.some((child) => {
              const translatedChildTitle = translateTitle(child.title);
              return translatedChildTitle
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            })
          : false;

        if (hasActiveChild || searchMatchesChildren) {
          setExpandedItems((prev) => {
            if (!prev.has(item.href)) {
              return new Set([...prev, item.href]);
            }
            return prev;
          });
        }
      }
    });
  }, [pathname, searchQuery, settingsMenu, translateTitle]);

  // Get filtered and flattened menu items for keyboard navigation
  const filteredMenu = useMemo(() => {
    return settingsMenu.filter((item) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      // Translate titles for search comparison
      const translatedTitle = translateTitle(item.title);
      const matchesParent = translatedTitle.toLowerCase().includes(query);
      const matchesChildren = item.children?.some((child) => {
        const translatedChildTitle = translateTitle(child.title);
        return translatedChildTitle.toLowerCase().includes(query);
      });
      return matchesParent || matchesChildren;
    });
  }, [settingsMenu, searchQuery, translateTitle]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get active element once at the start
      const activeElement = document.activeElement as HTMLElement | null;

      // Helper: Check if user is typing in any input field or dialog
      const isTypingInInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable ||
          activeElement.closest("[role='dialog']") !== null ||
          activeElement.closest("[role='combobox']") !== null ||
          activeElement.closest("[role='listbox']") !== null);

      // If user is typing in an input field or dialog, don't interfere with keyboard events
      // This allows spaces and other keys to work normally in forms
      if (isTypingInInput) {
        return;
      }

      // Focus search with Cmd/Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isMenuCollapsed && searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
        return;
      }

      // If typing printable characters and search is not focused, focus it
      // But only if focus is within the menu sidebar (not in content area)
      const isFocusInMenuSidebar =
        sidebarRef.current &&
        activeElement &&
        sidebarRef.current.contains(activeElement as Node);

      if (
        !isMenuCollapsed &&
        searchInputRef.current &&
        document.activeElement !== searchInputRef.current &&
        isFocusInMenuSidebar &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key !== "Enter" &&
        e.key !== "Tab"
      ) {
        searchInputRef.current.focus();
        return;
      }

      // If search input is focused, don't handle menu navigation
      if (
        document.activeElement === searchInputRef.current &&
        searchInputRef.current
      ) {
        // Allow Escape to blur search
        if (e.key === "Escape") {
          searchInputRef.current.blur();
          setFocusedIndex(null);
          setFocusedChildIndex(null);
          setSearchQuery("");
        }
        return;
      }

      if (isMenuCollapsed) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (focusedChildIndex !== null) {
          // Navigating from child to next item
          const currentParentIndex = focusedChildIndex.parentIndex;
          const currentItem = filteredMenu[currentParentIndex];
          const children =
            currentItem.children?.filter((child) => {
              if (!searchQuery) return true;
              const translatedChildTitle = translateTitle(child.title);
              return translatedChildTitle
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            }) || [];

          if (focusedChildIndex.childIndex < children.length - 1) {
            setFocusedChildIndex({
              parentIndex: focusedChildIndex.parentIndex,
              childIndex: focusedChildIndex.childIndex + 1,
            });
          } else {
            // Move to next parent or its first child
            const nextParentIndex = currentParentIndex + 1;
            if (nextParentIndex < filteredMenu.length) {
              const nextItem = filteredMenu[nextParentIndex];
              if (nextItem.children && expandedItems.has(nextItem.href)) {
                setFocusedChildIndex({
                  parentIndex: nextParentIndex,
                  childIndex: 0,
                });
              } else {
                setFocusedIndex(nextParentIndex);
                setFocusedChildIndex(null);
              }
            }
          }
        } else {
          const nextIndex =
            focusedIndex === null
              ? 0
              : Math.min(focusedIndex + 1, filteredMenu.length - 1);
          const nextItem = filteredMenu[nextIndex];
          if (nextItem.children && expandedItems.has(nextItem.href)) {
            setFocusedChildIndex({ parentIndex: nextIndex, childIndex: 0 });
          } else {
            setFocusedIndex(nextIndex);
          }
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (focusedChildIndex !== null) {
          if (focusedChildIndex.childIndex > 0) {
            setFocusedChildIndex({
              parentIndex: focusedChildIndex.parentIndex,
              childIndex: focusedChildIndex.childIndex - 1,
            });
          } else {
            // Move to parent
            setFocusedIndex(focusedChildIndex.parentIndex);
            setFocusedChildIndex(null);
          }
        } else {
          const prevIndex =
            focusedIndex === null
              ? filteredMenu.length - 1
              : Math.max(focusedIndex - 1, 0);
          const prevItem = filteredMenu[prevIndex];
          if (prevItem.children && expandedItems.has(prevItem.href)) {
            const children = prevItem.children.filter((child) => {
              if (!searchQuery) return true;
              const translatedChildTitle = translateTitle(child.title);
              return translatedChildTitle
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            });
            setFocusedChildIndex({
              parentIndex: prevIndex,
              childIndex: children.length - 1,
            });
          } else {
            setFocusedIndex(prevIndex);
          }
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusedChildIndex !== null) {
          const item = filteredMenu[focusedChildIndex.parentIndex];
          const children =
            item.children?.filter((child) => {
              if (!searchQuery) return true;
              const translatedChildTitle = translateTitle(child.title);
              return translatedChildTitle
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            }) || [];
          const child = children[focusedChildIndex.childIndex];
          if (child) {
            window.location.href = child.href;
          }
        } else if (focusedIndex !== null) {
          const item = filteredMenu[focusedIndex];
          if (item.children) {
            // Toggle expand/collapse
            setExpandedItems((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(item.href)) {
                newSet.delete(item.href);
              } else {
                newSet.add(item.href);
              }
              return newSet;
            });
          } else {
            window.location.href = item.href;
          }
        }
      } else if (e.key === "Escape") {
        setFocusedIndex(null);
        setFocusedChildIndex(null);
        setSearchQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isMenuCollapsed,
    focusedIndex,
    focusedChildIndex,
    filteredMenu,
    expandedItems,
    searchQuery,
    translateTitle,
  ]);

  return (
    <div className="space-y-3">
      {/* Settings Layout */}
      <div className="flex flex-col gap-3 md:flex-row">
        {/* Sidebar Navigation */}
        <aside
          ref={sidebarRef}
          className={cn(
            "flex-shrink-0 transition-all duration-300 ease-in-out",
            isMenuCollapsed ? "w-12 md:w-12" : "w-full md:w-52"
          )}
        >
          <div className="flex items-center gap-1.5 mb-2">
            {!isMenuCollapsed && (
              <div className="relative flex-1">
                <Search className="absolute left-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t("common.search", "Search...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-6 h-7 text-xs"
                  onKeyDown={(e) => {
                    // Allow arrow keys to navigate menu when search is focused
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                      searchInputRef.current?.blur();
                      // Set focus to first/last menu item
                      if (e.key === "ArrowDown") {
                        const firstItem = filteredMenu[0];
                        if (firstItem) {
                          if (
                            firstItem.children &&
                            expandedItems.has(firstItem.href)
                          ) {
                            setFocusedChildIndex({
                              parentIndex: 0,
                              childIndex: 0,
                            });
                          } else {
                            setFocusedIndex(0);
                          }
                        }
                      } else {
                        // ArrowUp - focus last item
                        const lastIndex = filteredMenu.length - 1;
                        const lastItem = filteredMenu[lastIndex];
                        if (lastItem) {
                          if (
                            lastItem.children &&
                            expandedItems.has(lastItem.href)
                          ) {
                            const children = lastItem.children.filter(
                              (child) => {
                                if (!searchQuery) return true;
                                const translatedChildTitle = translateTitle(
                                  child.title
                                );
                                return translatedChildTitle
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase());
                              }
                            );
                            setFocusedChildIndex({
                              parentIndex: lastIndex,
                              childIndex: children.length - 1,
                            });
                          } else {
                            setFocusedIndex(lastIndex);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
              className="h-7 w-7 p-0 flex-shrink-0"
              aria-label={
                isMenuCollapsed
                  ? t("common.expandMenu", "Expand menu")
                  : t("common.collapseMenu", "Collapse menu")
              }
            >
              {isMenuCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <nav className="space-y-0.5">
            {filteredMenu.map((item, itemIndex) => {
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;

              // Check if any child is active
              const hasActiveChild = hasChildren
                ? item.children!.some(
                    (child) =>
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/")
                  )
                : false;

              // Parent is active only if it's directly active AND no child is active
              const isActive =
                !hasActiveChild &&
                (pathname === item.href ||
                  pathname.startsWith(item.href + "/"));

              // Parent has weak highlight when a child is active
              const isParentWeakActive =
                hasActiveChild &&
                (pathname === item.href ||
                  pathname.startsWith(item.href + "/"));

              // When collapsed and has children, wrap in Popover
              if (isMenuCollapsed && hasChildren) {
                return (
                  <Popover key={item.href}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center justify-center px-2 py-2 rounded transition-all duration-300 text-xs w-full",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isParentWeakActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        title={translateTitle(item.title)}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="start"
                      className="w-48 p-1.5"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="space-y-0.5">
                        <div className="px-2 py-1.5 text-xs font-semibold border-b">
                          {translateTitle(item.title)}
                        </div>
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/");

                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-300 text-xs",
                                isChildActive
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5" />
                              <span>{translateTitle(child.title)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              // Default rendering (expanded or no children)
              const isExpanded = expandedItems.has(item.href);

              return (
                <div key={item.href} className="space-y-1">
                  {hasChildren && !isMenuCollapsed ? (
                    // Menu item with children - make it clickable to toggle
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setExpandedItems((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.href)) {
                            newSet.delete(item.href);
                          } else {
                            newSet.add(item.href);
                          }
                          return newSet;
                        });
                      }}
                      onFocus={() => {
                        setFocusedIndex(itemIndex);
                        setFocusedChildIndex(null);
                      }}
                      tabIndex={
                        focusedIndex === itemIndex && focusedChildIndex === null
                          ? 0
                          : -1
                      }
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-300 text-xs w-full text-left outline-none",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isParentWeakActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground",
                        focusedIndex === itemIndex && focusedChildIndex === null
                          ? "ring-2 ring-ring ring-offset-1"
                          : ""
                      )}
                      {...(hasChildren && { "aria-expanded": isExpanded })}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium whitespace-nowrap text-xs">
                          {translateTitle(item.title)}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 flex-shrink-0 transition-transform duration-200",
                          isExpanded ? "rotate-180" : "rotate-0"
                        )}
                      />
                    </button>
                  ) : (
                    // Regular menu item without children or when collapsed
                    <Link
                      to={item.href}
                      onFocus={() => {
                        setFocusedIndex(itemIndex);
                        setFocusedChildIndex(null);
                      }}
                      tabIndex={
                        focusedIndex === itemIndex && focusedChildIndex === null
                          ? 0
                          : -1
                      }
                      className={cn(
                        "flex rounded transition-all duration-300 outline-none",
                        isMenuCollapsed
                          ? "items-center justify-center px-2 py-2"
                          : "items-center gap-2 px-2 py-1.5",
                        "text-xs",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                        focusedIndex === itemIndex && focusedChildIndex === null
                          ? "ring-2 ring-ring ring-offset-1"
                          : ""
                      )}
                      title={
                        isMenuCollapsed ? translateTitle(item.title) : undefined
                      }
                    >
                      <Icon
                        className={cn(
                          "flex-shrink-0 transition-all duration-300",
                          isMenuCollapsed ? "h-4 w-4" : "h-4 w-4"
                        )}
                      />
                      <div
                        className={cn(
                          "flex-1 transition-all duration-300 ease-in-out overflow-hidden",
                          isMenuCollapsed
                            ? "max-w-0 opacity-0"
                            : "max-w-full opacity-100"
                        )}
                      >
                        <div className="font-medium whitespace-nowrap text-xs">
                          {translateTitle(item.title)}
                        </div>
                      </div>
                    </Link>
                  )}
                  {hasChildren && !isMenuCollapsed && isExpanded && (
                    <div className="ml-6 space-y-0.5">
                      {item
                        .children!.filter((child) => {
                          if (!searchQuery) return true;
                          const translatedChildTitle = translateTitle(
                            child.title
                          );
                          return translatedChildTitle
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase());
                        })
                        .map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const isChildActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/");
                          const isFocused =
                            focusedChildIndex?.parentIndex === itemIndex &&
                            focusedChildIndex?.childIndex === childIndex;

                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              onFocus={() => {
                                setFocusedChildIndex({
                                  parentIndex: itemIndex,
                                  childIndex,
                                });
                                setFocusedIndex(null);
                              }}
                              tabIndex={isFocused ? 0 : -1}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded transition-all duration-300 text-xs outline-none",
                                isChildActive
                                  ? "bg-primary text-primary-foreground font-medium"
                                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                                isFocused
                                  ? "ring-2 ring-ring ring-offset-1"
                                  : ""
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5" />
                              <span>{translateTitle(child.title)}</span>
                            </Link>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
