"""
Pydantic schemas for EventSeat API.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.shared.enums import EventSeatStatusEnum


class BrokerSeatImportItemSchema(BaseModel):
    """Schema for a single seat in a broker import list"""
    section_name: str
    row_name: str
    seat_number: str
    price: float = 0.0
    ticket_code: Optional[str] = None
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ImportBrokerSeatsRequest(BaseModel):
    """Request to import multiple seats from a broker"""
    broker_id: str
    seats: List[BrokerSeatImportItemSchema]


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
    price: float
    ticket_code: Optional[str] = None
    broker_id: Optional[str] = None
    attributes: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class EventSeatListResponse(BaseModel):
    """Response model for a paginated list of event seats"""
    items: List[EventSeatResponse]
    total: int
    skip: int
    limit: int
    has_next: bool
