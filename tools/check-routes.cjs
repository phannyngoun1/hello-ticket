#!/usr/bin/env node

/**
 * CLI tool to check if routes are generated for an entity
 * Usage: node tools/check-routes.cjs <entity-name> [--parent <parent-route>] [--package <package-name>]
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

function pluralize(str) {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
${colors.bright}${colors.cyan}Check Routes CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  node tools/check-routes.cjs <entity-name> [options]
  node tools/check-routes.cjs customer
  node tools/check-routes.cjs customer --parent sales --package sales

${colors.bright}Options:${colors.reset}
  --parent, -p <route>      Parent route (e.g., "sales", "settings/sales")
  --package, -pkg <name>    Package name (e.g., "sales", "inventory")
  --help, -h                Show this help message

${colors.bright}Examples:${colors.reset}
  node tools/check-routes.cjs customer
  node tools/check-routes.cjs customer --parent sales
  node tools/check-routes.cjs customer-type --parent settings/sales --package sales
`);
  process.exit(0);
}

let entityName = null;
let parentRoute = null;
let packageName = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--parent' || arg === '-p') {
    parentRoute = args[++i];
  } else if (arg === '--package' || arg === '-pkg') {
    packageName = args[++i];
  } else if (!entityName && !arg.startsWith('--')) {
    entityName = arg;
  }
}

if (!entityName) {
  log('Error: Entity name is required', 'red');
  log('Usage: node tools/check-routes.cjs <entity-name> [options]', 'yellow');
  process.exit(1);
}

const entityPlural = pluralize(entityName);
const entityKebab = toKebabCase(entityPlural);

// Check route files
const routesBaseDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'routes');
const pagesBaseDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'pages');

console.log();
log('═'.repeat(64), 'cyan');
log(`${colors.bright}Checking routes for: ${colors.cyan}${entityName}${colors.reset}`, 'bright');
log('═'.repeat(64), 'cyan');
console.log();

let foundRoutes = false;
let foundPages = false;

// Check routes directory
if (parentRoute) {
  // Check specific parent route
  const routesDir = path.join(routesBaseDir, parentRoute, entityPlural);
  const layoutRoute = path.join(routesBaseDir, parentRoute, `${entityPlural}.tsx`);
  const listRoute = path.join(routesDir, 'index.tsx');
  const detailRoute = path.join(routesDir, '$id.tsx');
  
  log(`Checking routes in: ${colors.cyan}${parentRoute}/${entityPlural}${colors.reset}`);
  
  if (fs.existsSync(layoutRoute)) {
    log(`  ✓ Layout route: ${layoutRoute}`, 'green');
    foundRoutes = true;
  } else {
    log(`  ✗ Layout route: ${layoutRoute}`, 'red');
  }
  
  if (fs.existsSync(listRoute)) {
    log(`  ✓ List route: ${listRoute}`, 'green');
    foundRoutes = true;
  } else {
    log(`  ✗ List route: ${listRoute}`, 'red');
  }
  
  if (fs.existsSync(detailRoute)) {
    log(`  ✓ Detail route: ${detailRoute}`, 'green');
    foundRoutes = true;
  } else {
    log(`  ✗ Detail route: ${detailRoute}`, 'red');
  }
  
  // Check pages
  const listPage = path.join(pagesBaseDir, parentRoute, `${entityKebab}-page.tsx`);
  const detailPage = path.join(pagesBaseDir, parentRoute, `view-${entityKebab}-page.tsx`);
  
  log(`\nChecking pages in: ${colors.cyan}${parentRoute}${colors.reset}`);
  
  if (fs.existsSync(listPage)) {
    log(`  ✓ List page: ${listPage}`, 'green');
    foundPages = true;
  } else {
    log(`  ✗ List page: ${listPage}`, 'red');
  }
  
  if (fs.existsSync(detailPage)) {
    log(`  ✓ Detail page: ${detailPage}`, 'green');
    foundPages = true;
  } else {
    log(`  ✗ Detail page: ${detailPage}`, 'red');
  }
} else {
  // Search all routes
  log(`Searching for routes in all parent routes...`, 'cyan');
  console.log();
  
  if (fs.existsSync(routesBaseDir)) {
    const parentDirs = fs.readdirSync(routesBaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const parent of parentDirs) {
      const routesDir = path.join(routesBaseDir, parent, entityPlural);
      const layoutRoute = path.join(routesBaseDir, parent, `${entityPlural}.tsx`);
      
      if (fs.existsSync(routesDir) || fs.existsSync(layoutRoute)) {
        foundRoutes = true;
        log(`  ✓ Found routes in: ${colors.green}${parent}/${entityPlural}${colors.reset}`, 'green');
        
        const listRoute = path.join(routesDir, 'index.tsx');
        const detailRoute = path.join(routesDir, '$id.tsx');
        
        if (fs.existsSync(layoutRoute)) {
          log(`    - Layout: ${layoutRoute}`, 'dim');
        }
        if (fs.existsSync(listRoute)) {
          log(`    - List: ${listRoute}`, 'dim');
        }
        if (fs.existsSync(detailRoute)) {
          log(`    - Detail: ${detailRoute}`, 'dim');
        }
      }
    }
  }
  
  // Search pages
  log(`\nSearching for pages...`, 'cyan');
  
  if (fs.existsSync(pagesBaseDir)) {
    const parentDirs = fs.readdirSync(pagesBaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const parent of parentDirs) {
      const listPage = path.join(pagesBaseDir, parent, `${entityKebab}-page.tsx`);
      const detailPage = path.join(pagesBaseDir, parent, `view-${entityKebab}-page.tsx`);
      
      if (fs.existsSync(listPage) || fs.existsSync(detailPage)) {
        foundPages = true;
        log(`  ✓ Found pages in: ${colors.green}${parent}${colors.reset}`, 'green');
        
        if (fs.existsSync(listPage)) {
          log(`    - List: ${listPage}`, 'dim');
        }
        if (fs.existsSync(detailPage)) {
          log(`    - Detail: ${detailPage}`, 'dim');
        }
      }
    }
  }
}

// Summary
console.log();
log('═'.repeat(64), 'cyan');
log(`${colors.bright}Summary${colors.reset}`, 'bright');
log('═'.repeat(64), 'cyan');
console.log();

if (foundRoutes && foundPages) {
  log(`${colors.green}✓ Routes and pages are generated${colors.reset}`, 'green');
  log(`  Routes: ${colors.green}Enabled${colors.reset}`, 'green');
  log(`  Pages: ${colors.green}Enabled${colors.reset}`, 'green');
} else if (foundRoutes) {
  log(`${colors.yellow}⚠ Routes found but pages may be missing${colors.reset}`, 'yellow');
  log(`  Routes: ${colors.green}Enabled${colors.reset}`, 'green');
  log(`  Pages: ${colors.red}Not found${colors.reset}`, 'red');
} else if (foundPages) {
  log(`${colors.yellow}⚠ Pages found but routes may be missing${colors.reset}`, 'yellow');
  log(`  Routes: ${colors.red}Not found${colors.reset}`, 'red');
  log(`  Pages: ${colors.green}Enabled${colors.reset}`, 'green');
} else {
  log(`${colors.red}✗ Routes and pages are NOT generated${colors.reset}`, 'red');
  log(`  Routes: ${colors.red}Not found${colors.reset}`, 'red');
  log(`  Pages: ${colors.red}Not found${colors.reset}`, 'red');
  console.log();
  log(`To generate routes, run:`, 'yellow');
  log(`  node tools/create-route.cjs ${entityName}${parentRoute ? ` --parent ${parentRoute}` : ''}${packageName ? ` --package ${packageName}` : ''}`, 'cyan');
}

console.log();

