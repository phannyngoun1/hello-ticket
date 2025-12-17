"""
Test/Demo Script for User Cache

Run this to see the user cache in action!

Usage:
    cd backend
    python -m test_user_cache
"""
import asyncio
from sqlmodel import Session, select
from app.infrastructure.database.platform_models import UserModel
from app.infrastructure.database.platform_connection import get_platform_session_sync
from app.infrastructure.database.models import UserCacheModel, OrderModel
from app.infrastructure.database.connection import get_session_sync
from app.application.core.user.services.user_sync_service import user_sync_service
from datetime import datetime, timezone
from decimal import Decimal


async def demo_user_cache():
    """Demonstrate user cache functionality"""
    
    print("=" * 80)
    print("🚀 USER CACHE DEMONSTRATION")
    print("=" * 80)
    print()
    
    # Step 1: Create a test user in Platform DB
    print("📝 Step 1: Create test user in Platform DB...")
    with get_platform_session_sync() as platform_session:
        test_user = UserModel(
            id="demo_user_001",
            tenant_id="default-tenant",
            username="demo_user",
            name="Demo User",
            email="demo@test.com",
            hashed_password="hashed_pw",
            role="user",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Check if exists
        existing = platform_session.get(UserModel, "demo_user_001")
        if existing:
            print("   ✓ User already exists in Platform DB")
        else:
            platform_session.add(test_user)
            platform_session.commit()
            print("   ✓ User created in Platform DB")
    
    print()
    
    # Step 2: Sync to Operational DB cache
    print("🔄 Step 2: Sync user to Operational DB cache...")
    success = await user_sync_service.sync_user("demo_user_001")
    if success:
        print("   ✓ User synced to cache")
    else:
        print("   ✗ Sync failed")
    
    print()
    
    # Step 3: Verify cache
    print("🔍 Step 3: Verify user in cache...")
    with get_session_sync() as operational_session:
        cached_user = operational_session.get(UserCacheModel, "demo_user_001")
        if cached_user:
            print(f"   ✓ Found in cache:")
            print(f"      - Name: {cached_user.name}")
            print(f"      - Email: {cached_user.email}")
            print(f"      - Synced at: {cached_user.synced_at}")
            print(f"      - Version: {cached_user.version}")
        else:
            print("   ✗ Not found in cache")
    
    print()
    
    # Step 4: Create a test order
    print("📦 Step 4: Create test order...")
    with get_session_sync() as operational_session:
        existing_order = operational_session.get(OrderModel, "demo_order_001")
        if existing_order:
            print("   ✓ Order already exists")
        else:
            test_order = OrderModel(
                id="demo_order_001",
                tenant_id="default-tenant",
                customer_id="demo_user_001",
                customer_name="Demo User",  # Denormalized
                customer_email="demo@test.com",  # Denormalized
                status="completed",
                total_amount=Decimal("99.99"),
                tax_amount=Decimal("10.00"),
                shipping_cost=Decimal("5.00"),
                final_amount=Decimal("114.99"),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            operational_session.add(test_order)
            operational_session.commit()
            print("   ✓ Order created")
    
    print()
    
    # Step 5: Demonstrate SQL JOIN
    print("🔗 Step 5: SQL JOIN demo (orders with users)...")
    with get_session_sync() as operational_session:
        # SQL JOIN!
        statement = (
            select(OrderModel, UserCacheModel)
            .join(UserCacheModel, OrderModel.customer_id == UserCacheModel.id)
            .where(OrderModel.tenant_id == "default-tenant")
        )
        
        results = operational_session.exec(statement).all()
        
        if results:
            print(f"   ✓ Found {len(results)} order(s) with user data:")
            for order, user in results:
                print(f"\n      Order: {order.id}")
                print(f"      - Total: ${order.total_amount}")
                print(f"      - Status: {order.status}")
                print(f"\n      Customer (from JOIN):")
                print(f"      - Name: {user.name}")
                print(f"      - Email: {user.email}")
                print(f"      - Role: {user.role}")
                print(f"\n      Denormalized (from order table):")
                print(f"      - Name: {order.customer_name}")
                print(f"      - Email: {order.customer_email}")
                print(f"\n      Data Match: {user.name == order.customer_name and user.email == order.customer_email} ✓")
        else:
            print("   ℹ️  No orders found")
    
    print()
    
    # Step 6: Get sync stats
    print("📊 Step 6: Check sync statistics...")
    stats = await user_sync_service.get_sync_stats(tenant_id="default-tenant")
    if "error" not in stats:
        print(f"   ✓ Cache statistics:")
        print(f"      - Total cached users: {stats['total_cached']}")
        print(f"      - Tenant: {stats['tenant_id']}")
        print(f"      - Stale users (>1h): {stats['stale_count']}")
        if stats['oldest_sync']:
            print(f"      - Oldest sync: {stats['oldest_sync']}")
        if stats['newest_sync']:
            print(f"      - Newest sync: {stats['newest_sync']}")
    else:
        print(f"   ✗ Error: {stats['error']}")
    
    print()
    print("=" * 80)
    print("✅ DEMONSTRATION COMPLETE!")
    print("=" * 80)
    print()
    print("💡 Key Takeaways:")
    print("   1. Users are stored in Platform DB (source of truth)")
    print("   2. User cache synced to Operational DB for JOINs")
    print("   3. SQL JOINs work between orders and users_cache")
    print("   4. Cache includes sync metadata (synced_at, version)")
    print()
    print("📚 See USER_CACHE_GUIDE.md for complete documentation")
    print()


async def cleanup_demo_data():
    """Clean up demo data (optional)"""
    print("🧹 Cleaning up demo data...")
    
    # Remove from operational
    with get_session_sync() as operational_session:
        order = operational_session.get(OrderModel, "demo_order_001")
        if order:
            operational_session.delete(order)
        
        cached_user = operational_session.get(UserCacheModel, "demo_user_001")
        if cached_user:
            operational_session.delete(cached_user)
        
        operational_session.commit()
    
    # Remove from platform
    with get_platform_session_sync() as platform_session:
        user = platform_session.get(UserModel, "demo_user_001")
        if user:
            platform_session.delete(user)
        platform_session.commit()
    
    print("✓ Cleanup complete")


if __name__ == "__main__":
    import sys
    
    if "--cleanup" in sys.argv:
        asyncio.run(cleanup_demo_data())
    else:
        asyncio.run(demo_user_cache())
        print("💡 To cleanup demo data, run: python -m test_user_cache --cleanup")

