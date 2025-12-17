/**
 * {{EntityName}} List Container
 *
 * Wrapper component that integrates {{EntityName}}Management with the provider context.
 * This provides a consistent interface for tree-based entities.
 */

import { {{EntityName}}Management } from "./{{entity-name}}-management";

export interface {{EntityName}}ListContainerProps {
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function {{EntityName}}ListContainer({
  autoOpenCreate,
  onCreateDialogClose,
}: {{EntityName}}ListContainerProps) {
  return (
    <{{EntityName}}Management
      autoOpenCreate={autoOpenCreate}
      onCreateDialogClose={onCreateDialogClose}
    />
  );
}

