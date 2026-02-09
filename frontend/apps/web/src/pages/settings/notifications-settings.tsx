import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  cn,
} from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

export function NotificationsSettingsPage() {
  const { t } = useTranslation();
  const density = useDensityStyles();

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
            {t("pages.settings.notifications.title")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.notifications.description")}
          </CardDescription>
        </CardHeader>
        <CardContent
          className={cn(density.paddingContainer, density.spacingFormSection)}
        >
          <div className="flex items-center justify-between">
            <div className={density.spacingFormItem}>
              <Label
                htmlFor="email-notifications"
                className={density.textSizeLabel}
              >
                {t("pages.settings.notifications.emailNotifications")}
              </Label>
              <p className={cn("text-muted-foreground", density.textSizeSmall)}>
                {t("pages.settings.notifications.emailNotificationsDesc")}
              </p>
            </div>
            <Switch id="email-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div className={density.spacingFormItem}>
              <Label
                htmlFor="push-notifications"
                className={density.textSizeLabel}
              >
                {t("pages.settings.notifications.pushNotifications")}
              </Label>
              <p className={cn("text-muted-foreground", density.textSizeSmall)}>
                {t("pages.settings.notifications.pushNotificationsDesc")}
              </p>
            </div>
            <Switch id="push-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <div className={density.spacingFormItem}>
              <Label
                htmlFor="marketing-emails"
                className={density.textSizeLabel}
              >
                {t("pages.settings.notifications.marketingEmails")}
              </Label>
              <p className={cn("text-muted-foreground", density.textSizeSmall)}>
                {t("pages.settings.notifications.marketingEmailsDesc")}
              </p>
            </div>
            <Switch id="marketing-emails" />
          </div>

          <div className="flex items-center justify-between">
            <div className={density.spacingFormItem}>
              <Label
                htmlFor="security-alerts"
                className={density.textSizeLabel}
              >
                {t("pages.settings.notifications.securityAlerts")}
              </Label>
              <p className={cn("text-muted-foreground", density.textSizeSmall)}>
                {t("pages.settings.notifications.securityAlertsDesc")}
              </p>
            </div>
            <Switch id="security-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
