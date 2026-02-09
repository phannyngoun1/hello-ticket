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

  // Listen to storage changes to keep provider in sync
  useEffect(() => {
    // Listen for custom events when density changes (same-tab updates)
    const handleDensityChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.density) {
        const newDensity = customEvent.detail.density;
        if ((newDensity === "normal" || newDensity === "compact") && newDensity !== density) {
          setDensity(newDensity);
        }
      }
    };

    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          // Try to parse as JSON first (since storage.set() uses JSON.stringify)
          let value: string;
          try {
            value = JSON.parse(e.newValue);
          } catch {
            // If parsing fails, use the raw value
            value = e.newValue;
          }
          if ((value === "normal" || value === "compact") && value !== density) {
            setDensity(value);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener("density-preference-changed", handleDensityChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "density-preference-changed",
        handleDensityChange
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [storageKey, density]);

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

