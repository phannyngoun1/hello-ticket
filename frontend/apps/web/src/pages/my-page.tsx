/**
 * My Page - Example page
 */

import { PageHeader } from "@truths/custom-ui";
import { useRequireAuth } from "../hooks/use-require-auth";

export function MyPage() {
  // Check authentication on mount
  useRequireAuth();

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="My Page"
        description="Example page"
      />

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 className="mb-2 text-lg font-semibold">Welcome</h3>
        <p className="text-sm text-muted-foreground">
          This is a sample page.
        </p>
      </div>
    </div>
  );
}
