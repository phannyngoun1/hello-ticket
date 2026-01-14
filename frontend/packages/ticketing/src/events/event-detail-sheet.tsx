import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@truths/ui";
import { EventDetail } from "./event-detail";
import type { Event } from "./types";

export interface EventDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Event;
  loading?: boolean;
  error?: Error | null;
}

export function EventDetailSheet({
  open,
  onOpenChange,
  data,
  loading,
  error,
}: EventDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[740px] sm:max-w-[740px] flex flex-col p-0"
        style={{ width: "600px", maxWidth: "740px" }}
      >
        <SheetHeader className="px-6 py-4 ml-6 border-b">
          <SheetTitle>{data?.title || "Event Details"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pl-6 pr-8">
          <EventDetail
            data={data}
            loading={loading}
            error={error}
            className="border-0 shadow-none p-0"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
