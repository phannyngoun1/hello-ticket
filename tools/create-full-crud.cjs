#!/usr/bin/env node

/**
 * CLI tool to scaffold complete CRUD modules using unified-crud templates
 * Usage: node tools/create-full-crud.cjs <entity-name> --package <package-name> [options]
 * 
 * Note: This is the internal full CRUD generator. Use 'npm run create-crud -- --type full' 
 * or 'npm run create-full-crud' to access this functionality.
 * 
 * Templates: Uses templates/unified-crud/frontend (primary)
 * Backup: templates/full-crud is marked as backup and will be removed once unified-crud is validated
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
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
${colors.bright}${colors.cyan}Create CRUD Module CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-crud -- <entity-name> --package <package-name> [options]
  node tools/create-crud.cjs <entity-name> --package <package-name> [options]

${colors.bright}Required:${colors.reset}
  <entity-name>              Entity name (e.g., "product", "order", "invoice")
  --package, -p <name>       Package name where CRUD will be created (e.g., "inventory", "billing")

${colors.bright}Options:${colors.reset}
  --fields, -f <fields>      Comma-separated list of fields (e.g., "name:string,price:number,status:enum")
  --endpoint, -e <endpoint>  API endpoint path (default: pluralized entity name)
  --no-dialog                Skip generating dialog wrapper components
  --no-filter                Skip generating filter component
  --no-view-page             Skip generating view/detail page
  --auto-code                Treat "code" field as auto-generated (UI disables input)
  --force                    Overwrite existing entity module
  --interactive, -i          Enable interactive mode (prompts for missing information)

${colors.bright}Examples:${colors.reset}
  npm run create-crud -- product --package inventory
  npm run create-crud -- order --package billing --fields "total:number,status:enum"
  npm run create-crud -- invoice --package billing --endpoint invoices --fields "amount:number,dueDate:date"
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
const SYSTEM_STANDARD_FIELDS = ['id', 'tenant_id', 'version', 'is_active', 'code', 'name'];

/**
 * Combined list of all system fields
 */
const ALL_SYSTEM_FIELDS = [...SYSTEM_AUDIT_FIELDS, ...SYSTEM_STANDARD_FIELDS];

let entityName = args[0];
let options = {};
let force = false;
// Global variables for functions to access
let entityDir;
let srcDir;
let packageDir;
let templatesDir;

// Parse options
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--package' || arg === '-p') {
    options.package = args[++i];
  } else if (arg === '--fields' || arg === '-f') {
    options.fields = args[++i]?.split(',').map(f => f.trim()).filter(Boolean) || [];
  } else if (arg === '--endpoint' || arg === '-e') {
    options.endpoint = args[++i];
  } else if (arg === '--no-dialog') {
    options.noDialog = true;
  } else if (arg === '--no-filter') {
    options.noFilter = true;
  } else if (arg === '--interactive' || arg === '-i') {
    options.interactive = true;
  } else if (arg === '--force') {
    force = true;
  } else if (arg === '--no-view-page') {
    options.noViewPage = true;
  } else if (arg === '--auto-code') {
    options.autoCode = true;
  }
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
      let name = await question(rl, `${colors.cyan}Entity name (e.g., "product", "order"):${colors.reset} `);
      name = name.trim();
      if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
        error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
      }
      finalEntityName = name;
    }

    // Package name
    if (!collected.package) {
      let pkg = await question(rl, `${colors.cyan}Package name (e.g., "inventory", "billing"):${colors.reset} `);
      pkg = pkg.trim();
      if (!pkg) {
        error('Package name is required');
      }
      collected.package = pkg;
    }

    // Verify package exists
    const pkgDir = path.join(path.resolve(__dirname, '..', 'frontend'), 'packages', collected.package);
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
        { key: '5', value: 'enum', label: 'Enum' },
      ];

      log(`\n${colors.cyan}Field Configuration${colors.reset}`);
      log(`${colors.yellow}Add fields one by one. Enter 'done' when finished, or press Enter to skip.${colors.reset}`);
      log(`${colors.dim}Note: System fields (id, created_at, updated_at) are automatically handled and should not be included.${colors.reset}\n`);

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

        // Prevent adding system fields (but allow code and name as they're valid user fields)
        const FIELDS_TO_PREVENT = ['id', 'tenant_id', 'version', 'is_active', 'created_at', 'updated_at', 'deactivated_at'];
        if (FIELDS_TO_PREVENT.includes(fieldName)) {
          if (SYSTEM_AUDIT_FIELDS.includes(fieldName)) {
            log(`${colors.yellow}⚠ ${fieldName} is automatically added to all entities and should not be included.${colors.reset}`, 'yellow');
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

        const typeInput = await question(rl, `${colors.cyan}Choose type (1-5) [1]:${colors.reset} `);
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

        // If date type, show date format options
        if (selectedType.value === 'date') {
          const dateFormats = [
            { key: '1', value: 'date', label: 'Date only (YYYY-MM-DD)' },
            { key: '2', value: 'datetime', label: 'Date and Time (YYYY-MM-DD HH:mm:ss)' },
            { key: '3', value: 'timestamp', label: 'Timestamp' },
            { key: '4', value: 'iso', label: 'ISO Date String' },
          ];

          log(`\n${colors.cyan}Select date format for "${fieldName}":${colors.reset}`);
          dateFormats.forEach(format => {
            log(`  ${colors.yellow}${format.key}${colors.reset}. ${format.label}`);
          });

          const formatInput = await question(rl, `${colors.cyan}Choose format (1-4) [1]:${colors.reset} `);
          const formatChoice = formatInput.trim() || '1';
          const selectedFormat = dateFormats.find(f => f.key === formatChoice) || dateFormats[0];

          finalFieldType = `date:${selectedFormat.value}`;
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
        log(`${colors.yellow}No fields added. Using default 'name' field.${colors.reset}\n`);
      }
    }

    const hasCodeField = (collected.fields || []).some((field) => {
      const namePart = field.split(':')[0]?.trim() || '';
      return namePart.replace(/\?$/, '') === 'code';
    });

    if (hasCodeField && collected.autoCode === undefined) {
      const autoCodeInput = await question(
        rl,
        `${colors.cyan}Automatically generate codes? (y/N) [N]:${colors.reset} `
      );
      const normalized = autoCodeInput.trim().toLowerCase();
      collected.autoCode = normalized === 'y' || normalized === 'yes';
    }

    // Endpoint
    if (!collected.endpoint) {
      const endpointInput = await question(rl, `${colors.cyan}API endpoint path [${pluralize(finalEntityName)}]:${colors.reset} `);
      if (endpointInput.trim()) {
        collected.endpoint = endpointInput.trim();
      }
    }

    // Dialog options
    if (collected.noDialog === undefined) {
      const noDialogInput = await question(rl, `${colors.cyan}Skip dialog components? (y/n) [n]:${colors.reset} `);
      collected.noDialog = noDialogInput.trim().toLowerCase() === 'y' || noDialogInput.trim().toLowerCase() === 'yes';
    }

    // Filter options
    if (collected.noFilter === undefined) {
      const noFilterInput = await question(rl, `${colors.cyan}Skip filter component? (y/n) [n]:${colors.reset} `);
      collected.noFilter = noFilterInput.trim().toLowerCase() === 'y' || noFilterInput.trim().toLowerCase() === 'yes';
    }

    return { entityName: finalEntityName, options: collected };
  } finally {
    rl.close();
  }
}

// Utility functions (needed for interactive mode)
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelCase(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function pluralize(str) {
  // Simple pluralization - can be enhanced
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

function parseFields(fields) {
  const buildDefaultField = () => ({
    name: 'name',
    type: 'string',
    format: null,
    camelName: 'name',
    pascalName: 'Name',
    label: 'Name',
    placeholder: 'Enter Name',
    required: true,
    isIdentifier: false,
    isDate: false,
    isBoolean: false,
    isNumber: false,
    isString: true,
    isEmail: false,
    isPassword: false,
    isSelect: false,
    isRole: false,
    isTextArea: false,
    isBackendField: false,
    backendName: 'name',
    filterName: 'name',
    fieldType: 'string',
    inputType: 'text',
    defaultValue: '""',
    numberFormat: null,
    dateFormat: null,
    fieldSchema: 'z.string().min(1, "Name is required")',
    isOptional: false,
  });

  if (!fields || fields.length === 0) {
    return [buildDefaultField()];
  }

  // Filter out system fields (but allow code and name as they're valid user fields)
  // Fields to filter out (excluding code and name which are valid user fields)
  const FIELDS_TO_FILTER = ['id', 'tenant_id', 'version', 'is_active', 'created_at', 'updated_at', 'deactivated_at'];
  const systemFieldsDetected = [];
  const filteredFields = fields.filter(field => {
    const parts = field.split(':');
    let fieldNameRaw = parts[0].trim();
    // Remove optional marker if present
    if (fieldNameRaw.endsWith('?')) {
      fieldNameRaw = fieldNameRaw.slice(0, -1);
    }
    const fieldName = fieldNameRaw;
    
    if (FIELDS_TO_FILTER.includes(fieldName)) {
      systemFieldsDetected.push(fieldName);
      return false; // Filter out system fields
    }
    return true;
  });

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

  return filteredFields.map((field, index) => {
    const parts = field.split(':');
    let fieldNameRaw = parts[0].trim();
    let isOptional = fieldNameRaw.endsWith('?');
    if (isOptional) {
      fieldNameRaw = fieldNameRaw.slice(0, -1);
    }

    const fieldName = fieldNameRaw;
    const isCodeField = fieldName === 'code';
    const isAutoGeneratedCode = isCodeField && Boolean(options.autoCode);

    if (isAutoGeneratedCode && !isOptional) {
      isOptional = true;
    }
    let fieldType = (parts[1] || 'string').trim();
    let format = null;

    // Check if the last part (could be type or format) has optional marker
    if (!isOptional) {
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.trim().endsWith('?')) {
        isOptional = true;
      }
    }

    // Remove ? from type if present
    if (fieldType.endsWith('?')) {
      fieldType = fieldType.slice(0, -1).trim();
    }

    // Handle format syntax: number:currency, date:datetime, etc.
    if (parts.length > 2) {
      format = parts[2]?.trim().replace('?', '') || null;
    }

    // Detect special field types
    const lowerFieldName = fieldName.toLowerCase();
    const isEmail = lowerFieldName.includes('email');
    const isPassword = lowerFieldName.includes('password');
    const isSelect = fieldType === 'enum' || lowerFieldName.includes('role') || lowerFieldName.includes('status');
    const isRole = lowerFieldName === 'role' || lowerFieldName === 'base_role';
    const isBoolean = fieldType === 'boolean';
    const isNumber = fieldType === 'number';
    const isDate = fieldType === 'date';
    const isString = fieldType === 'string' || (!['number', 'boolean', 'date'].includes(fieldType) && !isSelect);
    const isTextArea = lowerFieldName.includes('description') || lowerFieldName.includes('note');

    // Determine input type based on format
    let inputType = 'text';
    if (isEmail) inputType = 'email';
    else if (isPassword) inputType = 'password';
    else if (isNumber) {
      inputType = 'number';
      if (format === 'currency') inputType = 'number';
      if (format === 'percentage') inputType = 'number';
    } else if (isDate) {
      inputType = format === 'datetime' ? 'datetime-local' : 'date';
    }

    const determineDefaultValue = () => {
      if (isNumber) {
        return isOptional ? 'undefined' : '0';
      }
      if (isBoolean) {
        return 'false';
      }
      if (isSelect) {
        return '""';
      }
      return '""';
    };

    const label = capitalize(fieldName.replace(/_/g, ' '));
    const placeholderText = isAutoGeneratedCode ? 'Auto generated' : `Enter ${label}`;
    const fieldSchema = buildFieldSchema({
      fieldType,
      isOptional,
      label,
      isSelect,
      isBoolean,
      isDate,
      isAutoGeneratedCode,
    });

    const defaultValue = isAutoGeneratedCode ? 'undefined' : determineDefaultValue();

    const createValueExpression = (() => {
      if (isAutoGeneratedCode) {
        return 'undefined';
      }
      if (isBoolean || isNumber || isDate) {
        return `data.${fieldName}`;
      }
      if (isOptional) {
        return `data.${fieldName} === "" ? null : data.${fieldName}`;
      }
      return `data.${fieldName}`;
    })();

    const updateValueExpression = (() => {
      if (isAutoGeneratedCode) {
        return 'undefined';
      }
      if (isBoolean || isNumber || isDate) {
        return `data.${fieldName}`;
      }
      if (isOptional) {
        return `data.${fieldName} === "" ? null : data.${fieldName}`;
      }
      return `data.${fieldName}`;
    })();

    const dtoType = (() => {
      if (isBoolean) return 'boolean';
      if (isNumber) return 'number';
      if (isDate) return 'string';
      return 'string';
    })();

    const serviceTransformValue = (() => {
      if (isDate) {
        return `dto.${fieldName} ? new Date(dto.${fieldName}) : undefined`;
      }
      if (isBoolean) {
        return `dto.${fieldName} ?? false`;
      }
      if (isNumber) {
        return `dto.${fieldName} ?? 0`;
      }
      if (isOptional) {
        return `dto.${fieldName} ?? null`;
      }
      return `dto.${fieldName} ?? ""`;
    })();

    const backendValue = (() => {
      if (isDate) {
        return `input.${fieldName} instanceof Date ? input.${fieldName}.toISOString() : input.${fieldName} ?? null`;
      }
      return `input.${fieldName}`;
    })();

    const tsType = mapTypeToTS(fieldType);
    // For dates, use string in input/output types since API uses ISO strings
    const tsInterfaceType = isDate ? 'string' : tsType;

    const createType = (() => {
      if (isBoolean || isNumber || isDate) {
        return tsInterfaceType;
      }
      if (isOptional) {
        return `${tsInterfaceType} | null`;
      }
      return tsInterfaceType;
    })();

    const updateType = (() => {
      if (isBoolean || isNumber || isDate) {
        return tsInterfaceType;
      }
      return `${tsInterfaceType} | null`;
    })();

    return {
      name: fieldName,
      type: tsInterfaceType, // Use TypeScript type for template compatibility (string for dates)
      format: format,
      camelName: camelCase(fieldName),
      pascalName: pascalCase(fieldName),
      label,
      placeholder: placeholderText,
      required: !isOptional,
      isIdentifier: index === 0,
      isDate,
      isBoolean,
      isNumber,
      isString,
      isEmail,
      isPassword,
      isSelect,
      isRole,
      isTextArea,
      isBackendField: false,
      backendName: fieldName,
      filterName: fieldName,
      fieldType,
      inputType,
      defaultValue,
      numberFormat: format && isNumber ? format : null,
      dateFormat: format && isDate ? format : null,
      fieldSchema,
      isOptional,
      createValueExpression,
      updateValueExpression,
      createValue: createValueExpression, // Alias for template compatibility
      updateValue: updateValueExpression, // Alias for template compatibility
      dtoType,
      serviceTransformValue,
      backendValue,
      createType,
      updateType,
      isSystemField: ['created_at', 'updated_at'].includes(fieldName),
      isCodeField,
      isAutoGeneratedCode,
    };
  });


}

function buildFieldSchema({ fieldType, isOptional, label, isSelect, isBoolean, isDate, isAutoGeneratedCode }) {
  if (isAutoGeneratedCode) {
    return 'z.string().optional()';
  }
  if (isBoolean) {
    return isOptional
      ? 'z.boolean().optional()'
      : 'z.boolean()';
  }

  if (fieldType === 'number') {
    // Use coerce with proper typing to avoid type inference issues
    return isOptional
      ? `z.coerce.number({ invalid_type_error: "${label} must be a number" }).optional()`
      : `z.coerce.number({ required_error: "${label} is required", invalid_type_error: "${label} must be a number" })`;
  }

  if (isDate) {
    return isOptional
      ? 'z.string().optional()'
      : `z.string().min(1, "${label} is required")`;
  }

  if (isSelect) {
    return isOptional
      ? 'z.string().optional()'
      : `z.string().min(1, "${label} is required")`;
  }

  return isOptional
    ? 'z.string().optional()'
    : `z.string().min(1, "${label} is required")`;
}

function mapTypeToTS(type) {
  const typeMap = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'date': 'Date',
  };
  return typeMap[type] || 'string';
}

// Generate replacements object for templates
function generateReplacements() {
  const EntityName = pascalCase(entityName);
  const entityNameCamel = camelCase(entityName);
  const entityNameKebab = entityName;
  const EntityPlural = pascalCase(pluralize(entityName));
  const entityPluralCamel = camelCase(pluralize(entityName));
  const entityPluralKebab = pluralize(entityName);
  const entityVar = generateShortName(entityName);
  const endpoint = options.endpoint || `/api/v1/${options.package}/${entityPluralKebab}`;
  const fields = parseFields(options.fields);

  // Determine features
  const hasStatus = fields.some(f => f.name === 'status' || f.name === 'is_active');
  const hasStatusActions = hasStatus;
  const hasComplexFilters = fields.length > 3;
  const hasAvatar = fields.some(f => f.name === 'avatar' || f.name === 'image');
  const hasRole = fields.some(f => f.name === 'role' || f.name === 'base_role');
  const hasLastLogin = fields.some(f => f.name === 'last_login' || f.name === 'lastLogin');
  const hasLockedUntil = fields.some(f => f.name === 'locked_until' || f.name === 'lockedUntil');
  const hasSuspendedStatus = hasStatus; // Only if status exists
  const hasPendingStatus = hasStatus; // Only if status exists
  const hasDisplayName = fields.some(f => f.name === 'name' || f.name === 'firstName' || f.name === 'first_name');
  const hasInitialsField = fields.some(f => f.name === 'firstName' || f.name === 'first_name');
  const hasDateRange = fields.some(f => f.isDate || f.name.includes('created') || f.name.includes('updated'));
  const hasActivity = false; // Can be enabled later if needed
  const hasSelectField = fields.some(f => f.isSelect);
  const hasTextArea = fields.some(f => f.isTextArea);
  const hasBooleanField = fields.some(f => f.isBoolean);
  const hasControlledField = hasSelectField || hasBooleanField; // Fields that need Controller from react-hook-form

  // Mark display field and initials field
  fields.forEach((f, index) => {
    f.index = index;
    f.isDisplayField = f.name === 'name' || f.name === 'firstName' || f.name === 'first_name' || index === 0;
    f.isInitialsField = f.name === 'firstName' || f.name === 'first_name';
    f.isFirst = index === 0;
    f.isLast = index === fields.length - 1;
  });

  const primaryField = fields.find(f => f.isDisplayField) || fields[0];
  // Add prefixedName for template compatibility
  primaryField.prefixedName = primaryField.camelName;

  const secondaryFields = fields.filter(f => f !== primaryField);
  const listColumns = secondaryFields.slice(0, 4);

  // Extract filter params
  const filterParams = fields
    .filter(f => f.name !== 'name' && f.name !== 'id' && !f.name.includes('password'))
    .map((f, index, arr) => ({
      name: f.camelName,
      type: f.type,
      filterName: f.filterName,
      isDate: f.isDate,
      isBoolean: f.isBoolean,
      index,
      isFirst: index === 0,
      isLast: index === arr.length - 1,
    }));

  const defaultRole = hasRole ? 'user' : '';



  // Generate interface content
  const FieldsInterface = fields
    .filter(f => !['created_at', 'updated_at'].includes(f.name))
    .map(f => {
      let tsType = 'string';
      if (f.type === 'number') tsType = 'number';
      if (f.type === 'date' || f.isDate) tsType = 'Date';
      if (f.type === 'boolean') tsType = 'boolean';
      if (f.type === 'enum') tsType = 'string';
      return `    ${f.camelName}: ${tsType};`;
    }).join('\n');

  const CreateFieldsInterface = fields
    .filter(f => !['created_at', 'updated_at', 'id'].includes(f.name))
    .map(f => {
      let tsType = 'string';
      if (f.type === 'number') tsType = 'number';
      if (f.type === 'date' || f.isDate) tsType = 'Date';
      if (f.type === 'boolean') tsType = 'boolean';
      if (f.type === 'enum') tsType = 'string';
      return `    ${f.camelName}${f.type === 'date' || f.isDate || f.type === 'boolean' || !f.required ? '?' : ''}: ${tsType};`;
    }).join('\n');

  const UpdateFieldsInterface = fields
    .filter(f => !['created_at', 'updated_at', 'id'].includes(f.name))
    .map(f => {
      let tsType = 'string';
      if (f.type === 'number') tsType = 'number';
      if (f.type === 'date' || f.isDate) tsType = 'Date';
      if (f.type === 'boolean') tsType = 'boolean';
      if (f.type === 'enum') tsType = 'string';
      return `    ${f.camelName}?: ${tsType};`;
    }).join('\n');

  const StatusField = hasStatus ? '    status: string;' : '';
  const StatusFilterField = hasStatus ? '    status?: string;\n' : '';
  const FilterFields = filterParams
    .filter(f => !['created_at', 'updated_at'].includes(f.name))
    .map(f => `    ${f.name}?: ${f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'};`).join('\n');

  return {
    // Core entity names - matches unified-crud template expectations
    EntityName,
    EntityNameLower: entityNameKebab, // Lowercase entity name (e.g., "test")
    entityName: entityNameCamel,
    'entity-name': entityNameKebab,

    // Plural names - matches unified-crud template expectations
    EntityPlural,
    EntityNamePlural: EntityPlural, // Alias for template compatibility (e.g., "Tests")
    EntityNamePluralLower: entityPluralKebab, // Lowercase plural (e.g., "tests")
    EntityNamePluralCamel: entityPluralCamel, // Camel case plural (e.g., "tests")
    entityPlural: entityPluralCamel,
    'entity-plural': entityPluralKebab,

    entityVar,
    packageName: options.package,
    PackageName: options.package, // Alias for template compatibility
    ParentRoute: options.package, // Used in detail page for route construction
    RoutePath: `/${options.package}/${entityPluralKebab}`, // Full route path
    IconName: 'FileText', // Default icon name (can be customized)
    endpoint,
    fields,
    hasStatus,
    hasComplexFilters,
    hasStatusActions,
    hasAvatar,
    hasRole,
    hasLastLogin,
    hasLockedUntil,
    hasSuspendedStatus,
    hasPendingStatus,
    hasDisplayName,
    hasInitialsField,
    hasDateRange,
    hasActivity,
    hasSelectField,
    hasTextArea,
    hasBooleanField,
    hasControlledField,
    filterParams,
    defaultRole,
    noDialog: options.noDialog,
    noFilter: options.noFilter,
    primaryField,
    listColumns,
    FieldsInterface,
    CreateFieldsInterface,
    UpdateFieldsInterface,
    StatusField,
    StatusFilterField,
    FilterFields,
  };
}

function generateShortName(name) {
  const parts = name.split('-');
  if (parts.length > 1) {
    return parts.map(p => p[0]).join('');
  }
  return name.substring(0, 3);
}

function getValueFromContext(context, key) {
  if (!key) {
    return undefined;
  }
  if (key === '.' || key === 'this') {
    return context;
  }

  const parts = key.split('.');
  let current = context;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function renderTemplateContent(template, context) {
  // Disabled: The auto-fix logic was too aggressive and was breaking valid templates
  // by matching JavaScript code (like .object({) followed by template directives ({{#fields}})
  // and incorrectly merging them together.
  // 
  // Since we've fixed the templates to use correct property names (isSystemField instead of 
  // isTimestampField), we no longer need this auto-fix functionality.

  const rendered = processTemplate(template, context);
  return rendered;
}

function processTemplate(template, context) {
  if (!template) {
    return '';
  }

  let result = '';
  let index = 0;

  while (index < template.length) {
    const start = template.indexOf('{{', index);
    if (start === -1) {
      result += template.slice(index);
      break;
    }

    result += template.slice(index, start);
    const end = template.indexOf('}}', start);
    if (end === -1) {
      result += template.slice(start);
      break;
    }

    const rawTag = template.slice(start + 2, end);
    let tag = rawTag.trim();

    if (!tag) {
      index = end + 2;
      continue;
    }

    if (tag.startsWith('#')) {
      const { section, nextIndex } = extractSection(template, start);
      result += renderSection(section, context);
      index = nextIndex;
      continue;
    }

    if (tag.startsWith('/')) {
      // Unexpected closing tag at this level; skip
      index = end + 2;
      continue;
    }

    if (tag === 'else') {
      // Handled within sections; skip
      index = end + 2;
      continue;
    }

    let bracePrefix = '';
    while (tag.startsWith('{')) {
      bracePrefix += '{';
      tag = tag.slice(1);
    }

    const value = getValueFromContext(context, tag);
    const renderedValue = value === undefined || value === null ? '' : `${value}`;
    result += bracePrefix + renderedValue;
    index = end + 2;
  }

  return result;
}

function parseOpeningTag(tag) {
  const trimmed = tag.trim();
  if (trimmed.startsWith('if ')) {
    return { type: 'if', key: trimmed.slice(3).trim() };
  }
  if (trimmed === 'if') {
    return { type: 'if', key: '' };
  }
  if (trimmed.startsWith('unless ')) {
    return { type: 'unless', key: trimmed.slice(7).trim() };
  }
  if (trimmed === 'unless') {
    return { type: 'unless', key: '' };
  }
  return { type: 'loop', key: trimmed };
}

function parseClosingTag(tag) {
  const trimmed = tag.trim();
  if (trimmed === 'if') {
    return { type: 'if' };
  }
  if (trimmed === 'unless') {
    return { type: 'unless' };
  }
  return { type: 'loop', key: trimmed };
}

function extractSection(template, startIndex) {
  const openEnd = template.indexOf('}}', startIndex);
  if (openEnd === -1) {
    throw new Error('Unclosed section tag');
  }

  const rawTag = template.slice(startIndex + 2, openEnd).trim();
  const opener = parseOpeningTag(rawTag.slice(1));
  const contentStart = openEnd + 2;

  let cursor = contentStart;
  const stack = [opener];
  let elseStart = -1;
  let elseEnd = -1;
  let closingStart = -1;
  let closingEnd = -1;

  while (cursor < template.length) {
    const nextStart = template.indexOf('{{', cursor);
    if (nextStart === -1) {
      throw new Error(`Unclosed section for ${rawTag}`);
    }
    const nextEnd = template.indexOf('}}', nextStart);
    if (nextEnd === -1) {
      throw new Error(`Unclosed section for ${rawTag}`);
    }

    const innerTag = template.slice(nextStart + 2, nextEnd).trim();
    if (!innerTag) {
      cursor = nextEnd + 2;
      continue;
    }

    if (innerTag.startsWith('#')) {
      const innerOpener = parseOpeningTag(innerTag.slice(1));
      stack.push(innerOpener);
    } else if (innerTag === 'else' && stack.length === 1 && stack[0].type !== 'loop') {
      elseStart = nextStart;
      elseEnd = nextEnd + 2;
    } else if (innerTag.startsWith('/')) {
      const closing = parseClosingTag(innerTag.slice(1));
      const current = stack[stack.length - 1];
      const matches = current.type === 'loop'
        ? closing.type === 'loop' && closing.key === current.key
        : closing.type === current.type;

      if (matches) {
        stack.pop();
        if (stack.length === 0) {
          closingStart = nextStart;
          closingEnd = nextEnd + 2;
          break;
        }
      }
    }

    cursor = nextEnd + 2;
  }

  if (closingStart === -1) {
    throw new Error(`Could not find closing tag for ${rawTag}`);
  }

  const truthyContent = elseStart === -1
    ? template.slice(contentStart, closingStart)
    : template.slice(contentStart, elseStart);

  const falsyContent = elseStart === -1
    ? ''
    : template.slice(elseEnd, closingStart);

  return {
    section: {
      opener,
      truthyContent,
      falsyContent,
    },
    nextIndex: closingEnd,
  };
}

function renderSection(section, context) {
  const { opener, truthyContent, falsyContent } = section;

  if (opener.type === 'loop') {
    const value = getValueFromContext(context, opener.key);

    if (Array.isArray(value)) {
      return value.map((item, index) => {
        const baseContext = typeof item === 'object' && item !== null ? item : { value: item };
        const loopContext = {
          ...context,
          ...baseContext,
        };

        if (!('this' in loopContext)) {
          loopContext.this = item;
        }
        if (!('index' in loopContext)) {
          loopContext.index = index;
        }
        if (!('isFirst' in loopContext)) {
          loopContext.isFirst = index === 0;
        }
        if (!('isLast' in loopContext)) {
          loopContext.isLast = index === value.length - 1;
        }

        return renderTemplateContent(truthyContent, loopContext);
      }).join('');
    }

    if (value && typeof value === 'object') {
      return renderTemplateContent(truthyContent, { ...context, ...value });
    }

    if (value) {
      return renderTemplateContent(truthyContent, context);
    }

    return '';
  }

  if (opener.type === 'if' || opener.type === 'unless') {
    const value = getValueFromContext(context, opener.key);
    const shouldRender = opener.type === 'if' ? !!value : !value;
    const segment = shouldRender ? truthyContent : falsyContent;
    return renderTemplateContent(segment, context);
  }

  return '';
}

// Replace placeholders in template content
function replacePlaceholders(content, replacements) {
  return renderTemplateContent(content, replacements);
}

// Try to use template, fallback to inline generation
function generateFromTemplate(templateName, outputName, fallbackFn) {
  const templatePath = path.join(templatesDir, templateName);
  if (fs.existsSync(templatePath)) {
    try {
      const replacements = generateReplacements();
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const processedContent = replacePlaceholders(templateContent, replacements);
      fs.writeFileSync(path.join(entityDir, outputName), processedContent);
      success(`✓ ${outputName} created from template`);
      return true;
    } catch (err) {
      log(`Warning: Error processing template ${templateName}, using fallback: ${err.message}`, 'yellow');
    }
  }
  // Use fallback
  if (fallbackFn) {
    fallbackFn();
    return false;
  }
  return false;
}

// Create entity directory
function createDirectories() {
  info('Creating directory structure...');
  fs.mkdirSync(entityDir, { recursive: true });
  success('✓ Directory structure created');
}

// Generate index.ts
function generateIndex() {
  info('Generating index.ts...');
  generateFromTemplate('index.template.ts', 'index.ts', () => {
    // Fallback inline generation
    const EntityName = pascalCase(entityName);
    const entityNamePlural = pluralize(entityName);
    const indexContent = `/**
 * ${capitalize(entityName)} Management Components
 */

export * from './${entityName}-list';
export * from './${entityName}-detail';
export * from './create-${entityName}';
${!options.noDialog ? `export * from './create-${entityName}-dialog';` : ''}
export * from './edit-${entityName}';
${!options.noDialog ? `export * from './edit-${entityName}-dialog';` : ''}
export * from './${entityName}-service';
export * from './use-${entityNamePlural}';
export * from './${entityName}-provider';
export * from './${entityName}-list-container';
${!options.noFilter ? `export * from './${entityName}-filter-sheet';` : ''}
`;

    fs.writeFileSync(path.join(entityDir, 'index.ts'), indexContent);
    success('✓ index.ts created');
  });
}

// Generate service file
function generateService() {
  info('Generating service file...');
  const entityNamePlural = pluralize(entityName);
  const outputName = `${entityName}-service.ts`;

  if (generateFromTemplate('service.template.ts', outputName, null)) {
    return; // Template was used successfully
  }

  // Fallback to inline generation
  const EntityName = pascalCase(entityName);
  const endpoint = options.endpoint || entityNamePlural;
  const CreateEntityInput = `Create${EntityName}Input`;
  const UpdateEntityInput = `Update${EntityName}Input`;
  const EntityFilter = `${EntityName}Filter`;

  const fields = options.fields ? parseFields(options.fields) : [
    { name: 'name', type: 'string', camelName: 'name', pascalName: 'Name' },
  ];

  // Generate DTO interface based on fields
  const dtoFields = fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    if (f.type === 'date') return `    ${f.name}?: string;`;
    if (f.type === 'enum') return `    ${f.name}?: string;`;
    if (f.type === 'number') return `    ${f.name}?: number;`;
    return `    ${f.name}?: string;`;
  });

  const serviceContent = `/**
 * ${EntityName} Service
 * 
 * Encapsulates all ${entityName}-related API operations
 * Handles data transformation between backend and frontend types
 */

import { ${EntityName}, ${CreateEntityInput}, ${UpdateEntityInput}, ${EntityFilter} } from '../types';
import { ServiceConfig, PaginatedResponse } from '@truths/shared';

// ${EntityName} DTO - Data Transfer Object matching API response format
interface ${EntityName}DTO {
    id: string;
${dtoFields.join('\n')}
    created_at?: string;
    updated_at?: string;
}

// Transform ${entityName} DTO to frontend ${EntityName} type
function transform${EntityName}(dto: ${EntityName}DTO): ${EntityName} {
    const parseDate = (dateStr?: string): Date | undefined => {
        if (!dateStr) return undefined;
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
        } catch {
            return undefined;
        }
    };

    return {
        id: dto.id,
${fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    if (f.type === 'date') {
      return `        ${f.camelName}: parseDate(dto.${f.name}),`;
    }
    return `        ${f.camelName}: dto.${f.name} || ${f.type === 'number' ? '0' : "''"},`;
  }).join('\n')}
        createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
        updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined,
    };
}

// Transform frontend ${entityName} to backend request
function transformToBackend(entity: ${CreateEntityInput} | ${UpdateEntityInput}): any {
    const result: any = {};

${fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    if (f.type === 'date') {
      return `    if ('${f.camelName}' in entity && entity.${f.camelName}) result.${f.name} = entity.${f.camelName}.toISOString();`;
    }
    return `    if ('${f.camelName}' in entity && entity.${f.camelName} !== undefined) result.${f.name} = entity.${f.camelName};`;
  }).join('\n')}

    return result;
}

// ${EntityName} service specific endpoints
interface ${EntityName}Endpoints extends Record<string, string> {
    ${entityNamePlural}: string;
}

export type ${EntityName}ServiceConfig = ServiceConfig<${EntityName}Endpoints>;

export class ${EntityName}Service {
    private config: ${EntityName}ServiceConfig;

    constructor(config: ${EntityName}ServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch paginated list of ${entityNamePlural}
     */
    async fetch${capitalize(entityNamePlural)}(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        [key: string]: any;
    }): Promise<PaginatedResponse<${EntityName}>> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.${entityNamePlural} || '${endpoint}';

        const queryParams = new URLSearchParams();
        if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const url = \`\${endpoint}?\${queryParams.toString()}\`;
        
        const { data } = await apiClient.get<any>(url);
        return {
            data: data.items?.map(transform${EntityName}) || [],
            pagination: {
                page: Math.floor((params?.skip || 0) / (params?.limit || 50)) + 1,
                pageSize: params?.limit || 50,
                total: data.total,
                totalPages: data.total_pages,
            },
        };
    }

    /**
     * Fetch a single ${entityName} by ID
     */
    async fetch${EntityName}(id: string): Promise<${EntityName}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.${entityNamePlural} || '${endpoint}';
        const { data } = await apiClient.get<any>(\`\${endpoint}/\${id}\`);
        return transform${EntityName}(data);
    }

    /**
     * Create a new ${entityName}
     */
    async create${EntityName}(input: ${CreateEntityInput}): Promise<${EntityName}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.${entityNamePlural} || '${endpoint}';
        const payload = transformToBackend(input);
        const { data } = await apiClient.post<any>(endpoint, payload);
        return transform${EntityName}(data);
    }

    /**
     * Update an existing ${entityName}
     */
    async update${EntityName}(id: string, input: ${UpdateEntityInput}): Promise<${EntityName}> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.${entityNamePlural} || '${endpoint}';
        const payload = transformToBackend(input);
        const { data } = await apiClient.put<any>(\`\${endpoint}/\${id}\`, payload);
        return transform${EntityName}(data);
    }

    /**
     * Delete a ${entityName}
     */
    async delete${EntityName}(id: string): Promise<void> {
        const { apiClient, endpoints } = this.config;
        const endpoint = endpoints?.${entityNamePlural} || '${endpoint}';
        await apiClient.delete(\`\${endpoint}/\${id}\`);
    }
}
`;

  fs.writeFileSync(path.join(entityDir, `${entityName}-service.ts`), serviceContent);
  success('✓ Service file created');
}

// Generate hooks file
function generateHooks() {
  info('Generating hooks file...');
  const entityNamePlural = pluralize(entityName);
  const outputName = `use-${entityNamePlural}.tsx`;

  if (generateFromTemplate('hooks.template.tsx', outputName, null)) {
    return; // Template was used successfully
  }

  // Fallback to inline generation
  const EntityName = pascalCase(entityName);
  const CreateEntityInput = `Create${EntityName}Input`;
  const UpdateEntityInput = `Update${EntityName}Input`;
  const EntityFilter = `${EntityName}Filter`;
  const ServiceName = `${EntityName}Service`;
  const hookName = `use${capitalize(entityNamePlural)}`;
  const useEntityHook = `use${EntityName}`;
  const createHook = `useCreate${EntityName}`;
  const updateHook = `useUpdate${EntityName}`;
  const deleteHook = `useDelete${EntityName}`;

  const hooksContent = `/**
 * ${EntityName} Hooks
 *
 * React Query hooks for ${entityName} operations
 * Provides data fetching, mutations, and query management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ${EntityName},
  ${CreateEntityInput},
  ${UpdateEntityInput},
  ${EntityFilter},
} from "../types";
import type { Pagination, PaginatedResponse } from "@truths/shared";
import type { ${ServiceName} } from "./${entityName}-service";

export interface Use${capitalize(entityNamePlural)}Params {
  filter?: ${EntityFilter};
  pagination?: Pagination;
}

export function ${hookName}(service: ${ServiceName}, params?: Use${capitalize(entityNamePlural)}Params) {
  const { filter, pagination } = params || {};

  return useQuery<PaginatedResponse<${EntityName}>>({
    queryKey: [
      "${entityNamePlural}",
      filter?.search,
      pagination?.page,
      pagination?.pageSize,
    ],
    queryFn: () => {
      const skip = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
      const limit = pagination?.pageSize || 50;

      return service.fetch${capitalize(entityNamePlural)}({
        skip,
        limit,
        search: filter?.search,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function ${useEntityHook}(service: ${ServiceName}, ${entityName}Id: string | null) {
  return useQuery<${EntityName}>({
    queryKey: ["${entityName}", ${entityName}Id],
    queryFn: () =>
      ${entityName}Id ? service.fetch${EntityName}(${entityName}Id) : Promise.resolve(null as any),
    enabled: !!${entityName}Id,
    staleTime: 5 * 60 * 1000,
  });
}

export function ${createHook}(service: ${ServiceName}) {
  const queryClient = useQueryClient();

  return useMutation<${EntityName}, Error, ${CreateEntityInput}>({
    mutationFn: (input) => service.create${EntityName}(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${entityNamePlural}"] });
    },
  });
}

export function ${updateHook}(service: ${ServiceName}) {
  const queryClient = useQueryClient();

  return useMutation<${EntityName}, Error, { id: string; input: ${UpdateEntityInput} }>({
    mutationFn: ({ id, input }) => service.update${EntityName}(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["${entityNamePlural}"] });
      queryClient.invalidateQueries({ queryKey: ["${entityName}", data.id] });
    },
  });
}

export function ${deleteHook}(service: ${ServiceName}) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => service.delete${EntityName}(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["${entityNamePlural}"] });
    },
  });
}
`;

  fs.writeFileSync(path.join(entityDir, `use-${entityNamePlural}.tsx`), hooksContent);
  success('✓ Hooks file created');
}

// Generate provider file
function generateProvider() {
  info('Generating provider file...');
  const outputName = `${entityName}-provider.tsx`;

  if (generateFromTemplate('provider.template.tsx', outputName, null)) {
    return; // Template was used successfully
  }

  // Fallback to inline generation
  const EntityName = pascalCase(entityName);
  const ServiceName = `${EntityName}Service`;
  const ConfigName = `${EntityName}ServiceConfig`;
  const ProviderName = `${EntityName}Provider`;
  const useServiceHook = `use${EntityName}Service`;

  const providerContent = `/**
 * ${EntityName} Provider
 *
 * Provides configured ${ServiceName} to all child components
 * Makes the service available via ${useServiceHook} hook
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import { ${ServiceName}, type ${ConfigName} } from "./${entityName}-service";

interface ${EntityName}ContextType {
  ${entityName}Service: ${ServiceName};
}

const ${EntityName}Context = createContext<${EntityName}ContextType | undefined>(undefined);

export interface ${ProviderName}Props {
  children: ReactNode;
  config: ${ConfigName};
}

export function ${ProviderName}({ children, config }: ${ProviderName}Props) {
  const ${entityName}Service = useMemo(
    () => new ${ServiceName}(config),
    [config.apiClient, config.endpoints?.${pluralize(entityName)}]
  );

  return (
    <${EntityName}Context.Provider value={{ ${entityName}Service }}>
      {children}
    </${EntityName}Context.Provider>
  );
}

export function ${useServiceHook}(): ${ServiceName} {
  const context = useContext(${EntityName}Context);
  if (!context) {
    throw new Error("${useServiceHook} must be used within a ${ProviderName}");
  }
  return context.${entityName}Service;
}
`;

  fs.writeFileSync(path.join(entityDir, `${entityName}-provider.tsx`), providerContent);
  success('✓ Provider file created');
}

// Generate basic components (stubs for now - can be enhanced)
function generateBasicComponents() {
  info('Generating component files...');
  const EntityName = pascalCase(entityName);
  const entityNamePlural = pluralize(entityName);

  // Generate shared form first
  if (!generateFromTemplate('form.template.tsx', `${entityName}-form.tsx`, () => {
    const formContent = `/**
 * ${EntityName} Form
 *
 * TODO: Replace with implementation.
 */

import { forwardRef } from "react";

export interface ${EntityName}FormProps {
  onSubmit: () => void;
}

export const ${EntityName}Form = forwardRef<HTMLFormElement, ${EntityName}FormProps>(
  function ${EntityName}Form({ onSubmit }, ref) {
    return (
      <form ref={ref} onSubmit={onSubmit}>
        <div>${EntityName} form placeholder</div>
      </form>
    );
  }
);
`;
    fs.writeFileSync(path.join(entityDir, `${entityName}-form.tsx`), formContent);
    success('✓ Form component created (stub)');
  })) {
    // Template already handled logging
  }

  // Determine display field for list items
  const fields = options.fields ? parseFields(options.fields) : [
    { name: 'name', type: 'string', camelName: 'name', pascalName: 'Name' },
  ];
  const hasNameField = fields.some(f => f.name === 'name');
  const hasCodeField = fields.some(f => f.name === 'code');
  const displayField = hasNameField ? 'name' : hasCodeField ? 'code' : 'id';
  const displayExpression = hasNameField
    ? `${entityName}.name || ${entityName}.code || ${entityName}.id`
    : hasCodeField
      ? `${entityName}.code || ${entityName}.id`
      : `${entityName}.id`;

  // Generate list component - try template first
  if (!generateFromTemplate('list.template.tsx', `${entityName}-list.tsx`, () => {
    // Fallback stub
    const listContent = `/**
 * ${EntityName} List Component
 *
 * Displays a list of ${entityNamePlural} with search, filtering, and actions
 */

import { ${EntityName} } from "../types";

export interface ${EntityName}ListProps {
  ${entityNamePlural}?: ${EntityName}[];
  loading?: boolean;
  error?: Error | null;
  on${EntityName}Click?: (${entityName}: ${EntityName}) => void;
  onEdit?: (${entityName}: ${EntityName}) => void;
  onDelete?: (${entityName}: ${EntityName}) => void;
  searchable?: boolean;
  className?: string;
}

export function ${EntityName}List({
  ${entityNamePlural} = [],
  loading = false,
  error = null,
  on${EntityName}Click,
  onEdit,
  onDelete,
  searchable = true,
  className,
}: ${EntityName}ListProps) {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className={className}>
      <h2>${capitalize(entityNamePlural)}</h2>
      {searchable && (
        <div>
          {/* TODO: Implement search input */}
          <input
            type="search"
            placeholder="Search ${entityNamePlural}..."
            disabled
            style={{ opacity: 0.5 }}
          />
        </div>
      )}
      {${entityNamePlural}.length === 0 ? (
        <p>No ${entityNamePlural} found</p>
      ) : (
        <ul>
          {${entityNamePlural}.map((${entityName}) => (
            <li key={${entityName}.id}>
              <button onClick={() => on${EntityName}Click?.(${entityName})}>
                {${displayExpression}}
              </button>
              {onEdit && (
                <button onClick={() => onEdit(${entityName})}>Edit</button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(${entityName})}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
`;
    fs.writeFileSync(path.join(entityDir, `${entityName}-list.tsx`), listContent);
    success('✓ List component created (stub)');
  }));

  // Generate other component files - try templates first
  const componentFiles = [
    { template: 'detail.template.tsx', output: `${entityName}-detail.tsx` },
    { template: 'create.template.tsx', output: `create-${entityName}.tsx` },
    { template: 'edit.template.tsx', output: `edit-${entityName}.tsx` },
  ];

  if (!options.noDialog) {
    componentFiles.push(
      { template: 'create-dialog.template.tsx', output: `create-${entityName}-dialog.tsx` },
      { template: 'edit-dialog.template.tsx', output: `edit-${entityName}-dialog.tsx` }
    );
  }

  componentFiles.forEach(({ template, output }) => {
    const type = output.includes('detail') ? 'Detail' :
      output.includes('create') ? 'Create' :
        output.includes('edit') ? 'Edit' : 'Dialog';

    if (!generateFromTemplate(template, output, () => {
      // Fallback stub
      const stubContent = `/**
 * ${type} ${EntityName} Component
 *
 * TODO: Implement this component
 */

// TODO: Implement this component
export function ${pascalCase(output.replace('.tsx', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g, ''))}() {
  return <div>${type} ${EntityName} Component - TODO: Implement</div>;
}
`;
      fs.writeFileSync(path.join(entityDir, output), stubContent);
      success(`✓ ${output} created (stub)`);
    }));
  });

  // Generate list container - try template first
  if (!generateFromTemplate('list-container.template.tsx', `${entityName}-list-container.tsx`, () => {
    // Fallback stub
    const containerContent = `/**
 * ${EntityName} List Container
 *
 * Container component that integrates ${EntityName}List with data fetching and mutations
 */

import { useState } from "react";
import { ${EntityName}List } from "./${entityName}-list";
import { use${capitalize(entityNamePlural)}, useDelete${EntityName} } from "./use-${entityNamePlural}";
import { use${EntityName}Service } from "./${entityName}-provider";
import { ${EntityName}Filter } from "../types";
import { Pagination } from "@truths/shared";

export interface ${EntityName}ListContainerProps {
  onNavigateTo${EntityName}?: (${entityName}Id: string) => void;
}

export function ${EntityName}ListContainer({
  onNavigateTo${EntityName},
}: ${EntityName}ListContainerProps) {
  const ${entityName}Service = use${EntityName}Service();
  const [filter, _setFilter] = useState<${EntityName}Filter>({});
  const [pagination, _setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
  });

  const { data, isLoading, error } = use${capitalize(entityNamePlural)}(${entityName}Service, {
    filter,
    pagination,
  });

  const _deleteMutation = useDelete${EntityName}(${entityName}Service);

  const ${entityNamePlural} = data?.data || [];

  return (
    <${EntityName}List
      ${entityNamePlural}={${entityNamePlural}}
      loading={isLoading}
      error={error}
      on${EntityName}Click={(item) => onNavigateTo${EntityName}?.(item.id)}
    />
  );
}
`;
    fs.writeFileSync(path.join(entityDir, `${entityName}-list-container.tsx`), containerContent);
    success('✓ List container created (stub)');
  }));

  if (!options.noFilter) {
    // Try template first
    if (!generateFromTemplate('filter-sheet.template.tsx', `${entityName}-filter-sheet.tsx`, () => {
      // Fallback stub
      const filterContent = `/**
 * ${EntityName} Filter Sheet
 *
 * Component for filtering ${entityNamePlural}
 */

import { ${EntityName}Filter } from "../types";

export interface ${EntityName}FilterSheetProps {
  filter: ${EntityName}Filter;
  onFilterChange: (filter: ${EntityName}Filter) => void;
  onClose: () => void;
}

export function ${EntityName}FilterSheet(_: ${EntityName}FilterSheetProps) {
  // TODO: Implement filter UI
  return <div>Filter Sheet - TODO: Implement</div>;
}
`;
      fs.writeFileSync(path.join(entityDir, `${entityName}-filter-sheet.tsx`), filterContent);
      success('✓ Filter sheet created (stub)');
    }));
  }

  success('✓ Component files created');
}

// Create entity-specific types.ts file (instead of modifying package types.ts)
function createEntityTypesFile() {
  info('Creating entity types.ts...');
  const typesPath = path.join(entityDir, 'types.ts');

  const EntityName = pascalCase(entityName);
  const entityNamePlural = pluralize(entityName);
  const fields = options.fields ? parseFields(options.fields) : [
    { name: 'name', type: 'string', camelName: 'name', pascalName: 'Name' },
  ];

  const entityType = `/**
 * ${EntityName} Types
 * 
 * This file contains all TypeScript types and interfaces for the ${EntityName} entity.
 * Types are co-located with the entity for better maintainability.
 * 
 * IMPORTANT: Do NOT duplicate these types in the package-level types.ts file.
 * The package types.ts should only contain shared types used across multiple entities.
 * These entity-specific types are automatically exported via the entity's index.ts.
 */

export interface ${EntityName} {
    id: string;
${fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    let tsType = 'string';
    if (f.type === 'number') tsType = 'number';
    if (f.type === 'date') tsType = 'Date';
    if (f.type === 'boolean') tsType = 'boolean';
    if (f.type === 'enum') tsType = 'string';
    const optional = f.isOptional ? '?' : '';
    return `    ${f.camelName}${optional}: ${tsType};`;
  }).join('\n')}
    created_at: Date;
    updated_at?: Date;
}

export interface Create${EntityName}Input {
${fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    let tsType = 'string';
    if (f.type === 'number') tsType = 'number';
    if (f.type === 'date') tsType = 'string';
    if (f.type === 'boolean') tsType = 'boolean';
    if (f.type === 'enum') tsType = 'string';
    const optional = f.isOptional ? '?' : '';
    return `    ${f.camelName}${optional}: ${tsType};`;
  }).join('\n')}
}

export interface Update${EntityName}Input {
${fields.filter(f => !f.isSystemField && f.name !== 'created_at' && f.name !== 'updated_at').map(f => {
    let tsType = 'string';
    if (f.type === 'number') tsType = 'number';
    if (f.type === 'date') tsType = 'string';
    if (f.type === 'boolean') tsType = 'boolean';
    if (f.type === 'enum') tsType = 'string';
    return `    ${f.camelName}?: ${tsType};`;
  }).join('\n')}
}

export interface ${EntityName}Filter {
    search?: string;
    createdAfter?: string;
    createdBefore?: string;
}
`;

  fs.writeFileSync(typesPath, entityType);
  success(`✓ Entity types.ts created at ${entityNamePlural}/types.ts`);
}

// Update package index.ts to export the new entity module
function updatePackageIndex() {
  info('Updating package index.ts...');
  const indexPath = path.join(srcDir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    info('index.ts not found, skipping index updates');
    return;
  }

  const entityNamePlural = pluralize(entityName);
  const exportLine = `export * from './${entityNamePlural}';`;

  // Read existing index file
  const existingIndex = fs.readFileSync(indexPath, 'utf8');

  // Check if already exported
  if (existingIndex.includes(exportLine)) {
    info('Entity already exported, skipping');
    return;
  }

  // Find a good insertion point - after other feature exports, before component registration
  const registerMatch = existingIndex.match(/\n\/\/ Register all/);
  if (registerMatch) {
    const insertIndex = registerMatch.index;
    const before = existingIndex.substring(0, insertIndex);
    const after = existingIndex.substring(insertIndex);
    const capitalizedEntity = capitalize(entityNamePlural);
    fs.writeFileSync(indexPath, before + `\n// ${capitalizedEntity} Management\nexport * from './${entityNamePlural}';\n` + after);
  } else {
    // Append at the end if no registration section found
    fs.appendFileSync(indexPath, '\n' + exportLine + '\n');
  }

  success('✓ Package index.ts updated');
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
    const pkgDir = path.join(frontendRoot, 'packages', options.package);

    // Use unified-crud templates (primary templates for full CRUD)
    // NOTE: templates/full-crud is marked as BACKUP and will be removed once unified-crud is fully validated
    const tmplDir = path.join(__dirname, 'templates', 'unified-crud', 'frontend');

    if (!fs.existsSync(tmplDir)) {
      error(`Unified CRUD templates not found at ${tmplDir}. Please ensure templates/unified-crud/frontend exists.`);
    }

    log(`Using unified-crud templates`, 'dim');

    // Check if package exists
    if (!fs.existsSync(pkgDir)) {
      error(`Package "${options.package}" does not exist. Create it first using: npm run create-package -- ${options.package}`);
    }

    const srcDirPath = path.join(pkgDir, 'src');
    const entityDirPath = path.join(srcDirPath, pluralize(entityName));

    // Check if entity already exists
    if (fs.existsSync(entityDirPath)) {
      if (force) {
        log(`Entity module "${entityName}" already exists. Using --force to continue...`, 'yellow');
      } else {
        error(`Entity module "${entityName}" already exists at ${entityDirPath}. Use --force to overwrite.`);
      }
    }

    // Set global variables for functions (they use these as closures)
    packageDir = pkgDir;
    templatesDir = tmplDir;
    srcDir = srcDirPath;
    entityDir = entityDirPath;

    // Show summary
    log(`\n${colors.bright}${colors.blue}Creating CRUD module: ${colors.cyan}${entityName}${colors.reset} in package ${colors.cyan}@truths/${options.package}${colors.reset}\n`);
    if (finalOptions.fields && finalOptions.fields.length > 0) {
      log(`${colors.cyan}Fields:${colors.reset} ${finalOptions.fields.join(', ')}`);
    }
    if (finalOptions.endpoint) {
      log(`${colors.cyan}Endpoint:${colors.reset} ${finalOptions.endpoint}`);
    }
    if (finalOptions.autoCode) {
      log(`${colors.cyan}Auto code:${colors.reset} Enabled (code input disabled in UI)`);
    }
    if (finalOptions.noDialog) {
      log(`${colors.cyan}Skip Dialogs:${colors.reset} Yes`);
    }
    if (finalOptions.noFilter) {
      log(`${colors.cyan}Skip Filter:${colors.reset} Yes`);
    }
    log('');

    createDirectories();
    generateIndex();
    generateService();
    generateHooks();
    generateProvider();
    generateBasicComponents();
    createEntityTypesFile();
    updatePackageIndex();

    // Restore original values
    entityName = originalEntityName;
    options = originalOptions;

    log(`\n${colors.bright}${colors.green}✓ CRUD module created successfully!${colors.reset}\n`);
    log(`${colors.cyan}Next steps:${colors.reset}`);
    log(`  1. Implement the component files in packages/${finalOptions.package}/src/${pluralize(finalEntityName)}/`);
    log(`  2. Use the generated hooks and service in your components`);
    log(`  3. Entity types are in ${pluralize(finalEntityName)}/types.ts (do NOT duplicate in package types.ts)`);
    log(`\n${colors.dim}Note: Package types.ts is only for shared types used across multiple entities.${colors.reset}`);
    log(`  4. Export the entity module from packages/${finalOptions.package}/src/index.ts`);
    log(`\n${colors.bright}Happy coding!${colors.reset}\n`);

  } catch (err) {
    error(err.message);
  }
})();
