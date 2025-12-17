import { createContext } from "react";

export type UIDensity = "compact" | "normal";

export type DensityProviderState = {
  density: UIDensity;
  setDensity: (density: UIDensity) => void;
};

const initialState: DensityProviderState = {
  density: "compact",
  setDensity: () => null,
};

export const DensityProviderContext = createContext<DensityProviderState>(
  initialState
);

