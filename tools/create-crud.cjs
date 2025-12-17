#!/usr/bin/env node

/**
 * Unified CLI tool to scaffold both basic and full CRUD modules
 * Usage: node tools/create-crud.cjs <entity-name> --package <package-name> [options]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Parse command line arguments
const args = process.argv.slice(2);
// Only show help if explicitly requested
if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
${colors.bright}${colors.cyan}Unified CRUD Module Creation CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-crud -- <entity-name> --package <package-name> [options]
  node tools/create-crud.cjs <entity-name> --package <package-name> [options]

${colors.bright}Required:${colors.reset}
  <entity-name>              Entity name (e.g., "product", "order", "invoice")
  --package, -p <name>       Package name where CRUD will be created (e.g., "inventory", "billing")

${colors.bright}Options:${colors.reset}
  --type, -t <type>          CRUD type: "basic" or "full" (default: prompts in interactive mode)
  --fields, -f <fields>      Comma-separated list of fields (e.g., "name:string,price:number,status:enum")
  --endpoint, -e <endpoint>   API endpoint path (default: pluralized entity name)
  --var-name, -v <name>       Short variable name (for basic CRUD only, default: auto-generated)
  --no-dialog                 Skip generating dialog wrapper components (full CRUD only)
  --no-filter                 Skip generating filter component (full CRUD only)
  --interactive, -i           Enable interactive mode (prompts for missing information)
  --no-interactive            Disable interactive mode (use command-line arguments only)

${colors.bright}CRUD Types:${colors.reset}
  basic                      Simple CRUD based on UOM pattern
                            - List, create, edit dialogs
                            - Service layer with API operations
                            - React Query hooks
                            - Basic filtering

  full                       Complete CRUD with advanced features
                            - All basic CRUD features
                            - Status actions (lock/unlock, activate/deactivate)
                            - Advanced filtering with filter sheet
                            - Detail views with tabs
                            - Comprehensive form validation
                            - Keyboard shortcuts
                            - Confirmation dialogs

${colors.bright}Examples:${colors.reset}
  # Basic CRUD
  npm run create-crud -- category --package inventory --type basic
  
  # Full CRUD
  npm run create-crud -- product --package inventory --type full --fields "name:string,price:number:currency"
  
  # Interactive mode (default when run without arguments)
  npm run create-crud
  
  # Non-interactive mode
  npm run create-crud -- category --package inventory --type basic --no-interactive
  
  # Full CRUD with custom endpoint
  npm run create-crud -- order --package billing --type full --endpoint orders --fields "total:number:currency,status:enum"
`);
  process.exit(0);
}

let entityName = null;
let options = {};
let crudType = null;
let noInteractive = false;

// Helper function to validate option value
function getOptionValue(args, currentIndex, optionName) {
  const nextIndex = currentIndex + 1;
  const value = args[nextIndex];
  if (!value || value.startsWith('--')) {
    error(`--${optionName} requires a non-empty value`);
  }
  return { value: value.trim(), nextIndex };
}

// Parse options
// First argument is entity name only if it doesn't start with --
if (args.length > 0 && args[0] && !args[0].startsWith('--')) {
  entityName = args[0];
}

// Parse options starting from index 0 (to catch flags that might be first)
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  // Skip if this is the entity name (first arg that doesn't start with --)
  if (i === 0 && entityName && arg === entityName) {
    continue;
  }
  if (arg === '--package' || arg === '-p') {
    const result = getOptionValue(args, i, 'package');
    options.package = result.value;
    i = result.nextIndex;
  } else if (arg === '--type' || arg === '-t') {
    const result = getOptionValue(args, i, 'type');
    crudType = result.value.toLowerCase();
    i = result.nextIndex;
    if (crudType !== 'basic' && crudType !== 'full') {
      error('CRUD type must be "basic" or "full"');
    }
  } else if (arg === '--fields' || arg === '-f') {
    const result = getOptionValue(args, i, 'fields');
    options.fields = result.value;
    i = result.nextIndex;
  } else if (arg === '--endpoint' || arg === '-e') {
    const result = getOptionValue(args, i, 'endpoint');
    options.endpoint = result.value;
    i = result.nextIndex;
  } else if (arg === '--var-name' || arg === '-v') {
    const result = getOptionValue(args, i, 'var-name');
    options.varName = result.value;
    i = result.nextIndex;
  } else if (arg === '--no-dialog') {
    options.noDialog = true;
  } else if (arg === '--no-filter') {
    options.noFilter = true;
  } else if (arg === '--interactive' || arg === '-i') {
    options.interactive = true;
  } else if (arg === '--no-interactive') {
    noInteractive = true;
  } else if (arg.startsWith('--')) {
    error(`Unknown option: ${arg}. Use --help for usage information.`);
  }
}

// Helper function to create readline interface
const readline = require('readline');
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

// Get available packages from multiple sources (filesystem, vite.config.ts, tsconfig.json)
function getAvailablePackages() {
  const packagesDir = path.join(path.resolve(__dirname, '..'), 'frontend', 'packages');
  const packagesSet = new Set();
  
  // Core packages to exclude (infrastructure packages, not feature packages)
  const corePackages = [
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

// Display review summary
function displayReviewSummary(collected) {
  log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  log(`${colors.bright}${colors.cyan}                    Review Summary${colors.reset}`);
  log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
  
  log(`${colors.bright}CRUD Type:${colors.reset} ${colors.yellow}${collected.crudType.toUpperCase()}${colors.reset}`);
  log(`${colors.bright}Package:${colors.reset} ${colors.cyan}@truths/${collected.options.package}${colors.reset}`);
  log(`${colors.bright}Entity Name:${colors.reset} ${colors.cyan}${collected.entityName}${colors.reset}`);
  
  // Handle fields - can be string (from CLI) or array (from interactive)
  let fieldsArray = [];
  if (collected.options.fields) {
    if (typeof collected.options.fields === 'string') {
      fieldsArray = collected.options.fields.split(',').map(f => f.trim()).filter(Boolean);
    } else if (Array.isArray(collected.options.fields)) {
      fieldsArray = collected.options.fields;
    }
  }
  
  if (fieldsArray.length > 0) {
    log(`\n${colors.bright}Fields:${colors.reset}`);
    fieldsArray.forEach((field, index) => {
      const parts = field.split(':');
      const fieldName = parts[0];
      const fieldType = parts.slice(1).join(':');
      log(`  ${colors.green}${index + 1}.${colors.reset} ${colors.cyan}${fieldName}${colors.reset} (${colors.yellow}${fieldType}${colors.reset})`);
    });
  } else {
    log(`\n${colors.bright}Fields:${colors.reset} ${colors.yellow}Using default fields${colors.reset}`);
  }
  
  if (collected.options.endpoint) {
    log(`\n${colors.bright}Endpoint:${colors.reset} ${colors.cyan}${collected.options.endpoint}${colors.reset}`);
  }
  
  if (collected.crudType === 'full') {
    if (collected.options.noDialog) {
      log(`\n${colors.bright}Skip Dialogs:${colors.reset} ${colors.yellow}Yes${colors.reset}`);
    }
    if (collected.options.noFilter) {
      log(`\n${colors.bright}Skip Filter:${colors.reset} ${colors.yellow}Yes${colors.reset}`);
    }
  }
  
  if (collected.crudType === 'basic' && collected.options.varName) {
    log(`\n${colors.bright}Variable Name:${colors.reset} ${colors.cyan}${collected.options.varName}${colors.reset}`);
  }
  
  log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

// Helper function to pluralize entity name
function pluralize(str) {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

// Interactive mode: prompt for all required information
async function collectInteractiveInput() {
  const rl = createReadlineInterface();
  const collected = { ...options };
  let finalEntityName = entityName;
  let finalCrudType = crudType;
  
  try {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}          CRUD Module Creation - Interactive Mode${colors.reset}`);
    log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
    // Step 1: CRUD Type Selection (always prompt unless already provided)
    if (!finalCrudType) {
      log(`\n${colors.bright}${colors.cyan}Step 1: Select CRUD Type${colors.reset}\n`);
      log(`${colors.cyan}  1.${colors.reset} ${colors.yellow}Basic CRUD${colors.reset} - Simple CRUD based on UOM pattern`);
      log(`     • List, create, edit dialogs`);
      log(`     • Service layer with API operations`);
      log(`     • React Query hooks`);
      log(`     • Basic filtering\n`);
      log(`${colors.cyan}  2.${colors.reset} ${colors.yellow}Full CRUD${colors.reset} - Complete CRUD with advanced features`);
      log(`     • All basic CRUD features`);
      log(`     • Status actions (lock/unlock, activate/deactivate)`);
      log(`     • Advanced filtering with filter sheet`);
      log(`     • Detail views with tabs`);
      log(`     • Comprehensive form validation`);
      log(`     • Keyboard shortcuts`);
      log(`     • Confirmation dialogs\n`);
      
      const typeInput = await question(rl, `${colors.cyan}Choose type (1-2) [1]:${colors.reset} `);
      const typeChoice = (typeInput.trim() || '1');
      
      // Validate input
      if (!['1', '2'].includes(typeChoice)) {
        log(`${colors.yellow}Invalid choice "${typeChoice}". Using default: basic${colors.reset}`);
        finalCrudType = 'basic';
      } else {
        finalCrudType = typeChoice === '2' ? 'full' : 'basic';
      }
      
      log(`${colors.green}✓ Selected: ${colors.bright}${finalCrudType.toUpperCase()}${colors.reset} CRUD\n`);
    } else {
      log(`\n${colors.bright}${colors.cyan}Step 1: CRUD Type${colors.reset}`);
      log(`${colors.green}✓ Using: ${colors.bright}${finalCrudType.toUpperCase()}${colors.reset} CRUD (from command line)\n`);
    }
    
    // Step 2: Package Selection
    if (!collected.package) {
      const availablePackages = getAvailablePackages();
      
      if (availablePackages.length > 0) {
        log(`${colors.bright}${colors.cyan}Step 2: Select Package${colors.reset}\n`);
        log(`${colors.yellow}Available packages (extracted from codebase):${colors.reset}\n`);
        availablePackages.forEach((pkg, index) => {
          // Show modules for each package
          const modules = getAvailableModulesFromPackage(pkg);
          const modulesInfo = modules.length > 0 
            ? ` ${colors.blue}(${modules.length} module${modules.length !== 1 ? 's' : ''}: ${modules.slice(0, 3).join(', ')}${modules.length > 3 ? '...' : ''})${colors.reset}`
            : '';
          log(`  ${colors.cyan}${index + 1}.${colors.reset} ${colors.green}${pkg}${colors.reset}${modulesInfo}`);
        });
        log(`  ${colors.cyan}${availablePackages.length + 1}.${colors.reset} ${colors.yellow}Enter package name manually${colors.reset}\n`);
        
        const packageChoice = await question(rl, `${colors.cyan}Select package (1-${availablePackages.length + 1}) [${availablePackages.length + 1}]:${colors.reset} `);
        const choiceNum = parseInt(packageChoice.trim()) || (availablePackages.length + 1);
        
        if (choiceNum >= 1 && choiceNum <= availablePackages.length) {
          collected.package = availablePackages[choiceNum - 1];
          log(`${colors.green}✓ Selected package: ${collected.package}${colors.reset}`);
          
          // Show modules in selected package
          const modules = getAvailableModulesFromPackage(collected.package);
          if (modules.length > 0) {
            log(`${colors.cyan}  Available modules in this package: ${modules.join(', ')}${colors.reset}\n`);
          } else {
            log('');
          }
        } else {
          const manualPackage = await question(rl, `${colors.cyan}Enter package name:${colors.reset} `);
          const pkg = manualPackage.trim();
          if (!pkg) {
            error('Package name is required');
          }
          collected.package = pkg;
        }
      } else {
        const manualPackage = await question(rl, `${colors.cyan}Enter package name:${colors.reset} `);
        const pkg = manualPackage.trim();
        if (!pkg) {
          error('Package name is required');
        }
        collected.package = pkg;
      }
      
      // Verify package exists
      const pkgDir = path.join(path.resolve(__dirname, '..'), 'packages', collected.package);
      if (!fs.existsSync(pkgDir)) {
        log(`\n${colors.yellow}⚠ Package "${collected.package}" does not exist.${colors.reset}`, 'yellow');
        const createPkg = await question(rl, `${colors.cyan}Would you like to create it first? (y/n) [n]:${colors.reset} `);
        if (createPkg.trim().toLowerCase() === 'y' || createPkg.trim().toLowerCase() === 'yes') {
          log(`\n${colors.yellow}Please create the package first:${colors.reset}`);
          log(`  ${colors.cyan}npm run create-package -- ${collected.package}${colors.reset}\n`);
          process.exit(0);
        } else {
          error(`Package "${collected.package}" does not exist. Create it first using: npm run create-package -- ${collected.package}`);
        }
      }
    }
    
    // Step 3: Entity Name
    if (!finalEntityName) {
      log(`\n${colors.bright}${colors.cyan}Step 3: Entity Name${colors.reset}\n`);
      let name = await question(rl, `${colors.cyan}Entity name (e.g., "product", "order", "invoice"):${colors.reset} `);
      name = name.trim();
      if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
        error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
      }
      finalEntityName = name;
      log(`${colors.green}✓ Entity name: ${finalEntityName}${colors.reset}\n`);
    }
    
    // Step 4: Field Collection
    if (!collected.fields || (typeof collected.fields === 'string' && !collected.fields.trim())) {
      log(`\n${colors.bright}${colors.cyan}Step 4: Field Configuration${colors.reset}`);
      log(`${colors.yellow}Add fields one by one. Enter 'done' when finished, or press Enter to skip.${colors.reset}\n`);
      
      const fieldTypes = [
        { key: '1', value: 'string', label: 'String' },
        { key: '2', value: 'number', label: 'Number' },
        { key: '3', value: 'date', label: 'Date' },
        { key: '4', value: 'boolean', label: 'Boolean' },
        { key: '5', value: 'enum', label: 'Enum' },
      ];
      
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
      
      collected.fields = fields.length > 0 ? fields.join(',') : '';
      
      if (fields.length > 0) {
        log(`${colors.green}✓ Configured ${fields.length} field(s)${colors.reset}\n`);
      } else {
        log(`${colors.yellow}No fields added. Using default fields.${colors.reset}\n`);
      }
    }
    
    // Step 5: Endpoint (optional)
    if (!collected.endpoint) {
      const pluralName = pluralize(finalEntityName);
      const endpointInput = await question(rl, `${colors.cyan}API endpoint path [${pluralName}]:${colors.reset} `);
      if (endpointInput.trim()) {
        collected.endpoint = endpointInput.trim();
      }
    }
    
    // Step 6: Additional options for full CRUD
    if (finalCrudType === 'full') {
      if (collected.noDialog === undefined) {
        const noDialogInput = await question(rl, `${colors.cyan}Skip dialog components? (y/n) [n]:${colors.reset} `);
        collected.noDialog = noDialogInput.trim().toLowerCase() === 'y' || noDialogInput.trim().toLowerCase() === 'yes';
      }
      
      if (collected.noFilter === undefined) {
        const noFilterInput = await question(rl, `${colors.cyan}Skip filter component? (y/n) [n]:${colors.reset} `);
        collected.noFilter = noFilterInput.trim().toLowerCase() === 'y' || noFilterInput.trim().toLowerCase() === 'yes';
      }
    }
    
    // Step 7: Variable name for basic CRUD
    if (finalCrudType === 'basic' && !collected.varName) {
      const varNameInput = await question(rl, `${colors.cyan}Variable name (short name, e.g., "cat" for category) [auto]:${colors.reset} `);
      if (varNameInput.trim()) {
        collected.varName = varNameInput.trim();
      }
    }
    
    // Step 8: Review and Confirmation
    const collectedData = { entityName: finalEntityName, crudType: finalCrudType, options: collected };
    displayReviewSummary(collectedData);
    
    const confirm = await question(rl, `${colors.cyan}Proceed with CRUD generation? (y/n) [y]:${colors.reset} `);
    const shouldProceed = confirm.trim().toLowerCase() !== 'n' && confirm.trim().toLowerCase() !== 'no';
    
    if (!shouldProceed) {
      log(`\n${colors.yellow}CRUD generation cancelled.${colors.reset}\n`);
      process.exit(0);
    }
    
    return collectedData;
  } finally {
    rl.close();
  }
}

// Main execution
(async () => {
  try {
    // Collect interactive input - default to interactive mode unless --no-interactive is passed
    let finalEntityName = entityName;
    let finalCrudType = crudType;
    let finalOptions = options;
    
    // Default to interactive mode unless --no-interactive flag is set
    // In non-interactive mode, all required args must be provided
    const shouldUseInteractive = !noInteractive;
    
    if (shouldUseInteractive) {
      const collected = await collectInteractiveInput();
      finalEntityName = collected.entityName || finalEntityName;
      finalCrudType = collected.crudType;
      finalOptions = collected.options;
    } else {
      // Non-interactive mode: validate all required args are provided
      if (!crudType) {
        error('CRUD type is required in non-interactive mode. Use --type basic or --type full');
      }
      if (!entityName) {
        error('Entity name is required in non-interactive mode');
      }
      if (!options.package) {
        error('Package name is required in non-interactive mode. Use --package <name>');
      }
      finalEntityName = entityName;
      finalCrudType = crudType;
      finalOptions = options;
    }
    
    // Validate CRUD type
    if (!finalCrudType) {
      error('CRUD type is required. Use --type basic or --type full');
    }
    
    if (finalCrudType !== 'basic' && finalCrudType !== 'full') {
      error('CRUD type must be "basic" or "full"');
    }
    
    // Validate entity name format
    if (finalEntityName && !/^[a-z][a-z0-9-]*$/.test(finalEntityName)) {
      error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
    }
    
    // Validate package exists
    if (finalOptions.package) {
      const packagePath = path.join(path.resolve(__dirname, '..'), 'packages', finalOptions.package);
      if (!fs.existsSync(packagePath)) {
        error(`Package "${finalOptions.package}" does not exist. Create it first:\n  npm run create-package -- ${finalOptions.package}`);
      }
    }
    
    // Build command for the appropriate CLI tool
    const toolsDir = path.resolve(__dirname);
    const cliScript = finalCrudType === 'basic' 
      ? path.join(toolsDir, 'create-basic-crud.cjs')
      : path.join(toolsDir, 'create-full-crud.cjs');
    
    // Validate CLI script exists
    if (!fs.existsSync(cliScript)) {
      error(`CRUD generator script not found: ${cliScript}\nPlease ensure the script exists in the tools directory.`);
    }
    
    // Build arguments array
    const cliArgs = [cliScript];
    
    // Add entity name
    if (finalEntityName) {
      cliArgs.push(finalEntityName);
    }
    
    // Add package
    if (finalOptions.package) {
      cliArgs.push('--package', finalOptions.package);
    }
    
    // Add fields
    if (finalOptions.fields) {
      cliArgs.push('--fields', finalOptions.fields);
    }
    
    // Add endpoint
    if (finalOptions.endpoint) {
      cliArgs.push('--endpoint', finalOptions.endpoint);
    }
    
    // Add variable name (basic CRUD only)
    if (finalCrudType === 'basic' && finalOptions.varName) {
      cliArgs.push('--var-name', finalOptions.varName);
    }
    
    // Add dialog option (full CRUD only)
    if (finalCrudType === 'full' && finalOptions.noDialog) {
      cliArgs.push('--no-dialog');
    }
    
    // Add filter option (full CRUD only)
    if (finalCrudType === 'full' && finalOptions.noFilter) {
      cliArgs.push('--no-filter');
    }
    
    // Don't pass --interactive to child process since we've already collected all data
    // Child scripts will only prompt if required args are missing, which we've already provided
    
    // Show summary
    log(`\n${colors.bright}${colors.blue}Generating ${colors.cyan}${finalCrudType.toUpperCase()}${colors.reset} CRUD module: ${colors.cyan}${finalEntityName}${colors.reset} in package ${colors.cyan}@truths/${finalOptions.package}${colors.reset}\n`);
    
    // Spawn the appropriate CLI tool
    const childProcess = spawn('node', cliArgs, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    
    // Handle process termination signals
    const handleSignal = (signal) => {
      childProcess.kill(signal);
      process.exit(signal === 'SIGINT' ? 130 : 143);
    };
    
    process.on('SIGINT', () => handleSignal('SIGINT'));
    process.on('SIGTERM', () => handleSignal('SIGTERM'));
    
    childProcess.on('error', (err) => {
      error(`Failed to spawn CLI process: ${err.message}\nMake sure Node.js is installed and the script is accessible.`);
    });
    
    childProcess.on('exit', (code, signal) => {
      if (signal) {
        error(`Process was terminated by signal: ${signal}`);
      } else if (code !== 0) {
        error(`CRUD generation failed with exit code ${code}`);
      }
      // Exit code 0 is success, no action needed
    });
    
  } catch (err) {
    error(err.message);
  }
})();

