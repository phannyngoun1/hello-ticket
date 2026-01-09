import React from "react";
import { Badge } from "@truths/ui";
import { Tag } from "lucide-react";

export interface TagBadgeProps {
  tag: string;
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag, className }) => {
  return (
    <Badge
      variant="secondary"
      className={`text-xs flex items-center gap-1.5 pr-2 py-1.5 px-2.5 bg-primary/10 text-primary border-primary/20 ${className || ""}`}
    >
      <Tag className="h-3 w-3" />
      <span>{tag}</span>
    </Badge>
  );
};

// Re-export TagList
export { TagList } from './tag-list';
export type { TagListProps } from './tag-list';