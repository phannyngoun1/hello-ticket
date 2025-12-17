import { useNavigate, useParams } from "@tanstack/react-router";
import { ViewUser } from "@truths/account";
import { useRequireAuth } from "../../hooks/use-require-auth";

export function ViewUserPage() {
  // Check authentication on mount
  useRequireAuth();

  const { id } = useParams({ from: "/users/$id" });
  const navigate = useNavigate();

  const handleBack = () => {
    navigate({ to: "/users" });
  };

  const handleUpdateTabTitle = (title: string, iconName?: string) => {
    window.dispatchEvent(
      new CustomEvent("update-tab-title", {
        detail: {
          path: `/users/${id}`,
          title,
          iconName: iconName || "User",
        },
      })
    );
  };

  if (!id) {
    return null;
  }

  return (
    <ViewUser
      userId={id}
      onBack={handleBack}
      onUpdateTabTitle={handleUpdateTabTitle}
    />
  );
}

