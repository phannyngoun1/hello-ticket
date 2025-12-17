"""
Container registrations package initialization.

This package provides modular container and mediator registration functions
organized by domain module.
"""

__all__ = [
    "register_user_container",
    "register_user_mediator",
    "register_auth_container",
    "register_session_container",
    "register_audit_container",
    "register_inventory_container",
    "register_inventory_mediator",
    "register_customer_container",
    "register_customer_mediator",
    "register_customer_type_container",
    "register_customer_type_mediator",
    "register_code_generator_container",
]
