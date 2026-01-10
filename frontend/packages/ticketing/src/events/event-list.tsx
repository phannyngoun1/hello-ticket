/**
 * Event List Component
 *
 * List view for events with card/list item display and actions.
 */

import React, { useState, useMemo } from "react";
import {
  Edit,
  Trash2,
  Clock,
  MapPin,
  ChevronDown,
  Package,
} from "lucide-react";
import {
  Badge,
  Input,
  Label,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@truths/ui";
import {
  ConfirmationDialog,
  DataList,
  type DataListItem,
  ActionButtonList,
  type ActionButtonItem,
} from "@truths/custom-ui";
import { Pagination } from "@truths/shared";
import type { Event, EventStatus } from "./types";
import { EventStatus as EventStatusEnum } from "./types";

export interface EventListProps {
  className?: string;
  events?: Event[];
  loading?: boolean;
  error?: Error | null;
  pagination?: Pagination;
  onEventClick?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onManageInventory?: (event: Event) => void;
  onStatusChange?: (event: Event, newStatus: EventStatus) => void;
  onCreate?: () => void;
  onSearch?: (query: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  customActions?: (event: Event) => React.ReactNode;
  showShowNameInTitle?: boolean;
  isDeleting?: boolean;
  searchable?: boolean;
  title?: string;
  description?: string;
  showViewToggle?: boolean;
}

interface EventListItem extends DataListItem {
  event: Event;
}

export function EventList({
  className,
  events = [],
  loading = false,
  error = null,
  onEventClick,
  onEdit,
  onDelete,
  onManageInventory,
  onStatusChange,
  onSearch,
  customActions,
  showShowNameInTitle = false,
  isDeleting = false,
}: EventListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    event: Event;
    newStatus: EventStatus;
  } | null>(null);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

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
      fullTime: d.toLocaleTimeString("en-US", {
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
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
      case "draft":
        return "outline";
      case "published":
      case "on_sale":
        return "default";
      case "sold_out":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Transform events to DataListItem format
  const eventItems: EventListItem[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      name: event.title,
      description: formatDateTime(event.start_dt),
      event,
    }));
  }, [events]);

  const handleItemClick = (item: EventListItem) => {
    if (onEventClick) {
      onEventClick(item.event);
    }
  };

  const handleEdit = (item: EventListItem) => {
    if (onEdit) {
      onEdit(item.event);
    }
  };

  const handleDeleteClick = (item: EventListItem) => {
    setSelectedEvent(item.event);
    setDeleteConfirmOpen(true);
  };

  const handleStatusChange = (event: Event, newStatus: EventStatus) => {
    setPendingStatusChange({ event, newStatus });
    setStatusChangeConfirmOpen(true);
  };

  const handleStatusChangeConfirm = () => {
    if (pendingStatusChange && onStatusChange) {
      onStatusChange(pendingStatusChange.event, pendingStatusChange.newStatus);
    }
    setStatusChangeConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const handleStatusChangeCancel = () => {
    setStatusChangeConfirmOpen(false);
    setPendingStatusChange(null);
  };

  const statusOptions = Object.values(EventStatusEnum).map((status) => ({
    value: status,
    label: formatStatus(status),
  }));

  // Render status badge with dropdown
  const renderStatusBadge = (
    event: Event,
    statusVariant: "default" | "secondary" | "destructive" | "outline"
  ) => {
    if (onStatusChange) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge
                variant={statusVariant}
                className="text-xs flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1"
              >
                {formatStatus(event.status)}
                <ChevronDown className="h-3 w-3" />
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(event, option.value)}
                disabled={event.status === option.value}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Badge variant={statusVariant} className="text-xs flex-shrink-0">
        {formatStatus(event.status)}
      </Badge>
    );
  };

  // Action button configuration
  const actionButtons: ActionButtonItem[] = useMemo(
    () => [
      {
        id: "manage-inventory",
        icon: <Package className="h-3.5 w-3.5" />,
        title: "Manage Inventory",
        onClick: (item: EventListItem) => {
          if (onManageInventory) {
            onManageInventory(item.event);
          }
        },
        show: !!onManageInventory,
      },
      {
        id: "edit",
        icon: <Edit className="h-3.5 w-3.5" />,
        title: "Edit",
        onClick: handleEdit,
        show: !!onEdit,
      },
      {
        id: "delete",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        title: "Delete",
        onClick: handleDeleteClick,
        className:
          "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
        show: !!onDelete,
      },
    ],
    [onManageInventory, onEdit, onDelete, handleEdit, handleDeleteClick]
  );

  // Custom item renderer - supports both card and list views
  const renderItem = useMemo(() => {
    return (item: EventListItem) => {
      const statusVariant = getStatusVariant(item.event.status);
      const dateInfo = formatDate(item.event.start_dt);
      const timeInfo = formatTime(item.event.start_dt);

      // Card view - compact layout optimized for space
      return (
        <div
          className="group rounded-lg border bg-card transition-all hover:shadow-md hover:border-primary/20 cursor-pointer overflow-hidden"
          onClick={() => handleItemClick(item)}
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
                  {showShowNameInTitle && item.event.show
                    ? `${item.event.show.name} - ${item.name}`
                    : item.name}
                </h4>
                <div className="flex-shrink-0">
                  {renderStatusBadge(item.event, statusVariant)}
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
                      {item.event.venue?.name || "Venue TBD"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{formatDuration(item.event.duration_minutes)}</span>
                  </div>
                </div>
                <ActionButtonList
                  item={item}
                  actions={actionButtons}
                  customActions={
                    customActions
                      ? (item) => customActions(item.event)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      );
    };
  }, [
    onEdit,
    onDelete,
    onManageInventory,
    onStatusChange,
    customActions,
    onEventClick,
    statusOptions,
  ]);

  const handleDeleteConfirmChange = (open: boolean) => {
    setDeleteConfirmOpen(open);
    if (!open) {
      setSelectedEvent(null);
      setDeleteConfirmationText("");
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent && onDelete) {
      onDelete(selectedEvent);
    }
    setDeleteConfirmOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedEvent(null);
    setDeleteConfirmationText("");
  };

  const deleteConfirmAction = {
    label: "Delete",
    onClick: handleDeleteConfirm,
    variant: "destructive" as const,
    loading: isDeleting,
    disabled: deleteConfirmationText.toLowerCase() !== "delete" || isDeleting,
  };

  const deleteCancelAction = {
    label: "Cancel",
    onClick: handleDeleteCancel,
    disabled: isDeleting,
  };

  const statusChangeConfirmAction = {
    label: "Change Status",
    onClick: handleStatusChangeConfirm,
    variant: "default" as const,
  };

  const statusChangeCancelAction = {
    label: "Cancel",
    onClick: handleStatusChangeCancel,
    variant: "outline" as const,
  };

  return (
    <div className={className}>
      {/* Header with Create Button */}

      <DataList<EventListItem>
        items={eventItems}
        loading={loading}
        error={error}
        title=""
        description=""
        onSearch={onSearch}
        searchable={false}
        onItemClick={handleItemClick}
        renderItem={renderItem}
        showCreateButton={false}
        defaultViewMode="card"
        viewMode="list"
        showViewToggle={false}
        gridCols={{ default: 1 }}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={handleDeleteConfirmChange}
        title="Delete Event"
        description={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedEvent
                ? `Are you sure you want to delete "${selectedEvent.title}"? This action cannot be undone.`
                : "Are you sure you want to delete this event? This action cannot be undone."}
            </p>
            <div className="space-y-2">
              <Label
                htmlFor="delete-event-confirmation"
                className="text-sm font-medium"
              >
                Type <span className="font-mono font-semibold">delete</span> to
                confirm:
              </Label>
              <Input
                id="delete-event-confirmation"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                disabled={isDeleting}
                autoFocus
                className="font-mono"
              />
            </div>
          </div>
        }
        confirmAction={deleteConfirmAction}
        cancelAction={deleteCancelAction}
      />

      <ConfirmationDialog
        open={statusChangeConfirmOpen}
        onOpenChange={(open) => {
          setStatusChangeConfirmOpen(open);
          if (!open) {
            setPendingStatusChange(null);
          }
        }}
        title="Change Event Status"
        description={
          pendingStatusChange
            ? `Are you sure you want to change the status of "${pendingStatusChange.event.title}" from ${formatStatus(pendingStatusChange.event.status)} to ${formatStatus(pendingStatusChange.newStatus)}?`
            : "Are you sure you want to change the event status?"
        }
        confirmAction={statusChangeConfirmAction}
        cancelAction={statusChangeCancelAction}
      />
    </div>
  );
}
