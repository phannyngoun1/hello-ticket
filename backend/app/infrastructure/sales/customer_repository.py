"""In-memory CustomerRepository implementation (temporary)."""
from __future__ import annotations

import re
from typing import Dict, List, Optional
from datetime import datetime, timezone

from app.domain.sales.customer import Customer
from app.domain.sales.repositories import CustomerRepository, CustomerSearchResult


class InMemoryCustomerRepository(CustomerRepository):
    def __init__(self):
        self._by_tenant: Dict[str, Dict[str, Customer]] = {}
        self._by_code: Dict[str, Dict[str, Customer]] = {}

    async def save(self, customer: Customer) -> Customer:
        tenant_map = self._by_tenant.setdefault(customer.tenant_id, {})
        code_map = self._by_code.setdefault(customer.tenant_id, {})
        tenant_map[customer.id] = customer
        code_map[customer.code] = customer
        return customer

    async def get_by_id(self, tenant_id: str, customer_id: str) -> Optional[Customer]:
        return self._by_tenant.get(tenant_id, {}).get(customer_id)

    async def get_by_code(self, tenant_id: str, code: str) -> Optional[Customer]:
        return self._by_code.get(tenant_id, {}).get(code.strip().upper())

    async def search(
        self,
        tenant_id: str,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> CustomerSearchResult:
        items: List[Customer] = list(self._by_tenant.get(tenant_id, {}).values())
        if search:
            term = search.lower()
            items = [c for c in items if term in c.code.lower() or term in c.name.lower()]
        if is_active is not None:
            items = [c for c in items if c.is_active == is_active]
        total = len(items)
        paged = items[skip : skip + limit]
        has_next = skip + limit < total
        return CustomerSearchResult(items=paged, total=total, has_next=has_next)

    async def delete(self, tenant_id: str, customer_id: str) -> bool:
        tenant_map = self._by_tenant.get(tenant_id, {})
        customer = tenant_map.get(customer_id)
        if not customer:
            return False
        # Soft delete: mark inactive and set deactivated_at
        customer.is_active = False
        customer.deactivated_at = datetime.now(timezone.utc)
        return True

    async def generate_next_code(self, tenant_id: str) -> str:
        """Generate the next available customer code in format C-000000"""
        # Get all customers for this tenant
        customers = list(self._by_tenant.get(tenant_id, {}).values())
        
        # Pattern to match C-XXXXXX format
        pattern = re.compile(r'^C-(\d+)$', re.IGNORECASE)
        
        max_number = 0
        for customer in customers:
            match = pattern.match(customer.code)
            if match:
                try:
                    number = int(match.group(1))
                    max_number = max(max_number, number)
                except ValueError:
                    continue
        
        # Increment and format
        next_number = max_number + 1
        return f"C-{next_number:06d}"

