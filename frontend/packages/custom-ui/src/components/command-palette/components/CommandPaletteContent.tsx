import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Badge,
} from "@truths/ui";
import { History, Search as SearchIcon } from "lucide-react";
import {
  DataTypeConfig,
  RecentSearch,
  SearchScope,
  Suggestion,
  NavigationItem,
  QuickAction,
  BaseDataItem,
} from "../types";
import { DataGroup } from "./DataGroup";
import { EmptyState } from "./EmptyState";

// Extended DataTypeConfig with additional properties added during filtering
type FilteredDataTypeConfig<T extends BaseDataItem = BaseDataItem> =
  DataTypeConfig<T> & {
    data: T[];
    isLoading: boolean;
    error: any;
    isError: boolean;
  };

interface CommandPaletteContentProps {
  search: string;
  scope: SearchScope;
  isOnline: boolean;
  recentSearches: RecentSearch[];
  suggestions: Suggestion[];
  filteredNavigation: NavigationItem[];
  filteredActions: QuickAction[];
  filteredDataTypes: FilteredDataTypeConfig[];
  dataTypes: DataTypeConfig<BaseDataItem>[];
  dataQueries: Record<string, any>;
  onRecentSelect: (recent: RecentSearch) => void;
  onClearRecentSearches: () => void;
  onSearchChange: (search: string) => void;
  onSelect: (callback: () => void) => void;
}

export function CommandPaletteContent({
  search,
  scope,
  isOnline,
  recentSearches,
  suggestions,
  filteredNavigation,
  filteredActions,
  filteredDataTypes,
  dataTypes,
  dataQueries,
  onRecentSelect,
  onClearRecentSearches,
  onSearchChange,
  onSelect,
}: CommandPaletteContentProps) {
  const navigate = useNavigate();

  return (
    <CommandList>
      <EmptyState isOnline={isOnline} dataTypes={dataTypes} />

      {/* Recent Searches - Show when no search query */}
      {!search && recentSearches.length > 0 && (
        <>
          <CommandGroup heading="Recent Searches">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs text-muted-foreground">
                Your recent searches
              </span>
              <button
                onClick={onClearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            {recentSearches.map((recent, index) => (
              <CommandItem
                key={`recent-${index}`}
                value={recent.query}
                onSelect={() => onRecentSelect(recent)}
              >
                <History className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{recent.query}</span>
                {recent.scope && recent.scope !== "all" && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {recent.scope}
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {/* Suggestions - Show when no search query */}
      {!search && suggestions.length > 0 && (
        <>
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion, index) => (
              <CommandItem
                key={`suggestion-${index}`}
                value={suggestion.text}
                onSelect={() => onSearchChange(suggestion.text)}
              >
                <SearchIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-mono">{suggestion.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
        </>
      )}

      {/* Navigation */}
      {filteredNavigation.length > 0 && (
        <>
          <CommandGroup heading="Navigation">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const meta = [item.parentLabel, item.description]
                .filter(Boolean)
                .join(" • ");

              return (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => onSelect(() => navigate({ to: item.path }))}
                  className="flex items-center gap-3"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    {meta ? (
                      <span className="text-xs text-muted-foreground">
                        {meta}
                      </span>
                    ) : null}
                  </div>
                  {item.shortcut ? (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {(filteredActions.length > 0 ||
            filteredDataTypes.some((dt) => dt.data.length > 0)) && (
            <CommandSeparator />
          )}
        </>
      )}

      {/* Quick Actions */}
      {filteredActions.length > 0 && (
        <>
          <CommandGroup
            heading={`Actions ${scope === "actions" ? "(scoped)" : ""}`}
          >
            {filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => onSelect(item.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          {filteredDataTypes.some((dt) => dt.data.length > 0) && (
            <CommandSeparator />
          )}
        </>
      )}

      {/* Dynamic Data Groups - Rendered generically */}
      {filteredDataTypes.map((dataType) => (
        <DataGroup
          key={dataType.key}
          dataType={dataType}
          scope={scope}
          onSelect={onSelect}
          dataQueries={dataQueries}
        />
      ))}

      {/* Help Footer - Show when empty search */}
      {!search && (
        <div className="border-t p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Pro tip:</span> Use scope modifiers
            like <code className="text-primary">nav:</code>,{" "}
            <code className="text-primary">action:</code>,{" "}
            {dataTypes.slice(0, 3).map((dataType, index) => (
              <React.Fragment key={dataType.key}>
                <code className="text-primary">{dataType.key}:</code>
                {index < Math.min(2, dataTypes.length - 1) && ", "}
              </React.Fragment>
            ))}
            {dataTypes.length > 3 && ", or more..."} to filter results
          </p>
        </div>
      )}
    </CommandList>
  );
}
