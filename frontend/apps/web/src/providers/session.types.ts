export interface SessionContextType {
    showSessionExpiredDialog: () => void;
    hideSessionExpiredDialog: () => void;
    isSessionDialogOpen: boolean;
}

export interface SessionProviderProps {
    children: React.ReactNode;
}

