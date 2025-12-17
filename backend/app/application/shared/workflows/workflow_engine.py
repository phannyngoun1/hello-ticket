"""
Workflow engine for business processes
"""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Type, TypeVar
from dataclasses import dataclass, field
from datetime import datetime, timezone
from app.shared.utils import generate_id

T = TypeVar('T')


class WorkflowStatus(Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class StepStatus(Enum):
    """Individual step status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class WorkflowContext:
    """Context for workflow execution"""
    workflow_id: str
    data: Dict[str, Any] = field(default_factory=dict)
    variables: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class WorkflowStep:
    """Individual workflow step"""
    step_id: str
    name: str
    handler_class: Type['WorkflowStepHandler']
    status: StepStatus = StepStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    dependencies: List[str] = field(default_factory=list)


class WorkflowStepHandler(ABC):
    """Base class for workflow step handlers"""
    
    @abstractmethod
    async def execute(self, context: WorkflowContext, **kwargs) -> Dict[str, Any]:
        """Execute the workflow step"""
        pass
    
    @abstractmethod
    async def rollback(self, context: WorkflowContext, **kwargs) -> None:
        """Rollback the workflow step"""
        pass


class WorkflowDefinition:
    """Workflow definition with steps and execution logic"""
    
    def __init__(self, workflow_id: str, name: str):
        self.workflow_id = workflow_id
        self.name = name
        self.steps: List[WorkflowStep] = []
        self.start_step: Optional[str] = None
        self.end_step: Optional[str] = None
    
    def add_step(
        self,
        step_id: str,
        name: str,
        handler_class: Type[WorkflowStepHandler],
        dependencies: Optional[List[str]] = None,
        max_retries: int = 3
    ) -> 'WorkflowDefinition':
        """Add a step to the workflow"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            handler_class=handler_class,
            dependencies=dependencies or [],
            max_retries=max_retries
        )
        self.steps.append(step)
        return self
    
    def set_start_step(self, step_id: str) -> 'WorkflowDefinition':
        """Set the starting step"""
        self.start_step = step_id
        return self
    
    def set_end_step(self, step_id: str) -> 'WorkflowDefinition':
        """Set the ending step"""
        self.end_step = step_id
        return self


class WorkflowInstance:
    """Running instance of a workflow"""
    
    def __init__(self, definition: WorkflowDefinition, context: WorkflowContext):
        self.definition = definition
        self.context = context
        self.status = WorkflowStatus.PENDING
        self.current_step: Optional[str] = None
        self.completed_steps: List[str] = []
        self.failed_steps: List[str] = []
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.error_message: Optional[str] = None
    
    def get_step(self, step_id: str) -> Optional[WorkflowStep]:
        """Get step by ID"""
        return next((step for step in self.definition.steps if step.step_id == step_id), None)
    
    def get_ready_steps(self) -> List[WorkflowStep]:
        """Get steps that are ready to execute"""
        ready_steps = []
        for step in self.definition.steps:
            if step.status == StepStatus.PENDING:
                # Check if all dependencies are completed
                dependencies_met = all(
                    dep_id in self.completed_steps for dep_id in step.dependencies
                )
                if dependencies_met:
                    ready_steps.append(step)
        return ready_steps


class WorkflowEngine:
    """Workflow execution engine"""
    
    def __init__(self):
        self.definitions: Dict[str, WorkflowDefinition] = {}
        self.instances: Dict[str, WorkflowInstance] = {}
    
    def register_workflow(self, definition: WorkflowDefinition) -> None:
        """Register a workflow definition"""
        self.definitions[definition.workflow_id] = definition
    
    async def start_workflow(
        self,
        workflow_id: str,
        initial_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Start a new workflow instance"""
        if workflow_id not in self.definitions:
            from app.shared.exceptions import NotFoundError
            raise NotFoundError(f"Workflow {workflow_id} not found")
        
        definition = self.definitions[workflow_id]
        instance_id = generate_id()
        
        context = WorkflowContext(
            workflow_id=workflow_id,
            data=initial_data or {}
        )
        
        instance = WorkflowInstance(definition, context)
        instance.status = WorkflowStatus.RUNNING
        instance.started_at = datetime.now(timezone.utc)
        instance.current_step = definition.start_step
        
        self.instances[instance_id] = instance
        
        # Start execution
        await self._execute_workflow(instance_id)
        
        return instance_id
    
    async def _execute_workflow(self, instance_id: str) -> None:
        """Execute workflow steps"""
        instance = self.instances[instance_id]
        
        try:
            while instance.status == WorkflowStatus.RUNNING:
                ready_steps = instance.get_ready_steps()
                
                if not ready_steps:
                    # Check if workflow is complete
                    if instance.current_step == instance.definition.end_step:
                        instance.status = WorkflowStatus.COMPLETED
                        instance.completed_at = datetime.now(timezone.utc)
                        break
                    else:
                        # No ready steps and not at end - this might be an error
                        instance.status = WorkflowStatus.FAILED
                        instance.error_message = "No ready steps available"
                        break
                
                # Execute ready steps (can be parallel in real implementation)
                for step in ready_steps:
                    await self._execute_step(instance, step)
                
                # Check if any step failed
                if instance.failed_steps:
                    instance.status = WorkflowStatus.FAILED
                    break
        
        except Exception as e:
            instance.status = WorkflowStatus.FAILED
            instance.error_message = str(e)
    
    async def _execute_step(self, instance: WorkflowInstance, step: WorkflowStep) -> None:
        """Execute a single workflow step"""
        try:
            step.status = StepStatus.RUNNING
            step.started_at = datetime.now(timezone.utc)
            
            # Create handler instance
            handler = step.handler_class()
            
            # Execute step
            result = await handler.execute(instance.context)
            
            # Update context with result
            instance.context.data.update(result)
            instance.context.updated_at = datetime.now(timezone.utc)
            
            # Mark step as completed
            step.status = StepStatus.COMPLETED
            step.completed_at = datetime.now(timezone.utc)
            instance.completed_steps.append(step.step_id)
            
            # Update current step
            if step.step_id == instance.current_step:
                instance.current_step = None  # Will be determined by next ready step
        
        except Exception as e:
            step.status = StepStatus.FAILED
            step.error_message = str(e)
            instance.failed_steps.append(step.step_id)
            
            # Retry logic
            if step.retry_count < step.max_retries:
                step.retry_count += 1
                step.status = StepStatus.PENDING
                # Reset error message for retry
                step.error_message = None
            else:
                # Max retries exceeded
                instance.status = WorkflowStatus.FAILED
                instance.error_message = f"Step {step.name} failed after {step.max_retries} retries"
    
    def get_instance(self, instance_id: str) -> Optional[WorkflowInstance]:
        """Get workflow instance by ID"""
        return self.instances.get(instance_id)
    
    async def cancel_workflow(self, instance_id: str) -> bool:
        """Cancel a running workflow"""
        instance = self.instances.get(instance_id)
        if not instance:
            return False
        
        if instance.status == WorkflowStatus.RUNNING:
            instance.status = WorkflowStatus.CANCELLED
            instance.completed_at = datetime.now(timezone.utc)
            
            # Rollback completed steps (in reverse order)
            for step_id in reversed(instance.completed_steps):
                step = instance.get_step(step_id)
                if step:
                    try:
                        handler = step.handler_class()
                        await handler.rollback(instance.context)
                    except Exception as e:
                        # Log rollback error but continue
                        print(f"Rollback error for step {step_id}: {e}")
        
        return True
