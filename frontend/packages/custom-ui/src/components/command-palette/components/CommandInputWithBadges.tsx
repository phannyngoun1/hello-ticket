import { CommandInput, Badge } from "@truths/ui";
import { WifiOff } from "lucide-react";

interface CommandInputWithBadgesProps {
  search: string;
  onValueChange: (value: string) => void;
  scope: string;
  autocomplete: string;
  isOnline: boolean;
}

/**
 * Command input component with status badges
 */
export function CommandInputWithBadges({
  search,
  onValueChange,
  scope,
  autocomplete,
  isOnline,
}: CommandInputWithBadgesProps) {
  return (
    <div className="relative">
      <CommandInput
        placeholder={
          scope === "all"
            ? "Type a command or search... (try: users:, employees:, bookings:, nav:)"
            : `Searching in ${scope}...`
        }
        value={search}
        onValueChange={onValueChange}
        className="w-full pr-20"
      />

      {/* Right-side badges - overlapping on the right */}
      <div className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center gap-2 pointer-events-none z-10">
        {/* Offline indicator */}
        {!isOnline && (
          <Badge
            variant="destructive"
            className="text-[10px] px-3 py-1.5 leading-none bg-red-100 text-red-700 shadow-sm font-medium rounded-lg ring-1 ring-red-100/20"
          >
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}

        {/* Autocomplete suggestion with Tab hint */}
        {autocomplete && autocomplete !== search && (
          <>
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm rounded-md border border-gray-200/60">
              <span className="text-xs text-gray-700 font-medium">
                {autocomplete}
              </span>

              <kbd className="text-[9px] text-gray-700 bg-gray-50 ml-1 border border-gray-200 rounded-sm px-2 py-0.5 font-mono font-medium shadow-sm">
                Tab
              </kbd>
            </div>
          </>
        )}

        {/* Scope badge - shows when no autocomplete and not offline */}
        {scope !== "all" &&
          !(autocomplete && autocomplete !== search) &&
          isOnline && (
            <Badge
              variant="secondary"
              className="text-[10px] px-3 py-1.5 leading-none bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 shadow-sm font-medium rounded-lg ring-1 ring-violet-100/20 hover:scale-105 transition-transform duration-200"
            >
              {scope}
            </Badge>
          )}
      </div>
    </div>
  );
}
