import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { useRequireAuth } from "../hooks/use-require-auth";

export function HomePage() {
  const { t } = useTranslation();

  // Check authentication on mount
  useRequireAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {t("pages.home.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("pages.home.subtitle")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/login">
              {t("common.login")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/dashboard">{t("pages.home.getStarted")}</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Fast & Modern</CardTitle>
              <CardDescription>
                Built with Vite, React 18, and TypeScript for blazing fast
                performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Hot Module Replacement</li>
                <li>• Optimized builds</li>
                <li>• Type-safe development</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>
                Following industry standards and modern development patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Monorepo structure</li>
                <li>• Component library</li>
                <li>• Separation of concerns</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Internationalization</CardTitle>
              <CardDescription>
                Multi-language support with i18next and dark mode ready
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Multiple languages</li>
                <li>• Dark/Light themes</li>
                <li>• Accessible components</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Tech Stack</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Core</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• React 18 with TypeScript</li>
                  <li>• Vite for fast builds</li>
                  <li>• TanStack Router for routing</li>
                  <li>• TanStack Query for data fetching</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">UI & Styling</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Tailwind CSS for styling</li>
                  <li>• shadcn/ui components</li>
                  <li>• Radix UI primitives</li>
                  <li>• Lucide icons</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
