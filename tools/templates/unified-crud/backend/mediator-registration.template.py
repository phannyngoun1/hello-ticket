    # Register {{EntityName}} command handlers
    from app.application.{{moduleName}}.commands_{{EntityNameLower}} import (
        Create{{EntityName}}Command,
        Update{{EntityName}}Command,
        Delete{{EntityName}}Command,
    )
    from app.application.{{moduleName}}.queries_{{EntityNameLower}} import (
        Get{{EntityName}}ByIdQuery,
        Get{{EntityName}}ByCodeQuery,
        Search{{EntityNamePlural}}Query,
    )
    from app.application.{{moduleName}}.handlers_{{EntityNameLower}} import {{EntityName}}CommandHandler, {{EntityName}}QueryHandler

    mediator.register_command_handler(Create{{EntityName}}Command, {{EntityName}}CommandHandler)
    mediator.register_command_handler(Update{{EntityName}}Command, {{EntityName}}CommandHandler)
    mediator.register_command_handler(Delete{{EntityName}}Command, {{EntityName}}CommandHandler)
{{ActivateDeactivateMediatorRegistrations}}

    # Register {{EntityName}} query handlers
    mediator.register_query_handler(Get{{EntityName}}ByIdQuery, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Get{{EntityName}}ByCodeQuery, {{EntityName}}QueryHandler)
    mediator.register_query_handler(Search{{EntityNamePlural}}Query, {{EntityName}}QueryHandler)

