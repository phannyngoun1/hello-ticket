"""Customer presenter for Sales API"""
from app.domain.sales.customer import Customer
from app.presentation.api.sales.schemas import CustomerResponse
from app.presentation.api.shared.presenter import BasePresenter


class CustomerPresenter(BasePresenter[Customer, CustomerResponse]):
    """Presenter for converting Customer domain entities to API responses"""

    def to_response(self, customer: Customer) ->CustomerResponse:
        return CustomerResponse(
            id=customer.id,
            tenant_id=customer.tenant_id,
            code=customer.code,
            name=customer.name,
            email=customer.contact_info.email if customer.contact_info else None,
            phone=customer.contact_info.phone if customer.contact_info else None,
            business_name=customer.business_name,
            street_address=customer.address.street_address if customer.address else None,
            city=customer.address.city if customer.address else None,
            state_province=customer.address.state_province if customer.address else None,
            postal_code=customer.address.postal_code if customer.address else None,
            country=customer.address.country if customer.address else None,
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
            status_reason=customer.status_reason,
            notes=customer.notes,
            public_notes=customer.public_notes,
            is_active=customer.is_active,
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            deactivated_at=customer.deactivated_at,
        )
