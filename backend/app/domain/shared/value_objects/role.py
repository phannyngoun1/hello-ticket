"""
Role value object for RBAC
"""
from enum import Enum
from typing import List, Set
from dataclasses import dataclass


class UserRole(str, Enum):
    """User roles in the system"""
    ADMIN = "admin"              # Tenant-level administrator
    MANAGER = "manager"
    USER = "user"
    GUEST = "guest"


class Permission(str, Enum):
    """System permissions"""
    # Tenant-level User permissions
    CREATE_USER = "user:create"
    READ_USER = "user:read"
    UPDATE_USER = "user:update"
    DELETE_USER = "user:delete"
    
    # Product/Inventory permissions
    CREATE_PRODUCT = "product:create"
    VIEW_PRODUCT = "product:view"
    UPDATE_PRODUCT = "product:update"
    DELETE_PRODUCT = "product:delete"

    # Purchasing permissions
    CREATE_PURCHASE_ORDER = "purchasing:create"
    VIEW_PURCHASE_ORDER = "purchasing:view"
    APPROVE_PURCHASE_ORDER = "purchasing:approve"
    RECEIVE_PURCHASE_ORDER = "purchasing:receive"
    CANCEL_PURCHASE_ORDER = "purchasing:cancel"
    
    # Integration permissions
    MANAGE_INTEGRATIONS = "integrations:manage"
    VIEW_INTEGRATIONS = "integrations:view"
    
    # Workflow permissions
    MANAGE_WORKFLOWS = "workflows:manage"
    VIEW_WORKFLOWS = "workflows:view"
    
    # Audit permissions
    VIEW_AUDIT_LOGS = "audit_logs:view"
    
    # Sales - Customers permissions
    CREATE_SALES_CUSTOMER = "sales_customer:create"
    VIEW_SALES_CUSTOMER = "sales_customer:view"

    # Sales - Customer Types permissions
    CREATE_SALES_CUSTOMER_TYPE = "sales_customer_type:create"
    VIEW_SALES_CUSTOMER_TYPE = "sales_customer_type:view"
    MANAGE_SALES_CUSTOMER_TYPE = "sales_customer_type:manage"

    # Sales - Customer Groups permissions
    CREATE_SALES_CUSTOMER_GROUP = "sales_customer_group:create"
    VIEW_SALES_CUSTOMER_GROUP = "sales_customer_group:view"
    MANAGE_SALES_CUSTOMER_GROUP = "sales_customer_group:manage"


    # Sales - Tests permissions
    CREATE_SALES_TEST = "sales_test:create"
    VIEW_SALES_TEST = "sales_test:view"
    MANAGE_SALES_TEST = "sales_test:manage"


    # Sales - Test Trees permissions
    CREATE_SALES_TEST_TREE = "sales_test_tree:create"
    VIEW_SALES_TEST_TREE = "sales_test_tree:view"
    MANAGE_SALES_TEST_TREE = "sales_test_tree:manage"

    # Sales - Test Basics permissions
    CREATE_SALES_TEST_BASIC = "sales_test_basic:create"
    VIEW_SALES_TEST_BASIC = "sales_test_basic:view"
    MANAGE_SALES_TEST_BASIC = "sales_test_basic:manage"

    # Inventory - Goods Receipts permissions
    CREATE_INVENTORY_GOODS_RECEIPT = "inventory_goods_receipt:create"
    VIEW_INVENTORY_GOODS_RECEIPT = "inventory_goods_receipt:view"
    MANAGE_INVENTORY_GOODS_RECEIPT = "inventory_goods_receipt:manage"

    # Warehouse - Vehicles permissions
    CREATE_WAREHOUSE_VEHICLE = "warehouse_vehicle:create"
    VIEW_WAREHOUSE_VEHICLE = "warehouse_vehicle:view"
    MANAGE_WAREHOUSE_VEHICLE = "warehouse_vehicle:manage"

    # Warehouse - Employees permissions
    CREATE_WAREHOUSE_EMPLOYEE = "warehouse_employee:create"
    VIEW_WAREHOUSE_EMPLOYEE = "warehouse_employee:view"
    MANAGE_WAREHOUSE_EMPLOYEE = "warehouse_employee:manage"

    # Ticketing - Venues permissions
    CREATE_TICKETING_VENUE = "ticketing_venue:create"
    VIEW_TICKETING_VENUE = "ticketing_venue:view"
    MANAGE_TICKETING_VENUE = "ticketing_venue:manage"


    # Ticketing - Organizers permissions
    CREATE_TICKETING_ORGANIZER = "ticketing_organizer:create"
    VIEW_TICKETING_ORGANIZER = "ticketing_organizer:view"
    MANAGE_TICKETING_ORGANIZER = "ticketing_organizer:manage"


    # Ticketing - Event Types permissions
    CREATE_TICKETING_EVENT_TYPE = "ticketing_event_type:create"
    VIEW_TICKETING_EVENT_TYPE = "ticketing_event_type:view"
    MANAGE_TICKETING_EVENT_TYPE = "ticketing_event_type:manage"


    # Ticketing - Shows permissions
    CREATE_TICKETING_SHOW = "ticketing_show:create"
    VIEW_TICKETING_SHOW = "ticketing_show:view"
    MANAGE_TICKETING_SHOW = "ticketing_show:manage"

    # Sales - Bookings permissions
    CREATE_SALES_BOOKING = "sales_booking:create"
    VIEW_SALES_BOOKING = "sales_booking:view"
    MANAGE_SALES_BOOKING = "sales_booking:manage"

    # Ticketing - Events permissions
    CREATE_TICKETING_EVENT = "ticketing_event:create"
    VIEW_TICKETING_EVENT = "ticketing_event:view"
    MANAGE_TICKETING_EVENT = "ticketing_event:manage"

    # Ticketing - Venue Types permissions
    CREATE_TICKETING_VENUE_TYPE = "ticketing_venue_type:create"
    VIEW_TICKETING_VENUE_TYPE = "ticketing_venue_type:view"
    MANAGE_TICKETING_VENUE_TYPE = "ticketing_venue_type:manage"

    # Sales - Employees permissions
    CREATE_SALES_EMPLOYEE = "sales_employee:create"
    VIEW_SALES_EMPLOYEE = "sales_employee:view"
    MANAGE_SALES_EMPLOYEE = "sales_employee:manage"

    # Sales - Payments permissions
    CREATE_SALES_PAYMENT = "sales_payment:create"
    VIEW_SALES_PAYMENT = "sales_payment:view"
    MANAGE_SALES_PAYMENT = "sales_payment:manage"
    
    # Sales - Orders permissions
    CREATE_SALES_ORDER = "sales_order:create"
    VIEW_SALES_ORDER = "sales_order:view"
    MANAGE_SALES_ORDER = "sales_order:manage"   

    # Sales - Invoices permissions
    CREATE_SALES_INVOICE = "sales_invoice:create"
    VIEW_SALES_INVOICE = "sales_invoice:view"
    MANAGE_SALES_INVOICE = "sales_invoice:manage"
    
    # Sales - Quotes permissions
    CREATE_SALES_QUOTE = "sales_quote:create"
    VIEW_SALES_QUOTE = "sales_quote:view"
    MANAGE_SALES_QUOTE = "sales_quote:manage"
    
    # Sales - Credits permissions
    CREATE_SALES_CREDIT = "sales_credit:create"
    VIEW_SALES_CREDIT = "sales_credit:view"
    MANAGE_SALES_CREDIT = "sales_credit:manage"
    
    # Sales - Returns permissions
    CREATE_SALES_RETURN = "sales_return:create"
    VIEW_SALES_RETURN = "sales_return:view"
    MANAGE_SALES_RETURN = "sales_return:manage"
    
    # Sales - Refunds permissions
    CREATE_SALES_REFUND = "sales_refund:create"
    VIEW_SALES_REFUND = "sales_refund:view"
    MANAGE_SALES_REFUND = "sales_refund:manage"
    
    # Sales - Discounts permissions
    CREATE_SALES_DISCOUNT = "sales_discount:create"
    VIEW_SALES_DISCOUNT = "sales_discount:view"
    MANAGE_SALES_DISCOUNT = "sales_discount:manage"
    
    # Sales - Taxes permissions
    CREATE_SALES_TAX = "sales_tax:create"
    VIEW_SALES_TAX = "sales_tax:view"
    MANAGE_SALES_TAX = "sales_tax:manage"
    
    # Sales - Shipments permissions
    CREATE_SALES_SHIPMENT = "sales_shipment:create"
    VIEW_SALES_SHIPMENT = "sales_shipment:view"
    MANAGE_SALES_SHIPMENT = "sales_shipment:manage"
    
# Role to permissions mapping
ROLE_PERMISSIONS: dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        # Admin has all permissions within their tenant
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
        Permission.CREATE_PRODUCT, Permission.VIEW_PRODUCT, Permission.UPDATE_PRODUCT, Permission.DELETE_PRODUCT,
        Permission.CREATE_PURCHASE_ORDER, Permission.VIEW_PURCHASE_ORDER,
        Permission.APPROVE_PURCHASE_ORDER, Permission.RECEIVE_PURCHASE_ORDER,
        Permission.CANCEL_PURCHASE_ORDER,
        Permission.MANAGE_INTEGRATIONS, Permission.VIEW_INTEGRATIONS,
        Permission.MANAGE_WORKFLOWS, Permission.VIEW_WORKFLOWS,
        Permission.VIEW_AUDIT_LOGS,
        # Sales - Customers
        Permission.CREATE_SALES_CUSTOMER, Permission.VIEW_SALES_CUSTOMER,
        # Sales - Customer Types
        Permission.CREATE_SALES_CUSTOMER_TYPE, Permission.VIEW_SALES_CUSTOMER_TYPE, Permission.MANAGE_SALES_CUSTOMER_TYPE,
        # Sales - Tests
        Permission.CREATE_SALES_TEST, Permission.VIEW_SALES_TEST, Permission.MANAGE_SALES_TEST,

        # Sales - Customer Types
        Permission.CREATE_SALES_CUSTOMER_TYPE, Permission.VIEW_SALES_CUSTOMER_TYPE, Permission.MANAGE_SALES_CUSTOMER_TYPE,
        # Sales - Customer Groups
        Permission.CREATE_SALES_CUSTOMER_GROUP, Permission.VIEW_SALES_CUSTOMER_GROUP, Permission.MANAGE_SALES_CUSTOMER_GROUP,

        # Sales - Test Trees
        Permission.CREATE_SALES_TEST_TREE, Permission.VIEW_SALES_TEST_TREE, Permission.MANAGE_SALES_TEST_TREE,

        # Sales - Test Basics
        Permission.CREATE_SALES_TEST_BASIC, Permission.VIEW_SALES_TEST_BASIC, Permission.MANAGE_SALES_TEST_BASIC,

        # Inventory - Goods Receipts
        Permission.CREATE_INVENTORY_GOODS_RECEIPT, Permission.VIEW_INVENTORY_GOODS_RECEIPT, Permission.MANAGE_INVENTORY_GOODS_RECEIPT,

        # Warehouse - Vehicles
        Permission.CREATE_WAREHOUSE_VEHICLE, Permission.VIEW_WAREHOUSE_VEHICLE, Permission.MANAGE_WAREHOUSE_VEHICLE,

        # Warehouse - Employees
        Permission.CREATE_WAREHOUSE_EMPLOYEE, Permission.VIEW_WAREHOUSE_EMPLOYEE, Permission.MANAGE_WAREHOUSE_EMPLOYEE,

        # Ticketing - Venues
        Permission.CREATE_TICKETING_VENUE, Permission.VIEW_TICKETING_VENUE, Permission.MANAGE_TICKETING_VENUE,

        # Ticketing - Organizers
        Permission.CREATE_TICKETING_ORGANIZER, Permission.VIEW_TICKETING_ORGANIZER, Permission.MANAGE_TICKETING_ORGANIZER,

        # Ticketing - Event Types
        Permission.CREATE_TICKETING_EVENT_TYPE, Permission.VIEW_TICKETING_EVENT_TYPE, Permission.MANAGE_TICKETING_EVENT_TYPE,

        # Ticketing - Shows
        Permission.CREATE_TICKETING_SHOW, Permission.VIEW_TICKETING_SHOW, Permission.MANAGE_TICKETING_SHOW,

        # Sales - Bookings
        Permission.CREATE_SALES_BOOKING, Permission.VIEW_SALES_BOOKING, Permission.MANAGE_SALES_BOOKING,

        # Ticketing - Events
        Permission.CREATE_TICKETING_EVENT, Permission.VIEW_TICKETING_EVENT, Permission.MANAGE_TICKETING_EVENT,

        # Ticketing - Venue Types
        Permission.CREATE_TICKETING_VENUE_TYPE, Permission.VIEW_TICKETING_VENUE_TYPE, Permission.MANAGE_TICKETING_VENUE_TYPE,

        #Sales - Employees
        Permission.CREATE_SALES_EMPLOYEE, Permission.VIEW_SALES_EMPLOYEE, Permission.MANAGE_SALES_EMPLOYEE,
        #Sales - Payments
        Permission.CREATE_SALES_PAYMENT, Permission.VIEW_SALES_PAYMENT, Permission.MANAGE_SALES_PAYMENT,
        #Sales - Orders
        Permission.CREATE_SALES_ORDER, Permission.VIEW_SALES_ORDER, Permission.MANAGE_SALES_ORDER,
        #Sales - Invoices
        Permission.CREATE_SALES_INVOICE, Permission.VIEW_SALES_INVOICE, Permission.MANAGE_SALES_INVOICE,
        #Sales - Quotes
        Permission.CREATE_SALES_QUOTE, Permission.VIEW_SALES_QUOTE, Permission.MANAGE_SALES_QUOTE,
        #Sales - Credits
        Permission.CREATE_SALES_CREDIT, Permission.VIEW_SALES_CREDIT, Permission.MANAGE_SALES_CREDIT,
        #Sales - Returns
        Permission.CREATE_SALES_RETURN, Permission.VIEW_SALES_RETURN, Permission.MANAGE_SALES_RETURN,
        #Sales - Refunds
        Permission.CREATE_SALES_REFUND, Permission.VIEW_SALES_REFUND, Permission.MANAGE_SALES_REFUND,
        #Sales - Discounts
        Permission.CREATE_SALES_DISCOUNT, Permission.VIEW_SALES_DISCOUNT, Permission.MANAGE_SALES_DISCOUNT,
        #Sales - Taxes
        Permission.CREATE_SALES_TAX, Permission.VIEW_SALES_TAX, Permission.MANAGE_SALES_TAX,
        #Sales - Shipments
        
        
    },
    UserRole.MANAGER: {
        # Manager can manage most resources
        Permission.CREATE_USER, Permission.READ_USER, Permission.UPDATE_USER,
        Permission.CREATE_PRODUCT, Permission.VIEW_PRODUCT, Permission.UPDATE_PRODUCT,
        Permission.CREATE_PURCHASE_ORDER, Permission.VIEW_PURCHASE_ORDER,
        Permission.APPROVE_PURCHASE_ORDER, Permission.RECEIVE_PURCHASE_ORDER,
        Permission.VIEW_INTEGRATIONS,
        Permission.VIEW_WORKFLOWS,
        Permission.VIEW_AUDIT_LOGS,
        # Sales - Customers
        Permission.CREATE_SALES_CUSTOMER, Permission.VIEW_SALES_CUSTOMER,
        # Sales - Customer Types
        Permission.VIEW_SALES_CUSTOMER_TYPE, Permission.MANAGE_SALES_CUSTOMER_TYPE,
    },
    UserRole.USER: {
        # Regular user can read some resources
        Permission.READ_USER,
        Permission.VIEW_PRODUCT,
        Permission.VIEW_PURCHASE_ORDER,
        # Sales - Customers
        Permission.VIEW_SALES_CUSTOMER,
        # Sales - Customer Types
        Permission.VIEW_SALES_CUSTOMER_TYPE,
    },
    UserRole.GUEST: {
        # Guest has no special permissions
    }
}


@dataclass(frozen=True)
class Role:
    """Role value object with permissions"""
    role: UserRole
    
    def __post_init__(self):
        if not isinstance(self.role, UserRole):
            raise ValueError(f"Invalid role: {self.role}")
    
    @property
    def value(self) -> str:
        """Get role value"""
        return self.role.value
    
    @property
    def permissions(self) -> Set[Permission]:
        """Get permissions for this role"""
        return ROLE_PERMISSIONS.get(self.role, set())
    
    def has_permission(self, permission: Permission) -> bool:
        """Check if role has specific permission"""
        return permission in self.permissions
    
    def has_any_permission(self, permissions: List[Permission]) -> bool:
        """Check if role has any of the specified permissions"""
        return any(perm in self.permissions for perm in permissions)
    
    def has_all_permissions(self, permissions: List[Permission]) -> bool:
        """Check if role has all of the specified permissions"""
        return all(perm in self.permissions for perm in permissions)
    
    def is_tenant_admin(self) -> bool:
        """Check if user is a tenant admin"""
        return self.role == UserRole.ADMIN
    
    def is_admin_level(self) -> bool:
        """Check if user has any admin privileges (tenant admin)"""
        return self.role == UserRole.ADMIN

