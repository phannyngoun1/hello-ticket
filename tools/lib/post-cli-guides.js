'use strict';

/**
 * Print backend registration guide after CRUD generation.
 *
 * @param {Object} params
 * @param {(msg: string, color?: string) => void} params.log - logger from CLI
 * @param {Record<string, string>} params.colors - ANSI color map
 * @param {string} params.moduleName - Backend module name
 * @param {string} params.entityName - Generated entity name (kebab-case)
 * @param {(value: string) => string} params.capitalize - Capitalize helper
 * @param {(value: string) => string} params.pluralize - Pluralize helper
 * @param {(value: string) => string} params.toUpperSnakeCase - Snake helper
 */
function printBackendRegistrationGuide({
    log,
    colors,
    moduleName,
    entityName,
    packageName,
    parentRoute,
    capitalize,
    pluralize,
    toUpperSnakeCase,
    showPaletteGuide = false,
}) {
    const entityNameSnake = entityName.replace(/-/g, '_');
    const entityRouterName = `${entityNameSnake}_router`;
    const entityNamePlural = pluralize(entityName);
    const entityLabel = capitalize(entityNamePlural);
    const entitySlug = entityNameSnake.replace(/_/g, '-');
    const entityKebab = entityName.replace(/_/g, '-');
    const entityPascal = toPascalCase(entityName);
    const entityPluralPascal = toPascalCase(entityNamePlural);
    const entityPluralKebab = entityNamePlural.replace(/_/g, '-');
    const entityCamel = toCamelCase(entityName);

    // Container & mediator guidance
    log(`${colors.cyan}🔧 Container & Mediator Registration:${colors.reset}`, 'bright');
    log(`   A registration file has been created at:`, 'dim');
    log(`   ${colors.cyan}backend/app/shared/container_registrations/${entityNameSnake}.py${colors.reset}`);
    console.log();
    log(`   ${colors.bright}Step 1 - Add Container Registration${colors.reset}`, 'bright');
    log(`   ${colors.dim}   File: backend/app/shared/container.py${colors.reset}`);
    log(`   ${colors.dim}   Function: setup_container()${colors.reset}`);
    log(`   ${colors.dim}   Add after other module registrations:${colors.reset}`);
    log(`   ${colors.green}+ from app.shared.container_registrations.${entityNameSnake} import register_${entityNameSnake}_container${colors.reset}`);
    log(`   ${colors.green}+ register_${entityNameSnake}_container(container)${colors.reset}`);
    console.log();
    log(`   ${colors.bright}Step 2 - Add Mediator Registration${colors.reset}`, 'bright');
    log(`   ${colors.dim}   File: backend/app/shared/container.py${colors.reset}`);
    log(`   ${colors.dim}   Function: setup_mediator()${colors.reset}`);
    log(`   ${colors.dim}   Add after other module registrations:${colors.reset}`);
    log(`   ${colors.green}+ from app.shared.container_registrations.${entityNameSnake} import register_${entityNameSnake}_mediator${colors.reset}`);
    log(`   ${colors.green}+ register_${entityNameSnake}_mediator(mediator)${colors.reset}`);
    console.log();

    log(`   ${colors.dim}What gets registered:${colors.reset}`, 'dim');
    log(`   ${colors.dim}  • Repository: ${entityPascal}Repository → SQL${entityPascal}Repository${colors.reset}`);
    log(`   ${colors.dim}  • Command Handler: ${entityPascal}CommandHandler${colors.reset}`);
    log(`   ${colors.dim}  • Query Handler: ${entityPascal}QueryHandler${colors.reset}`);
    log(`   ${colors.dim}  • Commands: Create, Update, Delete${colors.reset}`);
    log(`   ${colors.dim}  • Queries: GetById, GetByCode, Search${colors.reset}`);
    console.log();

    // Router guidance
    log(`${colors.cyan}📋 Router Registration:${colors.reset}`, 'bright');
    log(`   The entity router "${entityRouterName}" has been added to ${entityNameSnake}_routes.py`);
    log(`   and combined in the module's __init__.py file.`);
    log(`   ${colors.yellow}If this is a NEW module "${moduleName}", register it:${colors.reset}`);
    console.log();
    log(`   ${colors.bright}File 1: ${colors.reset}${colors.cyan}backend/app/presentation/${moduleName}/__init__.py${colors.reset}`);
    log(`   ${colors.dim}   The CLI has automatically combined routers in __init__.py:${colors.reset}`);
    log(`   ${colors.dim}   from fastapi import APIRouter${colors.reset}`);
    log(`   ${colors.dim}   from .${entityNameSnake}_routes import router as ${entityRouterName}${colors.reset}`);
    log(`   ${colors.dim}   router = APIRouter()${colors.reset}`);
    log(`   ${colors.dim}   router.include_router(${entityRouterName})${colors.reset}`);
    log(`   ${colors.dim}   ${moduleName}_router = router${colors.reset}`);
    log(`   ${colors.dim}   Note: All entity routers are combined here, not in routes.py${colors.reset}`);
    console.log();
    log(`   ${colors.bright}File 2: ${colors.reset}${colors.cyan}backend/app/presentation/router_registry.py${colors.reset}`);
    log(`   ${colors.dim}   Step 1 - Add import (after warehouse import):${colors.reset}`);
    log(`   ${colors.green}+ from app.presentation.${moduleName} import ${moduleName}_router${colors.reset}`);
    log(`   ${colors.dim}   Step 2 - Add to ROUTERS list (after sales_router):${colors.reset}`);
    log(`   ${colors.green}+ ${moduleName}_router,  # ${moduleName} module (includes ${entityRouterName})${colors.reset}`);
    console.log();

    // Permission guidance
    const permissionPrefix = toUpperSnakeCase(moduleName);
    const permissionEntity = toUpperSnakeCase(entityName);
    const managePermission = `MANAGE_${permissionPrefix}_${permissionEntity}`;
    const viewPermission = `VIEW_${permissionPrefix}_${permissionEntity}`;
    const permissionModuleLower = moduleName.toLowerCase();
    const permissionEntityLower = entityName.replace(/-/g, '_');
    const permissionStringManage = `${permissionModuleLower}_${permissionEntityLower}:manage`;
    const permissionStringView = `${permissionModuleLower}_${permissionEntityLower}:view`;

    log(`${colors.cyan}🔐 Permission Registration:${colors.reset}`, 'bright');
    log(`   The route file uses permission constants that reference Permission enum values.`);
    log(`   ${colors.yellow}Add these permissions to the Permission enum:${colors.reset}`);
    console.log();
    log(`   ${colors.bright}File: ${colors.reset}${colors.cyan}backend/app/domain/shared/value_objects/role.py${colors.reset}`);
    log(`   ${colors.dim}   Step 1 - Add to Permission enum (after other ${moduleName} permissions):${colors.reset}`);
    log(`   ${colors.green}+ # ${moduleName} - ${entityName} permissions${colors.reset}`);
    log(`   ${colors.green}+ ${managePermission} = "${permissionStringManage}"${colors.reset}`);
    log(`   ${colors.green}+ ${viewPermission} = "${permissionStringView}"${colors.reset}`);
    console.log();
    log(`   ${colors.dim}   Step 2 - Add to ROLE_PERMISSIONS for ADMIN:${colors.reset}`);
    log(`   ${colors.green}+ Permission.${managePermission}, Permission.${viewPermission},${colors.reset}`);
    console.log();
    log(`   ${colors.dim}   Step 3 - Add to ROLE_PERMISSIONS for MANAGER:${colors.reset}`);
    log(`   ${colors.green}+ Permission.${managePermission}, Permission.${viewPermission},${colors.reset}`);
    console.log();
    log(`   ${colors.dim}   Step 4 - Add to ROLE_PERMISSIONS for USER:${colors.reset}`);
    log(`   ${colors.green}+ Permission.${viewPermission},${colors.reset}`);
    console.log();

    // Navigation guidance
    log(`${colors.cyan}🧭 Navigation Menu:${colors.reset}`, 'bright');
    log(`   Update the navigation JSON so the new CRUD appears in the UI menu.`, 'dim');
    console.log();
    log(`   ${colors.bright}File: ${colors.reset}${colors.cyan}backend/app/presentation/core/routes/routes.json${colors.reset}`);
    log(`   ${colors.dim}   Step 1 - Find or create the parent module entry (e.g., "/${moduleName}")${colors.reset}`);
    log(`   ${colors.dim}   Step 2 - Ensure it has a "children" array${colors.reset}`);
    log(`   ${colors.dim}   Step 3 - Add or update a child item:${colors.reset}`);
    log(`   ${colors.green}+ {${colors.reset}`);
    log(`   ${colors.green}+   "label": "${entityLabel}",${colors.reset}`);
    log(`   ${colors.green}+   "path": "/${moduleName}/${entitySlug}",${colors.reset}`);
    log(`   ${colors.green}+   "icon": "Users",${colors.reset}`);
    log(`   ${colors.green}+   "description": "Manage ${entityNamePlural} and related data."${colors.reset}`);
    log(`   ${colors.green}+ }${colors.reset}`);
    log(`   ${colors.dim}   Step 4 - Save the file; /core/navigation will serve the new entry${colors.reset}`);
    console.log();

    if (showPaletteGuide) {
        const entityProviderFile = `frontend/apps/web/src/providers/${entityKebab}-provider.tsx`;
        const domainProvidersFile = 'frontend/apps/web/src/providers/domain-providers.tsx';
        const listEndpoint = `/api/v1/${(packageName || moduleName)}/${entityPluralKebab}`;

        log(`${colors.cyan}🌐 Global Provider Registration:${colors.reset}`, 'bright');
        log(`   Ensure the ${entityLabel.toLowerCase()} service is available globally before wiring search.`, 'dim');
        console.log();
        log(`   ${colors.bright}Step 1 - Create a Global ${entityPascal} Provider${colors.reset}`);
        log(`   ${colors.dim}   File: ${entityProviderFile}${colors.reset}`);
        log(`   ${colors.dim}   → Wrap children with ${entityPascal}Provider from "@truths/${packageName || moduleName}"${colors.reset}`);
        log(`   ${colors.dim}   → Configure endpoints to ${listEndpoint}${colors.reset}`);
        console.log();
        log(`   ${colors.bright}Step 2 - Register provider in DomainProviders${colors.reset}`);
        log(`   ${colors.dim}   File: ${domainProvidersFile}${colors.reset}`);
        log(`   ${colors.dim}   → Import Global${entityPascal}Provider and wrap the tree so shared UI can call use${entityPascal}Service()${colors.reset}`);
        console.log();
        console.log();
        printCommandPaletteGuide({
            log,
            colors,
            packageName: packageName || moduleName,
            parentRoute: parentRoute || moduleName,
            entityPascal,
            entityPluralPascal,
            entityPluralLabel: entityLabel,
            entityPluralKebab,
            entityCamel,
        });
    }
}

function printCommandPaletteGuide({
    log,
    colors,
    packageName,
    parentRoute,
    entityPascal,
    entityPluralPascal,
    entityPluralLabel,
    entityPluralKebab,
    entityCamel,
}) {
    const paletteFile = 'frontend/apps/web/src/components/layouts/command-palette-wrapper.tsx';
    const parentSegment = trimSlashes(parentRoute || packageName || '');
    const listRoute = `/${[parentSegment, entityPluralKebab].filter(Boolean).join('/')}`;
    const detailRoute = `${listRoute}/$id`;
    const serviceVar = `${entityCamel}Service`;
    const fetcherName = `fetch${entityPluralPascal}`;

    log(`${colors.cyan}⌨️ Command Palette Search Registration:${colors.reset}`, 'bright');
    log(`   Wire the generated ${entityPluralLabel.toLowerCase()} search into the global command palette so Cmd/Ctrl + K can find your records.`, 'dim');
    console.log();
    log(`   ${colors.bright}File:${colors.reset} ${colors.cyan}${paletteFile}${colors.reset}`);
    console.log();

    log(`   ${colors.bright}Step 1 - Import service, type, and icon${colors.reset}`, 'bright');
    log(`   ${colors.green}+ import { use${entityPascal}Service, type ${entityPascal} } from "@truths/${packageName}";${colors.reset}`);
    log(`   ${colors.green}+ import { Boxes } from "lucide-react";  ${colors.dim}// Choose an icon that matches your module${colors.reset}`);
    console.log();

    log(`   ${colors.bright}Step 2 - Expose the search fetcher${colors.reset}`, 'bright');
    log(`   ${colors.green}+ const ${serviceVar} = use${entityPascal}Service();${colors.reset}`);
    log(`   ${colors.green}+ const ${fetcherName} = useCallback(async (query: string) => {${colors.reset}`);
    log(`   ${colors.green}    return ${serviceVar}.search${entityPluralPascal}(query, 10);${colors.reset}`);
    log(`   ${colors.green}  }, [${serviceVar}]);${colors.reset}`);
    log(`   ${colors.dim}   Place this next to the existing fetchUsers / fetchInventoryItems helpers.${colors.reset}`);
    console.log();

    log(`   ${colors.bright}Step 3 - Register a DataType entry${colors.reset}`, 'bright');
    log(`   ${colors.dim}   Inside the dataTypes useMemo (see "Inventory Items" as a reference):${colors.reset}`);
    log(`   ${colors.green}{${colors.reset}`);
    log(`   ${colors.green}  key: "${entityPluralKebab}",${colors.reset}`);
    log(`   ${colors.green}  name: "${entityPluralLabel}",${colors.reset}`);
    log(`   ${colors.green}  icon: Boxes,${colors.reset}`);
    log(`   ${colors.green}  scope: "${entityPluralKebab}",${colors.reset}`);
    log(`   ${colors.green}  fetcher: ${fetcherName},${colors.reset}`);
    log(`   ${colors.green}  renderItem: (record, onSelect) => {${colors.reset}`);
    log(`   ${colors.green}    const ${entityCamel} = record as ${entityPascal};${colors.reset}`);
    log(`   ${colors.green}    return (${colors.reset}`);
    log(`   ${colors.green}      <CommandItem${colors.reset}`);
    log(`   ${colors.green}        key="${entityPluralKebab}-\${${entityCamel}.id}"${colors.reset}`);
    log(`   ${colors.green}        value="${entityPluralKebab}-\${${entityCamel}.code || ''}-\${${entityCamel}.name || ''}"${colors.reset}`);
    log(`   ${colors.green}        onSelect={onSelect}${colors.reset}`);
    log(`   ${colors.green}      >${colors.reset}`);
    log(`   ${colors.green}        <Boxes className="mr-2 h-4 w-4" />${colors.reset}`);
    log(`   ${colors.green}        <div className="flex flex-col">${colors.reset}`);
    log(`   ${colors.green}          <span className="text-sm">{${entityCamel}.name}</span>${colors.reset}`);
    log(`   ${colors.green}          <span className="text-xs text-muted-foreground">${colors.reset}`);
    log(`   ${colors.green}            {${entityCamel}.code}${colors.reset}`);
    log(`   ${colors.green}          </span>${colors.reset}`);
    log(`   ${colors.green}        </div>${colors.reset}`);
    log(`   ${colors.green}      </CommandItem>${colors.reset}`);
    log(`   ${colors.green}    );${colors.reset}`);
    log(`   ${colors.green}  },${colors.reset}`);
    log(`   ${colors.green}  getSearchValue: (record) => {${colors.reset}`);
    log(`   ${colors.green}    const ${entityCamel} = record as ${entityPascal};${colors.reset}`);
    log(`   ${colors.green}    return \`${entityPluralKebab}-\${${entityCamel}.code || ''}-\${${entityCamel}.name || ''}\`;${colors.reset}`);
    log(`   ${colors.green}  },${colors.reset}`);
    log(`   ${colors.green}  navigateTo: "${detailRoute}",${colors.reset}`);
    log(`   ${colors.green}},${colors.reset}`);
    console.log();

    log(`   ${colors.dim}Tips:${colors.reset}`, 'dim');
    log(`   ${colors.dim}  • Keep results under ~10 to avoid over-fetching${colors.reset}`);
    log(`   ${colors.dim}  • Include both code and name in value/search text for better matching${colors.reset}`);
    log(`   ${colors.dim}  • ${colors.reset}${colors.dim}Update the useMemo dependency array with ${fetcherName}${colors.reset}`);
    log(`   ${colors.dim}  • Cmd/Ctrl + K will now navigate to ${detailRoute.replace('$id', ':id')} automatically${colors.reset}`);
    console.log();
}

function trimSlashes(value) {
    return value.replace(/^\/+|\/+$/g, '');
}

function toPascalCase(value) {
    return value
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function toCamelCase(value) {
    const [first, ...rest] = value.split('-');
    return first + rest.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

module.exports = {
    printBackendRegistrationGuide,
    printCommandPaletteGuide,
};

