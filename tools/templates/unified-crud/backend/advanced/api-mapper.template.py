"""API mapper for {{ModuleName}} module"""
from app.domain.{{moduleName}}.{{EntityNameLower}} import {{EntityName}}
from app.presentation.api.{{moduleName}}.schemas_{{EntityNameLower}} import {{EntityName}}Response


class {{ModuleNameCapitalized}}ApiMapper:
    """Mapper for converting domain entities to API responses"""

    @staticmethod
    def {{EntityNameLower}}_to_response({{EntityNameLower}}: {{EntityName}}) -> {{EntityName}}Response:
        return {{EntityName}}Response(
            id={{EntityNameLower}}.id,
            tenant_id={{EntityNameLower}}.tenant_id,
            code={{EntityNameLower}}.code,
            name={{EntityNameLower}}.name,
{{MapperFields}}
            is_active={{EntityNameLower}}.is_active,
            created_at={{EntityNameLower}}.created_at,
            updated_at={{EntityNameLower}}.updated_at,
            deactivated_at={{EntityNameLower}}.deactivated_at,
        )

