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
import { Save } from "lucide-react";
import { useDensityStyles } from "@truths/utils";

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const density = useDensityStyles();

  return (
    <div className={cn("space-y-6", density.spacingFormSection)}>
      <Card>
        <CardHeader className={density.spacingFormItem}>
          <CardTitle className={cn(density.textSizeCardTitle, "font-semibold")}>
            {t("pages.settings.profile.title")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.profile.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn(density.paddingContainer, density.spacingFormSection)}>
          <div className={density.spacingFormItem}>
            <Label htmlFor="name" className={density.textSizeLabel}>{t("pages.settings.profile.name")}</Label>
            <Input id="name" placeholder="John Doe" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <div className={density.spacingFormItem}>
            <Label htmlFor="username" className={density.textSizeLabel}>
              {t("pages.settings.profile.username")}
            </Label>
            <Input id="username" placeholder="johndoe" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <div className={density.spacingFormItem}>
            <Label htmlFor="email" className={density.textSizeLabel}>{t("pages.settings.profile.email")}</Label>
            <Input id="email" type="email" placeholder="john@example.com" className={cn(density.inputHeight, density.textSize)} />
          </div>
          <div className={density.spacingFormItem}>
            <Label htmlFor="bio" className={density.textSizeLabel}>{t("pages.settings.profile.bio")}</Label>
            <textarea
              id="bio"
              className={cn(
                "flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                density.paddingCell,
                density.textSize,
                density.inputHeight === "h-7" ? "min-h-[60px]" : "min-h-[80px]"
              )}
              placeholder={t("pages.settings.profile.bioPlaceholder")}
            />
          </div>
          <Button className={cn(density.buttonHeightSmall, density.paddingCell, density.textSizeSmall, "flex items-center gap-1.5")}>
            <Save className={density.iconSizeSmall} />
            <span>{t("common.save")}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
