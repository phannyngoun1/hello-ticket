/**
 * TestTree Module
 * 
 * Exports for test-tree management
 */

import { api } from "@truths/api";
import {TestTreeService } from "./test-tree-service";

// Initialize service with default configuration
export const testTreeService = new TestTreeService({
    apiClient: api,
    endpoints: {
    testTrees: "/api/v1/sales/test-trees",
  },
});

// Export components
export * from "./test-tree-management";
export * from "./test-tree-list-container";
export * from "./test-tree-tree";
export * from "./create-test-tree-dialog";
export * from "./edit-test-tree-dialog";
export * from "./test-tree-provider";

// Export hooks
export * from "./use-test-trees";

// Export types
export * from "./types";
