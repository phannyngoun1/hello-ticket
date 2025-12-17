"""FastAPI dependencies for {{ModuleName}} routes"""
from app.domain.{{moduleName}}.{{EntityNameLower}}_repositories import {{EntityName}}Repository
from app.infrastructure.{{moduleName}} import SQL{{EntityName}}Repository
from app.shared.container import container


def get_{{EntityNameLower}}_repository() -> {{EntityName}}Repository:
    """Dependency for {{EntityNameLower}} repository"""
    return container.resolve({{EntityName}}Repository)

