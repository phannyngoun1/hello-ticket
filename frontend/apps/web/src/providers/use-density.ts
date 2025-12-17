import { useContext } from "react";
import { DensityProviderContext } from "./density-context";

export const useDensity = () => {
  const context = useContext(DensityProviderContext);

  if (context === undefined)
    throw new Error("useDensity must be used within a DensityProvider");

  return context;
};

