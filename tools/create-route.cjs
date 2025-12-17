#!/usr/bin/env node

/**
 * CLI tool to create frontend routes and pages following the vendor pattern
 * Usage: node tools/create-route.cjs [options]
 */

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

function info(message) {
  log(message, 'cyan');
}

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help flag first
if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
  console.log(`
${colors.bright}${colors.cyan}Create Route CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-route
  npm run create-route -- --interactive
  npm run create-route -- <entity-name> --parent <parent-route> --package <package-name>

${colors.bright}Interactive Mode (Default):${colors.reset}
  The tool runs in interactive mode by default, guiding you through:
  - Entity name selection
  - Parent route selection (from available routes)
  - Package selection (from available packages)
  - Route path confirmation
  - Menu update confirmation

${colors.bright}Non-Interactive Mode:${colors.reset}
  npm run create-route -- customer --parent sales --package sales

${colors.bright}Options:${colors.reset}
  --entity, -e <name>        Entity name (e.g., "customer", "vendor")
  --parent, -p <route>      Parent route (e.g., "sales", "purchasing")
  --package, -pkg <name>    Package name (e.g., "sales", "purchasing")
  --interactive, -i         Enable interactive mode (default)
  --no-interactive          Disable interactive mode

${colors.bright}Examples:${colors.reset}
  npm run create-route
  npm run create-route -- customer --parent sales --package sales
`);
  process.exit(0);
}

let entityName = null;
let parentRoute = null;
let packageName = null;
let noInteractive = false;
let noViewPage = false;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--entity' || arg === '-e') {
    const value = args[++i];
    if (!value || value.startsWith('--')) {
      error('--entity requires a value');
    }
    entityName = value.trim();
  } else if (arg === '--parent') {
    const value = args[++i];
    if (!value || value.startsWith('--')) {
      error('--parent requires a value');
    }
    parentRoute = value.trim();
  } else if (arg === '--package' || arg === '-pkg') {
    const value = args[++i];
    if (!value || value.startsWith('--')) {
      error('--package requires a value');
    }
    packageName = value.trim();
  } else if (arg === '--interactive' || arg === '-i') {
    // Interactive is default, so this is a no-op
  } else if (arg === '--no-interactive') {
    noInteractive = true;
  } else if (arg === '--no-view-page') {
    noViewPage = true;
  } else if (arg.startsWith('--')) {
    error(`Unknown option: ${arg}. Use --help for usage information.`);
  } else if (!entityName && !arg.startsWith('--')) {
    // First non-flag argument is entity name
    entityName = arg;
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

// Get available parent routes from routes directory
function getAvailableParentRoutes() {
  const routesDir = path.join(path.resolve(__dirname, '..'), 'frontend', 'apps', 'web', 'src', 'routes');
  if (!fs.existsSync(routesDir)) {
    return [];
  }
  
  const routes = fs.readdirSync(routesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('.') && !name.startsWith('(') && name !== 'node_modules')
    .sort();
  
  // Add common routes
  const commonRoutes = ['sales', 'purchasing', 'inventory', 'settings'];
  const allRoutes = [...new Set([...commonRoutes, ...routes])].sort();
  
  return allRoutes;
}

// Helper function to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// Helper function to convert to kebab-case
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to convert kebab-case to camelCase
function toCamelCase(str) {
  return str
    .split('-')
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

// Helper function to pluralize
function pluralize(str) {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

// Helper function to get short prop name (first 3 letters)
function getShortPropName(entityName) {
  const lower = entityName.toLowerCase();
  // Special cases
  if (lower === 'customer') return 'cus';
  if (lower === 'vendor') return 'ven';
  if (lower === 'purchaseorder') return 'po';
  if (lower === 'customer-type' || lower === 'customertype') return 'ct';
  // Default: first 3 letters
  return lower.substring(0, 3);
}

// Extract endpoint key from service file
function getEndpointKeyFromService(packageName, entityName) {
  const entityNamePlural = pluralize(entityName);
  const servicePath = path.join(
    path.resolve(__dirname, '..'),
    'frontend',
    'packages',
    packageName,
    'src',
    entityNamePlural,
    `${entityName}-service.ts`
  );
  
  // Also check singular version
  const servicePathSingular = path.join(
    path.resolve(__dirname, '..'),
    'frontend',
    'packages',
    packageName,
    'src',
    entityName,
    `${entityName}-service.ts`
  );
  
  const pathsToCheck = [servicePath, servicePathSingular];
  
  for (const serviceFile of pathsToCheck) {
    if (fs.existsSync(serviceFile)) {
      try {
        const content = fs.readFileSync(serviceFile, 'utf8');
        // Look for interface Endpoints extends Record<string, string> { key: string; }
        const endpointMatch = content.match(/interface\s+\w+Endpoints[^{]*\{[^}]*?(\w+):\s*string;/s);
        if (endpointMatch && endpointMatch[1]) {
          return endpointMatch[1];
        }
        // Also check for endpoints?.key or endpoints.key pattern
        const usageMatch = content.match(/endpoints\.(\w+)/);
        if (usageMatch && usageMatch[1]) {
          return usageMatch[1];
        }
      } catch (err) {
        // Silently fail
      }
    }
  }
  
  // Fallback to short prop name
  return getShortPropName(entityName);
}

// Replace template placeholders
function replaceTemplatePlaceholders(template, replacements) {
  let result = template;
  
  // Sort keys by length (descending) to avoid partial matches
  // e.g., EntityNamePlural should be replaced before EntityName
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    const value = replacements[key];
    
    // Special handling for NavigationHandler to avoid invalid JSX when empty
    if (key === 'NavigationHandler' && !value) {
      // Remove just the placeholder, preserving the preceding } and whitespace
      result = result.replace(/\{\{NavigationHandler\}\}/g, '');
    } else if (value !== undefined && value !== null) {
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
  }
  
  return result;
}

// Interactive mode: collect all required information
async function collectInteractiveInput() {
  const rl = createReadlineInterface();
  const collected = {
    entityName: entityName,
    parentRoute: parentRoute,
    packageName: packageName,
  };
  
  try {
    log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.cyan}          Route Creation - Interactive Mode${colors.reset}`);
    log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
    // Step 1: Entity Name
    if (!collected.entityName) {
      log(`${colors.bright}${colors.cyan}Step 1: Entity Name${colors.reset}\n`);
      let name = await question(rl, `${colors.cyan}Entity name (e.g., "customer", "vendor"):${colors.reset} `);
      name = name.trim();
      if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
        error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
      }
      collected.entityName = name;
      log(`${colors.green}✓ Entity name: ${collected.entityName}${colors.reset}\n`);
    } else {
      log(`${colors.bright}${colors.cyan}Step 1: Entity Name${colors.reset}`);
      log(`${colors.green}✓ Using: ${collected.entityName} (from command line)${colors.reset}\n`);
    }
    
    // Step 2: Parent Route Selection
    if (!collected.parentRoute) {
      const availableRoutes = getAvailableParentRoutes();
      
      log(`${colors.bright}${colors.cyan}Step 2: Select Parent Route${colors.reset}\n`);
      if (availableRoutes.length > 0) {
        log(`${colors.yellow}Available parent routes:${colors.reset}\n`);
        availableRoutes.forEach((route, index) => {
          log(`  ${colors.cyan}${index + 1}.${colors.reset} ${colors.green}${route}${colors.reset}`);
        });
        log(`  ${colors.cyan}${availableRoutes.length + 1}.${colors.reset} ${colors.yellow}Enter custom route${colors.reset}\n`);
        
        const routeChoice = await question(rl, `${colors.cyan}Select parent route (1-${availableRoutes.length + 1}) [${availableRoutes.length + 1}]:${colors.reset} `);
        const choiceNum = parseInt(routeChoice.trim()) || (availableRoutes.length + 1);
        
        if (choiceNum >= 1 && choiceNum <= availableRoutes.length) {
          collected.parentRoute = availableRoutes[choiceNum - 1];
          log(`${colors.green}✓ Selected parent route: ${collected.parentRoute}${colors.reset}\n`);
        } else {
          const manualRoute = await question(rl, `${colors.cyan}Enter parent route:${colors.reset} `);
          const route = manualRoute.trim();
          if (!route) {
            error('Parent route is required');
          }
          collected.parentRoute = route;
        }
      } else {
        const manualRoute = await question(rl, `${colors.cyan}Enter parent route:${colors.reset} `);
        const route = manualRoute.trim();
        if (!route) {
          error('Parent route is required');
        }
        collected.parentRoute = route;
      }
    } else {
      log(`${colors.bright}${colors.cyan}Step 2: Parent Route${colors.reset}`);
      log(`${colors.green}✓ Using: ${collected.parentRoute} (from command line)${colors.reset}\n`);
    }
    
    // Step 3: Package Selection
    if (!collected.packageName) {
      const availablePackages = getAvailablePackages();
      
      log(`${colors.bright}${colors.cyan}Step 3: Select Package${colors.reset}\n`);
      if (availablePackages.length > 0) {
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
          collected.packageName = availablePackages[choiceNum - 1];
          log(`${colors.green}✓ Selected package: ${collected.packageName}${colors.reset}`);
          
          // Show modules in selected package
          const modules = getAvailableModulesFromPackage(collected.packageName);
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
          collected.packageName = pkg;
        }
      } else {
        const manualPackage = await question(rl, `${colors.cyan}Enter package name:${colors.reset} `);
        const pkg = manualPackage.trim();
        if (!pkg) {
          error('Package name is required');
        }
        collected.packageName = pkg;
      }
      
      // Verify package exists
      const pkgDir = path.join(path.resolve(__dirname, '..'), 'frontend', 'packages', collected.packageName);
      if (!fs.existsSync(pkgDir)) {
        log(`\n${colors.yellow}⚠ Package "${collected.packageName}" does not exist.${colors.reset}`);
        const createPkg = await question(rl, `${colors.cyan}Would you like to create it first? (y/n) [n]:${colors.reset} `);
        if (createPkg.trim().toLowerCase() === 'y' || createPkg.trim().toLowerCase() === 'yes') {
          log(`\n${colors.yellow}Please create the package first:${colors.reset}`);
          log(`  ${colors.cyan}npm run create-package -- ${collected.packageName}${colors.reset}\n`);
          process.exit(0);
        } else {
          error(`Package "${collected.packageName}" does not exist. Create it first using: npm run create-package -- ${collected.packageName}`);
        }
      }
    } else {
      log(`${colors.bright}${colors.cyan}Step 3: Package${colors.reset}`);
      log(`${colors.green}✓ Using: ${collected.packageName} (from command line)${colors.reset}`);
      
      // Show modules even when package is provided via CLI
      const modules = getAvailableModulesFromPackage(collected.packageName);
      if (modules.length > 0) {
        log(`${colors.cyan}  Available modules: ${modules.join(', ')}${colors.reset}\n`);
      } else {
        log('');
      }
    }
    
    // Step 4: Route Path Confirmation
    const entityNamePlural = pluralize(collected.entityName);
    const routePath = `/${collected.parentRoute}/${entityNamePlural}`;
    
    log(`${colors.bright}${colors.cyan}Step 4: Route Path Confirmation${colors.reset}\n`);
    log(`${colors.yellow}Route path will be: ${colors.bright}${routePath}${colors.reset}`);
    const confirmPath = await question(rl, `${colors.cyan}Confirm? (Y/n):${colors.reset} `);
    
    if (confirmPath.trim().toLowerCase() === 'n' || confirmPath.trim().toLowerCase() === 'no') {
      const customPath = await question(rl, `${colors.cyan}Enter custom route path:${colors.reset} `);
      const custom = customPath.trim();
      if (!custom || !custom.startsWith('/')) {
        error('Route path must start with /');
      }
      collected.routePath = custom;
    } else {
      collected.routePath = routePath;
    }
    log(`${colors.green}✓ Route path: ${collected.routePath}${colors.reset}\n`);
    
    // Step 5: Menu Update Confirmation
    log(`${colors.bright}${colors.cyan}Step 5: Navigation Menu Update${colors.reset}\n`);
    const entityNamePluralForMenu = pluralize(collected.entityName);
    const entityLabel = capitalize(entityNamePluralForMenu);
    log(`${colors.yellow}Menu entry preview:${colors.reset}`);
    log(`  ${colors.cyan}- Label:${colors.reset} ${entityLabel}`);
    log(`  ${colors.cyan}- Path:${colors.reset} ${collected.routePath}`);
    log(`  ${colors.cyan}- Icon:${colors.reset} Users\n`);
    
    const updateMenu = await question(rl, `${colors.cyan}Update navigation menu? (Y/n):${colors.reset} `);
    collected.updateMenu = !(updateMenu.trim().toLowerCase() === 'n' || updateMenu.trim().toLowerCase() === 'no');
    
    if (collected.updateMenu) {
      log(`${colors.green}✓ Will update navigation menu${colors.reset}\n`);
    } else {
      log(`${colors.yellow}⚠ Will skip navigation menu update${colors.reset}\n`);
    }
    
    // Step 6: View Page Option (if not already set)
    if (collected.noViewPage === undefined) {
      log(`${colors.bright}${colors.cyan}Step 6: View Page Option${colors.reset}\n`);
      const viewPageAnswer = await question(rl, `${colors.cyan}Create view/detail page? (y/N) [N]:${colors.reset} `);
      const answer = viewPageAnswer.trim().toLowerCase();
      // Default to N (no view page) if empty or 'n', only create if explicitly 'y'
      collected.noViewPage = answer !== 'y' && answer !== 'yes';
      console.log();
    }
    
    // Step 7: File Generation Preview
    log(`${colors.bright}${colors.cyan}Step ${collected.noViewPage === undefined ? '7' : '6'}: File Generation Preview${colors.reset}\n`);
    const filesToCreate = [
      `routes/${collected.parentRoute}/${entityNamePlural}.tsx`,
      `routes/${collected.parentRoute}/${entityNamePlural}/index.tsx`,
      ...(collected.noViewPage ? [] : [`routes/${collected.parentRoute}/${entityNamePlural}/$id.tsx`]),
      `pages/${collected.parentRoute}/${entityNamePlural}-page.tsx`,
      ...(collected.noViewPage ? [] : [`pages/${collected.parentRoute}/view-${entityNamePlural}-page.tsx`]),
    ];
    
    log(`${colors.yellow}Files to be created:${colors.reset}\n`);
    filesToCreate.forEach(file => {
      log(`  ${colors.cyan}-${colors.reset} ${file}`);
    });
    
    const confirm = await question(rl, `\n${colors.cyan}Continue? (Y/n):${colors.reset} `);
    if (confirm.trim().toLowerCase() === 'n' || confirm.trim().toLowerCase() === 'no') {
      log(`${colors.yellow}Cancelled by user.${colors.reset}`);
      process.exit(0);
    }
    
    return collected;
  } finally {
    rl.close();
  }
}

// Extract endpoint key from service file
function getEndpointKeyFromService(packageName, entityName) {
  const servicePath = path.join(
    path.resolve(__dirname, '..'),
    'frontend',
    'packages',
    packageName,
    'src',
    entityName,
    `${entityName}-service.ts`
  );
  
  // Also check pluralized version
  const entityNamePlural = pluralize(entityName);
  const servicePathPlural = path.join(
    path.resolve(__dirname, '..'),
    'frontend',
    'packages',
    packageName,
    'src',
    entityNamePlural,
    `${entityName}-service.ts`
  );
  
  const pathsToCheck = [servicePath, servicePathPlural];
  
  for (const serviceFile of pathsToCheck) {
    if (fs.existsSync(serviceFile)) {
      try {
        const content = fs.readFileSync(serviceFile, 'utf8');
        // Look for interface Endpoints extends Record<string, string> { key: string; }
        const endpointMatch = content.match(/interface\s+\w+Endpoints[^{]*\{[^}]*?(\w+):\s*string;/s);
        if (endpointMatch && endpointMatch[1]) {
          return endpointMatch[1];
        }
        // Also check for endpoints?.key pattern
        const usageMatch = content.match(/endpoints\.(\w+)/);
        if (usageMatch && usageMatch[1]) {
          return usageMatch[1];
        }
      } catch (err) {
        // Silently fail
      }
    }
  }
  
  // Fallback to short prop name
  return getShortPropName(entityName);
}

// Generate route files
function generateRoutes(collected) {
  const entityName = collected.entityName;
  const entityNamePascal = toPascalCase(entityName);
  const entityNamePlural = pluralize(entityName);
  const entityNamePluralPascal = toPascalCase(entityNamePlural);
  const entityNameKebab = toKebabCase(entityNamePlural);
  const parentRoute = collected.parentRoute;
  const packageName = collected.packageName;
  const routePath = collected.routePath;
  const entityNameLower = entityName.toLowerCase();
  const entityNamePluralLower = entityNamePlural.toLowerCase();
  const entityNameCamel = toCamelCase(entityName);
  const entityNamePluralCamel = toCamelCase(entityNamePlural);
  const shortPropName = getShortPropName(entityName);
  const noViewPage = collected.noViewPage || false;
  
  // Extract endpoint key from service file
  const endpointKey = getEndpointKeyFromService(packageName, entityName);
  
  // Construct API endpoint path (remove 'settings/' prefix if present)
  const apiRoute = parentRoute.replace(/^settings\//, '');
  const apiEndpoint = `/api/v1/${apiRoute}/${entityNamePluralLower}`;
  
  // Icon name - default to Users, but could be customized
  const iconName = 'Users';
  
  // Build navigation handler conditionally based on whether view page is created
  const navigationHandler = noViewPage 
    ? '' 
    : `
          onNavigateTo${entityNamePascal}={(id) =>
            navigate({
              to: "${routePath}/$id",
              params: { id },
            })
          }`;

  const replacements = {
    EntityName: entityNamePascal,
    EntityNamePlural: entityNamePluralPascal,
    EntityNameLower: entityNameLower,
    EntityNameCamel: entityNameCamel,
    EntityNamePluralLower: entityNamePluralLower,
    EntityNamePluralCamel: entityNamePluralCamel,
    EntityNameKebab: entityNameKebab,
    ParentRoute: parentRoute,
    PackageName: packageName,
    RoutePath: routePath,
    ShortPropName: endpointKey, // Use extracted endpoint key instead of shortPropName
    ApiEndpoint: apiEndpoint, // Add API endpoint
    IconName: iconName,
    NavigationHandler: navigationHandler, // Conditionally include navigation handler
  };
  
  // Also add the hook variable name (use camelCase for valid JavaScript identifier)
  replacements['HookVariableName'] = entityNameCamel;
  
  const templatesDir = path.join(__dirname, 'templates', 'route');
  const isSettingsRoute = parentRoute.startsWith('settings/');
  const routesDir = path.join(__dirname, '..', 'frontend', 'apps', 'web', 'src', 'routes', parentRoute);
  const pagesDir = path.join(__dirname, '..', 'frontend', 'apps', 'web', 'src', 'pages', parentRoute);
  
  // Create directories
  fs.mkdirSync(routesDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });
  
  // Read list page template
  const listPageTemplate = fs.readFileSync(path.join(templatesDir, 'list-page.template.tsx'), 'utf8');
  
  // Generate list page file
  const listPage = replaceTemplatePlaceholders(listPageTemplate, replacements);
  fs.writeFileSync(path.join(pagesDir, `${entityNameKebab}-page.tsx`), listPage);
  
  // Conditionally create view page
  if (!noViewPage) {
    const detailPageTemplate = fs.readFileSync(path.join(templatesDir, 'detail-page.template.tsx'), 'utf8');
    const detailPage = replaceTemplatePlaceholders(detailPageTemplate, replacements);
    fs.writeFileSync(path.join(pagesDir, `view-${entityNameKebab}-page.tsx`), detailPage);
  }
  
  // Generate route files based on route type
  if (isSettingsRoute) {
    // Settings route: single file with RootLayout and SettingsLayout (like warehouses/store-locations)
    const settingsRouteTemplate = fs.readFileSync(path.join(templatesDir, 'settings-route.template.tsx'), 'utf8');
    const settingsRoute = replaceTemplatePlaceholders(settingsRouteTemplate, replacements);
    fs.writeFileSync(path.join(routesDir, `${entityNamePlural}.tsx`), settingsRoute);
  } else {
    // Module route: layout + subdirectory structure (like customers)
    const entityRoutesDir = path.join(routesDir, entityNamePlural);
    fs.mkdirSync(entityRoutesDir, { recursive: true });
    
    const layoutTemplate = fs.readFileSync(path.join(templatesDir, 'layout-route.template.tsx'), 'utf8');
    const listRouteTemplate = fs.readFileSync(path.join(templatesDir, 'list-route.template.tsx'), 'utf8');
    
    const layoutRoute = replaceTemplatePlaceholders(layoutTemplate, replacements);
    const listRoute = replaceTemplatePlaceholders(listRouteTemplate, replacements);
    
    fs.writeFileSync(path.join(routesDir, `${entityNamePlural}.tsx`), layoutRoute);
    fs.writeFileSync(path.join(entityRoutesDir, 'index.tsx'), listRoute);
    
    // Conditionally create detail route
    if (!noViewPage) {
      const detailRouteTemplate = fs.readFileSync(path.join(templatesDir, 'detail-route.template.tsx'), 'utf8');
      const detailRoute = replaceTemplatePlaceholders(detailRouteTemplate, replacements);
      fs.writeFileSync(path.join(entityRoutesDir, '$id.tsx'), detailRoute);
    }
  }
  
  log(`${colors.green}✓ Generated route files${colors.reset}`);
}

// Update navigation menu
function updateNavigationMenu(collected) {
  const routesJsonPath = path.join(__dirname, '..', '..', 'backend', 'app', 'presentation', 'core', 'routes', 'routes.json');
  
  if (!fs.existsSync(routesJsonPath)) {
    log(`${colors.yellow}⚠ Navigation menu file not found at ${routesJsonPath}${colors.reset}`);
    return;
  }
  
  const routesJson = JSON.parse(fs.readFileSync(routesJsonPath, 'utf8'));
  const entityNamePlural = pluralize(collected.entityName);
  const entityLabel = capitalize(entityNamePlural);
  const routePath = collected.routePath;
  const parentRoute = collected.parentRoute;
  
  // Find the parent route in the menu
  let parentMenu = routesJson.find(item => item.path === `/${parentRoute}`);
  
  if (!parentMenu) {
    // Parent menu doesn't exist, create it
    parentMenu = {
      label: capitalize(parentRoute),
      path: `/${parentRoute}`,
      icon: capitalize(parentRoute),
      children: [],
    };
    routesJson.push(parentMenu);
  }
  
  // Ensure children array exists
  if (!parentMenu.children) {
    parentMenu.children = [];
  }
  
  // Check if menu item already exists
  const existingIndex = parentMenu.children.findIndex(
    child => child.path === routePath || child.label === entityLabel
  );
  
  const menuItem = {
    label: entityLabel,
    path: routePath,
    icon: 'Users',
    description: `Manage ${entityNamePlural} and related data.`,
  };
  
  if (existingIndex >= 0) {
    // Update existing item
    parentMenu.children[existingIndex] = menuItem;
    log(`${colors.green}✓ Updated navigation menu item${colors.reset}`);
  } else {
    // Add new item
    parentMenu.children.push(menuItem);
    log(`${colors.green}✓ Added navigation menu item${colors.reset}`);
  }
  
  // Write back to file
  fs.writeFileSync(routesJsonPath, JSON.stringify(routesJson, null, 2));
}

// Main execution
async function main() {
  try {
    let collected;
    
    // Check if we have all required parameters for non-interactive mode
    const hasAllParams = entityName && parentRoute && packageName;
    
    if (noInteractive && !hasAllParams) {
      error('Non-interactive mode requires --entity, --parent, and --package options');
    }
    
    if (!noInteractive && !hasAllParams) {
      // Run interactive mode
      collected = await collectInteractiveInput();
    } else {
      // Use command line parameters
      const entityNamePlural = pluralize(entityName);
      collected = {
        entityName,
        parentRoute,
        packageName,
        routePath: `/${parentRoute}/${entityNamePlural}`,
        updateMenu: true, // Default to true in non-interactive mode
        noViewPage: noViewPage, // Pass the flag from command line
      };
    }
    
    // Validate collected data
    if (!collected.entityName || !collected.parentRoute || !collected.packageName) {
      error('Missing required parameters: entityName, parentRoute, packageName');
    }
    
    // Check if routes already exist
    const isSettingsRoute = collected.parentRoute.startsWith('settings/');
    const routesPath = isSettingsRoute 
      ? path.join(__dirname, '..', 'frontend', 'apps', 'web', 'src', 'routes', collected.parentRoute, `${pluralize(collected.entityName)}.tsx`)
      : path.join(__dirname, '..', 'frontend', 'apps', 'web', 'src', 'routes', collected.parentRoute, pluralize(collected.entityName));
    const routesDir = isSettingsRoute
      ? path.dirname(routesPath)
      : routesPath;
    if (fs.existsSync(routesDir)) {
      if (noInteractive) {
        // In non-interactive mode, overwrite by default
        log(`${colors.yellow}⚠ Routes directory already exists, overwriting: ${routesDir}${colors.reset}`);
      } else {
        log(`${colors.yellow}⚠ Routes directory already exists: ${routesDir}${colors.reset}`);
        const rl = createReadlineInterface();
        try {
          const overwrite = await question(rl, `${colors.cyan}Overwrite existing routes? (y/N):${colors.reset} `);
          if (overwrite.trim().toLowerCase() !== 'y' && overwrite.trim().toLowerCase() !== 'yes') {
            log(`${colors.yellow}Cancelled.${colors.reset}`);
            process.exit(0);
          }
        } finally {
          rl.close();
        }
      }
    }
    
    // Generate routes
    log(`\n${colors.bright}${colors.cyan}Generating routes...${colors.reset}\n`);
    generateRoutes(collected);
    
    // Update navigation menu if requested
    if (collected.updateMenu) {
      log(`\n${colors.bright}${colors.cyan}Updating navigation menu...${colors.reset}\n`);
      updateNavigationMenu(collected);
    }
    
    // Success message
    log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}`);
    log(`${colors.bright}${colors.green}                    Success!${colors.reset}`);
    log(`${colors.green}═══════════════════════════════════════════════════════${colors.reset}\n`);
    log(`${colors.green}✓ Routes created successfully${colors.reset}\n`);
    log(`${colors.cyan}Next steps:${colors.reset}`);
    log(`  1. Verify the generated files`);
    log(`  2. Check that the route tree is regenerated (TanStack Router will auto-detect)`);
    log(`  3. Test the routes in your application\n`);
    
  } catch (err) {
    error(err.message || 'An error occurred');
  }
}

// Run main function
main();

