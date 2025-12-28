/**
 * Initialize Seats Dialog Component
 *
 * Full-screen dialog for initializing event seats with price and ticket options
 */

import { useMemo } from "react";
import { Input, Label, Card, Badge } from "@truths/ui";
import { FullScreenDialog } from "@truths/custom-ui";
import { useForm } from "react-hook-form";
import type { Seat } from "../seats";
import type { Section } from "../layouts";
import type { EventSeat } from "./types";
import { DollarSign, Ticket, Info, Plus } from "lucide-react";

export interface InitializeSeatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InitializeSeatsData) => Promise<void>;
  layoutSeats: Seat[];
  sections: Section[];
  existingEventSeats?: EventSeat[];
  loading?: boolean;
}

export interface InitializeSeatsData {
  defaultPrice: number;
  generateTicketCodes: boolean;
  ticketCodePrefix?: string;
}

interface InitializeSeatsFormData {
  defaultPrice: string; // String for form input
  generateTicketCodes: boolean;
  ticketCodePrefix: string;
}

export function InitializeSeatsDialog({
  open,
  onClose,
  onSubmit,
  layoutSeats,
  sections,
  existingEventSeats = [],
  loading = false,
}: InitializeSeatsDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InitializeSeatsFormData>({
    defaultValues: {
      defaultPrice: "0",
      generateTicketCodes: false,
      ticketCodePrefix: "",
    },
  });

  const defaultPrice = watch("defaultPrice");
  const generateTicketCodes = watch("generateTicketCodes");
  const ticketCodePrefix = watch("ticketCodePrefix");

  // Create section name map for display
  const sectionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((section) => {
      map.set(section.id, section.name);
    });
    return map;
  }, [sections]);

  // Create maps for existing event seats for quick lookup
  const existingSeatIds = useMemo(() => {
    const seatIdSet = new Set<string>();
    const locationSet = new Set<string>();
    
    existingEventSeats.forEach((eventSeat) => {
      // Match by seat_id
      if (eventSeat.seat_id) {
        seatIdSet.add(eventSeat.seat_id);
      }
      // Match by location (section_name, row_name, seat_number)
      if (eventSeat.section_name && eventSeat.row_name && eventSeat.seat_number) {
        const key = `${eventSeat.section_name}|${eventSeat.row_name}|${eventSeat.seat_number}`;
        locationSet.add(key);
      }
    });
    
    return { seatIdSet, locationSet };
  }, [existingEventSeats]);

  // Filter out seats that already have event seats assigned
  const missingSeats = useMemo(() => {
    return layoutSeats.filter((layoutSeat) => {
      // Check if seat_id matches
      if (layoutSeat.id && existingSeatIds.seatIdSet.has(layoutSeat.id)) {
        return false;
      }
      
      // Check if location matches (using section name from map and row/seat_number from layout seat)
      const sectionName = sectionNameMap.get(layoutSeat.section_id);
      if (sectionName && layoutSeat.row && layoutSeat.seat_number) {
        const locationKey = `${sectionName}|${layoutSeat.row}|${layoutSeat.seat_number}`;
        if (existingSeatIds.locationSet.has(locationKey)) {
          return false;
        }
      }
      
      return true; // Seat is missing, include it
    });
  }, [layoutSeats, existingSeatIds, sectionNameMap]);

  // Get seat count by section for all layout seats
  const seatsBySection = useMemo(() => {
    const grouped = new Map<string, number>();
    layoutSeats.forEach((seat) => {
      const sectionName = sectionNameMap.get(seat.section_id) || "Unknown";
      grouped.set(sectionName, (grouped.get(sectionName) || 0) + 1);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [layoutSeats, sectionNameMap]);

  // Get seat count by section for missing seats
  const missingSeatsBySection = useMemo(() => {
    const grouped = new Map<string, number>();
    missingSeats.forEach((seat) => {
      const sectionName = sectionNameMap.get(seat.section_id) || "Unknown";
      grouped.set(sectionName, (grouped.get(sectionName) || 0) + 1);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [missingSeats, sectionNameMap]);

  const totalSeats = layoutSeats.length;
  const missingSeatsCount = missingSeats.length;
  const existingSeatsCount = totalSeats - missingSeatsCount;
  const hasMissingSeats = missingSeatsCount > 0;

  const handleFormSubmit = async (data: InitializeSeatsFormData) => {
    const submitData: InitializeSeatsData = {
      defaultPrice: parseFloat(data.defaultPrice) || 0,
      generateTicketCodes: data.generateTicketCodes,
      ticketCodePrefix: data.ticketCodePrefix.trim() || undefined,
    };
    await onSubmit(submitData);
  };

  return (
    <FullScreenDialog
      open={open}
      onClose={onClose}
      title={hasMissingSeats ? `Add ${missingSeatsCount} Missing Seats` : "Initialize Event Seats"}
      loading={loading}
      onSubmit={handleSubmit(handleFormSubmit)}
      showCancelButton={true}
      showSubmitButton={true}
      showClearButton={false}
      maxWidth="1000px"
    >
      <div className="space-y-6">
        {/* Information Card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">
                {hasMissingSeats ? "Add Seats to Event" : "Initialize Seats from Layout"}
              </h3>
              <p className="text-sm text-blue-800">
                {hasMissingSeats ? (
                  <>
                    There {missingSeatsCount === 1 ? "is" : "are"} {missingSeatsCount} seat{missingSeatsCount !== 1 ? "s" : ""} in the layout
                    that {missingSeatsCount === 1 ? "hasn't" : "haven't"} been added to this event yet.
                    {existingSeatsCount > 0 && (
                      <> {existingSeatsCount} seat{existingSeatsCount !== 1 ? "s are" : " is"} already assigned.</>
                    )}
                  </>
                ) : (
                  <>
                    This will create {totalSeats} event seat{totalSeats !== 1 ? "s" : ""} from the
                    layout seats. You can set default pricing and ticket codes for all seats.
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Seat Summary */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Seat Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Layout Seats:</span>
              <span className="font-medium">{totalSeats}</span>
            </div>
            {hasMissingSeats && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Assigned:</span>
                  <Badge variant="outline">{existingSeatsCount}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Seats to Add:
                  </span>
                  <Badge className="bg-green-600 text-white">{missingSeatsCount}</Badge>
                </div>
              </>
            )}
            <div className="border-t pt-2">
              <p className="text-sm font-medium mb-2">
                {hasMissingSeats ? "Missing Seats by Section:" : "Seats by Section:"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(hasMissingSeats ? missingSeatsBySection : seatsBySection).map(([sectionName, count]) => (
                  <div key={sectionName} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{sectionName}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Fields */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Configuration</h3>
            <div className="space-y-4">
              {/* Default Price */}
              <div className="space-y-2">
                <Label htmlFor="defaultPrice" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Default Price (per seat)
                </Label>
                <Input
                  id="defaultPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("defaultPrice", {
                    required: "Price is required",
                    min: { value: 0, message: "Price must be 0 or greater" },
                    valueAsNumber: false, // Keep as string for better UX
                  })}
                />
                {errors.defaultPrice && (
                  <p className="text-sm text-destructive">
                    {errors.defaultPrice.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  This price will be applied to all seats. You can change individual seat prices
                  later.
                </p>
              </div>

              {/* Ticket Code Options */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generateTicketCodes"
                    {...register("generateTicketCodes")}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="generateTicketCodes" className="flex items-center gap-2 cursor-pointer">
                    <Ticket className="h-4 w-4" />
                    Generate Ticket Codes
                  </Label>
                </div>

                {generateTicketCodes && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="ticketCodePrefix">Ticket Code Prefix (Optional)</Label>
                    <Input
                      id="ticketCodePrefix"
                      type="text"
                      placeholder="TIX-"
                      {...register("ticketCodePrefix")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional prefix for ticket codes. If not provided, codes will be generated
                      automatically (e.g., "EVT-001", "EVT-002").
                    </p>
                  </div>
                )}

                {!generateTicketCodes && (
                  <p className="text-xs text-muted-foreground pl-6">
                    Ticket codes can be added manually after initialization.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Preview */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-3">Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seats to {hasMissingSeats ? "add" : "create"}:</span>
                <span className="font-medium">{hasMissingSeats ? missingSeatsCount : totalSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default price:</span>
                <span className="font-medium">
                  ${parseFloat(defaultPrice || "0").toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket codes:</span>
                <span className="font-medium">
                  {generateTicketCodes ? "Yes" : "No"}
                  {generateTicketCodes && ticketCodePrefix && (
                    <span className="text-muted-foreground ml-1">
                      (Prefix: {ticketCodePrefix})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total value:</span>
                <span>
                  ${(parseFloat(defaultPrice || "0") * (hasMissingSeats ? missingSeatsCount : totalSeats)).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </FullScreenDialog>
  );
}

