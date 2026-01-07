"""
Customer mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.sales.customer import Customer
from app.infrastructure.shared.database.models import CustomerModel
from app.domain.shared.tag_repository import TagLinkRepository


class CustomerMapper:
    """Mapper for Customer entity to CustomerModel conversion"""
    
    def __init__(self, tag_link_repository: Optional[TagLinkRepository] = None):
        self._tag_link_repository = tag_link_repository
    
    def to_domain(self, model: CustomerModel, tenant_id: Optional[str] = None) -> Customer:
        """Convert database model to domain entity
        
        Args:
            model: CustomerModel from database
            
        Returns:
            Customer domain entity
        """
        return Customer(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            customer_id=model.id,
            email=model.email,
            phone=model.phone,
            business_name=model.business_name,
            street_address=model.street_address,
            city=model.city,
            state_province=model.state_province,
            postal_code=model.postal_code,
            country=model.country,
            date_of_birth=model.date_of_birth,
            gender=model.gender,
            nationality=model.nationality,
            id_number=model.id_number,
            id_type=model.id_type,
            account_manager_id=model.account_manager_id,
            sales_representative_id=model.sales_representative_id,
            customer_since=model.customer_since,
            last_purchase_date=model.last_purchase_date,
            total_purchase_amount=model.total_purchase_amount,
            last_contact_date=model.last_contact_date,
            event_preferences=model.event_preferences,
            seating_preferences=model.seating_preferences,
            accessibility_needs=model.accessibility_needs,
            dietary_restrictions=model.dietary_restrictions,
            emergency_contact_name=model.emergency_contact_name,
            emergency_contact_phone=model.emergency_contact_phone,
            emergency_contact_relationship=model.emergency_contact_relationship,
            preferred_language=model.preferred_language,
            marketing_opt_in=model.marketing_opt_in,
            email_marketing=model.email_marketing,
            sms_marketing=model.sms_marketing,
            facebook_url=model.facebook_url,
            twitter_handle=model.twitter_handle,
            linkedin_url=model.linkedin_url,
            instagram_handle=model.instagram_handle,
            website=model.website,
            tags=[],  # Tags will be loaded from TagLinkRepository if available
            status_reason=model.status_reason,
            notes=model.notes,
            public_notes=model.public_notes,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deactivated_at=model.deactivated_at,
            version=model.version,
        )
    
    def to_model(self, customer: Customer) -> CustomerModel:
        """Convert domain entity to database model
        
        Args:
            customer: Customer domain entity
            
        Returns:
            CustomerModel for database persistence
        """
        return CustomerModel(
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
            # Tags are now managed via TagLink table, not stored in customer table
            status_reason=customer.status_reason,
            notes=customer.notes,
            public_notes=customer.public_notes,
            is_active=customer.is_active,
            version=customer.get_version(),
            created_at=customer.created_at,
            updated_at=customer.updated_at,
            deactivated_at=customer.deactivated_at,
        )

