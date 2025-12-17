/**
 * TestTree List Container
 *
 * Wrapper component that integrates TestTreeManagement with the provider context.
 * This provides a consistent interface for tree-based entities.
 *
 * @author Phanny
 */

import { TestTreeManagement } from "./test-tree-management";

export interface TestTreeListContainerProps {
  autoOpenCreate?: boolean;
  onCreateDialogClose?: () => void;
}

export function TestTreeListContainer({
  autoOpenCreate,
  onCreateDialogClose,
}: TestTreeListContainerProps) {
  return (
    <TestTreeManagement
      autoOpenCreate={autoOpenCreate}
      onCreateDialogClose={onCreateDialogClose}
    />
  );
}

