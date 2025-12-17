"""
{{EntityName}} mapper - handles conversion between domain entities and database models
"""
from typing import Optional
from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}
from app.infrastructure.shared.database.models import {{EntityName}}Model


class {{EntityName}}Mapper:
    """Mapper for {{EntityName}} entity to {{EntityName}}Model conversion"""
    
    @staticmethod
    def to_domain(model: {{EntityName}}Model) -> {{EntityName}}:
        """Convert database model to domain entity
        
        Args:
            model: {{EntityName}}Model from database
            
        Returns:
            {{EntityName}} domain entity
        """
        return {{EntityName}}(
            tenant_id=model.tenant_id,
            code=model.code,
            name=model.name,
            {{EntityNameLower}}_id=model.id,
{{MapperToDomainFields}}            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
        )
    
    @staticmethod
    def to_model({{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}Model:
        """Convert domain entity to database model
        
        Args:
            {{EntityNameLower}}: {{EntityName}} domain entity
            
        Returns:
            {{EntityName}}Model for database persistence
        """
        return {{EntityName}}Model(
            id={{EntityNameLower}}.id,
            tenant_id={{EntityNameLower}}.tenant_id,
            code={{EntityNameLower}}.code,
            name={{EntityNameLower}}.name,
{{MapperToModelFields}}            is_active={{EntityNameLower}}.is_active,
            version={{EntityNameLower}}.get_version(),
            created_at={{EntityNameLower}}.created_at,
            updated_at={{EntityNameLower}}.updated_at,
        )

