import React, { forwardRef } from "react";
import { Input, cn } from "@truths/ui";

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  error?: boolean;
}

export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, leftIcon, error = false, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}
        <Input
          ref={ref}
          className={cn(
            leftIcon ? "pl-10" : undefined,
            error ? "border-destructive" : undefined,
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

InputWithIcon.displayName = "InputWithIcon";

export default InputWithIcon;

