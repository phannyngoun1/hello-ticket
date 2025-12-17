import { AlertCircle } from "lucide-react";
import { cn } from "@truths/ui";

export interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export default ErrorAlert;
