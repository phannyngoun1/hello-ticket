import React, { useState, forwardRef, useCallback } from "react";
import { Input, cn } from "@truths/ui";
import { Eye, EyeOff, CaseUpper } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  leftIcon?: React.ReactNode;
  error?: boolean;
  /** Custom message for caps lock indicator (e.g. for i18n). Default: "Caps Lock is on" */
  capsLockMessage?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, error = false, capsLockMessage = "Caps Lock is on", onKeyDown, onKeyUp, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);

    const checkCapsLock = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        setCapsLockOn(e.getModifierState("CapsLock"));
      },
      []
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        checkCapsLock(e);
        onKeyDown?.(e);
      },
      [checkCapsLock, onKeyDown]
    );

    const handleKeyUp = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        checkCapsLock(e);
        onKeyUp?.(e);
      },
      [checkCapsLock, onKeyUp]
    );

    return (
      <div className="relative">
        <div className="relative">
          {(leftIcon || capsLockOn) ? (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                capsLockOn
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
              {...(capsLockOn
                ? {
                    title: capsLockMessage,
                    role: "status" as const,
                    "aria-live": "polite" as const,
                    "aria-label": capsLockMessage,
                  }
                : {})}
            >
              {capsLockOn ? (
                <CaseUpper className="h-4 w-4 animate-pulse" />
              ) : (
                leftIcon
              )}
            </div>
          ) : null}

          <Input
            ref={ref}
            type={show ? "text" : "password"}
            className={cn(
              leftIcon || capsLockOn ? "pl-10" : undefined,
              "pr-10",
              error ? "border-destructive" : undefined,
              className
            )}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;

