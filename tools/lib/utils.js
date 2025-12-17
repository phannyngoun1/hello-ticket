const readline = require('readline');
const { spawn } = require('child_process');

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

function log(message, color = 'reset') {
    console.log(`${colors[color] || colors.reset}${message}${colors.reset}`);
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

module.exports = {
    colors,
    box,
    log,
    error,
    success,
    printHeader,
    printStep,
    printSummary,
    createReadlineInterface,
    question,
    runScript,
    runPythonScript,
    pluralize,
    capitalize,
    camelCase,
    pascalCase,
    snakeCase,
    toUpperSnakeCase,
    kebabCase
};
