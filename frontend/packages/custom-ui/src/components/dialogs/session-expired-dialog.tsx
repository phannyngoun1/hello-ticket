/**
 * Session Expired Dialog Component
 *
 * @author Phanny
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  toast,
  cn,
} from "@truths/ui";
import { AlertCircle, Loader2, X, LogIn } from "lucide-react";
import { useDensityStyles, useDensity } from "@truths/utils";

export interface SessionExpiredDialogCredentials {
  username: string;
  password: string;
}

export interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  initialUsername?: string;
  /**
   * Called right before attempting login (e.g., clear caches)
   */
  onBeforeLogin?: () => Promise<void> | void;
  /**
   * Execute the login with provided credentials
   */
  onLogin: (credentials: SessionExpiredDialogCredentials) => Promise<void>;
  /**
   * Called after successful login (e.g., refresh queries)
   */
  onAfterLogin?: () => Promise<void> | void;
}

export function SessionExpiredDialog({
  open,
  onOpenChange,
  title = "Session Expired",
  description = "Your session has timed out. Please log in again to continue your work.",
  initialUsername = "",
  onBeforeLogin,
  onLogin,
  onAfterLogin,
}: SessionExpiredDialogProps) {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<SessionExpiredDialogCredentials>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});
  const { isCompact } = useDensity();
  const density = useDensityStyles();

  // Reset credentials when dialog opens (auto-fill username)
  useEffect(() => {
    if (open) {
      setCredentials({ username: initialUsername || "", password: "" });
      setErrors({});

      if (initialUsername) {
        const timer = setTimeout(() => passwordInputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [open, initialUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};
    if (!credentials.username.trim()) newErrors.username = "Username or email is required";
    if (!credentials.password) newErrors.password = "Password is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (onBeforeLogin) await onBeforeLogin();
      await onLogin(credentials);
      if (onAfterLogin) await onAfterLogin();

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      setCredentials({ username: "", password: "" });
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setErrors({ general: errorMessage });
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCredentials({ username: "", password: "" });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className={cn("sm:max-w-md", density.paddingContainer)}
        style={{ zIndex: 9999 }}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className={density.spacingFormItem}>
          <div className={cn("flex items-center gap-3 mb-2", density.gapFormItem)}>
            <div className={cn("rounded-full bg-destructive/10 flex items-center justify-center", isCompact ? "h-10 w-10" : "h-12 w-12")}>
              <AlertCircle className={cn("text-destructive", isCompact ? "h-5 w-5" : "h-6 w-6")} />
            </div>
            <DialogTitle className={cn(isCompact ? "text-lg" : "text-xl", "font-semibold")}>{title}</DialogTitle>
          </div>
          <DialogDescription className={density.textSizeSmall}>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={cn("mt-4", density.spacingFormSection)}>
          {errors.general && (
            <div className={cn("rounded-md bg-destructive/10 text-destructive", density.paddingCell, density.textSizeSmall)}>{errors.general}</div>
          )}

          <div className={density.spacingFormItem}>
            <Label htmlFor="session-username" className={density.textSizeLabel}>Username or Email</Label>
            <Input
              id="session-username"
              type="text"
              placeholder="Enter your username or email"
              value={credentials.username}
              onChange={(e) =>
                setCredentials((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              disabled={isLoading}
              className={cn(errors.username ? "border-destructive" : "", density.inputHeight, density.textSize)}
              autoComplete="username"
            />
            {errors.username && <p className={cn("text-destructive", density.textSizeSmall)}>{errors.username}</p>}
          </div>

          <div className={density.spacingFormItem}>
            <Label htmlFor="session-password" className={density.textSizeLabel}>Password</Label>
            <Input
              ref={passwordInputRef}
              id="session-password"
              type="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              disabled={isLoading}
              className={cn(errors.password ? "border-destructive" : "", density.inputHeight, density.textSize)}
              autoComplete="current-password"
            />
            {errors.password && <p className={cn("text-destructive", density.textSizeSmall)}>{errors.password}</p>}
          </div>

          <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end pt-2", density.gapButtonGroup)}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isLoading}
              className={cn(density.buttonHeightSmall, density.paddingCell, density.textSizeSmall)}
            >
              <span className="flex items-center gap-1.5">
                <X className={density.iconSizeSmall} />
                <span>Cancel</span>
              </span>
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={cn(density.buttonHeightSmall, density.paddingCell, density.textSizeSmall)}
            >
              <span className="flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <Loader2 className={cn(density.iconSizeSmall, "animate-spin")} />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className={density.iconSizeSmall} />
                    <span>Log In</span>
                  </>
                )}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SessionExpiredDialog;

