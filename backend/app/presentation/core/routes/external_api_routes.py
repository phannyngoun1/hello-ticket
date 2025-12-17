"""
External API routes for system-to-system integration with API key authentication
These endpoints are designed for external systems to integrate with our platform
"""
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Security
from app.presentation.api.core.external_schemas import (
    ExternalWebhookPayload,
    ExternalAPIResponse,
)
from app.presentation.core.dependencies.api_key_dependencies import (
    get_api_key,
    RequireAPIKeyPermission,
    RequireAnyAPIKeyPermission,
)
from app.presentation.shared.dependencies import get_mediator_dependency
from app.infrastructure.shared.security.api_key_handler import APIKey
from app.shared.mediator import Mediator
from app.shared.exceptions import NotFoundError, BusinessRuleError, ValidationError
from app.infrastructure.integrations.erp_integrations import IntegrationService


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/external", tags=["External API"])


@router.get("/health", response_model=ExternalAPIResponse)
async def health_check(
    api_key: APIKey = Security(get_api_key)
):
    """Health check endpoint for external systems (requires valid API key)"""
    return ExternalAPIResponse(
        success=True,
        message="External API is healthy",
        data={
            "api_key_name": api_key.name,
            "api_key_id": api_key.key_id,
            "permissions": api_key.permissions
        }
    )


@router.post("/webhook", response_model=ExternalAPIResponse)
async def receive_webhook(
    payload: ExternalWebhookPayload,
    api_key: APIKey = Security(get_api_key)
):
    """Receive webhook from external systems (requires valid API key)
    
    This endpoint allows external systems to send event notifications to our platform.
    Common use cases: order status updates, inventory changes, payment confirmations.
    """
    try:
        # Process webhook based on event type
        event_type = payload.event_type
        event_data = payload.data
        
        # Log the webhook event
        logger.info(f"Received webhook from {api_key.name}: {event_type}")
        logger.info(f"Event data: {event_data}")
        
        # Here you would typically:
        # 1. Validate the webhook signature
        # 2. Process the event based on event_type
        # 3. Update relevant data in your system
        # 4. Trigger any necessary workflows
        
        # For now, we'll just acknowledge receipt
        return ExternalAPIResponse(
            success=True,
            message=f"Webhook event '{event_type}' received and queued for processing",
            data={
                "event_id": payload.event_id,
                "event_type": event_type,
                "processed_at": payload.timestamp.isoformat()
            }
        )
    except Exception as e:
        return ExternalAPIResponse(
            success=False,
            message="Webhook processing failed",
            error=str(e)
        )


@router.post("/integrations/push", response_model=ExternalAPIResponse)
async def push_to_integration(
    integration_name: str,
    message_type: str,
    payload: Dict[str, Any],
    api_key: APIKey = Depends(RequireAPIKeyPermission("integrations:write"))
):
    """Push data to a configured integration (requires integrations:write permission)
    
    This endpoint allows external systems to trigger outbound integrations.
    For example, sending data to SAP, Oracle, Salesforce, etc.
    """
    try:
        integration_service = IntegrationService()
        
        success = await integration_service.send_to_integration(
            integration_name=integration_name,
            message_type=message_type,
            payload=payload
        )
        
        if success:
            return ExternalAPIResponse(
                success=True,
                message=f"Message sent to {integration_name} successfully",
                data={
                    "integration": integration_name,
                    "message_type": message_type
                }
            )
        else:
            return ExternalAPIResponse(
                success=False,
                message=f"Failed to send message to {integration_name}",
                error="INTEGRATION_SEND_FAILED"
            )
    except Exception as e:
        return ExternalAPIResponse(
            success=False,
            message="Integration push failed",
            error=str(e)
        )

