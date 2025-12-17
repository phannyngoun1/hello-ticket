"""
Inventory response mappers - converts domain entities to API response models
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.domain.inventory.item import Item
from app.domain.inventory.balance import InventoryBalance
from app.presentation.api.inventory.schemas import (
    ItemResponse,
    PaginatedItemResponse,
    InventoryBalanceResponse,
    TransactionResponse,
)


class ItemResponseMapper:
    """Mapper for converting Item aggregate to response schema"""
    
    @staticmethod
    def to_response(item: Item) -> ItemResponse:
        """Convert Item domain entity to ItemResponse"""
        uom_mappings = item.attributes.get("uom_mappings") if item.attributes else None
        # Remove uom_mappings from attributes to avoid duplication
        attributes = {k: v for k, v in (item.attributes or {}).items() if k != "uom_mappings"}
        
        return ItemResponse(
            id=item.id,
            tenant_id=item.tenant_id,
            code=item.code or "",
            sku=item.sku,
            name=item.name,
            description=item.description,
            item_group=item.item_group,
            category_id=item.category_id if hasattr(item, 'category_id') else None,
            item_type=item.item_type,
            item_usage=item.item_usage,
            tracking_scope=item.tracking_scope,
            default_uom=item.default_uom,
            tracking_requirements=item.tracking_requirements,
            perishable=item.perishable,
            active=item.active,
            attributes=attributes,
            uom_mappings=uom_mappings,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
    
    @staticmethod
    def to_paginated_response(
        items: List[Item],
        skip: int = 0,
        limit: int = 100,
        total: int = None
    ) -> PaginatedItemResponse:
        """Convert list of items to paginated response"""
        item_responses = [ItemResponseMapper.to_response(item) for item in items]
        
        return PaginatedItemResponse(
            items=item_responses,
            total=total,
            skip=skip,
            limit=limit,
            has_next=len(items) == limit  # Simple heuristic
        )


class InventoryBalanceResponseMapper:
    """Mapper for converting InventoryBalance aggregate to response schema"""
    
    @staticmethod
    def to_response(
        balance: InventoryBalance,
        location_info: Optional[dict] = None
    ) -> InventoryBalanceResponse:
        """Convert InventoryBalance domain entity to InventoryBalanceResponse
        
        Args:
            balance: The inventory balance domain entity
            location_info: Optional dict with location information containing:
                - location_code: str
                - location_name: Optional[str]
                - location_type: Optional[str]
        """
        location = location_info or {}
        return InventoryBalanceResponse(
            id=balance.id,
            tenant_id=balance.tenant_id,
            item_id=balance.item_id,
            location_id=balance.location_id,
            tracking_id=balance.tracking_id,
            status=balance.status,
            quantity=balance.quantity,
            created_at=balance.created_at,
            updated_at=balance.updated_at,
            location_code=location.get("location_code"),
            location_name=location.get("location_name"),
            location_type=location.get("location_type"),
        )
    
    @staticmethod
    def to_list_response(
        balances: List[InventoryBalance],
        location_info_map: Optional[dict] = None
    ) -> List[InventoryBalanceResponse]:
        """Convert list of balances to response list
        
        Args:
            balances: List of inventory balance domain entities
            location_info_map: Optional dict mapping location_id to location_info dict
        """
        location_map = location_info_map or {}
        return [
            InventoryBalanceResponseMapper.to_response(
                balance,
                location_info=location_map.get(balance.location_id)
            )
            for balance in balances
        ]


class TransactionResponseMapper:
    """Mapper for converting transaction dicts to response schema"""
    
    @staticmethod
    def to_response(transaction: dict) -> TransactionResponse:
        """Convert transaction dict to TransactionResponse"""
        return TransactionResponse(
            id=transaction["id"],
            tenant_id=transaction["tenant_id"],
            occurred_at=transaction["occurred_at"],
            type=transaction["type"],
            item_id=transaction["item_id"],
            quantity=Decimal(str(transaction["quantity"])) if transaction.get("quantity") else None,
            uom=transaction["uom"],
            location_id=transaction.get("location_id"),
            tracking_id=transaction.get("tracking_id"),
            cost_per_unit=Decimal(str(transaction["cost_per_unit"])) if transaction.get("cost_per_unit") else None,
            source_ref_type=transaction.get("source_ref_type"),
            source_ref_id=transaction.get("source_ref_id"),
            reason_code=transaction.get("reason_code"),
            actor_id=transaction.get("actor_id"),
            created_at=transaction["created_at"]
        )
    
    @staticmethod
    def to_list_response(transactions: List[dict]) -> List[TransactionResponse]:
        """Convert list of transaction dicts to response list"""
        return [TransactionResponseMapper.to_response(tx) for tx in transactions]

