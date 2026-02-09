import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  cn,
  useToast,
  Switch,
  Label,
} from "@truths/ui";
import { Trash2, AlertTriangle, RefreshCw, Database } from "lucide-react";
import { useDensityStyles, storage, userPreferences } from "@truths/utils";
import { clearPersistedQueryCache } from "../../providers/query-provider";

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const density = useDensityStyles();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [queryCacheEnabled, setQueryCacheEnabled] = useState<boolean>(true);
  const [reactQueryCacheEnabled, setReactQueryCacheEnabled] =
    useState<boolean>(true);

  // Load cache preferences on mount
  useEffect(() => {
    const backendEnabled = userPreferences.get<boolean>(
      "cache",
      "queryCacheEnabled"
    );
    const frontendEnabled = userPreferences.get<boolean>(
      "cache",
      "reactQueryCacheEnabled"
    );
    // Default to true if not set (backward compatible)
    setQueryCacheEnabled(backendEnabled !== false);
    setReactQueryCacheEnabled(frontendEnabled !== false);
  }, []);

  const handleQueryCacheToggle = async (enabled: boolean) => {
    try {
      setQueryCacheEnabled(enabled);
      // Update preference - use async to ensure it's saved
      await userPreferences.setAsync(["cache", "queryCacheEnabled"], enabled);

      toast({
        title: enabled
          ? t("pages.settings.account.queryCacheEnabled")
          : t("pages.settings.account.queryCacheDisabled"),
        description: enabled
          ? t("pages.settings.account.queryCacheEnabledDesc")
          : t("pages.settings.account.queryCacheDisabledDesc"),
      });
    } catch (error) {
      console.error("Failed to update query cache preference:", error);
      // Revert on error
      setQueryCacheEnabled(!enabled);
      toast({
        title: t("pages.settings.account.preferenceUpdateError"),
        description: t("pages.settings.account.preferenceUpdateErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleReactQueryCacheToggle = async (enabled: boolean) => {
    try {
      setReactQueryCacheEnabled(enabled);
      // Update preference - use async to ensure it's saved
      await userPreferences.setAsync(
        ["cache", "reactQueryCacheEnabled"],
        enabled
      );

      // Update QueryClient default options for new queries
      const gcTime = enabled ? 24 * 60 * 60 * 1000 : 0; // 24 hours or 0
      const staleTime = enabled ? 5 * 60 * 1000 : 0; // 5 minutes or 0
      
      queryClient.setDefaultOptions({
        queries: {
          gcTime,
          staleTime,
        },
      });

      // Clear React Query cache if disabling
      if (!enabled) {
        queryClient.clear();
        await clearPersistedQueryCache();
      }

      toast({
        title: enabled
          ? t("pages.settings.account.reactQueryCacheEnabled")
          : t("pages.settings.account.reactQueryCacheDisabled"),
        description: enabled
          ? t("pages.settings.account.reactQueryCacheEnabledDesc")
          : t("pages.settings.account.reactQueryCacheDisabledDesc"),
      });
    } catch (error) {
      console.error("Failed to update React Query cache preference:", error);
      // Revert on error
      setReactQueryCacheEnabled(!enabled);
      toast({
        title: t("pages.settings.account.preferenceUpdateError"),
        description: t("pages.settings.account.preferenceUpdateErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear React Query in-memory cache
      queryClient.clear();
      queryClient.removeQueries();

      // Clear React Query persisted cache
      await clearPersistedQueryCache();

      // Clear other cached data from localStorage
      if (storage && typeof storage.remove === "function") {
        storage.remove("REACT_QUERY_OFFLINE_CACHE");
        storage.remove("app_tabs");
        storage.remove("scroll_positions");

        // Clear command palette recent searches
        if (storage.removeMatching) {
          storage.removeMatching("^command-palette-recent");
        } else {
          storage.remove("command-palette-recent");
        }
      }

      toast({
        title: t("pages.settings.account.cacheCleared"),
        description: t("pages.settings.account.cacheClearedDesc"),
      });
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast({
        title: t("pages.settings.account.cacheClearError"),
        description: t("pages.settings.account.cacheClearErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleInvalidateAllQueries = async () => {
    try {
      // Invalidate all React Query queries
      await queryClient.invalidateQueries();

      toast({
        title: t("pages.settings.account.queriesInvalidated"),
        description: t("pages.settings.account.queriesInvalidatedDesc"),
      });
    } catch (error) {
      console.error("Failed to invalidate queries:", error);
      toast({
        title: t("pages.settings.account.queriesInvalidateError"),
        description: t("pages.settings.account.queriesInvalidateErrorDesc"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("space-y-6", density.spacingFormSection)}>
      <Card>
        <CardHeader className={density.spacingFormItem}>
          <CardTitle
            className={cn(
              density.textSizeCardTitle,
              "font-semibold"
            )}
          >
            {t("pages.settings.account.title")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.account.description")}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(density.paddingContainer, density.spacingFormSection)}
        >
          <div
            className={cn(
              "flex items-center justify-between border rounded-lg",
              density.paddingForm
            )}
          >
            <div>
              <h4 className={cn("font-medium", density.textSize)}>
                {t("pages.settings.account.accountStatus")}
              </h4>
              <p className={cn("text-muted-foreground", density.textSizeSmall)}>
                {t("pages.settings.account.accountStatusDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "rounded-full bg-green-500",
                  density.iconSizeSmall
                )}
              ></div>
              <span className={cn("font-medium", density.textSizeSmall)}>
                {t("pages.settings.account.active")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={density.spacingFormItem}>
          <CardTitle
            className={cn(
              "flex items-center gap-2",
              density.textSizeCardTitle,
              "font-semibold"
            )}
          >
            <Database className={density.iconSize} />
            {t("pages.settings.account.cacheManagement")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.account.cacheManagementDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(density.paddingContainer, density.spacingFormSection)}
        >
          <div className={cn("space-y-6", density.spacingFormSection)}>
            <div className="flex items-center justify-between">
              <div className={density.spacingFormItem}>
                <Label
                  htmlFor="query-cache-enabled"
                  className={density.textSizeLabel}
                >
                  {t("pages.settings.account.enableQueryCache")}
                </Label>
                <p
                  className={cn("text-muted-foreground", density.textSizeSmall)}
                >
                  {t("pages.settings.account.enableQueryCacheDesc")}
                </p>
              </div>
              <Switch
                id="query-cache-enabled"
                checked={queryCacheEnabled}
                onCheckedChange={handleQueryCacheToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className={density.spacingFormItem}>
                <Label
                  htmlFor="react-query-cache-enabled"
                  className={density.textSizeLabel}
                >
                  {t("pages.settings.account.enableReactQueryCache")}
                </Label>
                <p
                  className={cn("text-muted-foreground", density.textSizeSmall)}
                >
                  {t("pages.settings.account.enableReactQueryCacheDesc")}
                </p>
              </div>
              <Switch
                id="react-query-cache-enabled"
                checked={reactQueryCacheEnabled}
                onCheckedChange={handleReactQueryCacheToggle}
              />
            </div>

            <div className={cn("space-y-3", density.spacingFormSection)}>
              <Button
                variant="outline"
                onClick={handleClearCache}
                className={cn(
                  density.buttonHeightSmall,
                  density.paddingCell,
                  density.textSizeSmall,
                  "flex items-center gap-1.5 w-full justify-start"
                )}
              >
                <Database className={density.iconSizeSmall} />
                <span>{t("pages.settings.account.clearCache")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleInvalidateAllQueries}
                className={cn(
                  density.buttonHeightSmall,
                  density.paddingCell,
                  density.textSizeSmall,
                  "flex items-center gap-1.5 w-full justify-start"
                )}
              >
                <RefreshCw className={density.iconSizeSmall} />
                <span>{t("pages.settings.account.invalidateAllQueries")}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader className={density.spacingFormItem}>
          <CardTitle
            className={cn(
              "text-destructive flex items-center gap-2",
              density.textSizeCardTitle,
              "font-semibold"
            )}
          >
            <AlertTriangle className={density.iconSize} />
            {t("pages.settings.account.dangerZone")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.account.dangerZoneDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className={density.paddingContainer}>
          <Button
            variant="destructive"
            className={cn(
              density.buttonHeightSmall,
              density.paddingCell,
              density.textSizeSmall,
              "flex items-center gap-1.5"
            )}
          >
            <Trash2 className={density.iconSizeSmall} />
            <span>{t("pages.settings.account.deleteAccount")}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
