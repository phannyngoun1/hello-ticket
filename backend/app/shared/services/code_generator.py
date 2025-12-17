"""Generic code generation service for document codes

Author: Phanny
"""
from typing import Optional

from app.domain.shared.repositories import SequenceRepository
from app.shared.tenant_context import require_tenant_context


class CodeGeneratorService:
    """Service for generating document codes using sequences"""

    def __init__(self, sequence_repository: SequenceRepository):
        self._sequence_repository = sequence_repository

    async def generate_code(
        self,
        sequence_type: str,
        prefix: Optional[str] = None,
        digits: Optional[int] = None,
        description: Optional[str] = None,
    ) -> str:
        """
        Generate the next code for a sequence type
        
        Args:
            sequence_type: Type of sequence (e.g., "PO", "SO", "WO", "GR", "IT")
            prefix: Optional prefix override (e.g., "PO-"). If not provided, uses existing or default
            digits: Optional digits override. If not provided, uses existing or default (6)
            description: Optional description for new sequences
        
        Returns:
            Generated code string (e.g., "PO-000001")
        """
        tenant_id = require_tenant_context()
        
        # Get or create sequence
        sequence = await self._sequence_repository.get_or_create(
            tenant_id=tenant_id,
            sequence_type=sequence_type,
            prefix=prefix or "",
            digits=digits or 6,
            description=description,
        )
        
        # Update config if overrides provided
        if prefix is not None or digits is not None:
            sequence.update_config(prefix=prefix, digits=digits)
            sequence = await self._sequence_repository.save(sequence)
        
        # Get next value (thread-safe)
        return await self._sequence_repository.get_next_value(
            tenant_id=tenant_id,
            sequence_type=sequence_type,
            prefix=sequence.prefix,
            digits=sequence.digits,
        )

    async def get_current_value(
        self, sequence_type: str
    ) -> Optional[int]:
        """Get the current sequence value without incrementing"""
        tenant_id = require_tenant_context()
        sequence = await self._sequence_repository.get_by_type(
            tenant_id, sequence_type
        )
        return sequence.current_value if sequence else None

    async def reset_sequence(
        self, sequence_type: str, new_value: int = 0
    ) -> None:
        """Reset a sequence to a new value"""
        tenant_id = require_tenant_context()
        sequence = await self._sequence_repository.get_by_type(
            tenant_id, sequence_type
        )
        if not sequence:
            raise ValueError(f"Sequence {sequence_type} not found")
        sequence.reset(new_value)
        await self._sequence_repository.save(sequence)

