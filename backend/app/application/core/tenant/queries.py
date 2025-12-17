"""
Tenant queries for multi-tenancy
"""
from dataclasses import dataclass


@dataclass
class GetTenantByIdQuery:
    """Query to get tenant by ID"""
    tenant_id: str


@dataclass
class GetTenantBySlugQuery:
    """Query to get tenant by slug"""
    slug: str


@dataclass
class GetAllTenantsQuery:
    """Query to get all tenants"""
    skip: int = 0
    limit: int = 100

