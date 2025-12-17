import React, { useState, forwardRef } from "react";
import { Input, cn } from "@truths/ui";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, error = false, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        {leftIcon ? (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        ) : null}

        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn(
            leftIcon ? "pl-10" : undefined,
            "pr-10",
            error ? "border-destructive" : undefined,
            className
          )}
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
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;

