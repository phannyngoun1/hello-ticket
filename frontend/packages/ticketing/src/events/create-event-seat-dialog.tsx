/**
 * Create Event Seat Dialog Component
 *
 * Dialog for creating a new event seat with optional ticket creation
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";

export interface CreateEventSeatData {
  seat_id?: string;
  section_name?: string;
  row_name?: string;
  seat_number?: string;
  broker_id?: string;
  create_ticket: boolean;
  ticket_price: number;
  ticket_number?: string;
}

export interface CreateEventSeatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateEventSeatData) => Promise<void>;
  loading?: boolean;
}

export function CreateEventSeatDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: CreateEventSeatDialogProps) {
  const [formData, setFormData] = useState<CreateEventSeatData>({
    section_name: "",
    row_name: "",
    seat_number: "",
    ticket_price: 0,
    ticket_number: "",
    broker_id: "",
    create_ticket: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateEventSeatData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Either seat_id or location info must be provided
    if (!formData.seat_id && !(formData.section_name && formData.row_name && formData.seat_number)) {
      if (!formData.seat_id) {
        if (!formData.section_name) newErrors.section_name = "Section name is required";
        if (!formData.row_name) newErrors.row_name = "Row name is required";
        if (!formData.seat_number) newErrors.seat_number = "Seat number is required";
      }
    }

    if (formData.create_ticket && formData.ticket_price < 0) {
      newErrors.ticket_price = "Ticket price cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Clean up empty strings to undefined
      const submitData: CreateEventSeatData = {
        ...formData,
        seat_id: formData.seat_id || undefined,
        section_name: formData.section_name || undefined,
        row_name: formData.row_name || undefined,
        seat_number: formData.seat_number || undefined,
        ticket_number: formData.ticket_number || undefined,
        broker_id: formData.broker_id || undefined,
        ticket_price: formData.ticket_price || 0,
      };
      await onSubmit(submitData);
      // Reset form on success
      setFormData({
        section_name: "",
        row_name: "",
        seat_number: "",
        ticket_price: 0,
        ticket_number: "",
        broker_id: "",
        create_ticket: false,
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to create event seat:", error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        section_name: "",
        row_name: "",
        seat_number: "",
        ticket_price: 0,
        ticket_number: "",
        broker_id: "",
        create_ticket: false,
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Event Seat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Seat ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="seat_id">Seat ID (Optional)</Label>
              <Input
                id="seat_id"
                value={formData.seat_id || ""}
                onChange={(e) => handleChange("seat_id", e.target.value)}
                placeholder="Reference to venue seat"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                If provided, seat location will be taken from the venue seat
              </p>
            </div>

            {/* Location Info (required if seat_id not provided) */}
            {!formData.seat_id && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="section_name">
                    Section Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="section_name"
                    value={formData.section_name || ""}
                    onChange={(e) => handleChange("section_name", e.target.value)}
                    placeholder="e.g., Section A"
                    disabled={loading}
                    className={cn(errors.section_name && "border-destructive")}
                  />
                  {errors.section_name && (
                    <p className="text-xs text-destructive">{errors.section_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="row_name">
                    Row Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="row_name"
                    value={formData.row_name || ""}
                    onChange={(e) => handleChange("row_name", e.target.value)}
                    placeholder="e.g., Row 1"
                    disabled={loading}
                    className={cn(errors.row_name && "border-destructive")}
                  />
                  {errors.row_name && (
                    <p className="text-xs text-destructive">{errors.row_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seat_number">
                    Seat Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="seat_number"
                    value={formData.seat_number || ""}
                    onChange={(e) => handleChange("seat_number", e.target.value)}
                    placeholder="e.g., 1, 2, 3"
                    disabled={loading}
                    className={cn(errors.seat_number && "border-destructive")}
                  />
                  {errors.seat_number && (
                    <p className="text-xs text-destructive">{errors.seat_number}</p>
                  )}
                </div>
              </>
            )}

            {/* Ticket Price (only shown if creating ticket) */}
            {formData.create_ticket && (
              <div className="space-y-2">
                <Label htmlFor="ticket_price">Ticket Price</Label>
                <Input
                  id="ticket_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ticket_price || 0}
                  onChange={(e) => handleChange("ticket_price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  disabled={loading}
                  className={cn(errors.ticket_price && "border-destructive")}
                />
                {errors.ticket_price && (
                  <p className="text-xs text-destructive">{errors.ticket_price}</p>
                )}
              </div>
            )}

            {/* Ticket Number (optional, only shown if creating ticket) */}
            {formData.create_ticket && (
              <div className="space-y-2">
                <Label htmlFor="ticket_number">Ticket Number (Optional)</Label>
                <Input
                  id="ticket_number"
                  value={formData.ticket_number || ""}
                  onChange={(e) => handleChange("ticket_number", e.target.value)}
                  placeholder="Leave empty to auto-generate"
                  disabled={loading}
                />
              </div>
            )}

            {/* Broker ID (optional) */}
            <div className="space-y-2">
              <Label htmlFor="broker_id">Broker ID (Optional)</Label>
              <Input
                id="broker_id"
                value={formData.broker_id || ""}
                onChange={(e) => handleChange("broker_id", e.target.value)}
                placeholder="Broker identifier"
                disabled={loading}
              />
            </div>

            {/* Create Ticket Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create_ticket"
                checked={formData.create_ticket}
                onCheckedChange={(checked) => handleChange("create_ticket", checked)}
                disabled={loading}
              />
              <Label
                htmlFor="create_ticket"
                className="text-sm font-normal cursor-pointer"
              >
                Create ticket immediately (mark as sold)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Seat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

