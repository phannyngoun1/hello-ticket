"""
Pydantic schemas for EventSeat API.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator
from app.shared.enums import EventSeatStatusEnum, TicketStatusEnum


class SectionPricingConfig(BaseModel):
    """Configuration for section-based pricing"""
    section_id: str = Field(..., description="Section ID")
    price: float = Field(..., ge=0, description="Price for this section")


class SeatPricingConfig(BaseModel):
    """Configuration for individual seat pricing (overrides section price)"""
    seat_id: str = Field(..., description="Seat ID")
    price: float = Field(..., ge=0, description="Price for this specific seat")


class InitializeEventSeatsRequest(BaseModel):
    """Request to initialize event seats from layout"""
    generate_tickets: bool = Field(False, description="If True, create tickets for all seats")
    ticket_price: float = Field(0.0, ge=0, description="Default price for tickets if generate_tickets is True (used when section_pricing is not provided)")
    # Section-based pricing configuration
    pricing_mode: str = Field("same", description="Pricing mode: 'same' for same price for all, 'per_section' for different prices per section")
    section_pricing: Optional[List[SectionPricingConfig]] = Field(None, description="Per-section pricing configuration (required if pricing_mode is 'per_section')")
    seat_pricing: Optional[List[SeatPricingConfig]] = Field(None, description="Individual seat pricing overrides (optional, overrides section price)")
    included_section_ids: Optional[List[str]] = Field(None, description="List of section IDs to include (if not provided, all sections are included)")
    excluded_section_ids: Optional[List[str]] = Field(None, description="List of section IDs to exclude")

    @model_validator(mode='after')
    def validate_pricing_config(self):
        """Validate that section_pricing is provided when pricing_mode is 'per_section'"""
        if self.pricing_mode == 'per_section' and (not self.section_pricing or len(self.section_pricing) == 0):
            raise ValueError("section_pricing is required when pricing_mode is 'per_section'")
        return self


class BrokerSeatImportItemSchema(BaseModel):
    """Schema for a single seat in a broker import list"""
    section_name: str
    row_name: str
    seat_number: str
    # Note: price and ticket_code removed - tickets should be created separately
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ImportBrokerSeatsRequest(BaseModel):
    """Request to import multiple seats from a broker"""
    broker_id: str
    seats: List[BrokerSeatImportItemSchema]


class DeleteEventSeatsRequest(BaseModel):
    """Request to delete specific event seats"""
    seat_ids: List[str] = Field(..., min_items=1, description="List of event seat IDs to delete")


class CreateTicketsFromSeatsRequest(BaseModel):
    """Request to create tickets from event seats"""
    seat_ids: List[str] = Field(..., min_items=1, description="List of event seat IDs to create tickets for")
    ticket_price: float = Field(0.0, ge=0, description="Price for tickets (applied to all)")


class CreateEventSeatRequest(BaseModel):
    """Request to create a single event seat"""
    seat_id: Optional[str] = Field(None, description="Reference to venue seat if applicable")
    section_name: Optional[str] = Field(None, description="Section name (required if seat_id not provided)")
    row_name: Optional[str] = Field(None, description="Row name (required if seat_id not provided)")
    seat_number: Optional[str] = Field(None, description="Seat number (required if seat_id not provided)")
    broker_id: Optional[str] = Field(None, description="Broker ID if applicable")
    create_ticket: bool = Field(False, description="If True, create ticket immediately and mark as sold")
    ticket_price: float = Field(0.0, ge=0, description="Price for ticket if create_ticket is True")
    ticket_number: Optional[str] = Field(None, description="Optional ticket number if create_ticket is True")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional attributes")


class EventSeatResponse(BaseModel):
    """Response model for an event seat"""
    id: str
    tenant_id: str
    event_id: str
    status: EventSeatStatusEnum
    seat_id: Optional[str] = None
    section_name: Optional[str] = None
    row_name: Optional[str] = None
    seat_number: Optional[str] = None
    broker_id: Optional[str] = None
    attributes: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    # Ticket information (if ticket exists)
    ticket_number: Optional[str] = None
    ticket_price: Optional[float] = None  # Ticket price
    ticket_status: Optional[TicketStatusEnum] = None  # Ticket status


class EventSeatListResponse(BaseModel):
    """Response model for a paginated list of event seats"""
    items: List[EventSeatResponse]
    total: int
    skip: int
    limit: int
    has_next: bool
