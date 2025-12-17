import { createContext } from "react";
import { SessionContextType } from "./session.types";

export const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);
