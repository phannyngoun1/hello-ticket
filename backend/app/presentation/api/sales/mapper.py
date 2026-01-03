"""API mapper for sales module"""
from app.domain.sales.customer import Customer
from app.presentation.api.sales.schemas import CustomerResponse


class SalesApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def customer_to_response(customer: Customer) -> CustomerResponse:
        return CustomerResponse(
            id=customer.id,
            tenant_id=customer.tenant_id,
            code=customer.code,
            name=customer.name,
            email=customer.email,
            phone=customer.phone,
            business_name=customer.business_name,
            street_address=customer.street_address,
            city=customer.city,
            state_province=customer.state_province,
            postal_code=customer.postal_code,
            country=customer.country,
            date_of_birth=customer.date_of_birth,
            gender=customer.gender,
            nationality=customer.nationality,
            id_number=customer.id_number,
            id_type=customer.id_type,
            account_manager_id=customer.account_manager_id,
            sales_representative_id=customer.sales_representative_id,
            customer_since=customer.customer_since,
            last_purchase_date=customer.last_purchase_date,
            total_purchase_amount=customer.total_purchase_amount,
            last_contact_date=customer.last_contact_date,
            event_preferences=customer.event_preferences,
            seating_preferences=customer.seating_preferences,
            accessibility_needs=customer.accessibility_needs,
            dietary_restrictions=customer.dietary_restrictions,
            emergency_contact_name=customer.emergency_contact_name,
            emergency_contact_phone=customer.emergency_contact_phone,
            emergency_contact_relationship=customer.emergency_contact_relationship,
            preferred_language=customer.preferred_language,
            marketing_opt_in=customer.marketing_opt_in,
            email_marketing=customer.email_marketing,
            sms_marketing=customer.sms_marketing,
            facebook_url=customer.facebook_url,
            twitter_handle=customer.twitter_handle,
            linkedin_url=customer.linkedin_url,
            instagram_handle=customer.instagram_handle,
            website=customer.website,
            tags=customer.tags or [],
            priority=customer.priority,
            status_reason=customer.status_reason,
            notes=customer.notes,
            public_notes=customer.public_notes,
            is_active=customer.is_active,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            deactivated_at=customer.deactivated_at,
        )
