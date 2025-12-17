import { useQueryClient } from "@tanstack/react-query";
import { setLoginGracePeriod } from "@truths/api";
import { storage } from "@truths/utils";
import { authService } from "../../services/auth-service";
import { SessionExpiredDialog as BaseSessionExpiredDialog } from "@truths/custom-ui";

interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function SessionExpiredDialog({
  open,
  onOpenChange,
  title,
  description,
}: SessionExpiredDialogProps) {
  const queryClient = useQueryClient();
  const initialUsername = storage.get<string>("last_username") || "";

  return (
    <BaseSessionExpiredDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      initialUsername={initialUsername}
      onBeforeLogin={async () => {
        // Clear React Query cache
        queryClient.clear();
        queryClient.removeQueries();
        // Clear persisted caches and app state
        if (storage && typeof storage.remove === "function") {
          storage.remove("REACT_QUERY_OFFLINE_CACHE");
          storage.remove("app_tabs");
          storage.remove("scroll_positions");
          if (storage.removeMatching) {
            storage.removeMatching("^command-palette-recent");
          } else {
            storage.remove("command-palette-recent");
          }
        }
      }}
      onLogin={async (credentials) => {
        await authService.login(credentials);
        setLoginGracePeriod();
      }}
      onAfterLogin={async () => {
        await queryClient.invalidateQueries();
      }}
    />
  );
}
