"""
Workflow management API routes with authentication and authorization
"""
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.application.shared.workflows.workflow_engine import (
    WorkflowEngine,
    WorkflowInstance,
    WorkflowStatus
)
from app.domain.shared.authenticated_user import AuthenticatedUser
from app.domain.shared.value_objects.role import Permission
from app.presentation.core.dependencies.auth_dependencies import (
    get_current_active_user,
    RequirePermission,
    RequireAnyPermission
)
from typing import List as TypingList


class WorkflowStartRequest(BaseModel):
    """Workflow start request schema"""
    workflow_id: str
    initial_data: Optional[Dict[str, Any]] = None


class WorkflowStatusResponse(BaseModel):
    """Workflow status response schema"""
    instance_id: str
    workflow_id: str
    status: str
    current_step: Optional[str]
    completed_steps: List[str]
    failed_steps: List[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str]


class WorkflowDefinitionResponse(BaseModel):
    """Workflow definition response schema"""
    workflow_id: str
    name: str
    steps: List[Dict[str, Any]]


router = APIRouter(prefix="/workflows", tags=["workflows"])


# Global workflow engine (in real app, this would be injected)
workflow_engine = WorkflowEngine()


# Initialize with workflows
# TODO: Register workflows here as needed


@router.get("/definitions", response_model=List[WorkflowDefinitionResponse])
async def get_workflow_definitions(
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_WORKFLOWS, Permission.MANAGE_WORKFLOWS]))
):
    """Get all workflow definitions (requires VIEW_WORKFLOWS or MANAGE_WORKFLOWS permission - Admin/Manager)"""
    try:
        definitions = []
        for workflow_id, definition in workflow_engine.definitions.items():
            steps = []
            for step in definition.steps:
                steps.append({
                    "step_id": step.step_id,
                    "name": step.name,
                    "dependencies": step.dependencies,
                    "max_retries": step.max_retries
                })
            
            definitions.append(WorkflowDefinitionResponse(
                workflow_id=workflow_id,
                name=definition.name,
                steps=steps
            ))
        
        return definitions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow definitions: {str(e)}")


@router.post("/start", response_model=Dict[str, str])
async def start_workflow(
    request: WorkflowStartRequest,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_WORKFLOWS))
):
    """Start a new workflow instance (requires MANAGE_WORKFLOWS permission - Admin only)"""
    try:
        instance_id = await workflow_engine.start_workflow(
            workflow_id=request.workflow_id,
            initial_data=request.initial_data
        )
        
        return {
            "message": "Workflow started successfully",
            "instance_id": instance_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start workflow: {str(e)}")


@router.get("/instances/{instance_id}", response_model=WorkflowStatusResponse)
async def get_workflow_instance(
    instance_id: str,
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_WORKFLOWS, Permission.MANAGE_WORKFLOWS]))
):
    """Get workflow instance status (requires VIEW_WORKFLOWS or MANAGE_WORKFLOWS permission - Admin/Manager)"""
    try:
        instance = workflow_engine.get_instance(instance_id)
        if not instance:
            raise HTTPException(status_code=404, detail="Workflow instance not found")
        
        return WorkflowStatusResponse(
            instance_id=instance_id,
            workflow_id=instance.definition.workflow_id,
            status=instance.status.value,
            current_step=instance.current_step,
            completed_steps=instance.completed_steps,
            failed_steps=instance.failed_steps,
            started_at=instance.started_at.isoformat() if instance.started_at else None,
            completed_at=instance.completed_at.isoformat() if instance.completed_at else None,
            error_message=instance.error_message
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow instance: {str(e)}")


@router.get("/instances", response_model=List[WorkflowStatusResponse])
async def get_workflow_instances(
    workflow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    current_user: AuthenticatedUser = Depends(RequireAnyPermission([Permission.VIEW_WORKFLOWS, Permission.MANAGE_WORKFLOWS]))
):
    """Get workflow instances with filters (requires VIEW_WORKFLOWS or MANAGE_WORKFLOWS permission - Admin/Manager)"""
    try:
        instances = []
        count = 0
        
        for instance_id, instance in workflow_engine.instances.items():
            if count >= limit:
                break
            
            # Apply filters
            if workflow_id and instance.definition.workflow_id != workflow_id:
                continue
            
            if status and instance.status.value != status:
                continue
            
            instances.append(WorkflowStatusResponse(
                instance_id=instance_id,
                workflow_id=instance.definition.workflow_id,
                status=instance.status.value,
                current_step=instance.current_step,
                completed_steps=instance.completed_steps,
                failed_steps=instance.failed_steps,
                started_at=instance.started_at.isoformat() if instance.started_at else None,
                completed_at=instance.completed_at.isoformat() if instance.completed_at else None,
                error_message=instance.error_message
            ))
            
            count += 1
        
        return instances
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow instances: {str(e)}")


@router.post("/instances/{instance_id}/cancel")
async def cancel_workflow(
    instance_id: str,
    current_user: AuthenticatedUser = Depends(RequirePermission(Permission.MANAGE_WORKFLOWS))
):
    """Cancel a running workflow (requires MANAGE_WORKFLOWS permission - Admin only)"""
    try:
        success = await workflow_engine.cancel_workflow(instance_id)
        
        if success:
            return {"message": "Workflow cancelled successfully"}
        else:
            raise HTTPException(status_code=404, detail="Workflow instance not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel workflow: {str(e)}")


