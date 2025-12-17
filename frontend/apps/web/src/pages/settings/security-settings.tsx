import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
  cn,
} from "@truths/ui";
import { Key, Shield } from "lucide-react";
import { useDensityStyles } from "@truths/utils";

export function SecuritySettingsPage() {
  const { t } = useTranslation();
  const density = useDensityStyles();

  return (
    <div className={cn("space-y-6", density.spacingFormSection)}>
      <Card>
        <CardHeader className={density.spacingFormItem}>
          <CardTitle className={cn("flex items-center gap-2", density.textSize === "text-sm" ? "text-lg" : "text-xl", "font-semibold")}>
            <Key className={density.iconSize} />
            {t("pages.settings.security.changePassword")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.security.changePasswordDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(density.paddingContainer, density.spacingFormSection)}>
          <div className={density.spacingFormItem}>
            <Label htmlFor="current-password" className={density.textSizeLabel}>
              {t("pages.settings.security.currentPassword")}
            </Label>
            <Input id="current-password" type="password" autoComplete="current-password" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <div className={density.spacingFormItem}>
            <Label htmlFor="new-password" className={density.textSizeLabel}>
              {t("pages.settings.security.newPassword")}
            </Label>
            <Input id="new-password" type="password" autoComplete="new-password" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <div className={density.spacingFormItem}>
            <Label htmlFor="confirm-password" className={density.textSizeLabel}>
              {t("pages.settings.security.confirmPassword")}
            </Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <Button className={cn(density.buttonHeightSmall, density.paddingCell, density.textSizeSmall, "flex items-center gap-1.5")}>
            <Key className={density.iconSizeSmall} />
            <span>{t("pages.settings.security.updatePassword")}</span>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={density.spacingFormItem}>
          <CardTitle className={cn("flex items-center gap-2", density.textSize === "text-sm" ? "text-lg" : "text-xl", "font-semibold")}>
            <Shield className={density.iconSize} />
            {t("pages.settings.security.twoFactor")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.security.twoFactorDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className={density.paddingContainer}>
          <Button variant="outline" className={cn(density.buttonHeightSmall, density.paddingCell, density.textSizeSmall, "flex items-center gap-1.5")}>
            <Shield className={density.iconSizeSmall} />
            <span>{t("pages.settings.security.enableTwoFactor")}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
