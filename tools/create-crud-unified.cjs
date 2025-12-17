#!/usr/bin/env node

/**
 * Unified CRUD Generation CLI Tool
 * 
 * Professional interactive tool for generating CRUD operations
 * Supports: Basic CRUD (Datatable/Tree) and Full CRUD with advanced features
 * 
 * IMPORTANT - System Fields Handling:
 * ===================================
 * The following fields are AUTOMATICALLY added to all entities and should NOT
 * be included in your --fields parameter:
 * 
 * 1. Audit Fields (automatically added to response types):
 *    - created_at: DateTime (when record was created)
 *    - updated_at: DateTime (when record was last modified)
 *    - deactivated_at: DateTime? (when record was soft-deleted)
 * 
 * 2. Standard System Fields:
 *    - id: string (primary key, UUID)
 *    - tenant_id: string (for multi-tenancy)
 *    - version: number (for optimistic locking)
 *    - is_active: boolean (soft delete flag)
 * 
 * 3. Hardcoded Business Fields:
 *    - code: string (business identifier)
 *    - name: string (display name)
 * 
 * These fields are:
 * ✓ Included in entity response types
 * ✓ Excluded from create/update input types  
 * ✓ Managed by the backend automatically
 * 
 * Only specify custom business fields unique to your entity!
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { printBackendRegistrationGuide, printCommandPaletteGuide } = require('./lib/post-cli-guides');

// Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

const box = {
    top: '╔',
    bottom: '╚',
    horizontal: '═',
    vertical: '║',
    topRight: '╗',
    bottomRight: '╝',
};

// ============================================================================
// System Field Constants
// ============================================================================

/**
 * System-managed audit fields that are automatically handled by the backend
 * These fields should NOT be included in --fields parameter as they are:
 * - Automatically added to all entity response types
 * - Excluded from create/update input types
 * - Managed by the database/ORM layer
 */
const SYSTEM_AUDIT_FIELDS = ['created_at', 'updated_at', 'deactivated_at'];

/**
 * Other system fields that are standard across all entities
 * These are also excluded from --fields parameter
 */
const SYSTEM_STANDARD_FIELDS = ['id', 'tenant_id', 'version', 'is_active', 'code', 'name'];

/**
 * Combined list of all system fields
 */
const ALL_SYSTEM_FIELDS = [...SYSTEM_AUDIT_FIELDS, ...SYSTEM_STANDARD_FIELDS];

// ============================================================================
// Command-line argument parsing
// ============================================================================

const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}${colors.cyan}Unified CRUD Generation CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  ${colors.dim}# Interactive mode (default)${colors.reset}
  node tools/create-crud-unified.cjs

  ${colors.dim}# Non-interactive mode${colors.reset}
  node tools/create-crud-unified.cjs <entity-name> --package <name> [options]

${colors.bright}Arguments:${colors.reset}
  <entity-name>                 Entity name (e.g., "product", "customer")

${colors.bright}Required Options (for non-interactive mode):${colors.reset}
  --package, -p <name>          Package/module name (e.g., "inventory", "sales")
  --fields, -f <fields>         Comma-separated fields: "name:type,price:number:currency"
                                Field format: name:type[:format][?]
                                  ? = optional field
                                  Types: string, number, date, boolean
                                  Formats: currency, decimal, percentage (number)
                                           datetime, date, timestamp (date)
                                
                                ${colors.yellow}Note:${colors.reset} ${colors.dim}Do NOT include system fields:${colors.reset}
                                  ${colors.dim}• id, tenant_id, version (managed by system)${colors.reset}
                                  ${colors.dim}• created_at, updated_at, deactivated_at (audit fields)${colors.reset}
                                  ${colors.dim}• is_active (status field)${colors.reset}
                                  ${colors.dim}• code, name (hardcoded in templates)${colors.reset}
                                ${colors.dim}These are automatically added to all entities.${colors.reset}

${colors.bright}Optional:${colors.reset}
  --type <type>                 CRUD type: "basic" or "full" (default: "full")
  --variant <variant>           For basic CRUD: "datatable" or "tree" (default: "datatable")
  --module <name>               Backend module name (default: same as package)
  --endpoint <path>             API endpoint (default: /api/v1/<package>/<entity-plural>)
  --parent-route <route>        Parent route for frontend (default: <package>)
  
  --frontend-only               Generate frontend code only
  --backend-only                Generate backend code only
  
  --view-page                   Create view/detail page (default for full CRUD)
  --no-view-page                Skip view/detail page (default for basic CRUD)
  
  --create-migration            Create database migration after backend generation
  --no-migration                Skip database migration (default)
  --code-sequence <type>        Enable auto code generation using this sequence type
  --code-prefix <prefix>        Optional prefix for generated codes (requires --code-sequence)
  
  --force                       Overwrite existing entity files
  --no-interactive              Run in non-interactive mode (required for script usage)

${colors.bright}Examples:${colors.reset}
  ${colors.dim}# Interactive mode${colors.reset}
  node tools/create-crud-unified.cjs

  ${colors.dim}# Full CRUD with both frontend and backend${colors.reset}
  node tools/create-crud-unified.cjs product --package inventory \\
    --fields "sku:string,description:string,price:number:currency,stock_quantity:number" \\
    --type full --endpoint "/api/v1/inventory/products" \\
    --parent-route "inventory" --view-page --no-interactive
  
  ${colors.dim}# Note: Don't include system fields (id, created_at, updated_at, etc.)${colors.reset}
  ${colors.dim}# These are automatically added to all entities${colors.reset}

  ${colors.dim}# Basic tree CRUD for categories${colors.reset}
  node tools/create-crud-unified.cjs category --package inventory \\
    --fields "code:string,name:string,parent_id:string?" \\
    --type basic --variant tree --no-view-page --no-interactive

  ${colors.dim}# Frontend only${colors.reset}
  node tools/create-crud-unified.cjs order --package sales \\
    --fields "order_number:string,total:number:currency,status:string" \\
    --frontend-only --no-interactive

${colors.bright}Type Handling:${colors.reset}
  ${colors.dim}Entity types are automatically generated in {entity-plural}/types.ts${colors.reset}
  ${colors.dim}Do NOT duplicate these in the package-level types.ts file${colors.reset}
  ${colors.dim}Package types.ts is only for shared types used across multiple entities${colors.reset}
`);
    process.exit(0);
}

// Parse command-line arguments
let entityNameArg = null;
let packageArg = null;
let fieldsArg = null;
let typeArg = null;
let variantArg = null;
let moduleArg = null;
let endpointArg = null;
let parentRouteArg = null;
let frontendOnly = false;
let backendOnly = false;
let viewPageArg = null; // null = not specified, true = --view-page, false = --no-view-page
let migrationArg = null; // null = not specified, true = --create-migration, false = --no-migration
let codeSequenceArg = null;
let codePrefixArg = null;
let forceArg = false;
let noInteractive = false;

// First non-flag argument is the entity name
for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--') || arg.startsWith('-')) {
        // It's a flag, handle it
        if (arg === '--package' || arg === '-p') {
            packageArg = args[++i];
        } else if (arg === '--fields' || arg === '-f') {
            fieldsArg = args[++i];
        } else if (arg === '--type' || arg === '-t') {
            typeArg = args[++i];
        } else if (arg === '--variant' || arg === '-v') {
            variantArg = args[++i];
        } else if (arg === '--module' || arg === '-m') {
            moduleArg = args[++i];
        } else if (arg === '--endpoint' || arg === '-e') {
            endpointArg = args[++i];
        } else if (arg === '--parent-route') {
            parentRouteArg = args[++i];
        } else if (arg === '--frontend-only') {
            frontendOnly = true;
        } else if (arg === '--backend-only') {
            backendOnly = true;
        } else if (arg === '--view-page') {
            viewPageArg = true;
        } else if (arg === '--no-view-page') {
            viewPageArg = false;
        } else if (arg === '--create-migration') {
            migrationArg = true;
        } else if (arg === '--no-migration') {
            migrationArg = false;
        } else if (arg === '--code-sequence') {
            codeSequenceArg = args[++i];
        } else if (arg === '--code-prefix') {
            codePrefixArg = args[++i];
        } else if (arg === '--force') {
            forceArg = true;
        } else if (arg === '--no-interactive') {
            noInteractive = true;
        }
    } else if (!entityNameArg) {
        // First non-flag argument is entity name
        entityNameArg = arg;
    }
}

if (codePrefixArg && !codeSequenceArg) {
    error('--code-prefix requires --code-sequence');
}

// ============================================================================
// Utility Functions
// ============================================================================


function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    log(`\n${box.horizontal.repeat(60)}`, 'red');
    log(`ERROR: ${message}`, 'red');
    log(`${box.horizontal.repeat(60)}\n`, 'red');
    process.exit(1);
}

function success(message) {
    log(`✓ ${message}`, 'green');
}

function printHeader() {
    console.log();
    log(`${box.horizontal.repeat(64)}${box.topRight}`, 'cyan');
    log(`${box.vertical}     ${colors.bright}Unified CRUD Generation CLI Tool${colors.reset}${colors.cyan}          ${box.vertical}`, 'cyan');
    log(`${box.bottom}${box.horizontal.repeat(64)}${box.bottomRight}\n`, 'cyan');

    log('This tool will generate CRUD operations for frontend and/or backend.', 'dim');
    log('It supports Basic CRUD (Datatable/Tree) and Full CRUD with advanced features.\n', 'dim');

    log('What will be generated:', 'bright');
    log('  Frontend: Types, service, provider, hooks, components', 'dim');
    log('  Backend: Domain entities, commands, queries, handlers, API routes', 'dim');
    log('  Optional: Routes and navigation menu\n', 'dim');
}

function printStep(stepNum, title) {
    console.log();
    log(`${'═'.repeat(64)}`, 'cyan');
    log(`Step ${stepNum}: ${title}`, 'bright');
    console.log();
}

// Get available packages from multiple sources (filesystem, vite.config.ts, tsconfig.json)
function getAvailablePackages() {
    const packagesDir = path.join(path.resolve(__dirname, '..'), 'frontend', 'packages');
    const packagesSet = new Set();

    // Core packages to exclude (infrastructure packages, not feature packages)
    const corePackages = [
        'api',
        'ui',
        'utils',
        'config',
        'api',
        'shared',
        'custom-ui',
        'ui-builder',
        'ui-builder-runtime',
        'ui-builder-compiler',
        'ui-builder-components'
    ];

    // Method 1: Read from filesystem (most reliable)
    if (fs.existsSync(packagesDir)) {
        const fsPackages = fs.readdirSync(packagesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .filter(name => !name.startsWith('.') && name !== 'node_modules')
            .filter(name => !corePackages.includes(name));

        fsPackages.forEach(pkg => packagesSet.add(pkg));
    }

    // Method 2: Extract from vite.config.ts
    const viteConfigPath = path.join(path.resolve(__dirname, '..'), 'frontend', 'apps', 'web', 'vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
        try {
            const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
            // Match @truths/package-name patterns
            const viteMatches = viteConfigContent.match(/@truths\/([a-z0-9-]+)/g);
            if (viteMatches) {
                viteMatches.forEach(match => {
                    const pkgName = match.replace('@truths/', '');
                    // Skip core packages that aren't feature packages
                    if (!corePackages.includes(pkgName)) {
                        packagesSet.add(pkgName);
                    }
                });
            }
        } catch (err) {
            // Silently fail if we can't read vite.config.ts
        }
    }

    // Method 3: Extract from tsconfig.json
    const tsconfigPath = path.join(path.resolve(__dirname, '..'), 'frontend', 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
        try {
            const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
            const tsconfigMatches = tsconfigContent.match(/@truths\/([a-z0-9-]+)/g);
            if (tsconfigMatches) {
                tsconfigMatches.forEach(match => {
                    const pkgName = match.replace('@truths/', '');
                    if (!corePackages.includes(pkgName)) {
                        packagesSet.add(pkgName);
                    }
                });
            }
        } catch (err) {
            // Silently fail if we can't read tsconfig.json
        }
    }

    return Array.from(packagesSet).sort();
}

// Get available modules from a specific package
function getAvailableModulesFromPackage(packageName) {
    const packageDir = path.join(path.resolve(__dirname, '..'), 'frontend', 'packages', packageName);
    const packageSrcDir = path.join(packageDir, 'src');
    const modulesSet = new Set();

    if (!fs.existsSync(packageSrcDir)) {
        return [];
    }

    // Method 1: Extract from index.ts exports
    const indexPath = path.join(packageSrcDir, 'index.ts');
    if (fs.existsSync(indexPath)) {
        try {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            // Match export * from './module-name' patterns
            const exportMatches = indexContent.match(/export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/g);
            if (exportMatches) {
                exportMatches.forEach(match => {
                    const moduleName = match.match(/['"]\.\/([^'"]+)['"]/)[1];
                    // Skip common non-module exports
                    if (!['registry', 'types', 'index'].includes(moduleName)) {
                        modulesSet.add(moduleName);
                    }
                });
            }
        } catch (err) {
            // Silently fail if we can't read index.ts
        }
    }

    // Method 2: Read from filesystem (directories in src/)
    try {
        const srcDirs = fs.readdirSync(packageSrcDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .filter(name => !name.startsWith('.') && name !== 'node_modules');

        srcDirs.forEach(dir => modulesSet.add(dir));
    } catch (err) {
        // Silently fail if we can't read directory
    }

    return Array.from(modulesSet).sort();
}

function printSummary(config) {
    console.log();
    log('═'.repeat(64), 'cyan');
    log(`${' '.repeat(24)}SUMMARY`, 'bright');
    log('═'.repeat(64), 'cyan');
    console.log();

    log(`Entity: ${colors.cyan}${config.entityName}${colors.reset} (${colors.dim}${config.entityPlural}${colors.reset})`);
    log(`Package: ${colors.cyan}${config.packageName}${colors.reset}`);
    log(`CRUD Type: ${colors.cyan}${config.crudType}${colors.reset} (${colors.dim}${config.variant}${colors.reset})`);
    console.log();

    if (config.generateBackend) {
        log(`Backend: ${colors.green}Yes${colors.reset} (${colors.dim}Module: ${config.moduleName}${colors.reset})`);
        if (config.createMigration) {
            log(`Migration: ${colors.green}Yes${colors.reset} (${colors.dim}Will create Alembic migration${colors.reset})`);
        } else {
            log(`Migration: ${colors.red}No${colors.reset}`);
        }
    } else {
        log(`Backend: ${colors.red}No${colors.reset}`);
    }

    if (config.generateFrontend) {
        log(`Frontend: ${colors.green}Yes${colors.reset} (${colors.dim}Package: ${config.packageName}${colors.reset})`);
    } else {
        log(`Frontend: ${colors.red}No${colors.reset}`);
    }
    console.log();

    log(`Fields (${config.fields.length}):`, 'bright');
    config.fields.forEach(f => {
        const req = f.required ? '[R]' : '[O]';
        log(`  ${colors.yellow}${req}${colors.reset} ${f.name}: ${f.type}`, 'dim');
    });
    console.log();

    if (config.generateRoutes) {
        log(`Routes: ${colors.green}Yes${colors.reset} (${colors.dim}${config.parentRoute}${colors.reset})`);
    } else {
        log(`Routes: ${colors.red}No${colors.reset}`);
    }

    log(`API Endpoint: ${colors.cyan}${config.endpoint}${colors.reset}`);
    if (config.codeSequence) {
        const prefixInfo = config.codePrefix ? ` (prefix: ${config.codePrefix})` : '';
        log(`Code Sequence: ${colors.cyan}${config.codeSequence}${colors.reset}${prefixInfo}`);
    }
    console.log();
    log('═'.repeat(64), 'cyan');
    console.log();
}

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function question(rl, query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

function runScript(scriptPath, args) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath, ...args], {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
    });
}

function runPythonScript(scriptPath, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn('python3', [scriptPath, ...args], {
            stdio: 'inherit',
            shell: true,
            cwd: cwd
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });
    });
}

function pluralize(str) {
    if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
        return str + 'es';
    }
    return str + 's';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelCase(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function pascalCase(str) {
    return capitalize(camelCase(str));
}

function snakeCase(str) {
    return str.replace(/-/g, '_').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function toUpperSnakeCase(str) {
    return snakeCase(str).toUpperCase();
}

function kebabCase(str) {
    // Convert to kebab-case: replace underscores and spaces with hyphens, handle camelCase
    return str
        .replace(/([A-Z])/g, '-$1')  // Add hyphen before capital letters
        .replace(/[_\s]+/g, '-')      // Replace underscores and spaces with hyphens
        .toLowerCase()                 // Convert to lowercase
        .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
}

// Parse fields for Python backend
function parseFieldsForBackend(fields) {
    // Filter out system fields that are handled automatically
    // Note: 'code' and 'name' are hardcoded in templates, so filter them out too
    return fields
        .filter(f => !ALL_SYSTEM_FIELDS.includes(f.name))
        .map(field => {
            const fieldName = field.name;
            const fieldNameSnake = snakeCase(fieldName);
            const fieldType = field.type;

            // Map types to Python types
            let pythonType = 'str';
            let pythonOptionalType = 'Optional[str]';
            let pydanticType = 'str';
            let defaultValue = 'None';

            if (fieldType === 'number') {
                pythonType = 'float';
                pythonOptionalType = 'Optional[float]';
                pydanticType = 'float';
                defaultValue = 'None';
            } else if (fieldType === 'boolean') {
                pythonType = 'bool';
                pythonOptionalType = 'Optional[bool]';
                pydanticType = 'bool';
                defaultValue = 'False';
            } else if (fieldType === 'date') {
                pythonType = 'datetime';
                pythonOptionalType = 'Optional[datetime]';
                pydanticType = 'datetime';
                defaultValue = 'None';
            }

            return {
                name: fieldName,
                nameSnake: fieldNameSnake,
                nameCamel: camelCase(fieldName),
                type: pythonType,
                optionalType: pythonOptionalType,
                pydanticType: pydanticType,
                required: field.required,
                defaultValue: defaultValue,
                isString: fieldType === 'string',
                isNumber: fieldType === 'number',
                isBoolean: fieldType === 'boolean',
                isDate: fieldType === 'date',
            };
        });
}

// Generate backend replacements object
function generateBackendReplacements(entityName, moduleName, fields, options = {}) {
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

    const rawSequence = options.codeSequence ? options.codeSequence.toUpperCase() : '';
    const autoCodeEnabled = Boolean(options.autoCode && rawSequence);
    const codeSequenceType = autoCodeEnabled ? rawSequence : '';
    const codePrefixValue = autoCodeEnabled ? (options.codePrefix || '') : '';
    const codeDigits = options.codeDigits || 6;

    const parsedFields = parseFieldsForBackend(fields);

    const createCommandCodeField = autoCodeEnabled
        ? 'code: Optional[str] = None'
        : 'code: str';

    const createRequestCodeField = autoCodeEnabled
        ? `    code: Optional[str] = Field(None, description="${EntityName} business code (auto-generated)")`
        : `    code: str = Field(..., description="${EntityName} business code")`;

    let codeGenerationLogic;
    if (autoCodeEnabled) {
        codeGenerationLogic = [
            `        if code_value:`,
            `            existing = await self._${entityNameLower}_repository.get_by_code(tenant_id, code_value)`,
            `            if existing:`,
            `                raise BusinessRuleError(f"${EntityName} code '{code_value}' already exists")`,
            `        else:`,
            `            if not self._code_generator:`,
            `                raise RuntimeError("Code generator service is not configured for ${EntityName}")`,
            `            code_value = await self._code_generator.generate_code(`,
            `                sequence_type=${JSON.stringify(codeSequenceType)},`,
            `                prefix=${JSON.stringify(codePrefixValue)},`,
            `                digits=${codeDigits},`,
            `                description=${JSON.stringify(`${EntityName} code`)}`,
            `            )`,
        ].join('\n');
    } else {
        codeGenerationLogic = [
            `        existing = await self._${entityNameLower}_repository.get_by_code(tenant_id, code_value)`,
            `        if existing:`,
            `            raise BusinessRuleError(f"${EntityName} code '{code_value}' already exists")`,
        ].join('\n');
    }

    const codeGeneratorInitParam = autoCodeEnabled ? ', code_generator=None' : '';
    const codeGeneratorInitAssignment = autoCodeEnabled ? '\n        self._code_generator = code_generator' : '';
    const codeGeneratorContainerImport = autoCodeEnabled ? '\nfrom app.shared.services.code_generator import CodeGeneratorService' : '';
    const codeGeneratorContainerSetup = autoCodeEnabled ? '    code_generator = container.resolve(CodeGeneratorService)\n' : '';
    const codeGeneratorConstructorArg = autoCodeEnabled ? ',\n        code_generator=code_generator' : '';

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
        CreateCommandCodeField: createCommandCodeField,
        UpdateFieldsCmd: updateFieldsCmd || '',
        CreateCommandFields: createCommandFields || '',
        UpdateCommandFields: updateCommandFields || '',
        CreateEntityFields: createEntityFields || '',
        UpdateEntityFields: updateEntityFields || '',
        CreateRequestCodeField: createRequestCodeField,
        CreateRequestFields: createRequestFields || '',
        UpdateRequestFields: updateRequestFields || '',
        ResponseFields: responseFields || '',
        MapperFields: mapperFields || '',
        NormalizeMethods: normalizeMethods || '',
        ValidationMethods: validationMethods || '',
        CreateValidation: createValidation || '',
        CodeGenerationLogic: codeGenerationLogic || '',
        CodeGeneratorInitParam: codeGeneratorInitParam,
        CodeGeneratorInitAssignment: codeGeneratorInitAssignment,
        CodeGeneratorContainerImport: codeGeneratorContainerImport,
        CodeGeneratorContainerSetup: codeGeneratorContainerSetup,
        CodeGeneratorConstructorArg: codeGeneratorConstructorArg,
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
        MapperToDomainFields: (() => {
            let fields = [];
            // Add hierarchy fields for tree entities
            if (options.variant === 'tree') {
                fields.push(`            parent_${entityNameLower}_id=model.parent_${entityNameLower}_id,`);
                fields.push(`            level=model.level,`);
                fields.push(`            sort_order=model.sort_order,`);
            }
            // Add custom fields
            if (parsedFields.length > 0) {
                fields.push(...parsedFields.map(f => `            ${f.nameSnake}=model.${f.nameSnake},`));
            }
            return fields.length > 0 ? fields.join('\n') + '\n' : '';
        })(),
        MapperToModelFields: (() => {
            let fields = [];
            // Add hierarchy fields for tree entities
            if (options.variant === 'tree') {
                fields.push(`            parent_${entityNameLower}_id={{EntityNameLower}}.parent_${entityNameLower}_id,`);
                fields.push(`            level={{EntityNameLower}}.level,`);
                fields.push(`            sort_order={{EntityNameLower}}.sort_order,`);
            }
            // Add custom fields
            if (parsedFields.length > 0) {
                fields.push(...parsedFields.map(f => `            ${f.nameSnake}={{EntityNameLower}}.${f.nameSnake},`));
            }
            return fields.length > 0 ? '\n' + fields.join('\n') + '\n' : '';
        })(),
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
    // Patterns to detect:
    // - { { Key } } - spaces between braces
    // - {{ Key }} - spaces around key
    // - { {Key} } - spaces between braces
    // - {{Key }} or {{ Key}} - spaces on one side
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
    const { entityName, moduleName, fields, crudType, variant, autoCode, codeSequence, codePrefix } = config;
    const toolsDir = __dirname;
    const backendRoot = path.resolve(toolsDir, '..', 'backend');

    // Select template directory based on CRUD type
    let templateSubdir = 'basic'; // default
    if (crudType === 'full' && variant === 'tree') {
        templateSubdir = 'tree';
    } else if (crudType === 'full') {
        templateSubdir = 'advanced';
    } else if (crudType === 'basic' && variant === 'tree') {
        templateSubdir = 'tree';
    } else if (crudType === 'basic' && variant === 'datatable') {
        templateSubdir = 'basic';
    }

    const templatesDir = path.join(toolsDir, 'templates', 'unified-crud', 'backend', templateSubdir);
    const baseTemplatesDir = path.join(toolsDir, 'templates', 'unified-crud', 'backend');

    log(`Using ${templateSubdir} backend templates`, 'dim');

    const replacements = generateBackendReplacements(entityName, moduleName, fields, {
        autoCode,
        codeSequence,
        codePrefix,
        variant,
    });

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

    // Generate infrastructure files (mapper and repository use base templates, except tree uses tree-specific repository)
    const repositoryTemplate = (crudType === 'basic' && variant === 'tree')
        ? path.join(templatesDir, 'infrastructure-repository.template.py')
        : path.join(baseTemplatesDir, 'infrastructure-repository.template.py');

    const infrastructureFiles = [
        {
            template: path.join(baseTemplatesDir, 'infrastructure-mapper.template.py'),
            output: path.join(backendRoot, 'app', 'infrastructure', moduleName, `mapper_${entityName.replace(/-/g, '_')}.py`),
            dir: path.join(backendRoot, 'app', 'infrastructure', moduleName),
        },
        {
            template: repositoryTemplate,
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

// ============================================================================
// Field Parser for Non-Interactive Mode
// ============================================================================

/**
 * Parse field string from command line into field objects
 * Format: "name:type[:format][?],name2:type2..."
 * Examples:
 *   "sku:string,description:string,price:number:currency,stock_quantity:number"
 * 
 * Note: System fields (id, created_at, updated_at, etc.) should NOT be included
 * as they are automatically handled by templates
 */
function parseFieldString(fieldString) {
    if (!fieldString) {
        return [];
    }

    const fieldParts = fieldString.split(',').map(f => f.trim()).filter(Boolean);
    const fields = [];
    const systemFieldsDetected = [];

    // Fields to filter out (excluding code and name which are valid user fields)
    // code and name are hardcoded in basic-crud templates as defaults but can be user-specified
    const FIELDS_TO_FILTER = ['id', 'tenant_id', 'version', 'is_active', 'created_at', 'updated_at', 'deactivated_at'];

    for (const fieldPart of fieldParts) {
        const parts = fieldPart.split(':');
        let fieldNameRaw = parts[0].trim();

        // Check if field is optional (ends with ?)
        const isOptional = fieldNameRaw.endsWith('?');
        if (isOptional) {
            fieldNameRaw = fieldNameRaw.slice(0, -1);
        }

        const fieldName = fieldNameRaw;

        // Detect system fields and warn user (but allow code and name through)
        if (FIELDS_TO_FILTER.includes(fieldName)) {
            systemFieldsDetected.push(fieldName);
            // Skip adding system fields - they'll be handled by templates
            continue;
        }

        let fieldType = (parts[1] || 'string').trim();
        let format = null;

        // Check if there's a format specified (e.g., number:currency, date:datetime)
        if (parts.length > 2) {
            format = parts[2].trim();
        }

        // Handle optional marker on type (e.g., "field:date?")
        if (fieldType.endsWith('?')) {
            fieldType = fieldType.slice(0, -1).trim();
            // If not already marked as optional from field name, mark it now
            if (!isOptional) {
                // Note: We already have isOptional from field name, so no need to update
            }
        }

        fields.push({
            name: fieldName,
            type: fieldType,
            format: format,
            required: !isOptional
        });
    }

    // Show warning if system fields were detected
    if (systemFieldsDetected.length > 0) {
        console.log(`\n${colors.yellow}⚠ Warning: System fields detected and will be ignored:${colors.reset}`);
        systemFieldsDetected.forEach(field => {
            if (SYSTEM_AUDIT_FIELDS.includes(field)) {
                console.log(`  ${colors.dim}• ${field} (automatically added to all entities)${colors.reset}`);
            } else {
                console.log(`  ${colors.dim}• ${field} (managed by the system)${colors.reset}`);
            }
        });
        console.log(`${colors.dim}These fields are automatically included in the generated code.${colors.reset}\n`);
    }

    return fields;
}

/**
 * Helper to pluralize entity names
 */
function pluralize(str) {
    if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
        return str + 'es';
    }
    return str + 's';
}

async function main() {
    // Determine if we're in interactive or non-interactive mode
    const isInteractive = !noInteractive && (!entityNameArg || !packageArg);

    // If non-interactive mode, validate required arguments
    if (noInteractive) {
        if (!entityNameArg) {
            error('Entity name is required in non-interactive mode. Usage: node tools/create-crud-unified.cjs <entity-name> --package <name> --fields <fields> --no-interactive');
        }
        if (!packageArg) {
            error('--package is required in non-interactive mode');
        }
        if (!fieldsArg) {
            error('--fields is required in non-interactive mode');
        }
    }

    const rl = isInteractive ? createReadlineInterface() : null;

    try {
        let entityName;
        let packageName;
        let moduleName;
        let generateFrontend;
        let generateBackend;
        let crudType;
        let variant;
        let fields;
        let endpoint;
        let parentRoute;
        let generateRoutes;
        let generateViewPage;
        let createMigration;
        let codeSequence = codeSequenceArg ? codeSequenceArg.toUpperCase() : null;
        let codePrefix = codePrefixArg ?? '';

        // ============================================================================
        // Non-Interactive Mode - Use command-line arguments
        // ============================================================================
        if (!isInteractive) {
            entityName = entityNameArg;
            packageName = packageArg;
            moduleName = moduleArg || packageArg;

            // Parse fields
            fields = parseFieldString(fieldsArg);

            // Generation scope
            generateFrontend = !backendOnly;
            generateBackend = !frontendOnly;

            // CRUD type and variant
            crudType = typeArg || 'full';
            variant = variantArg || (crudType === 'basic' ? 'datatable' : 'datatable');

            // Endpoint
            endpoint = endpointArg || `/api/v1/${packageName}/${pluralize(entityName)}`;

            // Routes
            generateRoutes = generateFrontend; // Always generate routes for frontend
            parentRoute = parentRouteArg || packageName;

            // View page - default based on CRUD type
            if (viewPageArg !== null) {
                generateViewPage = viewPageArg;
            } else {
                generateViewPage = crudType === 'full';
            }

            // Migration - default is false
            if (migrationArg !== null) {
                createMigration = migrationArg;
            } else {
                createMigration = false;
            }

            // Validate entity name format
            if (!/^[a-z][a-z0-9-]*$/.test(entityName)) {
                error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
            }

            // Verify package exists if generating frontend
            if (generateFrontend) {
                const pkgDir = path.join(path.resolve(__dirname, '..', 'frontend'), 'packages', packageName);
                if (!fs.existsSync(pkgDir)) {
                    error(`Frontend package "${packageName}" does not exist. Create it first using: npm run create-package -- ${packageName}`);
                }
            }

            // Verify backend module exists if generating backend
            if (generateBackend) {
                const backendModuleDir = path.join(path.resolve(__dirname, '..', 'backend'), 'app', 'domain', moduleName);
                if (!fs.existsSync(backendModuleDir)) {
                    log(`⚠ Backend module "${moduleName}" does not exist. It will be created.`, 'yellow');
                }
            }

            log(`\n${colors.bright}Running in non-interactive mode...${colors.reset}\n`);
            log(`Entity: ${entityName}`);
            log(`Package: ${packageName}`);
            log(`Fields: ${fieldsArg}`);
            log(`CRUD Type: ${crudType}${variant !== 'datatable' ? ` (${variant})` : ''}`);
            log('');
        }
        // ============================================================================
        // Interactive Mode - Prompt for all information
        // ============================================================================
        else {
            printHeader();

            // Step 1: Entity Configuration
            printStep(1, 'Entity Configuration');

            entityName = await question(rl, `${colors.cyan}Entity name (e.g., "customer", "product"):${colors.reset} `);
            entityName = entityName.trim();

            if (!entityName || !/^[a-z][a-z0-9-]*$/.test(entityName)) {
                error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
            }

            // Package/Module name selection with available packages
            const availablePackages = getAvailablePackages();

            if (availablePackages.length > 0) {
                log('Available packages (extracted from codebase):', 'bright');
                availablePackages.forEach((pkg, index) => {
                    // Show modules for each package
                    const modules = getAvailableModulesFromPackage(pkg);
                    const modulesInfo = modules.length > 0
                        ? ` ${colors.blue}(${modules.length} module${modules.length !== 1 ? 's' : ''}: ${modules.slice(0, 3).join(', ')}${modules.length > 3 ? '...' : ''})${colors.reset}`
                        : '';
                    log(`  ${colors.cyan}${index + 1}.${colors.reset} ${colors.green}${pkg}${colors.reset}${modulesInfo}`);
                });
                log(`  ${colors.cyan}${availablePackages.length + 1}.${colors.reset} ${colors.yellow}Enter package name manually${colors.reset}`);
                console.log();

                const packageChoice = await question(rl, `${colors.cyan}Package/Module name (1-${availablePackages.length + 1} or enter name) [${availablePackages.length + 1}]:${colors.reset} `);
                const choiceNum = parseInt(packageChoice.trim());

                if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= availablePackages.length) {
                    packageName = availablePackages[choiceNum - 1];
                    success(`Selected package: ${packageName}`);

                    // Show modules in selected package
                    const modules = getAvailableModulesFromPackage(packageName);
                    if (modules.length > 0) {
                        log(`  Available modules: ${colors.cyan}${modules.join(', ')}${colors.reset}`, 'dim');
                    }
                } else {
                    // User entered a name manually
                    packageName = packageChoice.trim();
                    if (!packageName) {
                        error('Package/Module name is required');
                    }
                }
            } else {
                // No packages found, ask for manual entry
                const packageNameInput = await question(rl, `${colors.cyan}Package/Module name (e.g., "sales", "purchasing"):${colors.reset} `);
                packageName = packageNameInput.trim();

                if (!packageName) {
                    error('Package/Module name is required');
                }
            }
        }
        console.log();

        // Continue with interactive mode prompts for Step 2 onwards
        if (isInteractive) {
            // Step 2: Generation Scope
            printStep(2, 'Generation Scope');

            log('What would you like to generate?', 'bright');
            log('    1. Frontend only');
            log('    2. Backend only');
            log(`  ${colors.yellow}→${colors.reset} 3. Both frontend and backend`);
            console.log();

            const scopeChoice = await question(rl, `${colors.cyan}Select (1-3) [3]:${colors.reset} `);
            const scopeValue = scopeChoice.trim() || '3';
            generateFrontend = scopeValue === '1' || scopeValue === '3';
            generateBackend = scopeValue === '2' || scopeValue === '3';
            console.log();

            if (!generateFrontend && !generateBackend) {
                error('You must select at least one generation scope');
            }
        }

        // Verify frontend package exists if generating frontend (both modes)
        if (generateFrontend) {
            const pkgDir = path.join(path.resolve(__dirname, '..', 'frontend'), 'packages', packageName);
            if (!fs.existsSync(pkgDir)) {
                error(`Frontend package "${packageName}" does not exist. Create it first.`);
            }
            success(`Frontend package "${packageName}" exists.`);
            console.log();
        }

        // Set module name from package name if not already set
        if (!moduleName) {
            moduleName = packageName;
        }

        // For interactive mode, ask for module name
        if (isInteractive && generateBackend) {
            const moduleAnswer = await question(rl, `${colors.cyan}Backend module name [${packageName}]:${colors.reset} `);
            moduleName = moduleAnswer.trim() || packageName;

            // Verify backend module exists
            const backendModuleDir = path.join(path.resolve(__dirname, '..', 'backend'), 'app', 'domain', moduleName);
            if (!fs.existsSync(backendModuleDir)) {
                log(`\n⚠ Backend module "${moduleName}" does not exist.`, 'yellow');
                const createModule = await question(rl, `${colors.cyan}Would you like to create it? (y/n) [n]:${colors.reset} `);
                if (createModule.trim().toLowerCase() !== 'y' && createModule.trim().toLowerCase() !== 'yes') {
                    error(`Backend module "${moduleName}" does not exist. Create it first or choose a different module.`);
                }
            }
            success(`Backend module: ${moduleName}`);
            console.log();
        }

        // Step 2.5: Entity Existence Check
        console.log();
        log(`${'═'.repeat(64)}`, 'cyan');
        log(`Step 2.5: Entity Existence Check`, 'bright');
        console.log();

        const entityNameSnake = entityName.replace(/-/g, '_');
        const entityNamePlural = pluralize(entityName);
        let entityExists = false;
        const existingPaths = [];

        // Check frontend entity (check both plural and singular)
        if (generateFrontend) {
            const frontendRoot = path.resolve(__dirname, '..', 'frontend');
            const packageSrcDir = path.join(frontendRoot, 'packages', packageName, 'src');

            // Check plural form (most common)
            const frontendEntityDirPlural = path.join(packageSrcDir, entityNamePlural);
            if (fs.existsSync(frontendEntityDirPlural)) {
                entityExists = true;
                existingPaths.push(`Frontend: ${frontendEntityDirPlural}`);
            }

            // Check singular form (less common but possible)
            const frontendEntityDirSingular = path.join(packageSrcDir, entityName);
            if (fs.existsSync(frontendEntityDirSingular) && entityName !== entityNamePlural) {
                entityExists = true;
                existingPaths.push(`Frontend: ${frontendEntityDirSingular}`);
            }
        }

        // Check backend entity (check multiple locations)
        if (generateBackend) {
            const backendRoot = path.resolve(__dirname, '..', 'backend');

            // Check domain entity file
            const domainEntityFile = path.join(backendRoot, 'app', 'domain', moduleName, `${entityNameSnake}.py`);
            if (fs.existsSync(domainEntityFile)) {
                entityExists = true;
                existingPaths.push(`Backend Domain: ${domainEntityFile}`);
            }

            // Check application commands file
            const applicationCommandsFile = path.join(backendRoot, 'app', 'application', moduleName, `commands_${entityNameSnake}.py`);
            if (fs.existsSync(applicationCommandsFile)) {
                entityExists = true;
                existingPaths.push(`Backend Commands: ${applicationCommandsFile}`);
            }

            // Check presentation routes file
            const presentationRoutesFile = path.join(backendRoot, 'app', 'presentation', moduleName, `${entityNameSnake}_routes.py`);
            if (fs.existsSync(presentationRoutesFile)) {
                entityExists = true;
                existingPaths.push(`Backend Routes: ${presentationRoutesFile}`);
            }

            // Check container registration file
            const containerRegFile = path.join(backendRoot, 'app', 'shared', 'container_registrations', `${entityNameSnake}.py`);
            if (fs.existsSync(containerRegFile)) {
                entityExists = true;
                existingPaths.push(`Backend Container: ${containerRegFile}`);
            }
        }

        if (entityExists) {
            console.log();
            log(`${colors.yellow}⚠ Warning: Entity "${entityName}" already exists!${colors.reset}`, 'yellow');
            log(`\nFound existing files:`, 'bright');
            existingPaths.forEach(p => {
                log(`  ${colors.dim}• ${p}${colors.reset}`, 'dim');
            });
            console.log();
            log(`Proceeding will ${colors.red}overwrite${colors.reset} these existing files.`, 'bright');
            console.log();

            // Interactive mode: ask for confirmation
            if (isInteractive) {
                const overwriteAnswer = await question(rl, `${colors.cyan}Continue and overwrite existing files? (y/N):${colors.reset} `);
                const shouldOverwrite = overwriteAnswer.trim().toLowerCase() === 'y' || overwriteAnswer.trim().toLowerCase() === 'yes';

                if (!shouldOverwrite) {
                    log('\nGeneration cancelled. Please choose a different entity name.', 'yellow');
                    rl.close();
                    process.exit(0);
                }

                log(`\n${colors.yellow}⚠ Continuing with overwrite enabled...${colors.reset}`, 'yellow');
                console.log();
            }
            // Non-interactive mode: check --force flag
            else {
                if (!forceArg) {
                    error(`Entity "${entityName}" already exists. Use --force to overwrite existing files.`);
                }
                log(`${colors.yellow}⚠ Continuing with overwrite (--force flag enabled)...${colors.reset}`, 'yellow');
                console.log();
            }
        } else {
            success(`Entity "${entityName}" does not exist. Safe to proceed.`);
            console.log();
        }

        // Step 3: CRUD Type selection (interactive mode only)
        if (isInteractive) {
            printStep(3, 'CRUD Type');
            log('CRUD Type:', 'bright');
            log(`  ${colors.yellow}→${colors.reset} 1. Basic CRUD (List, Detail, Create, Edit, Delete)`);
            log('    2. Full CRUD (Basic + Filter, Advanced features)');
            console.log();

            const typeChoice = await question(rl, `${colors.cyan}Select (1-2) [1]:${colors.reset} `);
            crudType = typeChoice.trim() === '2' ? 'full' : 'basic';
            console.log();

            variant = 'datatable';
            if (crudType === 'basic') {
                log('Basic CRUD Variant:', 'bright');
                log(`  ${colors.yellow}→${colors.reset} 1. Datatable (Data Table - like Units of Measure)`);
                log('    2. Treelist (Tree List - like Categories)');
                console.log();

                const variantChoice = await question(rl, `${colors.cyan}Select (1-2) [1]:${colors.reset} `);
                variant = variantChoice.trim() === '2' ? 'tree' : 'datatable';
                console.log();
            }

            success(`Entity: ${entityName} (${pluralize(entityName)})`);
            if (generateFrontend) {
                success(`Package: ${packageName} (exists)`);
            }
            if (generateBackend) {
                success(`Module: ${moduleName}`);
            }
            success(`CRUD Type: ${crudType} (${variant})`);

            // Step 4: Field Configuration
            printStep(4, 'Field Configuration');

            log('Configure fields for your entity. Default fields will be added automatically.\n');
            log(`${colors.dim}Note: System fields (id, created_at, updated_at) are automatically handled and should not be included.${colors.reset}\n`);

            fields = [
                { name: 'code', type: 'string', required: true },
                { name: 'name', type: 'string', required: true },
            ];

            success('Added default fields:');
            fields.forEach(f => {
                const marker = f.required ? '[R]' : '[O]';
                log(`  - ${f.name} (${f.type}, ${f.required ? 'required' : 'optional'})`, 'dim');
            });
            log(`${colors.dim}  - created_at, updated_at (automatically added by system)${colors.reset}`, 'dim');
            console.log();

            const addMore = await question(rl, `${colors.cyan}Add more custom fields? (Y/n):${colors.reset} `);

            if (addMore.trim().toLowerCase() !== 'n') {
                console.log();
                log('Add fields one by one. Type "done" when finished.', 'yellow');
                console.log();

                let fieldIndex = 1;
                while (true) {
                    const fieldName = await question(rl, `${colors.cyan}Field ${fieldIndex} name (or 'done'):${colors.reset} `);

                    if (!fieldName.trim() || fieldName.trim().toLowerCase() === 'done') {
                        break;
                    }

                    if (!/^[a-z][a-z0-9_]*$/.test(fieldName.trim())) {
                        log('Invalid field name. Use lowercase letters, numbers, and underscores.', 'red');
                        continue;
                    }

                    // Prevent adding system fields
                    const trimmedFieldName = fieldName.trim();
                    if (ALL_SYSTEM_FIELDS.includes(trimmedFieldName)) {
                        if (SYSTEM_AUDIT_FIELDS.includes(trimmedFieldName)) {
                            log(`${colors.yellow}⚠ ${trimmedFieldName} is automatically added to all entities and should not be included.${colors.reset}`, 'yellow');
                        } else {
                            log(`${colors.yellow}⚠ ${trimmedFieldName} is a system-managed field and should not be included.${colors.reset}`, 'yellow');
                        }
                        continue;
                    }

                    log('\nField type:', 'cyan');
                    log('  1. String');
                    log('  2. Number');
                    log('  3. Date');
                    log('  4. Boolean');

                    const typeChoice = await question(rl, `\n${colors.cyan}Choose (1-4) [1]:${colors.reset} `);
                    const typeMap = { '1': 'string', '2': 'number', '3': 'date', '4': 'boolean' };
                    const fieldType = typeMap[typeChoice.trim()] || 'string';

                    const reqChoice = await question(rl, `${colors.cyan}Required? (Y/n):${colors.reset} `);
                    const required = reqChoice.trim().toLowerCase() !== 'n';

                    fields.push({ name: fieldName.trim(), type: fieldType, required });
                    success(`Added: ${fieldName.trim()} (${fieldType}${required ? ', required' : ', optional'})\n`);
                    fieldIndex++;
                }
            }

            console.log();
            success(`Total fields: ${fields.length}`);
            console.log();

            log('Field Summary:', 'bright');
            fields.forEach(f => {
                const marker = f.required ? '[R]' : '[O]';
                log(`  ${colors.yellow}${marker}${colors.reset} ${f.name}: ${f.type}`, 'dim');
            });

            if (!codeSequence) {
                console.log();
                log('Code Generation', 'bright');
                log(`${colors.dim}Configure how the entity code should be generated.${colors.reset}`);
                const autoCodeAnswer = await question(rl, `${colors.cyan}Automatically generate codes? (y/N):${colors.reset} `);
                const wantsAutoCode = autoCodeAnswer.trim().toLowerCase() === 'y' || autoCodeAnswer.trim().toLowerCase() === 'yes';

                if (wantsAutoCode) {
                    const sanitizedName = entityName.replace(/[^a-z0-9]/gi, '');
                    const defaultSequence = (sanitizedName.slice(0, 3) || sanitizedName || entityName).toUpperCase();
                    let sequenceInput = '';

                    while (!sequenceInput) {
                        const sequenceAnswer = await question(rl, `${colors.cyan}Sequence type [${defaultSequence}]:${colors.reset} `);
                        sequenceInput = (sequenceAnswer.trim() || defaultSequence).toUpperCase();
                        if (!sequenceInput) {
                            log('Sequence type is required when enabling auto code generation.', 'red');
                        }
                    }

                    codeSequence = sequenceInput;
                    const defaultPrefixSuggestion = `${codeSequence}-`;
                    log(`${colors.dim}Tip: type "none" to skip a prefix.${colors.reset}`);
                    const prefixAnswer = await question(rl, `${colors.cyan}Code prefix (optional) [${defaultPrefixSuggestion}]:${colors.reset} `);
                    const trimmedPrefix = prefixAnswer.trim();

                    if (!trimmedPrefix) {
                        codePrefix = defaultPrefixSuggestion;
                    } else if (trimmedPrefix.toLowerCase() === 'none') {
                        codePrefix = '';
                    } else {
                        codePrefix = trimmedPrefix;
                    }

                    success(`Auto code generation enabled (sequence: ${codeSequence}${codePrefix ? `, prefix: ${codePrefix}` : ''})`);
                } else {
                    log('Auto code generation disabled. Codes must be provided manually.', 'yellow');
                }
                console.log();
            }

            // Step 5: Configuration
            let promptStepNum = 5;
            // These variables are already declared at top of main()
            // Just initialize them here for interactive mode
            if (!endpoint) endpoint = '';
            if (!parentRoute) parentRoute = '';
            if (generateRoutes === undefined) generateRoutes = false;
            if (createMigration === undefined) createMigration = false;

            if (generateFrontend) {
                printStep(promptStepNum++, 'Frontend Configuration');

                const defaultEndpoint = `/api/v1/${packageName}/${pluralize(entityName)}`;
                const endpointAnswer = await question(rl, `${colors.cyan}API endpoint [${defaultEndpoint}]:${colors.reset} `);
                endpoint = endpointAnswer.trim() || defaultEndpoint;
                console.log();

                success(`API Endpoint: ${endpoint}`);
            }

            // Step 6: Routes Configuration (only if generating frontend)
            if (generateViewPage === undefined) generateViewPage = false;
            if (generateFrontend) {
                printStep(promptStepNum++, 'Routes Configuration');

                const routesAnswer = await question(rl, `${colors.cyan}Create frontend routes and pages? (Y/n):${colors.reset} `);
                generateRoutes = routesAnswer.trim().toLowerCase() !== 'n';
                console.log();

                // Parent route for routing
                if (generateRoutes) {
                    // For full CRUD, automatically use module route (no need to ask)
                    if (crudType === 'full') {
                        // Module route: e.g., sales/customer-types
                        parentRoute = packageName;
                        console.log();
                        success(`Parent route: ${parentRoute} (module route - default for full CRUD)`);
                    } else {
                        // For basic CRUD, ask about route placement
                        log('Route placement:', 'bright');
                        log(`  ${colors.yellow}→${colors.reset} 1. Module route (e.g., "${packageName}/${pluralize(entityName)}")`);
                        log(`    2. Settings route (e.g., "settings/${packageName}/${pluralize(entityName)}")`);
                        console.log();

                        const placementChoice = await question(rl, `${colors.cyan}Select route placement (1-2) [2]:${colors.reset} `);
                        const placement = placementChoice.trim() || '2';

                        if (placement === '1') {
                            // Module route: e.g., sales/customer-types
                            parentRoute = packageName;
                        } else {
                            // Settings route: e.g., settings/sales/customer-types
                            parentRoute = `settings/${packageName}`;
                        }

                        console.log();
                        success(`Parent route: ${parentRoute}`);
                    }

                    // Ask about view page (detail page)
                    // For full CRUD, automatically enable view page (no need to ask)
                    if (crudType === 'full') {
                        generateViewPage = true;
                        console.log();
                        success(`View/detail page: enabled (default for full CRUD)`);
                    } else {
                        // For basic CRUD, ask about view page
                        const promptDefault = '[N]';
                        const promptOptions = '(y/N)';

                        console.log();
                        const viewPageAnswer = await question(rl, `${colors.cyan}Create view/detail page? ${promptOptions} ${promptDefault}:${colors.reset} `);
                        const answer = viewPageAnswer.trim().toLowerCase();

                        // Default to N for basic CRUD
                        if (answer === '') {
                            generateViewPage = false;
                        } else {
                            generateViewPage = answer === 'y' || answer === 'yes';
                        }
                    }
                    console.log();

                    if (generateViewPage) {
                        success('View page will be created');
                    } else {
                        log('View page will be skipped', 'yellow');
                    }
                } else {
                    console.log();
                }
            }

            if (generateBackend) {
                printStep(promptStepNum++, 'Backend Configuration');

                if (!endpoint) {
                    const defaultEndpoint = `/api/v1/${moduleName}/${pluralize(entityName)}`;
                    const endpointAnswer = await question(rl, `${colors.cyan}API endpoint [${defaultEndpoint}]:${colors.reset} `);
                    endpoint = endpointAnswer.trim() || defaultEndpoint;
                    console.log();
                    success(`API Endpoint: ${endpoint}`);
                }

                // Ask about database migration
                console.log();
                log('Database Migration:', 'bright');
                log(`  ${colors.yellow}→${colors.reset} Create Alembic migration after backend generation?`, 'dim');
                log(`     (This will generate a migration file for the new database model)`, 'dim');
                console.log();

                const migrationAnswer = await question(rl, `${colors.cyan}Create database migration? (Y/n) [Y]:${colors.reset} `);
                // Default to true (Y) if empty, otherwise true unless explicitly 'n'
                createMigration = migrationAnswer.trim() === '' || migrationAnswer.trim().toLowerCase() !== 'n';

                if (createMigration) {
                    success('Database migration will be created after backend generation');
                } else {
                    log('Database migration will be skipped', 'yellow');
                }
                console.log();
            }
        } // End of if (isInteractive) block

        // Build config (works for both modes)
        const config = {
            entityName,
            entityPlural: pluralize(entityName),
            packageName,
            moduleName: moduleName || packageName,
            crudType,
            variant,
            generateFrontend,
            generateBackend,
            generateRoutes,
            generateViewPage,
            fields,
            endpoint,
            parentRoute,
            createMigration,
            codeSequence: codeSequence || null,
            codePrefix,
            autoCode: Boolean(codeSequence),
        };

        // Show summary and confirm (interactive mode only)
        if (isInteractive) {
            printSummary(config);

            const proceed = await question(rl, `${colors.cyan}Proceed with generation ? (Y / n) : ${colors.reset} `);

            if (proceed.trim().toLowerCase() === 'n') {
                log('\nCancelled by user.', 'yellow');
                rl.close();
                return;
            }

            rl.close();
        }

        // Start generation (both modes)
        console.log();
        log('Starting code generation...', 'bright');
        console.log();

        const toolsDir = __dirname;

        // Generate Frontend
        if (generateFrontend) {
            let createScript;

            if (crudType === 'full') {
                // create-full-crud.cjs now uses unified-crud templates (like customer entity)
                createScript = path.join(toolsDir, 'create-full-crud.cjs');
            } else if (variant === 'tree') {
                createScript = path.join(toolsDir, 'create-tree-crud.cjs');
            } else {
                createScript = path.join(toolsDir, 'create-basic-crud.cjs');
            }

            // Build field args
            const fieldArgs = fields.map(f => {
                const formatPart = f.format ? `:${f.format}` : '';
                const optionalPart = f.required ? '' : '?';
                return `${f.name}${optionalPart}:${f.type}${formatPart}`;
            }).join(',');

            // Generate Frontend CRUD Module
            log(`${colors.blue}→${colors.reset} Creating frontend ${crudType} CRUD module...`, 'bright');
            const crudArgs = [
                entityName,
                '--package', packageName,
                '--fields', fieldArgs,
                '--endpoint', endpoint,
                '--force' // Allow overwriting existing modules
            ];
            if (!generateViewPage) {
                crudArgs.push('--no-view-page');
            }
            if (config.autoCode) {
                crudArgs.push('--auto-code');
            }
            await runScript(createScript, crudArgs);

            // Generate Routes (if requested)
            if (generateRoutes) {
                const routeScript = path.join(toolsDir, 'create-route.cjs');
                log(`\n${colors.blue}→${colors.reset} Generating frontend routes...`, 'bright');
                const routeArgs = [
                    '--entity', entityName,
                    '--parent', parentRoute,
                    '--package', packageName,
                    '--no-interactive'
                ];
                if (!generateViewPage) {
                    routeArgs.push('--no-view-page');
                }
                await runScript(routeScript, routeArgs);
            }
        }

        // Generate Backend
        if (generateBackend) {
            log(`\n${colors.blue}→${colors.reset} Generating backend code...`, 'bright');
            try {
                generateBackendFiles({
                    entityName,
                    moduleName: config.moduleName,
                    fields: config.fields,
                    crudType: config.crudType,
                    variant: config.variant,
                    autoCode: config.autoCode,
                    codeSequence: config.codeSequence,
                    codePrefix: config.codePrefix,
                });
                success('Backend code generation completed');

                // Create database migration if requested
                if (config.createMigration) {
                    console.log();
                    log(`${colors.blue}→${colors.reset} Creating database migration...`, 'bright');
                    try {
                        const backendDir = path.resolve(__dirname, '..', 'backend');
                        const manageMigrationsPath = path.join(backendDir, 'manage_migrations.py');
                        const EntityName = pascalCase(entityName);
                        const migrationMessage = `Add ${EntityName} model`;

                        try {
                            await runPythonScript(manageMigrationsPath, ['create', migrationMessage], backendDir);
                            success('Database migration created successfully');
                            log(`  Migration file created in backend / alembic / versions / `, 'dim');
                        } catch (err) {
                            // Check if error is about database not being up to date
                            const errorMsg = err.message || '';
                            if (errorMsg.includes('Target database is not up to date') || errorMsg.includes('not up to date')) {
                                console.log();
                                log(`${colors.yellow}⚠️  Database is not up to date!${colors.reset} `, 'yellow');
                                log(`  There are pending migrations that need to be applied first.`, 'dim');
                                console.log();
                                log(`  ${colors.bright}To fix this:${colors.reset} `, 'bright');
                                log(`    1. Upgrade the database: `, 'dim');
                                log(`       ${colors.cyan}cd backend && python manage_migrations.py upgrade head${colors.reset} `, 'dim');
                                log(`    2. Then create the migration again`, 'dim');
                                console.log();
                                log(`  ${colors.bright}Or check the current status:${colors.reset} `, 'bright');
                                log(`      ${colors.cyan}cd backend && python manage_migrations.py current${colors.reset} `, 'dim');
                                throw err; // Re-throw to exit gracefully
                            }
                            throw err; // Re-throw other errors
                        }

                        // Ask if user wants to run the migration
                        console.log();
                        const migrationRl = createReadlineInterface();
                        try {
                            log('Database Migration:', 'bright');
                            log(`  ${colors.yellow}→${colors.reset} Would you like to apply the migration now ? `, 'dim');
                            log(`     (This will run: python manage_migrations.py upgrade head)`, 'dim');
                            console.log();

                            const runMigrationAnswer = await question(migrationRl, `${colors.cyan}Apply migration now ? (Y / n)[Y] : ${colors.reset} `);
                            const runMigration = runMigrationAnswer.trim() === '' || runMigrationAnswer.trim().toLowerCase() !== 'n';

                            if (runMigration) {
                                console.log();
                                log(`${colors.blue}→${colors.reset} Applying database migration...`, 'bright');
                                try {
                                    await runPythonScript(manageMigrationsPath, ['upgrade', 'head'], backendDir);
                                    success('Database migration applied successfully');
                                    log(`  Database is now up to date with the new ${EntityName} model`, 'dim');
                                } catch (err) {
                                    log(`Warning: Failed to apply database migration: ${err.message} `, 'yellow');
                                    console.log();
                                    log(`${colors.yellow}📋 Manual Migration Guide:${colors.reset} `, 'bright');
                                    log(`  To apply the migration manually, run: `, 'dim');
                                    log(`  ${colors.cyan}cd backend${colors.reset} `, 'dim');
                                    log(`  ${colors.cyan}python manage_migrations.py upgrade head${colors.reset} `, 'dim');
                                    console.log();
                                    log(`  Or to review the migration first: `, 'dim');
                                    log(`  ${colors.cyan}cd backend${colors.reset} `, 'dim');
                                    log(`  ${colors.cyan}python manage_migrations.py current${colors.reset} `, 'dim');
                                    log(`  ${colors.cyan}python manage_migrations.py history${colors.reset} `, 'dim');
                                }
                            } else {
                                console.log();
                                log(`${colors.yellow}📋 Migration Guide:${colors.reset} `, 'bright');
                                log(`  The migration has been created but not applied.`, 'dim');
                                console.log();
                                log(`  ${colors.bright}To apply the migration:${colors.reset} `, 'bright');
                                log(`    ${colors.cyan}cd backend${colors.reset} `, 'dim');
                                log(`    ${colors.cyan}python manage_migrations.py upgrade head${colors.reset} `, 'dim');
                                console.log();
                                log(`  ${colors.bright}To review before applying:${colors.reset} `, 'bright');
                                log(`    ${colors.cyan}cd backend${colors.reset} `, 'dim');
                                log(`    ${colors.cyan}python manage_migrations.py current${colors.reset} `, 'dim');
                                log(`    ${colors.cyan}python manage_migrations.py history${colors.reset} `, 'dim');
                                log(`    ${colors.cyan}# Review the migration file in alembic / versions / ${colors.reset} `, 'dim');
                                console.log();
                                log(`  ${colors.bright}Other useful commands:${colors.reset} `, 'bright');
                                log(`    ${colors.cyan}python manage_migrations.py downgrade - 1  ${colors.dim}# Rollback last migration${colors.reset} `, 'dim');
                                log(`    ${colors.cyan}python manage_migrations.py downgrade base${colors.dim}  # Rollback all migrations${colors.reset} `, 'dim');
                            }
                        } finally {
                            migrationRl.close();
                        }
                    } catch (err) {
                        const errorMsg = err.message || '';

                        // Check if error is about database not being up to date
                        if (errorMsg.includes('Target database is not up to date') ||
                            errorMsg.includes('not up to date') ||
                            errorMsg.includes('Database is not up to date')) {
                            console.log();
                            log(`${colors.yellow}⚠️  Database Migration Issue:${colors.reset} `, 'yellow');
                            log(`  The database has pending migrations that need to be applied first.`, 'dim');
                            log(`  Alembic requires the database to be up to date before creating new migrations.`, 'dim');
                            console.log();
                            log(`  ${colors.bright} Solution:${colors.reset} `, 'bright');
                            log(`    1. Upgrade the database to apply pending migrations: `, 'dim');
                            log(`       ${colors.cyan}cd backend${colors.reset} `, 'dim');
                            log(`       ${colors.cyan}python manage_migrations.py upgrade head${colors.reset} `, 'dim');
                            console.log();
                            log(`    2. Then run the CRUD generation again to create the migration.`, 'dim');
                            console.log();
                            log(`  ${colors.bright}To check database status:${colors.reset} `, 'bright');
                            log(`      ${colors.cyan}cd backend && python manage_migrations.py current${colors.reset} `, 'dim');
                        } else {
                            log(`Warning: Failed to create database migration: ${err.message} `, 'yellow');
                            log(`  You can create it manually later by running: `, 'dim');
                            log(`  ${colors.cyan}cd backend && python manage_migrations.py create "Add ${pascalCase(entityName)} model"${colors.reset} `, 'dim');
                        }
                    }
                }
            } catch (err) {
                log(`Error generating backend code: ${err.message} `, 'red');
                log(`Stack: ${err.stack} `, 'dim');
                throw err;
            }
        }

        console.log();
        log('═'.repeat(64), 'green');
        log(`${colors.bright}${colors.green}✓ Generation completed successfully!${colors.reset} `);
        log('═'.repeat(64), 'green');
        console.log();

        // Step 7: Show full command line for non-interactive mode
        log(`${colors.cyan}📋 Step 7: Full Command Line (Non-Interactive Mode)${colors.reset}`, 'bright');
        log('   To regenerate this CRUD without prompts, use:', 'dim');
        console.log();

        // Build the full command line
        const fieldArgs = fields.map(f => {
            return `${f.name}:${f.type}${f.required ? '' : '?'}`;
        }).join(',');

        let fullCommand = `node tools/create-crud-unified.cjs ${entityName}`;
        fullCommand += ` --package ${packageName}`;
        if (generateBackend && moduleName !== packageName) {
            fullCommand += ` --module ${moduleName}`;
        }
        fullCommand += ` --fields "${fieldArgs}"`;

        // Scope
        if (generateFrontend && !generateBackend) {
            fullCommand += ` --frontend-only`;
        } else if (!generateFrontend && generateBackend) {
            fullCommand += ` --backend-only`;
        }
        // Default is both, no need to add flag

        // CRUD type and variant
        if (crudType === 'full') {
            fullCommand += ` --type full`;
        } else {
            fullCommand += ` --type basic`;
            if (variant === 'tree') {
                fullCommand += ` --variant tree`;
            }
        }

        if (endpoint) {
            fullCommand += ` --endpoint "${endpoint}"`;
        }

        if (generateRoutes && parentRoute) {
            fullCommand += ` --parent-route "${parentRoute}"`;
        }

        if (generateRoutes && generateViewPage) {
            fullCommand += ` --view-page`;
        } else if (generateRoutes && !generateViewPage) {
            fullCommand += ` --no-view-page`;
        }

        if (createMigration) {
            fullCommand += ` --create-migration`;
        } else if (generateBackend) {
            fullCommand += ` --no-migration`;
        }
        if (config.codeSequence) {
            fullCommand += ` --code-sequence ${config.codeSequence}`;
            if (config.codePrefix) {
                fullCommand += ` --code-prefix "${config.codePrefix}"`;
            }
        }

        fullCommand += ` --force --no-interactive`;

        log(`   ${colors.bright}${colors.green}${fullCommand}${colors.reset} `);
        console.log();
        log('   Copy this command to:', 'dim');
        log('   • Regenerate after making template changes', 'dim');
        log('   • Create similar CRUDs by modifying entity/package names', 'dim');
        log('   • Add to documentation or CI/CD scripts', 'dim');
        console.log();

        log('Next steps:', 'bright');
        let stepNum = 1;
        if (generateFrontend) {
            log(`  ${stepNum++}. Review generated files in packages / ${packageName} /src/${pluralize(entityName)}/`);
            log(`  ${stepNum++}. Customize form fields and validation as needed`);
            log(`  ${stepNum++}. Test the generated components`);
            if (crudType === 'full') {
                log(`  ${stepNum++}. Register the ${capitalize(pluralize(entityName))} search in the command palette (see guide below)`);
            }
        }
        if (generateBackend) {
            log(`  ${stepNum++}. Review generated files in backend/app/domain/${config.moduleName}/`);
            log(`  ${stepNum++}. Review generated files in backend/app/application/${config.moduleName}/`);
            log(`  ${stepNum++}. Review generated files in backend/app/presentation/api/${config.moduleName}/`);
            log(`  ${stepNum++}. Follow the registration instructions below`);
            log(`  ${stepNum++}. Test the generated API endpoints`);
            console.log();

            printBackendRegistrationGuide({
                log,
                colors,
                moduleName: config.moduleName,
                entityName,
                packageName,
                parentRoute: parentRoute || config.parentRoute || packageName,
                capitalize,
                pluralize,
                toUpperSnakeCase,
                showPaletteGuide: generateFrontend && crudType === 'full',
            });

        }

        if (generateFrontend && crudType === 'full' && !generateBackend) {
            console.log();
            const entityPlural = pluralize(entityName);
            printCommandPaletteGuide({
                log,
                colors,
                packageName,
                parentRoute: parentRoute || config.parentRoute || packageName,
                entityPascal: pascalCase(entityName),
                entityPluralPascal: pascalCase(entityPlural),
                entityPluralLabel: capitalize(entityPlural),
                entityPluralKebab: kebabCase(entityPlural),
                entityCamel: camelCase(entityName),
            });
        }
        console.log();

    } catch (err) {
        try { rl.close(); } catch (e) { }
        error(err.message);
    }
}

main();
