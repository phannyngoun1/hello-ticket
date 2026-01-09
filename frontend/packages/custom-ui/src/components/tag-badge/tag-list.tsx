import React from "react";
import { TagBadge } from "./index";

export interface TagListProps {
  tags: string[];
  className?: string;
}

export const TagList: React.FC<TagListProps> = ({ tags, className }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {tags.map((tag, index) => (
        <TagBadge
          key={`tag-${index}-${tag}`}
          tag={tag}
        />
      ))}
    </div>
  );
};