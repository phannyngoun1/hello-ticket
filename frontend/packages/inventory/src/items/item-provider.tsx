/**
 * Item Provider
 *
 * Provides configured ItemService to all child components
 * Makes the service available via useItemService hook
 *
 * @author Phanny
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import { ItemService, type ItemServiceConfig } from "./item-service";

interface ItemContextType {
  itemService: ItemService;
}

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export interface ItemProviderProps {
  children: ReactNode;
  config: ItemServiceConfig;
}

export function ItemProvider({ children, config }: ItemProviderProps) {
  const itemService = useMemo(
    () => new ItemService(config),
    [config.apiClient, config.endpoints?.items]
  );

  return (
    <ItemContext.Provider value={{ itemService }}>
      {children}
    </ItemContext.Provider>
  );
}

export function useItemService(): ItemService {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItemService must be used within a ItemProvider");
  }
  return context.itemService;
}
