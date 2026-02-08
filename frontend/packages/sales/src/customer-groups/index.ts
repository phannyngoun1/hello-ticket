/**
 * CustomerGroup Module
 * 
 * Exports for customer-group management
 */

import { api } from "@truths/api";
import {CustomerGroupService } from "./customer-group-service";

// Initialize service with default configuration
export const customerGroupService = new CustomerGroupService({
    apiClient: api,
    endpoints: {
    customerGroups: "/api/v1/sales/customer-groups",
  },
});

// Export components
export * from "./customer-group-management";
export * from "./customer-group-list-container";
export { CustomerGroupTree } from "./customer-group-tree";
export * from "./create-customer-group-dialog";
export * from "./edit-customer-group-dialog";
export * from "./customer-group-provider";

// Export hooks
export * from "./use-customer-groups";

// Export types (CustomerGroupTree type from ./types - use for type annotations)
export type {
  CustomerGroup,
  CustomerGroupHierarchy,
  CreateCustomerGroupInput,
  UpdateCustomerGroupInput,
  CustomerGroupFilter,
} from "./types";
