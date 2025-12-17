#!/usr/bin/env node

/**
 * CLI tool to scaffold basic CRUD modules based on UOM pattern
 * Uses template files and replaces placeholders
 * Usage: node tools/create-basic-crud.cjs <entity-name> --package <package-name> [options]
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
${colors.bright}${colors.cyan}Create Basic CRUD Module CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-basic-crud -- <entity-name> --package <package-name> [options]
  npm run create-basic-crud -- --interactive
  node tools/create-basic-crud.cjs <entity-name> --package <package-name> [options]

${colors.bright}Required:${colors.reset}
  <entity-name>              Entity name (e.g., "product", "category", "supplier")
  --package, -p <name>       Package name where CRUD will be created (e.g., "inventory")

${colors.bright}Options:${colors.reset}
  --fields, -f <fields>      Comma-separated list of fields (e.g., "name:string,code:string,status:number")
  --endpoint, -e <endpoint>  API endpoint path (default: pluralized entity name)
  --var-name, -v <name>      Short variable name (default: derived from entity name)
  --interactive, -i          Enable interactive mode (prompts for missing information)

${colors.bright}Examples:${colors.reset}
  npm run create-basic-crud -- category --package inventory
  npm run create-basic-crud -- --interactive
  npm run create-basic-crud -- supplier --package inventory --fields "name:string,code:string,email:string"
  npm run create-basic-crud -- product --package inventory --endpoint products --fields "name:string,price:number"
`);
  process.exit(0);
}

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
    } else if (arg === '--var-name' || arg === '-v') {
      options.varName = args[++i];
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
      let name = await question(rl, `${colors.cyan}Entity name (e.g., "category", "supplier"):${colors.reset} `);
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
      ];

      log(`\n${colors.cyan}Field Configuration${colors.reset}`);
      log(`${colors.yellow}Add fields one by one. Enter 'done' when finished, or press Enter to skip.${colors.reset}\n`);

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

    // Variable name
    if (!collected.varName) {
      const varNameInput = await question(rl, `${colors.cyan}Variable name (short name, e.g., "cat" for category) [auto]:${colors.reset} `);
      if (varNameInput.trim()) {
        collected.varName = varNameInput.trim();
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

// Parse fields
function parseFields(fields) {
  if (!fields || fields.length === 0) {
    // Default fields
    return [
      { name: 'code', type: 'string', label: 'Code', required: true, isIdentifier: true },
      { name: 'name', type: 'string', label: 'Name', required: true },
    ];
  }

  return fields.map((field, index) => {
    const parts = field.split(':');
    const fieldName = parts[0].trim();
    let fieldType = (parts[1] || 'string').trim();
    let format = null;
    let required = true;

    // Handle optional fields (suffix ?)
    if (fieldType.endsWith('?')) {
      required = false;
      fieldType = fieldType.slice(0, -1);
    }

    // Handle format syntax: number:integer, date:datetime, etc.
    if (fieldType.includes(':')) {
      const formatParts = fieldType.split(':');
      fieldType = formatParts[0].trim();
      format = formatParts[1]?.trim() || null;

      // Check for optional flag again in case it was after the format (e.g. date:datetime?)
      if (format && format.endsWith('?')) {
        required = false;
        format = format.slice(0, -1);
      }
    }

    // Determine input type based on format
    let inputType = 'text';
    if (fieldType === 'number') {
      inputType = 'number';
      if (format === 'currency') inputType = 'number'; // Could be enhanced to show currency symbol
      if (format === 'percentage') inputType = 'number'; // Could be enhanced to show % symbol
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
      required: required,
      isIdentifier: index === 0,
      isString: fieldType === 'string',
      isNumber: fieldType === 'number',
      isDate: fieldType === 'date',
      isBoolean: fieldType === 'boolean',
      isFirst: index === 0,
      fieldType: fieldType === 'number' ? 'string' : fieldType, // For form inputs
      inputType,
      defaultValue: fieldType === 'number' ? '"0"' : '""',
      // Format-specific properties
      numberFormat: format && fieldType === 'number' ? format : null,
      dateFormat: format && fieldType === 'date' ? format : null,
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
  const EntityPlural = pascalCase(pluralize(entityName));
  const entityPluralCamel = camelCase(pluralize(entityName));
  const entityPluralKebab = pluralize(entityName);
  const entityVar = options.varName || generateShortName(entityName);
  const endpoint = options.endpoint || `/api/v1/${options.package}/${entityPluralKebab}`;
  const fields = parseFields(options.fields);

  return {
    EntityName,
    entityName: entityNameCamel,
    'entity-name': entityNameKebab,
    EntityPlural,
    entityPlural: entityPluralCamel,
    'entity-plural': entityPluralKebab,
    entityVar,
    packageName: options.package,
    endpoint,
    fields,
    valueAttr: 'value={{service}}', // No spaces in JSX object literal
  };
}

function generateShortName(name) {
  // Generate short name like "uom" from "unit-of-measure"
  const parts = name.split('-');
  if (parts.length > 1) {
    return parts.map(p => p[0]).join('');
  }
  return name.substring(0, 3);
}

// Replace placeholders in template content
// Find matching closing tag for a conditional, handling nesting
// Must account for both {{#if}} and {{#unless}} when calculating depth
function findMatchingClose(content, startIndex, openTag, closeTag) {
  let depth = 1;
  let i = startIndex;

  // Determine which type of conditional we're looking for
  const isIf = openTag === '{{#if';
  const isUnless = openTag === '{{#unless';

  while (i < content.length) {
    const remaining = content.substring(i);

    // Check for any opening conditional tag (both {{#if}} and {{#unless}})
    if (remaining.startsWith('{{#if')) {
      depth++;
      // Skip past the full {{#if ...}} tag
      const tagEnd = remaining.indexOf('}}');
      if (tagEnd >= 0) {
        i += tagEnd + 2;
      } else {
        i += 5; // Just skip '{{#if'
      }
    } else if (remaining.startsWith('{{#unless')) {
      depth++;
      // Skip past the full {{#unless ...}} tag
      const tagEnd = remaining.indexOf('}}');
      if (tagEnd >= 0) {
        i += tagEnd + 2;
      } else {
        i += 9; // Just skip '{{#unless'
      }
    }
    // Check for closing tags
    else if (remaining.startsWith('{{/if}}')) {
      depth--;
      if (depth === 0 && isIf) {
        return i + 7; // length of '{{/if}}'
      }
      i += 7;
    } else if (remaining.startsWith('{{/unless}}')) {
      depth--;
      if (depth === 0 && isUnless) {
        return i + 11; // length of '{{/unless}}'
      }
      i += 11;
    }
    else {
      i++;
    }
  }

  return -1; // Not found
}

// Find all conditionals and their nesting depth
function findAllConditionals(content) {
  const conditionals = [];
  let i = 0;

  while (i < content.length) {
    const remaining = content.substring(i);
    let found = false;

    if (remaining.startsWith('{{#if')) {
      const tagEnd = remaining.indexOf('}}');
      if (tagEnd >= 0) {
        const fullTag = remaining.substring(0, tagEnd + 2);
        const match = fullTag.match(/{{#if\s+(\w+)}}/);
        if (match) {
          const closeIndex = findMatchingClose(content, i + tagEnd + 2, '{{#if', '{{/if}}');
          if (closeIndex >= 0) {
            const innerStart = i + match[0].length;
            const innerEnd = closeIndex - 7;
            const innerContent = content.substring(innerStart, innerEnd);
            const hasNested = innerContent.includes('{{#if') || innerContent.includes('{{#unless');

            conditionals.push({
              start: i,
              end: closeIndex,
              type: 'if',
              condition: match[1],
              innerContent,
              hasNested,
              depth: 0 // Will calculate later
            });
            i += match[0].length;
            found = true;
          }
        }
      }
    } else if (remaining.startsWith('{{#unless')) {
      const tagEnd = remaining.indexOf('}}');
      if (tagEnd >= 0) {
        const fullTag = remaining.substring(0, tagEnd + 2);
        const match = fullTag.match(/{{#unless\s+(\w+)}}/);
        if (match) {
          const closeIndex = findMatchingClose(content, i + tagEnd + 2, '{{#unless', '{{/unless}}');
          if (closeIndex >= 0) {
            const innerStart = i + match[0].length;
            const innerEnd = closeIndex - 11;
            const innerContent = content.substring(innerStart, innerEnd);
            const hasNested = innerContent.includes('{{#if') || innerContent.includes('{{#unless');

            conditionals.push({
              start: i,
              end: closeIndex,
              type: 'unless',
              condition: match[1],
              innerContent,
              hasNested,
              depth: 0
            });
            i += match[0].length;
            found = true;
          }
        }
      }
    }

    if (!found) {
      i++;
    }
  }

  // Calculate nesting depth
  conditionals.forEach(cond => {
    conditionals.forEach(other => {
      if (other !== cond && other.start < cond.start && other.end > cond.end) {
        cond.depth++;
      }
    });
  });

  return conditionals.sort((a, b) => b.depth - a.depth); // Sort by depth descending (innermost first)
}

// Recursively process conditionals until all are resolved
// Processes both {{#if}} and {{#unless}} together, innermost first
function processConditionals(content, field) {
  let processed = content;
  let maxIterations = 50;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Find all conditionals sorted by depth (innermost first)
    const conditionals = findAllConditionals(processed);

    if (conditionals.length === 0) {
      break; // No more conditionals
    }

    // Process innermost conditionals first (those without nested conditionals)
    let processedAny = false;

    for (const cond of conditionals) {
      // Re-verify the conditional still exists at this position
      const currentAtPos = processed.substring(cond.start, cond.start + 10);
      if (!currentAtPos.includes('{{#')) {
        continue; // Already processed or position changed
      }

      // Re-check hasNested from current content (not cached value)
      // Extract inner content from current processed string
      const currentMatch = processed.substring(cond.start, cond.end);
      const pattern = cond.type === 'if' ? /{{#if\s+\w+}}([\s\S]*?){{\/if}}/ : /{{#unless\s+\w+}}([\s\S]*?){{\/unless}}/;
      const match = currentMatch.match(pattern);

      if (!match) {
        // Debug: pattern didn't match
        if (iterations === 1) {
          log(`Debug: Pattern didn't match for ${cond.type} at ${cond.start}-${cond.end}`, 'yellow');
          log(`  currentMatch preview: ${currentMatch.substring(0, 50)}...`, 'yellow');
        }
        continue; // Conditional structure changed
      }

      const currentInnerContent = match[1];
      const currentlyHasNested = currentInnerContent.includes('{{#if') || currentInnerContent.includes('{{#unless');

      // Only process if it has no nested conditionals
      if (currentlyHasNested) {
        if (iterations === 1) {
          log(`Debug: Skipping ${cond.type} ${cond.condition} - has nested conditionals`, 'yellow');
        }
        continue;
      }

      // Debug: found one to process
      if (iterations === 1) {
        log(`Debug: Processing ${cond.type} ${cond.condition}, field value: ${field[cond.condition]}`, 'yellow');
      }

      // Update cond with current inner content
      cond.innerContent = currentInnerContent;
      processedAny = true;
      const hasElse = cond.innerContent.includes('{{else}}');

      let replacement;
      if (hasElse) {
        // Find the {{else}} that belongs to this conditional
        let elseIndex = -1;
        let depth = 0;
        for (let i = 0; i < cond.innerContent.length; i++) {
          const remaining = cond.innerContent.substring(i);
          if (remaining.startsWith('{{#if') || remaining.startsWith('{{#unless')) {
            depth++;
          } else if (remaining.startsWith('{{/if}}') || remaining.startsWith('{{/unless}}')) {
            depth--;
          } else if (depth === 0 && remaining.startsWith('{{else}}')) {
            elseIndex = i;
            break;
          }
        }

        if (elseIndex >= 0) {
          const truePart = cond.innerContent.substring(0, elseIndex);
          const falsePart = cond.innerContent.substring(elseIndex + 8);
          if (cond.type === 'if') {
            replacement = field[cond.condition] ? truePart : falsePart;
          } else {
            replacement = !field[cond.condition] ? truePart : falsePart;
          }
        } else {
          const parts = cond.innerContent.split('{{else}}');
          if (cond.type === 'if') {
            replacement = field[cond.condition] ? parts[0] : parts.slice(1).join('{{else}}');
          } else {
            replacement = !field[cond.condition] ? parts[0] : parts.slice(1).join('{{else}}');
          }
        }
      } else {
        if (cond.type === 'if') {
          replacement = field[cond.condition] ? cond.innerContent : '';
        } else {
          replacement = !field[cond.condition] ? cond.innerContent : '';
        }
      }

      // Replace the conditional
      processed = processed.substring(0, cond.start) + replacement + processed.substring(cond.end);

      // Break to restart search (positions have changed)
      break;
    }

    if (!processedAny) {
      // No conditionals were processed, but some still exist - might be an error
      break;
    }
  }

  if (processed.includes('{{#if') || processed.includes('{{#unless')) {
    log(`Warning: Some conditionals may remain unprocessed after ${iterations} iterations.`, 'yellow');
    const remaining = processed.match(/{{#[^}]+}}/g);
    if (remaining) {
      log(`Remaining: ${remaining.slice(0, 5).join(', ')}${remaining.length > 5 ? '...' : ''}`, 'yellow');
    }
  }

  return processed;
}

function replacePlaceholders(content, replacements) {
  let result = content;

  // First, detect and fix malformed placeholders (spaces inside or around braces)
  // Patterns to detect:
  // - { { Key } } - spaces between braces
  // - {{ Key }} - spaces around key
  // - { {Key} } - spaces between braces
  // - {{Key }} or {{ Key}} - spaces on one side

  // More comprehensive pattern that catches various malformed cases
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
        // Only flag if it's actually a template placeholder (not valid code)
        // Check if it looks like a template placeholder (contains letters/numbers, not just special chars)
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
    // This handles cases like {{ Key }}, {{Key }}, {{ Key}}
    result = result.replace(/\{\{\s+([^}]+)\s+\}\}/g, '{{$1}}');
    result = result.replace(/\{\{\s+([^}]+)\}\}/g, '{{$1}}');
    result = result.replace(/\{\{([^}]+)\s+\}\}/g, '{{$1}}');
  }

  // Simple replacements
  Object.keys(replacements).forEach(key => {
    if (key !== 'fields') {
      // Match both {{key}} and {{ key }} (spaces around key are allowed)
      const regex = new RegExp(`{{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}}`, 'g');
      result = result.replace(regex, replacements[key]);
    }
  });

  // Handle field loops
  // Match {{#fields}} with optional spaces: {{#fields}}, {{ #fields }}, etc.
  const fieldLoopPattern = /\{\{\s*#fields\s*\}\}([\s\S]*?)\{\{\s*\/fields\s*\}\}/g;
  if (fieldLoopPattern.test(result)) {
    // Reset regex lastIndex
    fieldLoopPattern.lastIndex = 0;
    result = result.replace(fieldLoopPattern, (match, loopContent) => {
      return replacements.fields.map((field, index) => {
        let fieldContent = loopContent;

        // Replace field properties first
        Object.keys(field).forEach(prop => {
          const propRegex = new RegExp(`{{\\s*${prop}\\s*}}`, 'g');
          fieldContent = fieldContent.replace(propRegex, field[prop]);
        });

        // Process conditionals recursively
        fieldContent = processConditionals(fieldContent, field);

        return fieldContent;
      }).filter(content => content.trim() !== '').join('');
    });
  }

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
  // Pattern matches: {{...}} or { { ... } } or any variation
  const placeholderPattern = /\{\s*\{[^}]*\}\s*\}|\{\{[^}]*\}\}/g;
  const matches = content.match(placeholderPattern);

  if (matches && matches.length > 0) {
    // Filter to find actual template placeholders (not valid JSX/code)
    const invalidPlaceholders = matches.filter(match => {
      // Normalize the match first (remove spaces between braces)
      const normalized = match.replace(/\{\s+\{/g, '{{').replace(/\}\s+\}/g, '}}');
      const isDoubleBrace = normalized.includes('{{') && normalized.includes('}}');
      if (!isDoubleBrace) return false;

      // Extract inner content (remove braces and trim, but preserve internal structure)
      // First normalize spaces around braces, then extract
      let innerContent = normalized.replace(/^\{\{|\}\}$/g, '').trim();

      // Exclude empty braces
      if (!innerContent || innerContent === '') return false;

      // Check if it matches known placeholder patterns
      // Template placeholders are typically PascalCase or camelCase identifiers
      const isKnownPattern = knownPlaceholderKeys.some(key => {
        // Compare normalized versions (ignore spaces)
        const normalizedKey = key.replace(/\s/g, '');
        const normalizedInner = innerContent.replace(/\s/g, '');
        return normalizedInner.includes(normalizedKey) ||
          normalizedInner === normalizedKey ||
          innerContent.startsWith('#') || // Handlebars directives like {{#if}}
          innerContent.startsWith('/');   // Handlebars closing like {{/if}}
      });

      if (isKnownPattern) return true;

      // Check if it looks like a template placeholder (PascalCase starting with capital)
      // Common template patterns: EntityName, CreateEntityNameInput, etc.
      const noSpaces = innerContent.replace(/\s/g, '');
      if (/^[A-Z][a-zA-Z0-9]*$/.test(noSpaces)) {
        // Could be a placeholder, but might also be valid code
        // Only flag if it's a known pattern or contains common template words
        const templateKeywords = ['Entity', 'Input', 'Output', 'DTO', 'Config', 'Service', 'Provider'];
        return templateKeywords.some(keyword => noSpaces.includes(keyword));
      }

      // Check for Handlebars-style conditionals/loops
      if (/^#(if|unless|each|fields|with)/.test(innerContent.trim()) ||
        /^\/(if|unless|each|fields|with)/.test(innerContent.trim())) {
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
        `  - Typo in placeholder name\n` +
        `  - Handlebars directives not processed: ${colors.red}{{#fields}}${colors.reset}\n`;

      error(errorMsg);
      return false;
    }
  }

  return true;
}

// Format content to remove excessive blank lines
function formatContent(content) {
  // Trim trailing whitespace from each line first
  let formatted = content.split('\n').map(line => line.trimEnd()).join('\n');

  // Replace 3 or more newlines with 2 newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure single newline at end of file
  formatted = formatted.trim() + '\n';

  return formatted;
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
    { template: 'provider.template.tsx', output: `${entityName}-provider.tsx` },
    { template: 'hooks.template.tsx', output: `use-${pluralize(entityName)}.tsx` },
    { template: 'list.template.tsx', output: `${entityName}-list.tsx` },
    { template: 'detail.template.tsx', output: `${entityName}-detail.tsx` },
    { template: 'create-dialog.template.tsx', output: `create-${entityName}-dialog.tsx` },
    { template: 'edit-dialog.template.tsx', output: `edit-${entityName}-dialog.tsx` },
    { template: 'list-container.template.tsx', output: `${entityName}-list-container.tsx` },
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

    // Validate that all placeholders were replaced before writing
    const outputPath = path.join(entityDir, output);
    if (!validatePlaceholdersReplaced(processedContent, output)) {
      // Error already logged in validatePlaceholdersReplaced
      process.exit(1);
    }

    // Format content before writing
    processedContent = formatContent(processedContent);

    fs.writeFileSync(outputPath, processedContent);
    success(`✓ ${output} created`);
  });
}

// Create entity-specific types.ts file (instead of modifying package types.ts)
function createEntityTypesFile() {
  info('Creating entity types.ts...');
  const replacements = generateReplacements();
  const typesPath = path.join(entityDir, 'types.ts');

  const templatePath = path.join(templatesDir, 'types.template.ts');
  const typeTemplate = fs.readFileSync(templatePath, 'utf8');
  let newTypes = replacePlaceholders(typeTemplate, replacements);

  // Validate that all placeholders were replaced
  if (!validatePlaceholdersReplaced(newTypes, 'types.template.ts')) {
    // Error already logged in validatePlaceholdersReplaced
    process.exit(1);
  }

  // Format content before writing
  newTypes = formatContent(newTypes);
  
  // Add header comment
  const EntityName = pascalCase(entityName);
  const entityPlural = pluralize(entityName);
  const header = `/**
 * ${EntityName} Types
 * 
 * This file contains all TypeScript types and interfaces for the ${EntityName} entity.
 * Types are co-located with the entity for better maintainability.
 */

`;

  fs.writeFileSync(typesPath, header + newTypes);
  success(`✓ Entity types.ts created at ${entityPlural}/types.ts`);
}

// Update package index.ts
function updatePackageIndex() {
  info('Updating package index.ts...');
  const indexPath = path.join(srcDir, 'index.ts');

  if (!fs.existsSync(indexPath)) {
    log(`Warning: index.ts not found, skipping index updates`, 'yellow');
    return;
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const EntityName = pascalCase(entityName);
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
    templatesDir = path.join(__dirname, 'templates', 'basic-crud');

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
    log(`\n${colors.bright}${colors.blue}Creating basic CRUD module: ${colors.cyan}${entityName}${colors.reset} in package ${colors.cyan}@truths/${options.package}${colors.reset}\n`);
    if (finalOptions.fields && finalOptions.fields.length > 0) {
      log(`${colors.cyan}Fields:${colors.reset} ${finalOptions.fields.join(', ')}`);
    }
    if (finalOptions.endpoint) {
      log(`${colors.cyan}Endpoint:${colors.reset} ${finalOptions.endpoint}`);
    }
    if (finalOptions.varName) {
      log(`${colors.cyan}Variable Name:${colors.reset} ${finalOptions.varName}`);
    }
    log('');

    createDirectories();
    generateFiles();
    createEntityTypesFile();
    updatePackageIndex();

    // Restore original values
    entityName = originalEntityName;
    options = originalOptions;

    log(`\n${colors.bright}${colors.green}✓ Basic CRUD module created successfully!${colors.reset}\n`);
    log(`${colors.cyan}Next steps:${colors.reset}`);
    log(`  1. Review generated files in packages/${finalOptions.package}/src/${pluralize(finalEntityName)}/`);
    log(`  2. Update types in packages/${finalOptions.package}/src/types.ts if needed`);
    log(`  3. Customize form fields and validation in create/edit dialogs`);
    log(`  4. Update API endpoint in provider if different from default`);
    log(`  5. Use the generated components in your app`);
    log(`\n${colors.bright}Happy coding!${colors.reset}\n`);

  } catch (err) {
    error(err.message);
  }
})();

