"""
Subscription plan value objects
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional


class PlanTier(str, Enum):
    """Subscription plan tiers"""
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


@dataclass
class PlanLimits:
    """Limits for a subscription plan"""
    # User limits
    max_users: Optional[int] = None  # None = unlimited
    max_admin_users: int = 1
    
    # Storage limits
    storage_gb: Optional[int] = None  # None = unlimited
    max_file_size_mb: int = 10
    
    # Record limits
    max_products: Optional[int] = None
    max_orders_per_month: Optional[int] = None
    max_customers: Optional[int] = None
    
    # Feature flags
    api_access: bool = True
    export_data: bool = True
    custom_branding: bool = False
    priority_support: bool = False
    audit_logs: bool = False
    
    # API rate limits
    api_calls_per_minute: int = 60
    api_calls_per_day: int = 10000


@dataclass
class SubscriptionPlan:
    """Subscription plan definition"""
    tier: PlanTier
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    limits: PlanLimits
    is_active: bool = True
    
    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mo)"


# Define standard subscription plans
SUBSCRIPTION_PLANS = {
    PlanTier.FREE: SubscriptionPlan(
        tier=PlanTier.FREE,
        name="Free",
        description="Perfect for trying out the platform",
        price_monthly=0.0,
        price_yearly=0.0,
        limits=PlanLimits(
            max_users=3,
            max_admin_users=1,
            storage_gb=1,
            max_file_size_mb=5,
            max_products=50,
            max_orders_per_month=100,
            max_customers=100,
            api_access=False,
            export_data=True,
            custom_branding=False,
            priority_support=False,
            audit_logs=False,
            api_calls_per_minute=10,
            api_calls_per_day=1000
        )
    ),
    
    PlanTier.STARTER: SubscriptionPlan(
        tier=PlanTier.STARTER,
        name="Starter",
        description="For small businesses getting started",
        price_monthly=29.0,
        price_yearly=290.0,  # 2 months free
        limits=PlanLimits(
            max_users=10,
            max_admin_users=2,
            storage_gb=10,
            max_file_size_mb=25,
            max_products=500,
            max_orders_per_month=1000,
            max_customers=1000,
            api_access=True,
            export_data=True,
            custom_branding=False,
            priority_support=False,
            audit_logs=True,
            api_calls_per_minute=60,
            api_calls_per_day=10000
        )
    ),
    
    PlanTier.PROFESSIONAL: SubscriptionPlan(
        tier=PlanTier.PROFESSIONAL,
        name="Professional",
        description="For growing businesses",
        price_monthly=99.0,
        price_yearly=990.0,  # 2 months free
        limits=PlanLimits(
            max_users=50,
            max_admin_users=5,
            storage_gb=100,
            max_file_size_mb=100,
            max_products=5000,
            max_orders_per_month=10000,
            max_customers=10000,
            api_access=True,
            export_data=True,
            custom_branding=True,
            priority_support=True,
            audit_logs=True,
            api_calls_per_minute=300,
            api_calls_per_day=50000
        )
    ),
    
    PlanTier.ENTERPRISE: SubscriptionPlan(
        tier=PlanTier.ENTERPRISE,
        name="Enterprise",
        description="For large organizations with custom needs",
        price_monthly=499.0,
        price_yearly=4990.0,  # 2 months free
        limits=PlanLimits(
            max_users=None,  # Unlimited
            max_admin_users=20,
            storage_gb=None,  # Unlimited
            max_file_size_mb=500,
            max_products=None,  # Unlimited
            max_orders_per_month=None,  # Unlimited
            max_customers=None,  # Unlimited
            api_access=True,
            export_data=True,
            custom_branding=True,
            priority_support=True,
            audit_logs=True,
            api_calls_per_minute=1000,
            api_calls_per_day=None  # Unlimited
        )
    )
}


def get_plan(tier: PlanTier) -> Optional[SubscriptionPlan]:
    """Get subscription plan by tier"""
    return SUBSCRIPTION_PLANS.get(tier)


def get_all_plans() -> list[SubscriptionPlan]:
    """Get all available subscription plans"""
    return list(SUBSCRIPTION_PLANS.values())

