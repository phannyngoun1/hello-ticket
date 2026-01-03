"""Handlers for customer commands and queries."""
import logging

from app.application.sales.commands import (
    CreateCustomerCommand,
    UpdateCustomerCommand,
    DeleteCustomerCommand
)
from app.application.sales.queries import (
    GetCustomerByIdQuery,
    GetCustomerByCodeQuery,
    SearchCustomersQuery
)
from app.domain.sales.repositories import CustomerRepository, CustomerSearchResult
from app.domain.sales.customer import Customer
from app.domain.shared.tag_repository import TagLinkRepository
from app.shared.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.shared.tenant_context import require_tenant_context

logger = logging.getLogger(__name__)

class CustomerCommandHandler:
    """Handles customer master data commands."""

    def __init__(
        self,
        customer_repository: CustomerRepository,
        tag_link_repository: TagLinkRepository,
    ):
        self._customer_repository = customer_repository
        self._tag_link_repository = tag_link_repository

    async def handle_create_customer(self, command: CreateCustomerCommand) -> Customer:
        tenant_id = require_tenant_context()

        if not command.name or not command.name.strip():
            raise ValidationError("Name is required")
        
        # Auto-generate code
        code = await self._customer_repository.generate_next_code(tenant_id)

        customer = Customer(
            tenant_id=tenant_id,
            code=code,
            name=command.name,
            email=command.email,
            phone=command.phone,
            business_name=command.business_name,
            street_address=command.street_address,
            city=command.city,
            state_province=command.state_province,
            postal_code=command.postal_code,
            country=command.country,
            date_of_birth=command.date_of_birth,
            gender=command.gender,
            nationality=command.nationality,
            id_number=command.id_number,
            id_type=command.id_type,
            event_preferences=command.event_preferences,
            seating_preferences=command.seating_preferences,
            accessibility_needs=command.accessibility_needs,
            dietary_restrictions=command.dietary_restrictions,
            emergency_contact_name=command.emergency_contact_name,
            emergency_contact_phone=command.emergency_contact_phone,
            emergency_contact_relationship=command.emergency_contact_relationship,
            preferred_language=command.preferred_language,
            marketing_opt_in=command.marketing_opt_in,
            email_marketing=command.email_marketing,
            sms_marketing=command.sms_marketing,
            facebook_url=command.facebook_url,
            twitter_handle=command.twitter_handle,
            linkedin_url=command.linkedin_url,
            instagram_handle=command.instagram_handle,
            website=command.website,
            tags=[],  # Tags are now managed via TagLink, not stored in customer
            priority=command.priority,
            notes=command.notes,
            public_notes=command.public_notes,
        )

        saved = await self._customer_repository.save(customer)
        
        # Set tags via TagLink (always set, even if empty list to clear existing tags)
        if command.tag_ids is not None:
            try:
                await self._tag_link_repository.set_tags_for_entity(
                    tenant_id=tenant_id,
                    entity_type="customer",
                    entity_id=saved.id,
                    tag_ids=command.tag_ids,
                )
                logger.info("Set %d tags for customer %s", len(command.tag_ids), saved.id)
            except Exception as e:
                logger.error("Failed to set tags for customer %s: %s", saved.id, str(e))
                # Don't fail customer creation if tag setting fails
                # Tags can be set later via tag management
        
        logger.info("Created customer %s with code %s for tenant=%s", saved.id, saved.code, tenant_id)
        return saved

    async def handle_update_customer(self, command: UpdateCustomerCommand) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._get_customer_or_raise(tenant_id, command.customer_id)

        # Handle status change using domain methods
        if command.status is not None:
            if command.status.lower() == "active":
                customer.activate()
            elif command.status.lower() == "inactive":
                customer.deactivate()
            else:
                raise ValidationError(f"Invalid status: {command.status}. Must be 'active' or 'inactive'")

        customer.update_details(
            name=command.name,
            email=command.email,
            phone=command.phone,
            business_name=command.business_name,
            street_address=command.street_address,
            city=command.city,
            state_province=command.state_province,
            postal_code=command.postal_code,
            country=command.country,
            date_of_birth=command.date_of_birth,
            gender=command.gender,
            nationality=command.nationality,
            id_number=command.id_number,
            id_type=command.id_type,
            event_preferences=command.event_preferences,
            seating_preferences=command.seating_preferences,
            accessibility_needs=command.accessibility_needs,
            dietary_restrictions=command.dietary_restrictions,
            emergency_contact_name=command.emergency_contact_name,
            emergency_contact_phone=command.emergency_contact_phone,
            emergency_contact_relationship=command.emergency_contact_relationship,
            preferred_language=command.preferred_language,
            marketing_opt_in=command.marketing_opt_in,
            email_marketing=command.email_marketing,
            sms_marketing=command.sms_marketing,
            facebook_url=command.facebook_url,
            twitter_handle=command.twitter_handle,
            linkedin_url=command.linkedin_url,
            instagram_handle=command.instagram_handle,
            website=command.website,
            tags=None,  # Tags are now managed via TagLink, not stored in customer
            priority=command.priority,
            status_reason=command.status_reason,
            notes=command.notes,
            public_notes=command.public_notes,
        )

        saved = await self._customer_repository.save(customer)
        
        # Set tags via TagLink (only if explicitly provided, None means don't change tags)
        if command.tag_ids is not None:
            try:
                await self._tag_link_repository.set_tags_for_entity(
                    tenant_id=tenant_id,
                    entity_type="customer",
                    entity_id=saved.id,
                    tag_ids=command.tag_ids,
                )
                logger.info("Set %d tags for customer %s", len(command.tag_ids), saved.id)
            except Exception as e:
                logger.error("Failed to set tags for customer %s: %s", saved.id, str(e))
                # Don't fail customer update if tag setting fails
                # Tags can be set later via tag management
        
        logger.info("Updated customer %s for tenant=%s", saved.id, tenant_id)
        return saved

    async def handle_delete_customer(self, command: DeleteCustomerCommand) -> bool:
        tenant_id = require_tenant_context()
        deleted = await self._customer_repository.delete(tenant_id, command.customer_id)

        if not deleted:
            raise NotFoundError(f"Customer {command.customer_id} not found")

        logger.info("Deleted customer %s for tenant=%s", command.customer_id, tenant_id)
        return True

    async def _get_customer_or_raise(self, tenant_id: str, customer_id: str) -> Customer:
        if not customer_id or not customer_id.strip():
            raise ValidationError("Customer identifier is required")

        customer = await self._customer_repository.get_by_id(tenant_id, customer_id)
        if not customer:
            raise NotFoundError(f"Customer " + str(customer_id) + " not found")
        return customer

class CustomerQueryHandler:
    """Handles customer queries."""

    def __init__(self, customer_repository: CustomerRepository):
        self._customer_repository = customer_repository

    async def handle_get_customer_by_id(self, query: GetCustomerByIdQuery) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._customer_repository.get_by_id(tenant_id, query.customer_id)
        if not customer:
            raise NotFoundError(f"Customer {query.customer_id} not found")
        return customer

    async def handle_get_customer_by_code(self, query: GetCustomerByCodeQuery) -> Customer:
        tenant_id = require_tenant_context()
        customer = await self._customer_repository.get_by_code(tenant_id, query.code)
        if not customer:
            raise NotFoundError(f"Customer code {query.code} not found")
        return customer

    async def handle_search_customers(self, query: SearchCustomersQuery) -> CustomerSearchResult:
        tenant_id = require_tenant_context()

        if query.limit <= 0 or query.limit > 200:
            raise ValidationError("Limit must be between 1 and 200")
        if query.skip < 0:
            raise ValidationError("Skip must be zero or greater")

        return await self._customer_repository.search(
            tenant_id=tenant_id,
            search=query.search,
            is_active=query.is_active,
            skip=query.skip,
            limit=query.limit,
        )
