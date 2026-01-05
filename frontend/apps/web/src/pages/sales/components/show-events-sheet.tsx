
import { Clock, MapPin, ShoppingCart, Ticket } from "lucide-react";
import {
  Button,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import { DataList } from "@truths/custom-ui";
import { type Event, EventStatus as EventStatusEnum } from "@truths/ticketing";
import { type ShowWithEvents } from "../events-page";

interface ShowEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: ShowWithEvents | null;
  onEventClick: (event: Event) => void;
  onBookNow: (event: Event) => void;
  showShowNameInTitle?: boolean;
}

export function ShowEventsSheet({
  open,
  onOpenChange,
  show,
  onEventClick,
  onBookNow,
  showShowNameInTitle = false,
}: ShowEventsSheetProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    return { month, day, fullDate: d };
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "short" });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return {
      dayOfWeek,
      time,
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "on_sale":
        return "default";
      case "published":
        return "secondary";
      case "sold_out":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] sm:w-[740px] sm:max-w-[740px] flex flex-col p-0"
      >
        {show && (
          <>
            {/* Sheet Header */}
            <div className="p-4 border-b">
              <SheetHeader>
                <SheetTitle className="text-xl">{show.name}</SheetTitle>
              </SheetHeader>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto p-4">
              <DataList
                items={show.events.map((event) => ({
                  ...event,
                  name: event.title,
                }))}
                searchable={false}
                viewMode="list"
                showViewToggle={false}
                gridCols={{ default: 1 }}
                emptyMessage="No events available for this show."
                renderItem={(event: any) => {
                  const statusVariant = getStatusVariant(event.status);
                  const dateInfo = formatDate(event.start_dt);
                  const timeInfo = formatTime(event.start_dt);

                  return (
                    <div
                      key={event.id}
                      className="group rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/20 cursor-pointer overflow-hidden mb-3"
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Date Badge */}
                        <div className="flex-shrink-0">
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-muted/50 border border-border/50">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase leading-tight tracking-wide">
                              {dateInfo.month}
                            </span>
                            <span className="text-xl font-bold text-foreground leading-none mt-0.5">
                              {dateInfo.day}
                            </span>
                          </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          {/* Header: Title and Status */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug flex-1">
                              {showShowNameInTitle && show
                                ? `${show.name} - ${event.title}`
                                : event.title}
                            </h4>
                            <div className="flex-shrink-0">
                              <Badge variant={statusVariant} className="text-xs">
                                {formatStatus(event.status)}
                              </Badge>
                            </div>
                          </div>

                          {/* Time, Location, Duration, and Actions - Single Row */}
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="font-medium text-foreground">
                                  {timeInfo.dayOfWeek}
                                </span>
                                <span>{timeInfo.time}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {event.venue?.name || "Venue TBD"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {formatDuration(event.duration_minutes)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {event.status === EventStatusEnum.ON_SALE && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBookNow(event);
                                  }}
                                >
                                  <Ticket className="h-3.5 w-3.5 mr-1.5" />
                                  Book Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
