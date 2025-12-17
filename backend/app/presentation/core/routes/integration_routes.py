"""
Integration management API routes with authentication and authorization
"""
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.infrastructure.integrations.erp_integrations import IntegrationService
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.core.dependencies.auth_dependencies import (
    get_current_active_user,
    RequirePermission,
    RequireAnyPermission
)
from typing import List as TypingList


class IntegrationConfig(BaseModel):
    """Integration configuration schema"""
    type: str
    base_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    access_token: Optional[str] = None
    shop_domain: Optional[str] = None
    connection_string: Optional[str] = None
    client_id: Optional[str] = None
    api_version: Optional[str] = None


class IntegrationStatus(BaseModel):
    """Integration status schema"""
    name: str
    status: str
    connected: bool
    last_check: str


class SendMessageRequest(BaseModel):
    """Send message request schema"""
    integration_name: str
    message_type: str
    payload: Dict[str, Any]


router = APIRouter(prefix="/integrations", tags=["integrations"])


# Global integration service (in real app, this would be injected)
integration_service = IntegrationService()


@router.get("/status", response_model=Dict[str, IntegrationStatus])
async def get_integration_status(
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_INTEGRATIONS, Permission.MANAGE_INTEGRATIONS]))
):
    """Get status of all integrations (requires VIEW_INTEGRATIONS or MANAGE_INTEGRATIONS permission - Admin/Manager)"""
    try:
        health_results = await integration_service.health_check_all()
        status_results = {}
        
        for name, is_healthy in health_results.items():
            status_results[name] = IntegrationStatus(
                name=name,
                status="healthy" if is_healthy else "unhealthy",
                connected=is_healthy,
                last_check="2024-01-01T00:00:00Z"  # In real app, track actual timestamps
            )
        
        return status_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check integration status: {str(e)}")


@router.post("/configure")
async def configure_integrations(
    configs: Dict[str, IntegrationConfig],
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Configure integrations (requires MANAGE_INTEGRATIONS permission - Admin only)"""
    try:
        # Convert Pydantic models to dict
        config_dict = {}
        for name, config in configs.items():
            config_dict[name] = {
                "type": config.type,
                "base_url": config.base_url,
                "username": config.username,
                "password": config.password,
                "access_token": config.access_token,
                "shop_domain": config.shop_domain,
                "connection_string": config.connection_string,
                "client_id": config.client_id,
                "api_version": config.api_version
            }
        
        await integration_service.register_integrations(config_dict)
        
        return {"message": "Integrations configured successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to configure integrations: {str(e)}")


@router.post("/send-message")
async def send_message(
    request: SendMessageRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Send message to integration (requires MANAGE_INTEGRATIONS permission - Admin only)"""
    try:
        success = await integration_service.send_to_integration(
            integration_name=request.integration_name,
            message_type=request.message_type,
            payload=request.payload
        )
        
        if success:
            return {"message": "Message sent successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to send message")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.post("/test-connection/{integration_name}")
async def test_connection(
    integration_name: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_INTEGRATIONS, Permission.MANAGE_INTEGRATIONS]))
):
    """Test connection to specific integration (requires VIEW_INTEGRATIONS or MANAGE_INTEGRATIONS permission - Admin/Manager)"""
    try:
        health_results = await integration_service.health_check_all()
        is_healthy = health_results.get(integration_name, False)
        
        if is_healthy:
            return {"message": f"Connection to {integration_name} is healthy"}
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Connection to {integration_name} is unhealthy"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test connection: {str(e)}")


@router.post("/shutdown")
async def shutdown_integrations(
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_INTEGRATIONS))
):
    """Shutdown all integrations (requires MANAGE_INTEGRATIONS permission - Admin only)"""
    try:
        await integration_service.shutdown()
        return {"message": "All integrations shut down successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to shutdown integrations: {str(e)}")
