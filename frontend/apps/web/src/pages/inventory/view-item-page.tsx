import { useParams } from "@tanstack/react-router";
import { ItemDetail } from "@truths/inventory";

export function ViewItemPage() {
  const { id } = useParams({ from: "/inventory/items/$id" });

  const handleUpdateTabTitle = (title: string, iconName?: string) => {
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/inventory/items/${id}`,
          title,
          iconName: iconName || "Package",
        },
      })
    );
  };

  return (
    <>
      <ItemDetail id={id} onUpdateTabTitle={handleUpdateTabTitle} />
    </>
  );
}
