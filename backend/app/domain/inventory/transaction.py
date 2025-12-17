"""
Inventory Transaction domain entity - Immutable ledger record
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from dataclasses import dataclass


@dataclass(frozen=True)
class InventoryTransaction:
    """Inventory transaction - immutable ledger record"""
    id: str
    tenant_id: str
    occurred_at: datetime
    type: str  # RECEIVE, ISSUE, MOVE, TRANSFER_OUT, TRANSFER_IN, ADJUST_IN, ADJUST_OUT, etc.
    item_id: str
    quantity: Decimal
    uom: str
    location_id: Optional[str] = None
    tracking_id: Optional[str] = None
    cost_per_unit: Optional[Decimal] = None
    source_ref_type: Optional[str] = None
    source_ref_id: Optional[str] = None
    reason_code: Optional[str] = None
    actor_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Deprecated fields (kept for backward compatibility)
    warehouse_id: Optional[str] = None
    bin_id: Optional[str] = None
    lot_id: Optional[str] = None
    serial_id: Optional[str] = None

