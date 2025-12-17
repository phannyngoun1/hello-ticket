/**
 * @truths/inventory
 * 
 * A comprehensive inventory management package.
 */

// Registry
export * from './registry';
export * from './types';

// Items Management
export * from './items';

// Categories Management
export * from './categories';

// Inventory Management Page
export * from './inventory-management-page';

// UoM Management
export * from './uom';

// Samples Management

// Register all inventory components
import { registerInventoryComponent } from './registry';

// Item components
// import { ItemList, itemListMetadata } from './item/item-list';
// registerInventoryComponent('item-list', {
//     Component: ItemList,
//     metadata: itemListMetadata(),
// });

