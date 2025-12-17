"""
External API schemas for system-to-system integration
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class ExternalOrderRequest(BaseModel):
    """External system order creation request"""
    external_order_id: str
    customer_email: EmailStr
    customer_name: str
    items: List[dict]
    total_amount: float
    currency: str = "USD"
    metadata: dict = {}


class ExternalProductSyncRequest(BaseModel):
    """External system product sync request"""
    external_product_id: str
    name: str
    description: str
    price: float
    stock_quantity: int
    sku: Optional[str] = None
    metadata: dict = {}


class ExternalWebhookPayload(BaseModel):
    """Webhook payload from external systems"""
    event_type: str
    event_id: str
    timestamp: datetime
    data: dict
    metadata: dict = {}


class ExternalAPIResponse(BaseModel):
    """Standard response for external API calls"""
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None

