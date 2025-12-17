import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Progress,
} from "@truths/ui";
import { AlertTriangle, Clock } from "lucide-react";

interface SessionWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeUntilExpiration: number; // in milliseconds
  onRefresh: () => Promise<void>;
}

export function SessionWarningDialog({
  open,
  onOpenChange,
  timeUntilExpiration,
  onRefresh,
}: SessionWarningDialogProps) {
  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`;
    }
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  };

  const timeRemaining = formatTimeRemaining(timeUntilExpiration);
  
  // Calculate progress percentage (0-100)
  // Assuming 30 minute session, show progress relative to that
  const totalSessionTime = 30 * 60 * 1000; // 30 minutes in ms
  const progress = Math.min(100, Math.max(0, (timeUntilExpiration / totalSessionTime) * 100));

  // Auto-refresh when very close to expiration (< 1 minute)
  useEffect(() => {
    if (open && timeUntilExpiration < 60 * 1000) {
      // Less than 1 minute remaining, auto-refresh
      const timer = setTimeout(() => {
        onRefresh().catch((error) => {
          console.error("Auto-refresh failed:", error);
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [open, timeUntilExpiration, onRefresh]);

  const handleRefresh = async () => {
    try {
      await onRefresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      // If refresh fails, the expiration dialog will be shown by the session monitor
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className="sm:max-w-md"
        style={{ zIndex: 9998 }} // Lower than expired dialog
        onEscapeKeyDown={(e) => {
          // Allow dismissing with Escape
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <DialogTitle className="text-xl">Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your session will expire in <strong>{timeRemaining}</strong>. 
            Refresh your session to continue working without interruption.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time remaining</span>
              <span className="font-medium">{timeRemaining}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Info message */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">What happens next?</p>
              <p className="mt-1">
                Your session will be automatically refreshed. You can also refresh manually 
                to ensure you don't lose any unsaved work.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
            <Button type="button" onClick={handleRefresh}>
              Refresh Session Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

