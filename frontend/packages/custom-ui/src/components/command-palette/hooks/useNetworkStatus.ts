import * as React from "react";

/**
 * Hook to monitor network status
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = React.useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );

    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
