"""API mapper for {{ModuleName}} module"""
from typing import List
from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}
from app.presentation.api.{{moduleName}}.schemas_{{EntityNameLower}} import (
    {{EntityName}}Response,
    {{EntityName}}TreeResponse,
)


class {{ModuleNameCapitalized}}ApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def {{EntityNameLower}}_to_response({{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}Response:
        return {{EntityName}}Response(
            id={{EntityNameLower}}.id,
            tenant_id={{EntityNameLower}}.tenant_id,
            code={{EntityNameLower}}.code,
            name={{EntityNameLower}}.name,
            parent_{{EntityNameLower}}_id={{EntityNameLower}}.parent_{{EntityNameLower}}_id,
            level={{EntityNameLower}}.level,
            sort_order={{EntityNameLower}}.sort_order,
{{MapperFields}}
            is_active={{EntityNameLower}}.is_active,
            created_at={{EntityNameLower}}.created_at,
            updated_at={{EntityNameLower}}.updated_at,
            deactivated_at={{EntityNameLower}}.deactivated_at,
        )

    @staticmethod
    def {{EntityNameLower}}_tree_to_response({{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}TreeResponse:
        """Convert {{EntityName}} with children to {{EntityName}}TreeResponse recursively"""
        children = [
            {{ModuleNameCapitalized}}ApiMapper.{{EntityNameLower}}_tree_to_response(child)
            for child in {{EntityNameLower}}.children
        ]
        
        return {{EntityName}}TreeResponse(
            id={{EntityNameLower}}.id,
            tenant_id={{EntityNameLower}}.tenant_id,
            code={{EntityNameLower}}.code,
            name={{EntityNameLower}}.name,
            parent_{{EntityNameLower}}_id={{EntityNameLower}}.parent_{{EntityNameLower}}_id,
            level={{EntityNameLower}}.level,
            sort_order={{EntityNameLower}}.sort_order,
{{MapperFields}}
            is_active={{EntityNameLower}}.is_active,
            created_at={{EntityNameLower}}.created_at,
            updated_at={{EntityNameLower}}.updated_at,
            deactivated_at={{EntityNameLower}}.deactivated_at,
            children=children,
            children_count=len(children),
            has_children=len(children) > 0,
        )

