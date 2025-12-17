/**
 * User Provider
 *
 * Provides configured UserService to all child components
 * Makes the service available via useUserService hook
 *
 * @author Phanny
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import { UserService, type UserServiceConfig } from "./user-service";

interface UserContextType {
  userService: UserService;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export interface UserProviderProps {
  children: ReactNode;
  config: UserServiceConfig;
}

export function UserProvider({ children, config }: UserProviderProps) {
  const userService = useMemo(
    () => new UserService(config),
    [config.apiClient, config.endpoints?.users]
  );

  return (
    <UserContext.Provider value={{ userService }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserService(): UserService {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserService must be used within a UserProvider");
  }
  return context.userService;
}
