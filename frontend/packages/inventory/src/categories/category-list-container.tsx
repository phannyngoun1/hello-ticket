/**
 * Category List Container Component
 *
 * Container component that manages category data fetching and state
 * Now uses the CategoryManagement component with tree view
 *
 * @author Phanny
 */

import { CategoryManagement } from "./category-management";
import { CategoryService } from "./category-service";
import { ItemCategory } from "../types";

export interface CategoryListContainerProps {
  service: CategoryService;
  className?: string;
  onCategoryClick?: (category: ItemCategory) => void;
  showCreateButton?: boolean;
}

export function CategoryListContainer({
  service,
  className,
  onCategoryClick,
  showCreateButton = true,
}: CategoryListContainerProps) {
  // The CategoryManagement component handles all the tree view and interactions
  // onCategoryClick is handled internally by the tree component
  return (
    <CategoryManagement
      className={className}
      service={service}
    />
  );
}

