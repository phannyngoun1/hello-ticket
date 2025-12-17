"""Enumerations for inventory domain"""
from enum import Enum


class GoodsReceiptStatus(str, Enum):
    """Lifecycle status for a goods receipt"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PUTAWAY = "putaway"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class GoodsReceiptLineStatus(str, Enum):
    """Line-level lifecycle tracking for goods receipts"""

    PENDING = "pending"
    RECEIVED = "received"
    REJECTED = "rejected"
