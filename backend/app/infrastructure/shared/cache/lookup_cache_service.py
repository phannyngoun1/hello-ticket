"""
Lookup and Master Data Cache Service

This service is specifically designed for:
- Static lookup data (categories, statuses, types)
- Master data that rarely changes (products, configurations)
- Reference data for dropdowns and selections
"""
from typing import Optional, List, Dict, Any
from enum import Enum
from app.infrastructure.shared.cache.cache_service import CacheService, cache_service


class LookupType(str, Enum):
    """Types of lookup data"""
    PRODUCT_CATEGORY = "product_category"
    ORDER_STATUS = "order_status"
    USER_ROLE = "user_role"
    COUNTRY = "country"
    CURRENCY = "currency"
    PAYMENT_METHOD = "payment_method"
    SHIPPING_METHOD = "shipping_method"


class LookupCacheService:
    """
    Specialized service for caching lookup and master data
    
    Features:
    - Long TTL for stable data (7 days default)
    - Bulk operations for efficient loading
    - Type-safe lookup patterns
    """
    
    def __init__(self, cache: Optional[CacheService] = None):
        self._cache = cache or cache_service
    
    def get_lookup(
        self,
        lookup_type: LookupType,
        key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a single lookup value
        
        Args:
            lookup_type: Type of lookup data
            key: Lookup key/code
            
        Returns:
            Lookup data dictionary or None
        """
        cache_key = f"lookup:{lookup_type.value}:{key}"
        return self._cache.get(cache_key)
    
    def set_lookup(
        self,
        lookup_type: LookupType,
        key: str,
        value: Dict[str, Any],
        ttl: Optional[float] = None
    ) -> bool:
        """
        Set a single lookup value
        
        Args:
            lookup_type: Type of lookup data
            key: Lookup key/code
            value: Lookup data dictionary
            ttl: Time to live (default: 7 days)
            
        Returns:
            True if successful
        """
        cache_key = f"lookup:{lookup_type.value}:{key}"
        ttl = ttl or self._cache.TTL_LOOKUP
        return self._cache.set(cache_key, value, ttl)
    
    def get_lookup_list(
        self,
        lookup_type: LookupType
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get all lookup values for a type
        
        Args:
            lookup_type: Type of lookup data
            
        Returns:
            List of lookup data dictionaries
        """
        cache_key = f"lookup:{lookup_type.value}:all"
        return self._cache.get_cached_list(cache_key)
    
    def set_lookup_list(
        self,
        lookup_type: LookupType,
        values: List[Dict[str, Any]],
        ttl: Optional[float] = None
    ) -> bool:
        """
        Set all lookup values for a type
        
        Args:
            lookup_type: Type of lookup data
            values: List of lookup data dictionaries
            ttl: Time to live (default: 7 days)
            
        Returns:
            True if successful
        """
        cache_key = f"lookup:{lookup_type.value}:all"
        ttl = ttl or self._cache.TTL_LOOKUP
        return self._cache.set_cached_list(cache_key, values, ttl)
    
    def invalidate_lookup(
        self,
        lookup_type: Optional[LookupType] = None
    ):
        """
        Invalidate lookup cache
        
        Args:
            lookup_type: Specific lookup type, or None for all
        """
        if lookup_type:
            self._cache.delete_pattern(f"lookup:{lookup_type.value}:*")
        else:
            self._cache.delete_pattern("lookup:*")
    
    # Convenience methods for common lookup types
    
    def get_product_categories(self) -> Optional[List[Dict[str, Any]]]:
        """Get all product categories"""
        return self.get_lookup_list(LookupType.PRODUCT_CATEGORY)
    
    def set_product_categories(self, categories: List[Dict[str, Any]]) -> bool:
        """Set product categories"""
        return self.set_lookup_list(LookupType.PRODUCT_CATEGORY, categories)
    
    def get_order_statuses(self) -> Optional[List[Dict[str, Any]]]:
        """Get all order statuses"""
        return self.get_lookup_list(LookupType.ORDER_STATUS)
    
    def set_order_statuses(self, statuses: List[Dict[str, Any]]) -> bool:
        """Set order statuses"""
        return self.set_lookup_list(LookupType.ORDER_STATUS, statuses)
    
    def get_countries(self) -> Optional[List[Dict[str, Any]]]:
        """Get all countries"""
        return self.get_lookup_list(LookupType.COUNTRY)
    
    def set_countries(self, countries: List[Dict[str, Any]]) -> bool:
        """Set countries"""
        return self.set_lookup_list(LookupType.COUNTRY, countries)
    
    def warm_cache(
        self,
        lookup_data: Dict[LookupType, List[Dict[str, Any]]]
    ):
        """
        Warm up the cache with initial lookup data
        
        Args:
            lookup_data: Dictionary mapping lookup types to their data
            
        Example:
            warm_cache({
                LookupType.PRODUCT_CATEGORY: [
                    {"code": "ELEC", "name": "Electronics"},
                    {"code": "CLOTH", "name": "Clothing"}
                ],
                LookupType.ORDER_STATUS: [
                    {"code": "PENDING", "name": "Pending"},
                    {"code": "CONFIRMED", "name": "Confirmed"}
                ]
            })
        """
        for lookup_type, values in lookup_data.items():
            self.set_lookup_list(lookup_type, values)
            
            # Also cache individual items for faster single lookups
            for item in values:
                if "code" in item:
                    self.set_lookup(lookup_type, item["code"], item)


# Global lookup cache service instance
lookup_cache_service = LookupCacheService()

