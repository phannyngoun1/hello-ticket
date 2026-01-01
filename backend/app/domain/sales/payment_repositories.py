"""Repository interfaces for Payment domain."""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.sales.payment import Payment


class PaymentRepository(ABC):
    """Repository interface for Payment aggregate"""

    @abstractmethod
    async def save(self, payment: Payment) -> Payment:
        """Save payment (create or update)"""
        pass

    @abstractmethod
    async def get_by_id(self, tenant_id: str, payment_id: str) -> Optional[Payment]:
        """Get payment by ID"""
        pass

    @abstractmethod
    async def get_by_booking(self, tenant_id: str, booking_id: str) -> List[Payment]:
        """Get all payments for a booking"""
        pass

    @abstractmethod
    async def get_all(self, tenant_id: str) -> List[Payment]:
        """Get all payments for a tenant"""
        pass

