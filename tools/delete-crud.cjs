#!/usr/bin/env node

/**
 * CLI tool to delete generated CRUD modules
 * Usage: node tools/delete-crud.cjs <entity-name> --package <package-name> [options]
 * 
 * Options:
 *   --dry-run          Show what would be deleted without deleting
 *   --force            Skip confirmation prompt
 *   --frontend-only    Delete only frontend files
 *   --backend-only     Delete only backend files
 *   --help, -h         Show help message
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
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

function warning(message) {
    log(message, 'yellow');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
${colors.bright}${colors.cyan}Delete CRUD Module CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  node tools/delete-crud.cjs <entity-name> --package <package-name> [options]

${colors.bright}Required:${colors.reset}
  <entity-name>              Entity name (e.g., "test-entity", "product")
  --package, -p <name>       Package name (e.g., "sales", "inventory")

${colors.bright}Options:${colors.reset}
  --dry-run                  Show what would be deleted without deleting
  --force                    Skip confirmation prompt
  --frontend-only            Delete only frontend files
  --backend-only             Delete only backend files
  --help, -h                 Show this help message

${colors.bright}Examples:${colors.reset}
  # Dry run to preview what will be deleted
  node tools/delete-crud.cjs test-entity --package sales --dry-run

  # Delete with confirmation
  node tools/delete-crud.cjs test-entity --package sales

  # Force delete without confirmation
  node tools/delete-crud.cjs test-entity --package sales --force

  # Delete only frontend files
  node tools/delete-crud.cjs test-entity --package sales --frontend-only
`);
    process.exit(0);
}

// Helper function to prompt user
function askQuestion(rl, query) {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
}

async function main() {
    let entityName = null;
    let packageName = null;
    let dryRun = false;
    let force = false;
    let frontendOnly = false;
    let backendOnly = false;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--package' || arg === '-p') {
            packageName = args[++i];
        } else if (arg === '--dry-run') {
            dryRun = true;
        } else if (arg === '--force') {
            force = true;
        } else if (arg === '--frontend-only') {
            frontendOnly = true;
        } else if (arg === '--backend-only') {
            backendOnly = true;
        } else if (!entityName && !arg.startsWith('--')) {
            entityName = arg;
        }
    }

    // Interactive mode if arguments are missing
    if (!entityName || !packageName) {
        console.log(`${colors.bright}${colors.cyan}Interactive Deletion Mode${colors.reset}\n`);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            // 1. Select Package
            if (!packageName) {
                const packagesDir = path.join(frontendRoot, 'packages');
                let packages = [];

                if (fs.existsSync(packagesDir)) {
                    packages = fs.readdirSync(packagesDir).filter(file => {
                        return fs.statSync(path.join(packagesDir, file)).isDirectory();
                    });
                }

                if (packages.length === 0) {
                    // Fallback to manual entry if no packages found
                    packageName = await askQuestion(rl, `${colors.green}?${colors.reset} Enter package name (e.g., sales): `);
                } else {
                    console.log(`${colors.green}?${colors.reset} Select package:`);
                    packages.forEach((pkg, index) => {
                        console.log(`  ${index + 1}) ${pkg}`);
                    });
                    console.log(`  0) Manual Entry`);

                    const answer = await askQuestion(rl, `\nEnter choice [1-${packages.length}]: `);
                    const index = parseInt(answer.trim()) - 1;

                    if (index >= 0 && index < packages.length) {
                        packageName = packages[index];
                    } else {
                        packageName = await askQuestion(rl, `${colors.green}?${colors.reset} Enter package name (e.g., sales): `);
                    }
                }
                packageName = packageName.trim();
            }

            // 2. Select Entity
            if (!entityName) {
                // Try to find entities in the selected package
                // We look in frontend/packages/<package>/src/<entity-plural>
                const packageSrcDir = path.join(frontendRoot, 'packages', packageName, 'src');
                let entities = [];

                if (fs.existsSync(packageSrcDir)) {
                    const dirs = fs.readdirSync(packageSrcDir).filter(file => {
                        return fs.statSync(path.join(packageSrcDir, file)).isDirectory();
                    });

                    // Filter out common directories that aren't entities
                    const commonDirs = ['components', 'hooks', 'utils', 'assets', 'lib', 'types', 'context'];

                    // Also try to verify if it looks like an entity module (has types.ts, service.ts, etc)
                    entities = dirs.filter(dir => {
                        if (commonDirs.includes(dir)) return false;

                        // Check if it has characteristic files
                        const dirPath = path.join(packageSrcDir, dir);
                        const files = fs.readdirSync(dirPath);
                        return files.some(f => f.endsWith('service.ts') || f.endsWith('types.ts') || f.startsWith('use-'));
                    });
                }

                if (entities.length === 0) {
                    entityName = await askQuestion(rl, `${colors.green}?${colors.reset} Enter entity name (e.g., test-entity): `);
                } else {
                    console.log(`\n${colors.green}?${colors.reset} Select entity to delete from '${packageName}':`);
                    entities.forEach((ent, index) => {
                        // Try to singularize for display if possible, but keep directory name
                        console.log(`  ${index + 1}) ${ent}`);
                    });
                    console.log(`  0) Manual Entry`);

                    const answer = await askQuestion(rl, `\nEnter choice [1-${entities.length}]: `);
                    const index = parseInt(answer.trim()) - 1;

                    if (index >= 0 && index < entities.length) {
                        // The directory name is usually plural (e.g. "test-entities")
                        // We need to convert it back to singular entity name for the script logic
                        // This is a bit tricky because the script expects singular "test-entity"
                        // and then pluralizes it. 
                        // Let's ask the user to confirm or provide singular name if we can't easily guess.

                        const selectedDir = entities[index];
                        // Simple heuristic: remove 's' or 'es'
                        let guess = selectedDir;
                        if (guess.endsWith('ies')) guess = guess.slice(0, -3) + 'y';
                        else if (guess.endsWith('es')) guess = guess.slice(0, -2); // e.g. boxes -> box, but also sales -> sal (wrong)
                        else if (guess.endsWith('s')) guess = guess.slice(0, -1);

                        // Ask user to confirm singular name
                        const confirmedName = await askQuestion(rl, `${colors.green}?${colors.reset} Confirm singular entity name [${guess}]: `);
                        entityName = confirmedName.trim() || guess;
                    } else {
                        entityName = await askQuestion(rl, `${colors.green}?${colors.reset} Enter entity name (e.g., test-entity): `);
                    }
                }
                entityName = entityName.trim();
            }

            // If scope not specified via flags, ask for it
            if (!frontendOnly && !backendOnly) {
                console.log(`\n${colors.green}?${colors.reset} Select deletion scope:`);
                console.log(`  1) Both Frontend and Backend (default)`);
                console.log(`  2) Frontend Only`);
                console.log(`  3) Backend Only`);

                const scopeAnswer = await askQuestion(rl, `\nEnter choice [1-3]: `);
                const choice = scopeAnswer.trim();

                if (choice === '2') {
                    frontendOnly = true;
                } else if (choice === '3') {
                    backendOnly = true;
                }
                // Default is both (do nothing)
            }
        } finally {
            rl.close();
        }
    }

    // Validate required arguments
    if (!entityName) {
        error('Entity name is required.');
    }

    if (!packageName) {
        error('Package name is required.');
    }

    // Validate entity name format
    if (!/^[a-z][a-z0-9-]*$/.test(entityName)) {
        error('Entity name must be lowercase and contain only letters, numbers, and hyphens');
    }

    // Utility functions
    function pluralize(str) {
        if (str.endsWith('y')) {
            return str.slice(0, -1) + 'ies';
        } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
            return str + 'es';
        }
        return str + 's';
    }

    function camelCase(str) {
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    function pascalCase(str) {
        return str.charAt(0).toUpperCase() + camelCase(str).slice(1);
    }

    function snakeCase(str) {
        return str.replace(/-/g, '_');
    }

    // Generate file paths
    const entityNamePlural = pluralize(entityName);
    const entityNameSnake = snakeCase(entityName);
    const EntityName = pascalCase(entityName);

    const projectRoot = path.resolve(__dirname, '..');
    const frontendRoot = path.join(projectRoot, 'frontend');
    const backendRoot = path.join(projectRoot, 'backend');

    // Build list of files to delete
    const filesToDelete = {
        frontend: [],
        backend: [],
        routes: [],
    };

    // Frontend files
    if (!backendOnly) {
        const frontendEntityDir = path.join(frontendRoot, 'packages', packageName, 'src', entityNamePlural);
        if (fs.existsSync(frontendEntityDir)) {
            filesToDelete.frontend.push({
                path: frontendEntityDir,
                type: 'directory',
                description: `Frontend ${entityNamePlural} module`
            });
        }

        // Routes
        const routesDir = path.join(frontendRoot, 'apps', 'web', 'src', 'routes');
        // Try to find routes - could be in various parent routes
        // We need to check for both directories AND files (e.g. tests.tsx)
        const possibleRoutePaths = [
            // Directories
            { path: path.join(routesDir, 'settings', packageName, entityNamePlural), type: 'directory' },
            { path: path.join(routesDir, packageName, entityNamePlural), type: 'directory' },
            // Files
            { path: path.join(routesDir, 'settings', packageName, `${entityNamePlural}.tsx`), type: 'file' },
            { path: path.join(routesDir, packageName, `${entityNamePlural}.tsx`), type: 'file' },
        ];

        for (const route of possibleRoutePaths) {
            if (fs.existsSync(route.path)) {
                filesToDelete.routes.push({
                    path: route.path,
                    type: route.type,
                    description: `Frontend route ${route.type === 'directory' ? 'directory' : 'file'} for ${entityNamePlural}`
                });
                // Don't break here, as there might be both a file and a directory (nested routes)
            }
        }

        // Pages
        const pagesDirs = [
            path.join(frontendRoot, 'apps', 'web', 'src', 'pages', packageName),
            path.join(frontendRoot, 'apps', 'web', 'src', 'pages', 'settings', packageName)
        ];

        for (const pagesDir of pagesDirs) {
            if (fs.existsSync(pagesDir)) {
                const pageFiles = [
                    { name: `${entityNamePlural}-page.tsx`, desc: 'List page' },
                    { name: `view-${entityNamePlural}-page.tsx`, desc: 'View page' }
                ];

                for (const page of pageFiles) {
                    const pagePath = path.join(pagesDir, page.name);
                    if (fs.existsSync(pagePath)) {
                        filesToDelete.frontend.push({
                            path: pagePath,
                            type: 'file',
                            description: `Frontend ${page.desc}`
                        });
                    }
                }
            }
        }
    }

    // Backend files
    if (!frontendOnly) {
        const backendFiles = [
            // Domain
            {
                path: path.join(backendRoot, 'app', 'domain', packageName, `${entityNameSnake}.py`),
                type: 'file',
                description: `Domain entity ${entityNameSnake}.py`
            },
            {
                path: path.join(backendRoot, 'app', 'domain', packageName, `${entityNameSnake}_repositories.py`),
                type: 'file',
                description: `Domain repository interface`
            },
            // Application
            {
                path: path.join(backendRoot, 'app', 'application', packageName, `commands_${entityNameSnake}.py`),
                type: 'file',
                description: `Application commands`
            },
            {
                path: path.join(backendRoot, 'app', 'application', packageName, `queries_${entityNameSnake}.py`),
                type: 'file',
                description: `Application queries`
            },
            {
                path: path.join(backendRoot, 'app', 'application', packageName, `handlers_${entityNameSnake}.py`),
                type: 'file',
                description: `Application handlers`
            },
            // Presentation API
            {
                path: path.join(backendRoot, 'app', 'presentation', 'api', packageName, `schemas_${entityNameSnake}.py`),
                type: 'file',
                description: `API schemas`
            },
            {
                path: path.join(backendRoot, 'app', 'presentation', 'api', packageName, `mapper_${entityNameSnake}.py`),
                type: 'file',
                description: `API mapper`
            },
            // Presentation routes
            {
                path: path.join(backendRoot, 'app', 'presentation', packageName, `${entityNameSnake}_routes.py`),
                type: 'file',
                description: `API routes`
            },
            // Infrastructure
            {
                path: path.join(backendRoot, 'app', 'infrastructure', packageName, `mapper_${entityNameSnake}.py`),
                type: 'file',
                description: `Infrastructure mapper`
            },
            {
                path: path.join(backendRoot, 'app', 'infrastructure', packageName, `${entityNameSnake}_repository.py`),
                type: 'file',
                description: `Infrastructure repository`
            },
            // Container registration
            {
                path: path.join(backendRoot, 'app', 'shared', 'container_registrations', `${entityNameSnake}.py`),
                type: 'file',
                description: `Container registration`
            },
        ];

        for (const file of backendFiles) {
            if (fs.existsSync(file.path)) {
                filesToDelete.backend.push(file);
            }
        }
    }

    // Count total files
    const totalFiles = filesToDelete.frontend.length + filesToDelete.backend.length + filesToDelete.routes.length;

    if (totalFiles === 0) {
        warning(`\nNo files found for entity "${entityName}" in package "${packageName}"`);
        log('\nPossible reasons:', 'yellow');
        log('  - Entity does not exist', 'dim');
        log('  - Entity name or package name is incorrect', 'dim');
        log('  - Files were already deleted', 'dim');
        process.exit(0);
    }

    // Display what will be deleted
    console.log(`\n${colors.bright}${colors.cyan}Deletion Summary${colors.reset}\n`);
    log(`Entity: ${colors.bright}${entityName}${colors.reset}`);
    log(`Package: ${colors.bright}${packageName}${colors.reset}`);
    log(`Mode: ${dryRun ? colors.yellow + 'DRY RUN' + colors.reset : colors.red + 'ACTUAL DELETION' + colors.reset}\n`);

    if (filesToDelete.frontend.length > 0) {
        log(`${colors.bright}Frontend Files (${filesToDelete.frontend.length}):${colors.reset}`, 'cyan');
        filesToDelete.frontend.forEach(file => {
            log(`  ${file.type === 'directory' ? '📁' : '📄'} ${file.path}`, 'dim');
            log(`     ${file.description}`, 'dim');
        });
        console.log();
    }

    if (filesToDelete.routes.length > 0) {
        log(`${colors.bright}Route Files (${filesToDelete.routes.length}):${colors.reset}`, 'cyan');
        filesToDelete.routes.forEach(file => {
            log(`  📁 ${file.path}`, 'dim');
            log(`     ${file.description}`, 'dim');
        });
        console.log();
    }

    if (filesToDelete.backend.length > 0) {
        log(`${colors.bright}Backend Files (${filesToDelete.backend.length}):${colors.reset}`, 'cyan');
        filesToDelete.backend.forEach(file => {
            log(`  📄 ${file.path}`, 'dim');
            log(`     ${file.description}`, 'dim');
        });
        console.log();
    }

    log(`${colors.bright}Total: ${totalFiles} items will be deleted${colors.reset}\n`);

    // Registry cleanup notes
    log(`${colors.bright}${colors.yellow}Manual Cleanup Required:${colors.reset}`, 'yellow');
    log(`After deletion, you may need to manually remove:`, 'yellow');
    log(`  1. Export from frontend/packages/${packageName}/src/index.ts`, 'dim');
    log(`  2. Router import from backend/app/presentation/${packageName}/__init__.py`, 'dim');
    log(`  3. Permissions from backend/app/domain/shared/value_objects/role.py`, 'dim');
    log(`  4. Model from backend/app/infrastructure/persistence/models.py`, 'dim');
    log(`  5. Model import from backend/app/infrastructure/persistence/db/connection.py`, 'dim');
    console.log();

    // If dry-run, exit here
    if (dryRun) {
        info('📋 Dry-run mode: No files were deleted');
        log('\nTo actually delete these files, run the command without --dry-run', 'dim');
        process.exit(0);
    }

    await deleteFiles();

    // Confirmation prompt
    async function confirmDeletion() {
        if (force) {
            return true;
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(
                `${colors.red}${colors.bright}Are you sure you want to delete these ${totalFiles} items? (y/N): ${colors.reset}`,
                (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
                }
            );
        });
    }

    // Delete files
    async function deleteFiles() {
        const confirmed = await confirmDeletion();

        if (!confirmed) {
            warning('\n❌ Deletion cancelled by user');
            process.exit(0);
        }

        console.log(`\n${colors.bright}${colors.red}Deleting files...${colors.reset}\n`);

        let deletedCount = 0;
        let errorCount = 0;

        const allFiles = [
            ...filesToDelete.frontend,
            ...filesToDelete.routes,
            ...filesToDelete.backend
        ];

        for (const file of allFiles) {
            try {
                if (file.type === 'directory') {
                    fs.rmSync(file.path, { recursive: true, force: true });
                    success(`✓ Deleted directory: ${path.relative(projectRoot, file.path)}`);
                } else {
                    fs.unlinkSync(file.path);
                    success(`✓ Deleted file: ${path.relative(projectRoot, file.path)}`);
                }
                deletedCount++;
            } catch (err) {
                error(`✗ Failed to delete: ${path.relative(projectRoot, file.path)}`);
                log(`  Reason: ${err.message}`, 'red');
                errorCount++;
            }
        }

        console.log();
        log(`${colors.bright}═══════════════════════════════════════════════════════${colors.reset}`, 'green');
        log(`${colors.bright}                  Deletion Complete!${colors.reset}`, 'green');
        log(`${colors.bright}═══════════════════════════════════════════════════════${colors.reset}`, 'green');
        console.log();

        success(`✓ Successfully deleted ${deletedCount} items`);
        if (errorCount > 0) {
            warning(`⚠ Failed to delete ${errorCount} items`);
        }

        console.log();
        log(`${colors.bright}${colors.yellow}Next Steps:${colors.reset}`, 'yellow');
        log(`  1. Review and manually remove exports from index files`, 'dim');
        log(`  2. Remove router imports from __init__.py`, 'dim');
        log(`  3. Remove permissions from role.py`, 'dim');
        log(`  4. Remove model from models.py and connection.py`, 'dim');
        log(`  5. Test your application to ensure it still works`, 'dim');
        console.log();
    }
}

// Execute main function
main().catch(err => {
    error(`Unexpected error: ${err.message}`);
});
