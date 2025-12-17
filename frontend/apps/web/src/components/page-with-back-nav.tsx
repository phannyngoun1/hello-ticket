/**
 * Page with Back Navigation Component
 *
 * Wrapper component that adds a back navigation button to any page
 */

import { Button } from "@truths/ui";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";

interface PageWithBackNavProps {
  children: ReactNode;
  backTo: string;
  backLabel?: string;
  className?: string;
}

export function PageWithBackNav({
  children,
  backTo,
  backLabel = "Back to List",
  className = "",
}: PageWithBackNavProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: backTo });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {backLabel}
      </Button>
      {children}
    </div>
  );
}
