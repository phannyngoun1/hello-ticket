import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";
import { Check } from "lucide-react";
import { cn } from "@truths/ui";
import { useDensityStyles } from "@truths/utils";

export function LanguageSettingsPage() {
  const { t, i18n } = useTranslation();
  const density = useDensityStyles();

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "es", name: "Spanish", nativeName: "Español" },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
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
            {t("pages.settings.language.title")}
          </CardTitle>
          <CardDescription className={density.textSizeSmall}>
            {t("pages.settings.language.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className={density.paddingContainer}>
          <div className={cn("space-y-2", density.spacingFormItem)}>
            {languages.map((language) => {
              const isActive = i18n.language === language.code;
              return (
                <button
                  key={language.code}
                  onClick={() => changeLanguage(language.code)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border hover:bg-accent transition-colors",
                    density.paddingForm,
                    isActive ? "border-primary bg-accent" : "border-muted"
                  )}
                >
                  <div className="text-left">
                    <div className={cn("font-medium", density.textSize)}>
                      {language.nativeName}
                    </div>
                    <div
                      className={cn(
                        "text-muted-foreground",
                        density.textSizeSmall
                      )}
                    >
                      {language.name}
                    </div>
                  </div>
                  {isActive && (
                    <Check className={cn("text-primary", density.iconSize)} />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
