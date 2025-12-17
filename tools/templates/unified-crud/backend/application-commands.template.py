"""{{ModuleName}} commands for CQRS pattern"""
from dataclasses import dataclass
from typing import Optional{{OptionalDictImport}}{{DateTimeImport}}


@dataclass
class Create{{EntityName}}Command:
    """Command to create a new {{EntityNameLower}}"""

    name: str
    {{CreateCommandCodeField}}
{{CreateFields}}

@dataclass
class Update{{EntityName}}Command:
    """Command to update {{EntityNameLower}} details"""

    {{EntityNameLower}}_id: str
    name: Optional[str] = None
    code: Optional[str] = None
{{UpdateFieldsCmd}}

@dataclass
class Delete{{EntityName}}Command:
    """Command to remove a {{EntityNameLower}} (soft-delete only)"""

    {{EntityNameLower}}_id: str

{{ActivateDeactivateCommands}}

