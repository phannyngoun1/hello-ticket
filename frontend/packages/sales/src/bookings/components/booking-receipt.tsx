import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Button,
  Separator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Label,
  Input,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { BookingTicket } from "../types";
import type { Customer } from "../../types";
import type { Employee } from "../../employees/types";

interface BookingReceiptProps {
  // Customer Props
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectedCustomerIdChange: (id: string | null) => void;
  customerPopoverOpen: boolean;
  onCustomerPopoverOpenChange: (open: boolean) => void;
  customerSearchQuery: string;
  onCustomerSearchQueryChange: (query: string) => void;

  // Salesperson Props
  employees: Employee[];
  selectedSalespersonId: string | null;
  onSelectedSalespersonIdChange: (id: string | null) => void;
  salespersonPopoverOpen: boolean;
  onSalespersonPopoverOpenChange: (open: boolean) => void;
  salespersonSearchQuery: string;
  onSalespersonSearchQueryChange: (query: string) => void;

  // Discount Props
  discountType: "percentage" | "amount";
  onDiscountTypeChange: (type: "percentage" | "amount") => void;
  discountValue: string;
  onDiscountValueChange: (value: string) => void;

  // Existing Props
  selectedTickets: BookingTicket[];
  onRemoveTicket: (eventSeatId: string) => void;
  onClearAll: () => void;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function BookingReceipt({
  // Customer Props
  customers,
  selectedCustomerId,
  onSelectedCustomerIdChange,
  customerPopoverOpen,
  onCustomerPopoverOpenChange,
  customerSearchQuery,
  onCustomerSearchQueryChange,

  // Salesperson Props
  employees,
  selectedSalespersonId,
  onSelectedSalespersonIdChange,
  salespersonPopoverOpen,
  onSalespersonPopoverOpenChange,
  salespersonSearchQuery,
  onSalespersonSearchQueryChange,

  // Discount Props
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,

  // Existing Props
  selectedTickets,
  onRemoveTicket,
  onClearAll,
  subtotalAmount,
  discountAmount,
  taxAmount,
  totalAmount,
}: BookingReceiptProps) {
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedSalesperson = employees.find(
    (e) => e.id === selectedSalespersonId,
  );

  const [activeTab, setActiveTab] = useState<string>("info");

  // Switch to tickets tab when a ticket is added
  useEffect(() => {
    if (selectedTickets.length > 0) {
      setActiveTab("tickets");
    }
  }, [selectedTickets.length]);

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col h-full"
      >
        <div className="border-b flex-shrink-0">
          <TabsList className="w-full h-auto p-0 bg-transparent justify-start">
            <TabsTrigger
              value="info"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium"
            >
              Information
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-medium flex items-center gap-2"
            >
              <span>Tickets</span>
              {selectedTickets.length > 0 && (
                <span className="text-sm text-muted-foreground font-normal">
                  ({selectedTickets.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Info Tab - Customer, Salesperson, Discount */}
        <TabsContent value="info" className="flex-1 overflow-y-auto mt-0">
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Customer
              </label>
              <Popover
                open={customerPopoverOpen}
                onOpenChange={(open) => {
                  onCustomerPopoverOpenChange(open);
                  if (!open) {
                    onCustomerSearchQueryChange("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-9"
                  >
                    {selectedCustomerId
                      ? selectedCustomer?.name ||
                        selectedCustomer?.code ||
                        "Select a customer"
                      : "Select customer (optional)"}
                    <svg
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search customers..."
                      className="h-9"
                      value={customerSearchQuery}
                      onValueChange={onCustomerSearchQueryChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {customerSearchQuery
                          ? `No customers found matching "${customerSearchQuery}"`
                          : "Start typing to search customers..."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            onSelectedCustomerIdChange(null);
                            onCustomerPopoverOpenChange(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">
                              No customer selected
                            </span>
                          </div>
                        </CommandItem>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name || customer.code} ${customer.code || ""} ${customer.email || ""}`}
                            onSelect={() => {
                              onSelectedCustomerIdChange(customer.id);
                              onCustomerPopoverOpenChange(false);
                              onCustomerSearchQueryChange("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {customer.name || customer.code}
                              </span>
                              {customer.code && customer.name && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.code}
                                </span>
                              )}
                              {customer.email && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.email}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Salesperson Selection */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Salesperson
              </label>
              <Popover
                open={salespersonPopoverOpen}
                onOpenChange={(open) => {
                  onSalespersonPopoverOpenChange(open);
                  if (!open) {
                    onSalespersonSearchQueryChange("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-9"
                  >
                    {selectedSalespersonId
                      ? selectedSalesperson?.name ||
                        selectedSalesperson?.code ||
                        "Select a salesperson"
                      : "Select salesperson (optional)"}
                    <svg
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search salespeople..."
                      className="h-9"
                      value={salespersonSearchQuery}
                      onValueChange={onSalespersonSearchQueryChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {salespersonSearchQuery
                          ? `No salespeople found matching "${salespersonSearchQuery}"`
                          : "Start typing to search salespeople..."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            onSelectedSalespersonIdChange(null);
                            onSalespersonPopoverOpenChange(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">
                              No salesperson selected
                            </span>
                          </div>
                        </CommandItem>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.name} ${employee.code || ""} ${employee.work_email || ""}`}
                            onSelect={() => {
                              onSelectedSalespersonIdChange(employee.id);
                              onSalespersonPopoverOpenChange(false);
                              onSalespersonSearchQueryChange("");
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {employee.name}
                              </span>
                              {employee.code && (
                                <span className="text-xs text-muted-foreground">
                                  {employee.code}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Discount Section */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                Discount (Optional)
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                    <Button
                      variant={
                        discountType === "percentage" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => onDiscountTypeChange("percentage")}
                      className="h-7 px-3 text-xs"
                    >
                      %
                    </Button>
                    <Button
                      variant={discountType === "amount" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => onDiscountTypeChange("amount")}
                      className="h-7 px-3 text-xs"
                    >
                      $
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => onDiscountValueChange(e.target.value)}
                    placeholder="0"
                    className="h-9 flex-1"
                    min="0"
                    step={discountType === "percentage" ? "1" : "0.01"}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tickets Tab - Ticket List */}
        <TabsContent value="tickets" className="flex-1 overflow-y-auto mt-0">
          <div className="p-4 space-y-4 h-full flex flex-col">
            {selectedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">No tickets selected</p>
                  <p className="text-xs">
                    Select seats from the layout or list
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Receipt Items */}
                <div className="space-y-0">
                  {selectedTickets.map((ticket, index) => {
                    const location =
                      ticket.sectionName && ticket.rowName && ticket.seatNumber
                        ? `${ticket.sectionName} ${ticket.rowName} ${ticket.seatNumber}`
                        : ticket.seatId
                          ? `Seat ${ticket.seatId.slice(0, 8)}`
                          : "Unknown";

                    return (
                      <div
                        key={ticket.eventSeatId}
                        className="group py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                #{String(index + 1).padStart(3, "0")}
                              </span>
                              <span className="text-sm font-medium truncate">
                                {location}
                              </span>
                            </div>
                            {ticket.ticketNumber && (
                              <p className="text-xs text-muted-foreground">
                                Ticket: {ticket.ticketNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold tabular-nums">
                              ${ticket.ticketPrice?.toFixed(2) || "0.00"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveTicket(ticket.eventSeatId)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Remove ticket"
                              title="Remove ticket"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {selectedTickets.length > 0 && (
            <div className="border-t bg-background mt-auto flex-shrink-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold tabular-nums">
                    ${subtotalAmount.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {discountType === "percentage"
                        ? ` (${discountValue}%):`
                        : " ($):"}
                    </span>
                    <span className="font-semibold tabular-nums text-green-600">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%):</span>
                  <span className="font-semibold tabular-nums">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="w-full h-8 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
