import { useEffect, useState } from "react";
import { storage } from "@truths/utils";
import { DensityProviderContext, UIDensity } from "./density-context";

type DensityProviderProps = {
  children: React.ReactNode;
  defaultDensity?: UIDensity;
  storageKey?: string;
};

export function DensityProvider({
  children,
  defaultDensity = "normal",
  storageKey = "ui-density",
  ...props
}: DensityProviderProps) {
  const [density, setDensity] = useState<UIDensity>(
    () => storage.get<UIDensity>(storageKey) || defaultDensity
  );

  const value = {
    density,
    setDensity: (density: UIDensity) => {
      storage.set(storageKey, density);
      setDensity(density);
      // Trigger a storage event so other components can react
      window.dispatchEvent(
        new CustomEvent("density-preference-changed", { detail: { density } })
      );
    },
  };

  return (
    <DensityProviderContext.Provider {...props} value={value}>
      {children}
    </DensityProviderContext.Provider>
  );
}

