/**
 * CustomerGroup List Container
 *
 * Wrapper component that integrates CustomerGroupManagement with the provider context.
 * This provides a consistent interface for tree-based entities.
 *
 * @author Phanny
 */

import { CustomerGroupManagement } from "./customer-group-management";

export interface CustomerGroupListContainerProps {
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function CustomerGroupListContainer({
  autoOpenCreate,
  onCreateDialogClose,
}: CustomerGroupListContainerProps) {
  return (
    <CustomerGroupManagement
      autoOpenCreate={autoOpenCreate}
      onCreateDialogClose={onCreateDialogClose}
    />
  );
}

