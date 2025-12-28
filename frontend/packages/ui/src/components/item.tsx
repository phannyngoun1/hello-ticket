import * as React from "react";
import { cn } from "../lib/utils";

export interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-card transition-colors",
          onClick && "cursor-pointer hover:bg-accent/50",
          className
        )}
        onClick={onClick}
        {...props}
      />
    );
  }
);
Item.displayName = "Item";

export interface ItemMediaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ItemMedia = React.forwardRef<HTMLDivElement, ItemMediaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-shrink-0", className)}
        {...props}
      />
    );
  }
);
ItemMedia.displayName = "ItemMedia";

export interface ItemContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ItemContent = React.forwardRef<HTMLDivElement, ItemContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 min-w-0", className)}
        {...props}
      />
    );
  }
);
ItemContent.displayName = "ItemContent";

export interface ItemTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ItemTitle = React.forwardRef<HTMLDivElement, ItemTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm font-medium text-foreground", className)}
        {...props}
      />
    );
  }
);
ItemTitle.displayName = "ItemTitle";

export interface ItemDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ItemDescription = React.forwardRef<HTMLDivElement, ItemDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-sm text-muted-foreground mt-1", className)}
        {...props}
      />
    );
  }
);
ItemDescription.displayName = "ItemDescription";

export interface ItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ItemActions = React.forwardRef<HTMLDivElement, ItemActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2 flex-shrink-0", className)}
        {...props}
      />
    );
  }
);
ItemActions.displayName = "ItemActions";

