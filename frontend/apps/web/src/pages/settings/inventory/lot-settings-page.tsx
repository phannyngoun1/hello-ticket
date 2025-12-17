import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";

export function LotSettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("pages.settings.inventory.lots.title", "Lot Settings")}
        </h2>
        <p className="text-muted-foreground">
          {t("pages.settings.inventory.lots.description", "Configure lot tracking settings")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.settings.inventory.lots.configuration", "Lot Configuration")}</CardTitle>
          <CardDescription>
            {t("pages.settings.inventory.lots.configurationDesc", "Settings for lot tracking and management")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {t("common.comingSoon", "Coming soon")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

