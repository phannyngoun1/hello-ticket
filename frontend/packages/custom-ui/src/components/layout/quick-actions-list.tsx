/**
 * Quick Actions List Component
 *
 * @author Phanny
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@truths/ui";

export interface QuickAction {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface QuickActionsListProps {
  title?: string;
  description?: string;
  actions: QuickAction[];
}

export function QuickActionsList({
  title = "Quick Actions",
  description = "Common tasks and shortcuts",
  actions,
}: QuickActionsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2"
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsList;
