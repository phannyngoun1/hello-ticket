const fs = require('fs');
const path = require('path');
const {
    colors,
    log,
    error,
    success,
    pluralize,
    capitalize,
    camelCase,
    pascalCase,
    snakeCase,
    toUpperSnakeCase,
    kebabCase
} = require('./utils');
const { parseFieldsForBackend } = require('./field-parser');

// Generate backend replacements object
function generateBackendReplacements(entityName, moduleName, fields) {
    const EntityName = pascalCase(entityName);
    const entityNameLower = entityName.replace(/-/g, '_');
    const entityNameCamel = camelCase(entityName);
    const EntityPlural = pascalCase(pluralize(entityName));
    const entityPluralLower = pluralize(entityName).replace(/-/g, '_');
    const entityPluralSnake = snakeCase(pluralize(entityName));
    const entityPluralKebab = kebabCase(pluralize(entityName));
    const ModuleName = pascalCase(moduleName);
    const moduleNameLower = moduleName.toLowerCase();
    const ModuleNameCapitalized = ModuleName;

    // Generate permission name (e.g., MANAGE_SALES_CUSTOMER_TYPE)
    const permissionPrefix = toUpperSnakeCase(moduleName);
    const permissionEntity = toUpperSnakeCase(entityName);
    const Permission = `MANAGE_${permissionPrefix}_${permissionEntity}`;
    const PermissionPrefix = `${permissionPrefix}_${permissionEntity}`; // For VIEW_PERMISSION = Permission.VIEW_{{PermissionPrefix}}

    const parsedFields = parseFieldsForBackend(fields);

    // Generate field strings for templates
    const initFields = parsedFields.length > 0
        ? parsedFields.map(f =>
            `        ${f.nameSnake}: ${f.required ? f.type : f.optionalType}${f.required ? '' : ' = None'}`
        ).join(',\n') + ','
        : '';

    const initAssignments = parsedFields.map(f =>
        `        self.${f.nameSnake} = ${f.nameSnake}`
    ).join('\n');

    const updateFields = parsedFields.length > 0
        ? parsedFields.map(f =>
            `        ${f.nameSnake}: ${f.optionalType} = None`
        ).join(',\n') + ','
        : '';

    const updateAssignments = parsedFields.map(f =>
        `        if ${f.nameSnake} is not None:\n            self.${f.nameSnake} = ${f.nameSnake}`
    ).join('\n');

    const createFields = parsedFields.map(f =>
        `    ${f.nameSnake}: ${f.required ? f.type : f.optionalType}`
    ).join('\n');

    const updateFieldsCmd = parsedFields.map(f =>
        `    ${f.nameSnake}: ${f.optionalType} = None`
    ).join('\n');

    const createCommandFields = parsedFields.map(f =>
        `            ${f.nameSnake}=request.${f.nameSnake}`
    ).join(',\n');

    const updateCommandFields = parsedFields.map(f =>
        `            ${f.nameSnake}=request.${f.nameSnake}`
    ).join(',\n');

    const createEntityFields = parsedFields.map(f =>
        `            ${f.nameSnake}=command.${f.nameSnake}`
    ).join(',\n');

    // Always include code and name in update_kwargs handling, plus any additional fields
    const baseUpdateFields = [
        `        if command.code is not None:\n            update_kwargs['code'] = command.code`,
        `        if command.name is not None:\n            update_kwargs['name'] = command.name`
    ];
    const additionalUpdateFields = parsedFields.map(f =>
        `        if command.${f.nameSnake} is not None:\n            update_kwargs['${f.nameSnake}'] = command.${f.nameSnake}`
    );
    const updateEntityFields = [...baseUpdateFields, ...additionalUpdateFields].join('\n');

    const createRequestFields = parsedFields.map(f =>
        `    ${f.nameSnake}: ${f.required ? f.pydanticType : `Optional[${f.pydanticType}]`} = Field(${f.required ? '...' : 'None'}, description="${capitalize(f.name.replace(/_/g, ' '))}")`
    ).join('\n');

    const updateRequestFields = parsedFields.map(f =>
        `    ${f.nameSnake}: Optional[${f.pydanticType}] = Field(None, description="${capitalize(f.name.replace(/_/g, ' '))}")`
    ).join('\n');

    const responseFields = parsedFields.map(f =>
        `    ${f.nameSnake}: ${f.pydanticType}`
    ).join('\n');

    const mapperFields = parsedFields.length > 0
        ? parsedFields.map(f =>
            `            ${f.nameSnake}=${entityNameLower}.${f.nameSnake}`
        ).join(',\n') + ','
        : '';

    const normalizeMethods = parsedFields
        .filter(f => f.isString)
        .map(f =>
            `    def _normalize_${f.nameSnake}(self, ${f.nameSnake}: str) -> str:\n        if not ${f.nameSnake} or not ${f.nameSnake}.strip():\n            raise ValidationError("${EntityName} ${f.name.replace(/_/g, ' ')} is required")\n        return ${f.nameSnake}.strip()`
        ).join('\n\n');

    const validationMethods = parsedFields
        .filter(f => f.required)
        .map(f => {
            if (f.isString) {
                return `        if not self.${f.nameSnake} or not self.${f.nameSnake}.strip():\n            raise ValidationError("${EntityName} ${f.name.replace(/_/g, ' ')} is required")`;
            } else if (f.isNumber) {
                return `        if self.${f.nameSnake} is None:\n            raise ValidationError("${EntityName} ${f.name.replace(/_/g, ' ')} is required")`;
            }
            return '';
        })
        .filter(v => v)
        .join('\n');

    const createValidation = parsedFields
        .filter(f => f.required)
        .map(f => {
            if (f.isString) {
                return `        if not command.${f.nameSnake} or not command.${f.nameSnake}.strip():\n            raise ValidationError("${EntityName} ${f.name.replace(/_/g, ' ')} is required")`;
            }
            return '';
        })
        .filter(v => v)
        .join('\n');

    // Check if Optional/Dict/DateTime imports are needed
    const needsOptional = parsedFields.some(f => !f.required || f.isDate);
    const OptionalDictImport = needsOptional ? ', Dict' : '';
    const DateTimeImport = parsedFields.some(f => f.isDate) ? ', datetime' : '';

    // Command imports
    const commandImports = [
        'Create' + EntityName + 'Command',
        'Update' + EntityName + 'Command',
        'Delete' + EntityName + 'Command',
    ].join(',\n    ');

    // Query imports
    const baseQueryImports = [
        'Get' + EntityName + 'ByIdQuery',
        'Get' + EntityName + 'ByCodeQuery',
        'Search' + EntityPlural + 'Query',
    ];
    
    // Add tree-specific queries if variant is 'tree'
    if (options.variant === 'tree') {
        baseQueryImports.push(
            'Get' + EntityName + 'TreeQuery',
            'Get' + EntityName + 'ChildrenQuery'
        );
    }
    
    const queryImports = baseQueryImports.join(',\n    ');

    // Activate/Deactivate commands (optional - can be added later)
    const activateDeactivateCommands = '';
    const activateDeactivateCommandImports = '';
    const activateDeactivateHandlers = '';
    const activateDeactivateRoutes = '';
    const activateDeactivateMediatorRegistrations = '';

    return {
        EntityName,
        EntityNameLower: entityNameLower,
        entityNameLower: entityNameLower,
        EntityPlural,
        EntityNamePlural: EntityPlural,  // Alias for template compatibility
        EntityPluralLower: entityPluralLower,
        EntityNamePluralLower: entityPluralLower,  // Alias for template compatibility
        entityPluralLower: entityPluralLower,
        entityPluralSnake: entityPluralSnake,
        EntityNamePluralSnake: entityPluralSnake,  // Alias for template compatibility
        EntityPluralKebab: entityPluralKebab,
        EntityNamePluralKebab: entityPluralKebab,  // Kebab-case for route prefixes
        ModuleName,
        moduleName: moduleNameLower,
        ModuleNameCapitalized,
        Permission,
        PermissionPrefix,
        InitFields: initFields || '',
        InitAssignments: initAssignments || '',
        UpdateFields: updateFields || '',
        UpdateAssignments: updateAssignments || '',
        CreateFields: createFields || '',
        UpdateFieldsCmd: updateFieldsCmd || '',
        CreateCommandFields: createCommandFields || '',
        UpdateCommandFields: updateCommandFields || '',
        CreateEntityFields: createEntityFields || '',
        UpdateEntityFields: updateEntityFields || '',
        CreateRequestFields: createRequestFields || '',
        UpdateRequestFields: updateRequestFields || '',
        ResponseFields: responseFields || '',
        MapperFields: mapperFields || '',
        NormalizeMethods: normalizeMethods || '',
        ValidationMethods: validationMethods || '',
        CreateValidation: createValidation || '',
        OptionalDictImport,
        DateTimeImport,
        CommandImports: commandImports,
        QueryImports: queryImports,
        ActivateDeactivateCommands: activateDeactivateCommands,
        ActivateDeactivateCommandImports: activateDeactivateCommandImports,
        ActivateDeactivateHandlers: activateDeactivateHandlers,
        ActivateDeactivateRoutes: activateDeactivateRoutes,
        ActivateDeactivateMediatorRegistrations: activateDeactivateMediatorRegistrations,
        fields: parsedFields,
        // Infrastructure templates placeholders
        tableName: entityPluralLower.replace(/_/g, '_'),
        EntityDescription: `${EntityName} master data`,
        MapperToDomainFields: parsedFields.length > 0
            ? parsedFields.map(f => `            ${f.nameSnake}=model.${f.nameSnake},`).join('\n') + '\n'
            : '',
        MapperToModelFields: parsedFields.length > 0
            ? '\n' + parsedFields.map(f => `            ${f.nameSnake}={{EntityNameLower}}.${f.nameSnake},`).join('\n') + '\n'
            : '',
        ModelFields: parsedFields.length > 0
            ? '\n    ' + parsedFields.map(f => {
                let fieldType = 'str';
                let fieldDefault = '';
                if (f.isString) {
                    fieldType = 'str';
                } else if (f.isNumber) {
                    fieldType = 'Decimal';
                } else if (f.isBoolean) {
                    fieldType = 'bool';
                    fieldDefault = ' = False';
                }
                return `${f.nameSnake}: ${f.required ? fieldType : `Optional[${fieldType}]`}${!f.required && !fieldDefault ? ' = None' : fieldDefault}`;
            }).join('\n    ')
            : '',
        RepositoryUpdateFields: parsedFields.length > 0
            ? '\n' + parsedFields.map(f => `                existing_model.${f.nameSnake} = {{EntityNameLower}}.${f.nameSnake}`).join('\n')
            : '',
    };
}

// Replace placeholders in backend template content
function replaceBackendPlaceholders(content, replacements) {
    let result = content;

    // First, detect and auto-fix malformed placeholders (spaces inside or around braces)
    const malformedPatterns = [
        /\{\s+\{[^}]+\}\s+\}/g,           // { { Key } }
        /\{\{\s+[^}]+\s+\}\}/g,           // {{ Key }}
        /\{\s+\{[^}]+\}\}/g,              // { {Key} }
        /\{\{[^}]+\}\s+\}/g,              // {{Key} }
        /\{\{\s+[^}]+\}\}/g,              // {{ Key}
    ];

    let foundMalformed = false;
    const allMatches = new Set();

    malformedPatterns.forEach(pattern => {
        const matches = result.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Only flag if it's actually a template placeholder (contains letters/numbers)
                if (/[A-Za-z0-9]/.test(match)) {
                    allMatches.add(match);
                    foundMalformed = true;
                }
            });
        }
    });

    if (foundMalformed) {
        const unique = Array.from(allMatches);
        log(`\n${colors.yellow}WARNING: Malformed placeholders detected in template:${colors.reset}`, 'yellow');
        unique.slice(0, 10).forEach(match => {
            log(`  - ${match} (has spaces inside/around braces)`, 'yellow');
        });
        if (unique.length > 10) {
            log(`  ... and ${unique.length - 10} more`, 'yellow');
        }
        log(`${colors.yellow}Fixing automatically...${colors.reset}\n`, 'yellow');

        // Auto-fix: normalize all placeholder formats to {{Key}}
        // Step 1: Remove spaces between braces: { { -> {{
        result = result.replace(/\{\s+\{/g, '{{');
        result = result.replace(/\}\s+\}/g, '}}');

        // Step 2: Remove spaces around the key inside braces: {{ Key }} -> {{Key}}
        result = result.replace(/\{\{\s+([^}]+)\s+\}\}/g, '{{$1}}');
        result = result.replace(/\{\{\s+([^}]+)\}\}/g, '{{$1}}');
        result = result.replace(/\{\{([^}]+)\s+\}\}/g, '{{$1}}');
    }

    // Replace placeholders - process longer keys first to avoid partial matches
    // Sort keys by length (descending) to handle cases like EntityName vs EntityNamePlural
    const keys = Object.keys(replacements)
        .filter(key => key !== 'fields')
        .sort((a, b) => b.length - a.length);

    keys.forEach(key => {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
        const value = replacements[key];
        if (value !== undefined && value !== null) {
            result = result.replace(regex, String(value));
        }
    });

    return result;
}

// Validate that all placeholders have been replaced
function validatePlaceholdersReplaced(content, filePath) {
    // Known replacement keys that should have been replaced
    const knownPlaceholderKeys = [
        'EntityName', 'EntityNamePlural', 'EntityNameLower', 'EntityNamePluralLower',
        'entityName', 'entityNamePlural', 'entityVar', 'entity-name', 'entity-plural',
        'ModuleName', 'moduleName', 'Permission', 'PermissionPrefix',
        'DTOFields', 'TransformFields', 'CreateCommandFields', 'UpdateCommandFields',
        'ActivateDeactivateCommandImports', 'ActivateDeactivateRoutes'
    ];

    // Match any remaining placeholders (including malformed ones with spaces)
    const placeholderPattern = /\{\s*\{[^}]*\}\s*\}|\{\{[^}]*\}\}/g;
    const matches = content.match(placeholderPattern);

    if (matches && matches.length > 0) {
        // Filter to find actual template placeholders
        const invalidPlaceholders = matches.filter(match => {
            const isDoubleBrace = match.includes('{{') && match.includes('}}');
            if (!isDoubleBrace) return false;

            const innerContent = match.replace(/\{\{|\}\}|\s/g, '').trim();
            if (!innerContent || innerContent === '') return false;

            // Check if it matches known placeholder patterns
            const isKnownPattern = knownPlaceholderKeys.some(key =>
                innerContent.includes(key) ||
                innerContent === key ||
                innerContent.startsWith('#') || // Handlebars directives
                innerContent.startsWith('/')    // Handlebars closing
            );

            if (isKnownPattern) return true;

            // Check for template-like patterns
            if (/^[A-Z][a-zA-Z0-9]*$/.test(innerContent)) {
                const templateKeywords = ['Entity', 'Input', 'Output', 'DTO', 'Config', 'Service', 'Provider'];
                return templateKeywords.some(keyword => innerContent.includes(keyword));
            }

            // Check for Handlebars-style conditionals/loops
            if (/^#(if|unless|each|fields|with)/.test(innerContent) ||
                /^\/(if|unless|each|fields|with)/.test(innerContent)) {
                return true;
            }

            return false;
        });

        if (invalidPlaceholders.length > 0) {
            const uniquePlaceholders = [...new Set(invalidPlaceholders)];
            const errorMsg = `\n${colors.red}═══════════════════════════════════════════════════════════${colors.reset}\n` +
                `${colors.red}ERROR: Unprocessed placeholders found in ${filePath}${colors.reset}\n` +
                `${colors.red}═══════════════════════════════════════════════════════════${colors.reset}\n\n` +
                uniquePlaceholders.map(p => `  ${colors.yellow}${p}${colors.reset}`).join('\n') +
                `\n\n${colors.bright}This indicates a template processing error. Please check:${colors.reset}\n` +
                `  1. Template placeholder syntax (should be ${colors.cyan}{{Key}}${colors.reset} not ${colors.red}{ { Key } }${colors.reset})\n` +
                `  2. All required replacements are provided in the generator\n` +
                `  3. Template file is not corrupted\n` +
                `  4. Placeholder names match exactly (case-sensitive)\n\n` +
                `${colors.yellow}Common issues:${colors.reset}\n` +
                `  - Spaces inside braces: ${colors.red}{ { EntityName } }${colors.reset} → ${colors.green}{{EntityName}}${colors.reset}\n` +
                `  - Missing replacement key in generator\n` +
                `  - Typo in placeholder name\n`;

            error(errorMsg);
            return false;
        }
    }

    return true;
}

// Generate backend files
function generateBackendFiles(config) {
    const { entityName, moduleName, fields, crudType, variant } = config;
    const toolsDir = path.resolve(__dirname, '..', '..', 'tools');
    const backendRoot = path.resolve(toolsDir, '..', 'backend');

    // Select template directory based on CRUD type
    let templateSubdir = 'basic'; // default
    if (crudType === 'full') {
        templateSubdir = 'advanced';
    } else if (crudType === 'basic' && variant === 'tree') {
        templateSubdir = 'tree';
    } else if (crudType === 'basic' && variant === 'datatable') {
        templateSubdir = 'basic';
    }

    const templatesDir = path.join(toolsDir, 'templates', 'unified-crud', 'backend', templateSubdir);
    const baseTemplatesDir = path.join(toolsDir, 'templates', 'unified-crud', 'backend');

    log(`Using ${templateSubdir} backend templates`, 'dim');

    const replacements = generateBackendReplacements(entityName, moduleName, fields);

    // Define backend file structure
    const backendFiles = [
        // Domain
        {
            template: 'domain-entity.template.py',
            output: path.join(backendRoot, 'app', 'domain', moduleName, `${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'domain', moduleName),
        },
        {
            template: 'domain-repository-interface.template.py',
            output: path.join(backendRoot, 'app', 'domain', moduleName, `${entityName.replace(/-/g, '_')}_repositories.py`),
            dir: path.join(backendRoot, 'app', 'domain', moduleName),
        },
        // Application
        {
            template: 'application-commands.template.py',
            output: path.join(backendRoot, 'app', 'application', moduleName, `commands_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'application', moduleName),
            append: false,
        },
        {
            template: 'application-queries.template.py',
            output: path.join(backendRoot, 'app', 'application', moduleName, `queries_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'application', moduleName),
            append: false,
        },
        {
            template: 'application-handlers.template.py',
            output: path.join(backendRoot, 'app', 'application', moduleName, `handlers_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'application', moduleName),
            append: false,
        },
        // Presentation/API
        {
            template: 'api-schemas.template.py',
            output: path.join(backendRoot, 'app', 'presentation', 'api', moduleName, `schemas_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'presentation', 'api', moduleName),
            append: false,
        },
        {
            template: 'api-routes.template.py',
            output: path.join(backendRoot, 'app', 'presentation', moduleName, `${entityName.replace(/-/g, '_')}_routes.py`),
            dir: path.join(backendRoot, 'app', 'presentation', moduleName),
            append: false,
            isRouteFile: true,
        },
        {
            template: 'api-mapper.template.py',
            output: path.join(backendRoot, 'app', 'presentation', 'api', moduleName, `mapper_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'presentation', 'api', moduleName),
            append: false,
        },
        // Infrastructure
        {
            template: 'infrastructure-mapper.template.py',
            output: path.join(backendRoot, 'app', 'infrastructure', moduleName, `mapper_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'infrastructure', moduleName),
            append: false,
        },
        {
            template: 'infrastructure-repository.template.py',
            output: path.join(backendRoot, 'app', 'infrastructure', moduleName, `${entityName.replace(/-/g, '_')}_repository.py`),
            dir: path.join(backendRoot, 'app', 'infrastructure', moduleName),
            append: false,
        },
    ];

    // Create directories and generate files
    let entityRouteFile = null;
    backendFiles.forEach(({ template, output, dir, append, isRouteFile }) => {
        const templatePath = path.join(templatesDir, template);

        if (!fs.existsSync(templatePath)) {
            log(`Warning: Template ${template} not found, skipping...`, 'yellow');
            return;
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const processedContent = replaceBackendPlaceholders(templateContent, replacements);

        // Validate placeholders before writing
        const outputFileName = isRouteFile ? output : (append && fs.existsSync(output)
            ? output.replace('.py', `_${entityName.replace(/-/g, '_')}.py`)
            : output);

        if (!validatePlaceholdersReplaced(processedContent, path.basename(outputFileName))) {
            process.exit(1);
        }

        if (isRouteFile) {
            // For route files, create separate entity route file
            fs.writeFileSync(output, processedContent);
            entityRouteFile = output;
            success(`✓ ${path.basename(output)} created`);
        } else if (append && fs.existsSync(output)) {
            // For files that should be appended, we'll just log a note
            // In practice, you might want to merge content or create separate files
            log(`Note: ${path.basename(output)} already exists. Manual merge may be required.`, 'yellow');
            // Write to a new file with entity name to avoid overwriting
            const newOutput = output.replace('.py', `_${entityName.replace(/-/g, '_')}.py`);
            fs.writeFileSync(newOutput, processedContent);
            success(`✓ ${path.basename(newOutput)} created (original file exists)`);
        } else {
            fs.writeFileSync(output, processedContent);
            success(`✓ ${path.basename(output)} created`);
        }
    });

    // Update __init__.py to include the new entity router
    if (entityRouteFile) {
        const initPath = path.join(backendRoot, 'app', 'presentation', moduleName, '__init__.py');
        const entityNameSnake = entityName.replace(/-/g, '_');
        const entityRouterName = `${entityNameSnake}_router`;
        const moduleRouterName = `${moduleName}_router`;

        if (fs.existsSync(initPath)) {
            // Read existing __init__.py
            let initContent = fs.readFileSync(initPath, 'utf8');

            // Check if entity router import already exists
            const entityImportPattern = new RegExp(`from \\.${entityNameSnake}_routes import router as ${entityRouterName}`, 'g');
            if (!entityImportPattern.test(initContent)) {
                // Add entity router import - find best place to insert
                if (initContent.includes('from fastapi import APIRouter')) {
                    // Add after APIRouter import
                    const apirouterMatch = initContent.match(/from fastapi import APIRouter/);
                    if (apirouterMatch) {
                        const insertIndex = apirouterMatch.index + apirouterMatch[0].length;
                        initContent = initContent.slice(0, insertIndex) +
                            `\nfrom .${entityNameSnake}_routes import router as ${entityRouterName}` +
                            initContent.slice(insertIndex);
                    }
                } else if (initContent.match(/from \\.routes import/)) {
                    // Add after routes import
                    const routesMatch = initContent.match(/from \\.routes import router as \w+/);
                    if (routesMatch) {
                        const insertIndex = routesMatch.index + routesMatch[0].length;
                        initContent = initContent.slice(0, insertIndex) +
                            `\nfrom .${entityNameSnake}_routes import router as ${entityRouterName}` +
                            initContent.slice(insertIndex);
                    }
                } else {
                    // Add at the beginning
                    initContent = `from fastapi import APIRouter\nfrom .${entityNameSnake}_routes import router as ${entityRouterName}\n` + initContent;
                }
            }

            // Check if router combination section exists
            const hasRouterCombination = /router\s*=\s*APIRouter\(\)/.test(initContent);
            const hasEntityInclude = new RegExp(`router\\.include_router\\(${entityRouterName}\\)`, 'g').test(initContent);

            if (!hasRouterCombination) {
                // Need to create router combination - check if there's an existing router export
                const existingRouterExport = initContent.match(/from \\.routes import router as (\w+)/);
                const existingRouterName = existingRouterExport ? existingRouterExport[1] : null;

                // Find __all__ to insert before it
                const allMatch = initContent.match(/__all__\s*=\s*\[/);
                const insertBeforeAll = allMatch ? allMatch.index : initContent.length;

                // Build router combination
                let routerCombination = `\nfrom fastapi import APIRouter\n`;
                if (existingRouterName) {
                    routerCombination += `from .routes import router as ${existingRouterName.replace(/_router$/, '_entity_router')}\n`;
                }
                routerCombination += `from .${entityNameSnake}_routes import router as ${entityRouterName}\n\n`;
                routerCombination += `# Main router that combines all ${moduleName} routes\n`;
                routerCombination += `router = APIRouter()\n`;
                if (existingRouterName) {
                    routerCombination += `router.include_router(${existingRouterName.replace(/_router$/, '_entity_router')})\n`;
                }
                routerCombination += `router.include_router(${entityRouterName})\n\n`;
                routerCombination += `# Export as ${moduleRouterName} for consistency\n`;
                routerCombination += `${moduleRouterName} = router\n\n`;

                initContent = initContent.slice(0, insertBeforeAll) + routerCombination + initContent.slice(insertBeforeAll);

                // Update __all__ if it exists
                if (allMatch) {
                    initContent = initContent.replace(/__all__\s*=\s*\[[^\]]*\]/, `__all__ = ["${moduleRouterName}"]`);
                } else {
                    initContent += `\n__all__ = ["${moduleRouterName}"]\n`;
                }
            } else if (!hasEntityInclude) {
                // Router combination exists, just add the entity router include
                const routerIncludeMatch = initContent.match(/router\\.include_router\\([^)]+\\)/g);
                if (routerIncludeMatch && routerIncludeMatch.length > 0) {
                    const lastInclude = routerIncludeMatch[routerIncludeMatch.length - 1];
                    const insertIndex = initContent.indexOf(lastInclude) + lastInclude.length;
                    initContent = initContent.slice(0, insertIndex) +
                        `\nrouter.include_router(${entityRouterName})` +
                        initContent.slice(insertIndex);
                }
            }

            fs.writeFileSync(initPath, initContent);
            log(`✓ Updated ${path.basename(initPath)} to include ${entityRouterName}`, 'dim');
        } else {
            // Create a new __init__.py file if it doesn't exist
            const initContent = `from fastapi import APIRouter
from .${entityNameSnake}_routes import router as ${entityRouterName}

# Main router that combines all ${moduleName} routes
router = APIRouter()
router.include_router(${entityRouterName})

# Export as ${moduleRouterName} for consistency
${moduleRouterName} = router

__all__ = ["${moduleRouterName}"]
`;
            fs.writeFileSync(initPath, initContent);
            success(`✓ ${path.basename(initPath)} created`);
        }
    }

    // Generate infrastructure files (mapper and repository use base templates)
    const infrastructureFiles = [
        {
            template: path.join(baseTemplatesDir, 'infrastructure-mapper.template.py'),
            output: path.join(backendRoot, 'app', 'infrastructure', moduleName, `mapper_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'infrastructure', moduleName),
        },
        {
            template: path.join(baseTemplatesDir, 'infrastructure-repository.template.py'),
            output: path.join(backendRoot, 'app', 'infrastructure', moduleName, `${entityName.replace(/-/g, '_')}_repository.py`),
            dir: path.join(backendRoot, 'app', 'infrastructure', moduleName),
        },
    ];

    infrastructureFiles.forEach(({ template, output, dir }) => {
        if (!fs.existsSync(template)) {
            log(`Warning: Template ${path.basename(template)} not found, skipping...`, 'yellow');
            return;
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const templateContent = fs.readFileSync(template, 'utf8');
        const processedContent = replaceBackendPlaceholders(templateContent, replacements);

        // Validate placeholders before writing
        if (!validatePlaceholdersReplaced(processedContent, path.basename(output))) {
            process.exit(1);
        }

        fs.writeFileSync(output, processedContent);
        success(`✓ ${path.basename(output)} created`);
    });

    // Insert database model into models.py
    const dbModelTemplate = path.join(baseTemplatesDir, 'infrastructure-database-model.template.py');
    if (fs.existsSync(dbModelTemplate)) {
        const modelsPath = path.join(backendRoot, 'app', 'infrastructure', 'shared', 'database', 'models.py');
        if (fs.existsSync(modelsPath)) {
            const dbModelContent = fs.readFileSync(dbModelTemplate, 'utf8');
            const processedDbModel = replaceBackendPlaceholders(dbModelContent, replacements);

            // Validate placeholders before inserting
            if (!validatePlaceholdersReplaced(processedDbModel, 'infrastructure-database-model.template.py')) {
                process.exit(1);
            }

            // Read models.py
            let modelsContent = fs.readFileSync(modelsPath, 'utf8');

            // Find the module section (e.g., # SALES MODULE - MASTER DATA)
            const moduleNameUpper = replacements.ModuleName ? replacements.ModuleName.toUpperCase() : moduleName.toUpperCase();
            const moduleSectionRegex = new RegExp(`(# =+\\s*\\n# )${moduleNameUpper} MODULE`, 'i');
            const moduleMatch = modelsContent.match(moduleSectionRegex);

            if (moduleMatch) {
                // Insert after the module header
                const insertPosition = modelsContent.indexOf(moduleMatch[0]) + moduleMatch[0].length;
                const beforeInsert = modelsContent.substring(0, insertPosition);
                const afterInsert = modelsContent.substring(insertPosition);

                // Find the next section or end of file
                const nextSectionMatch = afterInsert.match(/^# =+\s*$/m);
                const insertEnd = nextSectionMatch ? nextSectionMatch.index : afterInsert.length;

                // Check if model already exists
                const modelName = `${replacements.EntityName}Model`;
                if (modelsContent.includes(`class ${modelName}`)) {
                    log(`Note: ${modelName} already exists in models.py, skipping...`, 'yellow');
                } else {
                    // Insert the model before the next section
                    const insertBefore = afterInsert.substring(0, insertEnd);
                    const insertAfter = afterInsert.substring(insertEnd);

                    modelsContent = beforeInsert + '\n\n' + processedDbModel + insertBefore + insertAfter;
                    fs.writeFileSync(modelsPath, modelsContent);
                    success(`✓ Added ${modelName} to models.py`);
                }
            } else {
                // Create module section before INVENTORY MODULE - WAREHOUSE STRUCTURE
                const warehouseSectionMatch = modelsContent.match(/# =+\s*\n# INVENTORY MODULE - WAREHOUSE STRUCTURE/i);
                if (warehouseSectionMatch) {
                    const insertPosition = warehouseSectionMatch.index;
                    const beforeInsert = modelsContent.substring(0, insertPosition);
                    const afterInsert = modelsContent.substring(insertPosition);

                    const moduleHeader = `# ============================================================================\n# ${moduleNameUpper} MODULE - MASTER DATA\n# ============================================================================\n\n`;
                    modelsContent = beforeInsert + moduleHeader + processedDbModel + '\n\n' + afterInsert;
                    fs.writeFileSync(modelsPath, modelsContent);
                    success(`✓ Added ${replacements.EntityName}Model to models.py with new module section`);
                } else {
                    // Append at the end before the last line
                    modelsContent = modelsContent.trimEnd() + `\n\n# ============================================================================\n# ${moduleNameUpper} MODULE - MASTER DATA\n# ============================================================================\n\n` + processedDbModel + '\n';
                    fs.writeFileSync(modelsPath, modelsContent);
                    success(`✓ Added ${replacements.EntityName}Model to models.py at end`);
                }
            }
        }
    }

    // Update connection.py to import the new model
    const connectionPath = path.join(backendRoot, 'app', 'infrastructure', 'shared', 'database', 'connection.py');
    if (fs.existsSync(connectionPath)) {
        let connectionContent = fs.readFileSync(connectionPath, 'utf8');
    const modelName = `${replacements.EntityName}Model`;
    const importPattern = /from app\.infrastructure\.shared\.database\.models import \(/;

        if (!connectionContent.includes(modelName)) {
            // Find the import statement
        const importMatch = importPattern.exec(connectionContent);
            if (importMatch) {
                // Find the closing parenthesis of the import
            const importStart = importMatch.index + importMatch[0].length;
                let depth = 1;
                let importEnd = importStart;

                while (importEnd < connectionContent.length && depth > 0) {
                    if (connectionContent[importEnd] === '(') depth++;
                    if (connectionContent[importEnd] === ')') depth--;
                    importEnd++;
                }

                const beforeImport = connectionContent.substring(0, importEnd - 1);
                const afterImport = connectionContent.substring(importEnd - 1);

                // Find where to insert (before operational_metadata or before closing paren)
                const moduleNameDisplay = replacements.ModuleName || moduleName;
                const insertBefore = beforeImport.endsWith(',') ? `\n    # ${moduleNameDisplay} master data\n    ${modelName},` : `,\n    # ${moduleNameDisplay} master data\n    ${modelName}`;
                connectionContent = beforeImport + insertBefore + afterImport;
                fs.writeFileSync(connectionPath, connectionContent);
                success(`✓ Added ${modelName} import to connection.py`);
            }
        }
    }

    // Generate combined container and mediator registration file
    const containerRegTemplate = path.join(templatesDir, 'container-registration.template.py');

    if (fs.existsSync(containerRegTemplate)) {
        const containerContent = fs.readFileSync(containerRegTemplate, 'utf8');
        const processedContent = replaceBackendPlaceholders(containerContent, replacements);

        // Write to shared/container_registrations/{entity_name}.py
        const registrationDir = path.join(backendRoot, 'app', 'shared', 'container_registrations');
        if (!fs.existsSync(registrationDir)) {
            fs.mkdirSync(registrationDir, { recursive: true });
        }

        const entityNameSnake = entityName.replace(/-/g, '_');
        const registrationOutput = path.join(registrationDir, `${entityNameSnake}.py`);

        // Validate placeholders before writing
        if (!validatePlaceholdersReplaced(processedContent, path.basename(registrationOutput))) {
            process.exit(1);
        }

        fs.writeFileSync(registrationOutput, processedContent);

        log(`\n${colors.green}✓ Container registration created:${colors.reset}`);
        log(`  ${registrationOutput}`, 'dim');
    }
}

module.exports = {
    generateBackendFiles,
    generateBackendReplacements,
    replaceBackendPlaceholders,
    validatePlaceholdersReplaced
};
