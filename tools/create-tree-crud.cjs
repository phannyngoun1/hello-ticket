#!/usr/bin/env node

/**
 * CLI tool to scaffold Tree CRUD modules based on Store Location pattern
 * Uses template files and replaces placeholders
 * Usage: node tools/create-tree-crud.cjs <entity-name> --package <package-name> [options]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    log(`Error: ${message}`, 'red');
    process.exit(1);
}

function success(message) {
    log(message, 'green');
}

function info(message) {
    log(message, 'cyan');
}

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help flag first
if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
    console.log(`
${colors.bright}${colors.cyan}Create Tree CRUD Module CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-tree-crud -- <entity-name> --package <package-name> [options]
  npm run create-tree-crud -- --interactive
  node tools/create-tree-crud.cjs <entity-name> --package <package-name> [options]

${colors.bright}Required:${colors.reset}
  <entity-name>              Entity name (e.g., "category", "department")
  --package, -p <name>       Package name where CRUD will be created (e.g., "inventory")

${colors.bright}Options:${colors.reset}
  --fields, -f <fields>      Comma-separated list of fields (e.g., "name:string,code:string")
  --endpoint, -e <endpoint>  API endpoint path (default: pluralized entity name)
  --interactive, -i          Enable interactive mode (prompts for missing information)

${colors.bright}Examples:${colors.reset}
  npm run create-tree-crud -- category --package inventory
  npm run create-tree-crud -- --interactive
  npm run create-tree-crud -- department --package hr --fields "name:string,code:string"
`);
    process.exit(0);
}

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
const SYSTEM_STANDARD_FIELDS = ['id', 'tenant_id', 'version', 'is_active'];

/**
 * Combined list of all system fields (excluding code/name which are valid user fields)
 */
const ALL_SYSTEM_FIELDS = [...SYSTEM_AUDIT_FIELDS, ...SYSTEM_STANDARD_FIELDS];

let entityName = null;
let options = {};
let force = false;

// Check if interactive flag is present
let hasInteractiveFlag = false;
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--interactive' || args[i] === '-i') {
        hasInteractiveFlag = true;
        options.interactive = true;
        break;
    }
}

// Parse options and entity name
for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Skip interactive flag (already handled)
    if (arg === '--interactive' || arg === '-i') {
        continue;
    }

    // Check if this is a flag (starts with -- or -)
    if (arg.startsWith('--') || (arg.startsWith('-') && arg.length > 1)) {
        // It's a flag, parse accordingly
        if (arg === '--package' || arg === '-p') {
            options.package = args[++i];
        } else if (arg === '--fields' || arg === '-f') {
            options.fields = args[++i]?.split(',').map(f => f.trim()).filter(Boolean) || [];
        } else if (arg === '--endpoint' || arg === '-e') {
            options.endpoint = args[++i];
        } else if (arg === '--no-view-page') {
            options.noViewPage = true;
        } else if (arg === '--force') {
            force = true;
        }
    } else {
        // It's the entity name (first non-flag argument)
        if (!entityName) {
            entityName = arg;
        }
    }
}

// If no args provided or interactive flag is set, enable interactive mode
if (args.length === 0 || hasInteractiveFlag) {
    options.interactive = true;
}

// Helper function to create readline interface
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

// Helper function to prompt user
function question(rl, query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

// Interactive mode: prompt for missing information
async function collectInteractiveInput() {
    const rl = createReadlineInterface();
    const collected = { ...options };
    let finalEntityName = entityName;

    try {
        // Entity name
        if (!finalEntityName) {
            let name = await question(rl, `${colors.cyan}Entity name (e.g., "category", "department"):${colors.reset} `);
            name = name.trim();
            if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
                error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
            }
            finalEntityName = name;
        }

        // Package name
        if (!collected.package) {
            let pkg = await question(rl, `${colors.cyan}Package name (e.g., "inventory"):${colors.reset} `);
            pkg = pkg.trim();
            if (!pkg) {
                error('Package name is required');
            }
            collected.package = pkg;
        }

        // Verify package exists
        const pkgDir = path.join(path.resolve(__dirname, '..'), 'packages', collected.package);
        if (!fs.existsSync(pkgDir)) {
            log(`\n⚠ Package "${collected.package}" does not exist.`, 'yellow');
            const createPkg = await question(rl, `${colors.cyan}Would you like to create it first? (y/n) [n]:${colors.reset} `);
            if (createPkg.trim().toLowerCase() === 'y' || createPkg.trim().toLowerCase() === 'yes') {
                log(`\n${colors.yellow}Please create the package first:${colors.reset}`);
                log(`  ${colors.cyan}npm run create-package -- ${collected.package}${colors.reset}\n`);
                process.exit(0);
            } else {
                error(`Package "${collected.package}" does not exist. Create it first using: npm run create-package -- ${collected.package}`);
            }
        }

        // Fields - interactive collection
        if (!collected.fields || collected.fields.length === 0) {
            const fieldTypes = [
                { key: '1', value: 'string', label: 'String' },
                { key: '2', value: 'number', label: 'Number' },
                { key: '3', value: 'date', label: 'Date' },
                { key: '4', value: 'boolean', label: 'Boolean' },
            ];

            log(`\n${colors.cyan}Field Configuration${colors.reset}`);
            log(`${colors.yellow}Add fields one by one. Enter 'done' when finished, or press Enter to skip.${colors.reset}`);
            log(`${colors.dim}Note: System fields (id, created_at, updated_at) and tree fields (code, name, parent_id, level, etc.) are automatically handled and should not be included.${colors.reset}\n`);

            const fields = [];
            let fieldIndex = 1;

            while (true) {
                const fieldNameInput = await question(rl, `${colors.cyan}Field ${fieldIndex} name (or 'done' to finish):${colors.reset} `);
                const fieldName = fieldNameInput.trim();

                if (!fieldName || fieldName.toLowerCase() === 'done') {
                    break;
                }

                if (!/^[a-z][a-z0-9_]*$/.test(fieldName)) {
                    log(`${colors.red}Invalid field name. Use lowercase letters, numbers, and underscores only.${colors.reset}`, 'red');
                    continue;
                }

                // Prevent adding system fields and tree-specific reserved fields
                const treeReservedFields = ['code', 'name', 'description', 'parent_id', 'level', 'sort_order', 'is_active', 'attributes'];
                const FIELDS_TO_PREVENT = [...ALL_SYSTEM_FIELDS, ...treeReservedFields];
                
                if (FIELDS_TO_PREVENT.includes(fieldName)) {
                    if (SYSTEM_AUDIT_FIELDS.includes(fieldName)) {
                        log(`${colors.yellow}⚠ ${fieldName} is automatically added to all entities and should not be included.${colors.reset}`, 'yellow');
                    } else if (treeReservedFields.includes(fieldName)) {
                        log(`${colors.yellow}⚠ ${fieldName} is a tree-specific field that is automatically handled and should not be included.${colors.reset}`, 'yellow');
                    } else {
                        log(`${colors.yellow}⚠ ${fieldName} is a system-managed field and should not be included.${colors.reset}`, 'yellow');
                    }
                    continue;
                }

                // Show field type menu
                log(`\n${colors.cyan}Select field type for "${fieldName}":${colors.reset}`);
                fieldTypes.forEach(type => {
                    log(`  ${colors.yellow}${type.key}${colors.reset}. ${type.label}`);
                });

                const typeInput = await question(rl, `${colors.cyan}Choose type (1-4) [1]:${colors.reset} `);
                const typeChoice = typeInput.trim() || '1';
                const selectedType = fieldTypes.find(t => t.key === typeChoice) || fieldTypes[0];

                let finalFieldType = selectedType.value;
                let typeLabel = selectedType.label;

                // If number type, show number format options
                if (selectedType.value === 'number') {
                    const numberFormats = [
                        { key: '1', value: 'integer', label: 'Integer' },
                        { key: '2', value: 'decimal', label: 'Decimal/Float' },
                        { key: '3', value: 'currency', label: 'Currency' },
                        { key: '4', value: 'percentage', label: 'Percentage' },
                    ];

                    log(`\n${colors.cyan}Select number format for "${fieldName}":${colors.reset}`);
                    numberFormats.forEach(format => {
                        log(`  ${colors.yellow}${format.key}${colors.reset}. ${format.label}`);
                    });

                    const formatInput = await question(rl, `${colors.cyan}Choose format (1-4) [1]:${colors.reset} `);
                    const formatChoice = formatInput.trim() || '1';
                    const selectedFormat = numberFormats.find(f => f.key === formatChoice) || numberFormats[0];

                    finalFieldType = `number:${selectedFormat.value}`;
                    typeLabel = `${selectedType.label} (${selectedFormat.label})`;
                }

                fields.push(`${fieldName}:${finalFieldType}`);
                log(`${colors.green}✓ Added field: ${fieldName} (${typeLabel})${colors.reset}\n`);
                fieldIndex++;
            }

            collected.fields = fields;

            if (fields.length > 0) {
                log(`${colors.green}✓ Configured ${fields.length} field(s)${colors.reset}\n`);
            } else {
                log(`${colors.yellow}No fields added. Using default fields.${colors.reset}\n`);
            }
        }

        // Endpoint
        if (!collected.endpoint) {
            // Simple pluralization for prompt
            const pluralName = finalEntityName.endsWith('y')
                ? finalEntityName.slice(0, -1) + 'ies'
                : finalEntityName + 's';
            const endpointInput = await question(rl, `${colors.cyan}API endpoint path [${pluralName}]:${colors.reset} `);
            if (endpointInput.trim()) {
                collected.endpoint = endpointInput.trim();
            }
        }

        return { entityName: finalEntityName, options: collected };
    } finally {
        rl.close();
    }
}

// Validate entity name (if provided via CLI)
if (entityName && !/^[a-z][a-z0-9-]*$/.test(entityName)) {
    error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
}

// Global variables for functions to access (set after interactive input)
let packageDir;
let templatesDir;
let srcDir;
let entityDir;

// Utility functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelCase(str) {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function pluralize(str) {
    if (str.endsWith('y')) {
        return str.slice(0, -1) + 'ies';
    } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
        return str + 'es';
    }
    return str + 's';
}

function pascalCase(str) {
    return capitalize(camelCase(str));
}

function snakeCase(str) {
    // Convert kebab-case or camelCase to snake_case
    return str
        .replace(/-/g, '_')  // Replace hyphens with underscores
        .replace(/([A-Z])/g, '_$1')  // Add underscore before uppercase letters
        .toLowerCase()  // Convert to lowercase
        .replace(/^_/, '');  // Remove leading underscore if any
}

// Parse fields
function parseFields(fields) {
    // Reserved fields for tree entities - these are hardcoded in the template
    const treeReservedFields = [
        'code', 'name', 'description', 'parent_id',
        'level', 'sort_order', 'is_active', 'attributes'
    ];
    // System fields that are automatically handled
    const systemFields = ['id', 'tenant_id', 'version', 'created_at', 'updated_at', 'deactivated_at'];
    const reservedFields = [...treeReservedFields, ...systemFields];

    if (!fields || fields.length === 0) {
        // All tree fields are now hardcoded in the template
        return [];
    }

    // Track detected system/reserved fields for better warnings
    const systemFieldsDetected = [];
    const treeFieldsDetected = [];

    const filteredFields = fields.filter(field => {
        const rawName = field.split(':')[0].trim();
        // Strip optional suffix '?' if present
        const fieldName = rawName.endsWith('?') ? rawName.slice(0, -1) : rawName;

        if (systemFields.includes(fieldName)) {
            systemFieldsDetected.push(fieldName);
            return false;
        }
        if (treeReservedFields.includes(fieldName)) {
            treeFieldsDetected.push(fieldName);
            return false;
        }
        return true;
    });

    // Show warnings if system/reserved fields were detected
    if (systemFieldsDetected.length > 0 || treeFieldsDetected.length > 0) {
        console.log(`\n${colors.yellow}⚠ Warning: Reserved fields detected and will be ignored:${colors.reset}`);
        systemFieldsDetected.forEach(field => {
            if (SYSTEM_AUDIT_FIELDS.includes(field)) {
                console.log(`  ${colors.dim}• ${field} (automatically added to all entities)${colors.reset}`);
            } else {
                console.log(`  ${colors.dim}• ${field} (managed by the system)${colors.reset}`);
            }
        });
        treeFieldsDetected.forEach(field => {
            console.log(`  ${colors.dim}• ${field} (tree-specific field, automatically handled)${colors.reset}`);
        });
        console.log(`${colors.dim}These fields are automatically included in the generated code.${colors.reset}\n`);
    }

    return filteredFields
        .map((field, index) => {
            const parts = field.split(':');
            const fieldName = parts[0].trim();
            let fieldType = (parts[1] || 'string').trim();
            let format = null;

            // Handle format syntax: number:integer, date:datetime, etc.
            if (fieldType.includes(':')) {
                const formatParts = fieldType.split(':');
                fieldType = formatParts[0].trim();
                format = formatParts[1]?.trim() || null;
            }

            // Determine input type based on format
            let inputType = 'text';
            if (fieldType === 'number') {
                inputType = 'number';
            } else if (fieldType === 'date') {
                if (format === 'datetime') inputType = 'datetime-local';
                else inputType = 'date';
            }

            return {
                name: fieldName,
                type: mapTypeToTS(fieldType),
                format: format, // Store format for templates to use
                label: capitalize(fieldName.replace(/_/g, ' ')),
                placeholder: `Enter ${fieldName}`,
                required: true,
                isString: fieldType === 'string',
                isNumber: fieldType === 'number',
                isDate: fieldType === 'date',
                isBoolean: fieldType === 'boolean',
                fieldType: fieldType === 'number' ? 'string' : fieldType, // For form inputs
                inputType,
                defaultValue: fieldType === 'number' ? 'undefined' : '""',
                isSystemField: ['created_at', 'updated_at'].includes(fieldName),
            };
        });
}

function mapTypeToTS(type) {
    const typeMap = {
        'string': 'string',
        'number': 'number',
        'boolean': 'boolean',
        'date': 'string',
    };
    return typeMap[type] || 'string';
}

// Generate replacements object
function generateReplacements() {
    const EntityName = pascalCase(entityName);
    const entityNameCamel = camelCase(entityName);
    const entityNameKebab = entityName;
    const entityNameSnake = snakeCase(entityName);
    const EntityPlural = pascalCase(pluralize(entityName));
    const entityPluralCamel = camelCase(pluralize(entityName));
    const entityPluralKebab = pluralize(entityName);
    const endpoint = options.endpoint || `/api/v1/${options.package}/${entityPluralKebab}`;
    const fields = parseFields(options.fields);

    return {
        EntityName,
        entityName: entityNameCamel,
        entityNameSnake,  // snake_case version for backend field names (e.g., "test_tree")
        entityVar: entityNameCamel,  // For detail template variable name
        'entity-name': entityNameKebab,
        EntityPlural,
        entityPlural: entityPluralCamel,
        'entity-plural': entityPluralKebab,
        packageName: options.package,
        endpoint,
        fields,
    };
}

// Replace placeholders in template content
function replacePlaceholders(content, replacements) {
    let result = content;

    // Simple replacements
    Object.keys(replacements).forEach(key => {
        if (key !== 'fields') {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, replacements[key]);
        }
    });

    // Handle field loops
    if (content.includes('{{#fields}}')) {
        const fieldLoopRegex = /{{#fields}}([\s\S]*?){{\/fields}}/g;
        result = result.replace(fieldLoopRegex, (match, loopContent) => {
            return replacements.fields.map((field, index) => {
                let fieldContent = loopContent;

                // Replace field properties
                Object.keys(field).forEach(prop => {
                    const propRegex = new RegExp(`{{\\s*${prop}\\s*}}`, 'g');
                    fieldContent = fieldContent.replace(propRegex, field[prop]);
                });

                // Handle conditionals with else support
                // Regex matches: {{#if condition}} content {{/if}}
                // We use a loop to handle multiple conditionals
                const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

                fieldContent = fieldContent.replace(ifRegex, (match, condition, innerContent) => {
                    const hasElse = innerContent.includes('{{else}}');

                    if (hasElse) {
                        const parts = innerContent.split('{{else}}');
                        const truePart = parts[0];
                        const falsePart = parts.slice(1).join('{{else}}'); // Join back if multiple else (shouldn't happen usually)

                        return field[condition] ? truePart : falsePart;
                    } else {
                        return field[condition] ? innerContent : '';
                    }
                });

                // Handle unless conditionals
                const unlessRegex = /{{#unless\s+(\w+)}}([\s\S]*?){{\/unless}}/g;

                fieldContent = fieldContent.replace(unlessRegex, (match, condition, innerContent) => {
                    const hasElse = innerContent.includes('{{else}}');

                    if (hasElse) {
                        const parts = innerContent.split('{{else}}');
                        const truePart = parts[0];
                        const falsePart = parts.slice(1).join('{{else}}');

                        return !field[condition] ? truePart : falsePart;
                    } else {
                        return !field[condition] ? innerContent : '';
                    }
                });

                return fieldContent;
            }).filter(content => content.trim() !== '').join('\n');
        });
    }

    return result;
}

// Create entity directory
function createDirectories() {
    info('Creating directory structure...');
    fs.mkdirSync(entityDir, { recursive: true });
    success('✓ Directory structure created');
}

// Copy and process template files
function generateFiles() {
    info('Generating files from templates...');
    const replacements = generateReplacements();

    const templateFiles = [
        { template: 'service.template.ts', output: `${entityName}-service.ts` },
        { template: 'types.template.ts', output: 'types.ts' },
        { template: 'provider.template.tsx', output: `${entityName}-provider.tsx` },
        { template: 'hooks.template.tsx', output: `use-${pluralize(entityName)}.tsx` },
        { template: 'tree.template.tsx', output: `${entityName}-tree.tsx` },
        ...(options.noViewPage ? [] : [{ template: 'detail.template.tsx', output: `${entityName}-detail.tsx` }]),
        { template: 'management.template.tsx', output: `${entityName}-management.tsx` },
        { template: 'list-container.template.tsx', output: `${entityName}-list-container.tsx` },
        { template: 'create-dialog.template.tsx', output: `create-${entityName}-dialog.tsx` },
        { template: 'edit-dialog.template.tsx', output: `edit-${entityName}-dialog.tsx` },
        { template: 'index.template.ts', output: 'index.ts' },
    ];

    templateFiles.forEach(({ template, output }) => {
        const templatePath = path.join(templatesDir, template);
        if (!fs.existsSync(templatePath)) {
            log(`Warning: Template ${template} not found, skipping...`, 'yellow');
            return;
        }

        const templateContent = fs.readFileSync(templatePath, 'utf8');
        let processedContent = replacePlaceholders(templateContent, replacements);

        // Conditionally remove detail export from index template
        if (output === 'index.ts' && options.noViewPage) {
            // Remove the detail export line (after placeholders are replaced)
            processedContent = processedContent.replace(/export \* from ['"]\.\/[^'"]+-detail['"];\n?/g, '');
        }

        const outputPath = path.join(entityDir, output);
        fs.writeFileSync(outputPath, processedContent);
        success(`✓ ${output} created`);
    });
}

// Update types.ts (Not needed for Tree CRUD as it has its own types file usually, but we might want to export it)
// For Tree CRUD, we generated a local types.ts, so we might just need to export it from package index.

// Update package index.ts
function updatePackageIndex() {
    info('Updating package index.ts...');
    const indexPath = path.join(srcDir, 'index.ts');

    if (!fs.existsSync(indexPath)) {
        log(`Warning: index.ts not found, skipping index updates`, 'yellow');
        return;
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const entityPlural = pluralize(entityName);
    const exportLine = `export * from './${entityPlural}';`;

    // Check if already exported
    if (indexContent.includes(exportLine)) {
        log(`Info: ${entityPlural} already exported`, 'cyan');
        return;
    }

    // Append export
    const updatedContent = indexContent.trim() + '\n' + exportLine + '\n';
    fs.writeFileSync(indexPath, updatedContent);
    success('✓ package index.ts updated');
}

// Main execution
(async () => {
    try {
        // Collect interactive input if enabled or if required args are missing
        let finalEntityName = entityName;
        let finalOptions = options;

        if (options.interactive || !entityName || !options.package) {
            log(`\n${colors.bright}${colors.cyan}Interactive Mode${colors.reset}\n`);
            const collected = await collectInteractiveInput();
            finalEntityName = collected.entityName;
            finalOptions = collected.options;
        }

        // Validate entity name
        if (!finalEntityName || !/^[a-z][a-z0-9-]*$/.test(finalEntityName)) {
            error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
        }

        if (!finalOptions.package) {
            error('Package name is required');
        }

        // Update variables for use in functions
        const originalEntityName = entityName;
        const originalOptions = options;
        entityName = finalEntityName;
        options = finalOptions;

        const frontendRoot = path.resolve(__dirname, '..', 'frontend');
        packageDir = path.join(frontendRoot, 'packages', options.package);
        templatesDir = path.join(__dirname, 'templates', 'tree-crud');

        // Check if package exists
        if (!fs.existsSync(packageDir)) {
            error(`Package "${options.package}" does not exist. Create it first using: npm run create-package -- ${options.package}`);
        }

        // Check if templates directory exists
        if (!fs.existsSync(templatesDir)) {
            error(`Templates directory not found at ${templatesDir}`);
        }

        srcDir = path.join(packageDir, 'src');
        entityDir = path.join(srcDir, pluralize(entityName));

        // Check if entity already exists
        if (fs.existsSync(entityDir)) {
            if (force) {
                log(`Entity module "${entityName}" already exists. Using --force to continue...`, 'yellow');
            } else {
                error(`Entity module "${entityName}" already exists at ${entityDir}. Use --force to overwrite.`);
            }
        }

        // Show summary
        log(`\n${colors.bright}${colors.blue}Creating Tree CRUD module: ${colors.cyan}${entityName}${colors.reset} in package ${colors.cyan}@truths/${options.package}${colors.reset}\n`);
        if (finalOptions.fields && finalOptions.fields.length > 0) {
            log(`${colors.cyan}Fields:${colors.reset} ${finalOptions.fields.join(', ')}`);
        }
        if (finalOptions.endpoint) {
            log(`${colors.cyan}Endpoint:${colors.reset} ${finalOptions.endpoint}`);
        }
        log('');

        createDirectories();
        generateFiles();
        updatePackageIndex();

        // Restore original values
        entityName = originalEntityName;
        options = originalOptions;

        log(`\n${colors.bright}${colors.green}✓ Tree CRUD module created successfully!${colors.reset}\n`);
        log(`${colors.cyan}Next steps:${colors.reset}`);
        log(`  1. Review generated files in packages/${finalOptions.package}/src/${pluralize(finalEntityName)}/`);
        log(`  2. Update API endpoint in provider if different from default`);
        log(`  3. Use the generated components in your app`);
        log(`\n${colors.bright}Happy coding!${colors.reset}\n`);

    } catch (err) {
        error(err.message);
    }
})();
