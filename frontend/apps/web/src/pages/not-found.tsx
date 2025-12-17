import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@truths/ui";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-6xl font-bold text-muted-foreground">404</div>
          <CardTitle className="text-2xl">
            {t("pages.notFound.title")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("pages.notFound.message")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full" size="lg">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            {t("pages.notFound.goHome")}
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("pages.notFound.goBack")}
        </Button>
      </CardContent>
    </Card>
  );
}
