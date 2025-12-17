import { UoMListContainer, UoMProvider } from "@truths/inventory";
import { api } from "@truths/api";

export function UnitsOfMeasureListPage() {
  const handleNavigateToUoM = (id: string) => {
    // Navigate to detail route when it exists
    // TODO: Once routes are created, use: navigate({ to: "/settings/inventory/units/$id", params: { id } })
    // Routes needed: /settings/inventory/units/$id.tsx
    window.location.href = `/settings/inventory/units/${id}`;
  };

  const handleNavigateToCreate = () => {
    // Navigate to create route when it exists
    // TODO: Once routes are created, use: navigate({ to: "/settings/inventory/units/new" })
    // Routes needed: /settings/inventory/units/new.tsx
    window.location.href = `/settings/inventory/units/new`;
  };

  return (
    <UoMProvider
      config={{
        apiClient: api,
        endpoints: {
          uom: "/api/v1/inventory/units-of-measure",
        },
      }}
    >
      <UoMListContainer
        onNavigateToUoM={handleNavigateToUoM}
        onNavigateToCreate={handleNavigateToCreate}
      />
    </UoMProvider>
  );
}
