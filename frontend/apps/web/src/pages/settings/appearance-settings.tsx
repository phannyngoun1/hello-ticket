import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from "@truths/ui";
import { useTheme } from "../../providers/use-theme";
import { useDensity } from "../../providers/use-density";
import {
  Moon,
  Sun,
  Monitor,
  Layout,
  PanelLeft,
  PanelTop,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@truths/ui";
import { storage } from "@truths/utils";

const ENABLE_TABS_STORAGE_KEY = "enable_tabs";
const TAB_POSITION_STORAGE_KEY = "tab_position";

export function AppearanceSettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { density, setDensity } = useDensity();
  const [enableTabs, setEnableTabs] = useState<boolean>(() => {
    const saved = storage.get<boolean>(ENABLE_TABS_STORAGE_KEY);
    return saved ?? true; // Default to enabled
  });
  const [tabPosition, setTabPosition] = useState<"separate" | "inline">(() => {
    const saved = storage.get<"separate" | "inline">(TAB_POSITION_STORAGE_KEY);
    return saved ?? "separate"; // Default to separate
  });

  const handleToggleTabs = (enabled: boolean) => {
    setEnableTabs(enabled);
    storage.set(ENABLE_TABS_STORAGE_KEY, enabled);
    // Trigger a storage event so other components can react
    window.dispatchEvent(
      new CustomEvent("tabs-preference-changed", { detail: { enabled } })
    );
  };

  const handleTabPositionChange = (position: "separate" | "inline") => {
    setTabPosition(position);
    storage.set(TAB_POSITION_STORAGE_KEY, position);
    // Trigger a storage event so other components can react
    window.dispatchEvent(
      new CustomEvent("tab-position-changed", { detail: { position } })
    );
  };

  const themes = [
    {
      value: "light",
      label: t("theme.light"),
      icon: Sun,
    },
    {
      value: "dark",
      label: t("theme.dark"),
      icon: Moon,
    },
    {
      value: "system",
      label: t("theme.system"),
      icon: Monitor,
    },
  ];

  const densityOptions = [
    {
      value: "compact",
      label: t("pages.settings.appearance.compact", "Compact"),
      icon: Minimize2,
      description: t(
        "pages.settings.appearance.compactDesc",
        "Dense layout with smaller spacing"
      ),
    },
    {
      value: "normal",
      label: t("pages.settings.appearance.normal", "Normal"),
      icon: Maximize2,
      description: t(
        "pages.settings.appearance.normalDesc",
        "Comfortable layout with more spacing"
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.settings.appearance.title")}</CardTitle>
          <CardDescription>
            {t("pages.settings.appearance.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>{t("pages.settings.appearance.themeMode")}</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => setTheme(item.value as any)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 hover:bg-accent transition-colors",
                      theme === item.value
                        ? "border-primary bg-accent"
                        : "border-muted"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("pages.settings.appearance.uiDensity", "UI Density")}</Label>
            <p className="text-sm text-muted-foreground">
              {t(
                "pages.settings.appearance.uiDensityDesc",
                "Choose between compact and normal spacing for a more comfortable or data-dense interface"
              )}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {densityOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => setDensity(item.value as "compact" | "normal")}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 hover:bg-accent transition-colors",
                      density === item.value
                        ? "border-primary bg-accent"
                        : "border-muted"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <p className="text-xs text-muted-foreground text-center">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {t("pages.settings.appearance.interfaceSettings")}
          </CardTitle>
          <CardDescription>
            {t("pages.settings.appearance.interfaceSettingsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-tabs">
                {t("pages.settings.appearance.enableTabs")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("pages.settings.appearance.enableTabsDesc")}
              </p>
            </div>
            <Switch
              id="enable-tabs"
              checked={enableTabs}
              onCheckedChange={handleToggleTabs}
            />
          </div>

          {enableTabs && (
            <div className="space-y-3">
              <Label>{t("pages.settings.appearance.tabPosition")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleTabPositionChange("separate")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 hover:bg-accent transition-colors",
                    tabPosition === "separate"
                      ? "border-primary bg-accent"
                      : "border-muted"
                  )}
                >
                  <PanelTop className="h-6 w-6" />
                  <span className="text-sm font-medium">
                    {t("pages.settings.appearance.tabPositionSeparate")}
                  </span>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("pages.settings.appearance.tabPositionSeparateDesc")}
                  </p>
                </button>
                <button
                  onClick={() => handleTabPositionChange("inline")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 hover:bg-accent transition-colors",
                    tabPosition === "inline"
                      ? "border-primary bg-accent"
                      : "border-muted"
                  )}
                >
                  <PanelLeft className="h-6 w-6" />
                  <span className="text-sm font-medium">
                    {t("pages.settings.appearance.tabPositionInline")}
                  </span>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("pages.settings.appearance.tabPositionInlineDesc")}
                  </p>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
