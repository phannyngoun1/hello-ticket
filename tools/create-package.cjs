#!/usr/bin/env node

/**
 * CLI tool to scaffold new packages similar to the account package
 * Usage: node tools/create-package.cjs <package-name> [options]
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
${colors.bright}${colors.cyan}Create Package CLI Tool${colors.reset}

${colors.bright}Usage:${colors.reset}
  npm run create-package -- <package-name> [options]
  node tools/create-package.cjs <package-name> [options]
  
${colors.yellow}Note:${colors.reset} When using npm scripts, use '--' before the package name to pass arguments.

${colors.bright}Options:${colors.reset}
  --features, -f <features>    Comma-separated list of feature modules (e.g., "users,roles,profile")
  --description, -d <desc>     Package description
  --author, -a <author>        Package author (default: "Truths Platform")
  --crud-type, -c <type>       CRUD type for features: "basic" or "full" (default: none)
  --crud-template <name>       Explicit CRUD template folder (e.g., "basic-crud", "full-crud")
  --crud-fields, --fields      Fields for CRUD modules (e.g., "name:string,code:string")
  --list-templates             Show available CRUD templates and exit
  --interactive, -i            Enable interactive mode (prompts for missing information)
  --install                    Install dependencies after creating package (default: false)
  --no-install                 Skip installing dependencies (default behavior)

${colors.bright}CRUD Generation:${colors.reset}
  After creating a package, you can generate CRUD modules using:
  - ${colors.cyan}npm run create-basic-crud${colors.reset} - For simple CRUD (UOM pattern)
  - ${colors.cyan}npm run create-crud${colors.reset} - For full CRUD with advanced features

${colors.bright}Examples:${colors.reset}
  npm run create-package inventory --features "items,categories,suppliers"
  npm run create-package billing --description "Billing and invoicing package"
  npm run create-package analytics --features "reports,dashboards,metrics"
  
  ${colors.yellow}With CRUD generation:${colors.reset}
  npm run create-package inventory --features "category" --crud-type basic
  npm run create-package inventory --features "product" --crud-type full --crud-fields "name:string,price:number,status:enum"
  npm run create-package inventory --features "supplier" --crud-template full-crud --crud-fields "name:string,email:string"
  
  ${colors.yellow}With dependency installation:${colors.reset}
  npm run create-package inventory --features "items" --install
  npm run create-package inventory --features "product" --crud-type full --install

${colors.yellow}Template visibility:${colors.reset}
  npm run create-package -- --list-templates
`);
  process.exit(0);
}

let packageName = args[0];
let options = {};

// Parse options
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--features' || arg === '-f') {
    options.features = args[++i]?.split(',').map(f => f.trim()).filter(Boolean) || [];
  } else if (arg === '--description' || arg === '-d') {
    options.description = args[++i] || '';
  } else if (arg === '--author' || arg === '-a') {
    options.author = args[++i] || 'Truths Platform';
  } else if (arg === '--crud-type' || arg === '-c') {
    options.crudType = args[++i];
    if (options.crudType && !['basic', 'full'].includes(options.crudType)) {
      error('CRUD type must be either "basic" or "full"');
    }
  } else if (arg === '--crud-fields' || arg === '--fields') {
    options.crudFields = args[++i];
  } else if (arg === '--crud-template') {
    const templateArg = args[++i];
    if (!templateArg || templateArg.startsWith('--')) {
      error('--crud-template requires a template name (e.g., "basic-crud")');
    }
    options.crudTemplate = templateArg;
  } else if (arg === '--interactive' || arg === '-i') {
    options.interactive = true;
  } else if (arg === '--install') {
    options.install = true;
  } else if (arg === '--no-install') {
    options.install = false;
  } else if (arg === '--list-templates') {
    options.listTemplates = true;
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
  
  try {
    // Package name
    if (!packageName) {
      let name = await question(rl, `${colors.cyan}Package name:${colors.reset} `);
      name = name.trim();
      if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
        error('Package name must be lowercase and contain only letters, numbers, and hyphens');
      }
      collected.packageName = name;
    } else {
      collected.packageName = packageName;
    }
    
    // Description
    if (!collected.description) {
      const desc = await question(rl, `${colors.cyan}Description (optional):${colors.reset} `);
      if (desc.trim()) {
        collected.description = desc.trim();
      }
    }
    
    // Features
    if (!collected.features || collected.features.length === 0) {
      const featuresInput = await question(rl, `${colors.cyan}Features (comma-separated, optional):${colors.reset} `);
      if (featuresInput.trim()) {
        collected.features = featuresInput.split(',').map(f => f.trim()).filter(Boolean);
      } else {
        collected.features = [];
      }
    }
    
    // CRUD type
    if (!collected.crudType && collected.features && collected.features.length > 0) {
      printCrudTemplateSummary(crudTemplates);
      const crudType = await question(rl, `${colors.cyan}Generate CRUD? (basic/full/none) [none]:${colors.reset} `);
      const type = crudType.trim().toLowerCase();
      if (type === 'basic' || type === 'full') {
        collected.crudType = type;
        
        // CRUD fields
        if (!collected.crudFields) {
          const fieldsInput = await question(rl, `${colors.cyan}CRUD fields (e.g., "name:string,code:string") [optional]:${colors.reset} `);
          if (fieldsInput.trim()) {
            collected.crudFields = fieldsInput.trim();
          }
        }
      }
    }
    
    if (collected.crudType || collected.crudTemplate) {
      logCrudTemplateSelection(collected, { header: 'Using CRUD template' });
    }

    // Author
    if (!collected.author || collected.author === 'Truths Platform') {
      const author = await question(rl, `${colors.cyan}Author [Truths Platform]:${colors.reset} `);
      if (author.trim()) {
        collected.author = author.trim();
      } else {
        collected.author = 'Truths Platform';
      }
    }
    
    // Install dependencies (always prompt in interactive mode)
    const cliDefault = collected.install !== undefined ? collected.install : false;
    const defaultChar = cliDefault ? 'y' : 'n';
    const installPrompt = `${colors.cyan}Install dependencies after creation? (y/n) [${defaultChar}]:${colors.reset} `;
    const installInput = await question(rl, installPrompt);
    const installValue = installInput.trim().toLowerCase();
    
    // If user just presses Enter, use the CLI default (or false if no CLI default)
    if (installValue === '') {
      collected.install = cliDefault;
    } else if (installValue === 'y' || installValue === 'yes') {
      collected.install = true;
    } else {
      collected.install = false;
    }
    
    return collected;
  } finally {
    rl.close();
  }
}

// Validate package name (if provided via CLI)
if (packageName && !/^[a-z][a-z0-9-]*$/.test(packageName)) {
  error('Package name must be lowercase and contain only letters, numbers, and hyphens');
}

const frontendRoot = path.resolve(__dirname, '..', 'frontend');
const packagesDir = path.join(frontendRoot, 'packages');
const templatesRoot = path.join(__dirname, 'templates');

const CRUD_TEMPLATE_ALIAS = {
  basic: 'basic-crud',
  full: 'full-crud',
};

const TEMPLATE_LABEL_OVERRIDES = {
  'basic-crud': 'Basic CRUD',
  'full-crud': 'Full CRUD',
};

const TEMPLATE_ALIAS_LOOKUP = Object.entries(CRUD_TEMPLATE_ALIAS).reduce((acc, [alias, target]) => {
  if (!acc[target]) {
    acc[target] = [];
  }
  acc[target].push(alias);
  return acc;
}, {});

const crudTemplates = loadCrudTemplateMetadata();

if (options.listTemplates) {
  printCrudTemplateSummary(crudTemplates, { includeFiles: true });
  process.exit(0);
}

if (options.crudTemplate && !options.crudType) {
  const resolvedKey = resolveCrudTemplateKey(options.crudTemplate);
  if (resolvedKey) {
    options.crudTemplate = resolvedKey;
    const aliasMatch = Object.entries(CRUD_TEMPLATE_ALIAS).find(([, target]) => target === resolvedKey);
    if (aliasMatch) {
      options.crudType = aliasMatch[0];
    }
  }
}

if (options.crudTemplate) {
  const templateKey = resolveCrudTemplateKey(options.crudTemplate);
  if (!templateKey) {
    error(`CRUD template "${options.crudTemplate}" not found. Use --list-templates to see available templates.`);
  }
}

if (options.crudType && !options.crudTemplate) {
  getSelectedCrudTemplateInfo(options);
}

function loadCrudTemplateMetadata() {
  if (!fs.existsSync(templatesRoot)) {
    return {};
  }

  const entries = fs.readdirSync(templatesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory());

  return entries.reduce((acc, entry) => {
    const dirKey = entry.name;
    const templatePath = path.join(templatesRoot, dirKey);
    const files = fs.readdirSync(templatePath, { withFileTypes: true })
      .filter(child => child.isFile())
      .map(child => child.name);

    acc[dirKey] = {
      key: dirKey,
      label: TEMPLATE_LABEL_OVERRIDES[dirKey] || toHumanReadable(dirKey),
      path: templatePath,
      files,
      operations: classifyTemplateOperations(files),
    };

    return acc;
  }, {});
}

function classifyTemplateOperations(files = []) {
  const normalized = files.map(name => name.toLowerCase());

  const operations = {
    list: normalized.some(name => name.includes('list')),
    detail: normalized.some(name => name.includes('detail')),
    create: normalized.some(name => name.includes('create')),
    update: normalized.some(name => name.includes('edit')),
    delete: normalized.some(name => name.includes('service')),
    provider: normalized.some(name => name.includes('provider')),
    hooks: normalized.some(name => name.includes('hook')),
    service: normalized.some(name => name.includes('service')),
    types: normalized.some(name => name.includes('types')),
  };

  operations.summary = [
    operations.list ? 'List' : null,
    operations.detail ? 'Detail' : null,
    operations.create ? 'Create' : null,
    operations.update ? 'Update' : null,
    operations.delete ? 'Delete' : null,
  ].filter(Boolean);

  operations.support = [
    operations.hooks ? 'Hooks' : null,
    operations.provider ? 'Provider' : null,
    operations.service ? 'Service' : null,
    operations.types ? 'Types' : null,
  ].filter(Boolean);

  return operations;
}

function printCrudTemplateSummary(metadata, { includeFiles = false } = {}) {
  if (!metadata || Object.keys(metadata).length === 0) {
    log('No CRUD templates found in tools/templates. Skipping template summary.', 'yellow');
    return;
  }

  log(`\n${colors.bright}${colors.blue}Available CRUD templates:${colors.reset}`);
  Object.values(metadata).forEach(meta => {
    const aliases = TEMPLATE_ALIAS_LOOKUP[meta.key];
    const aliasSuffix = aliases && aliases.length > 0 ? ` (aliases: ${aliases.join(', ')})` : '';
    log(`  • ${meta.label}${aliasSuffix}`);
    log(`    Path: ${meta.path}`);
    if (meta.operations.summary.length > 0) {
      log(`    Operations: ${meta.operations.summary.join(', ')}`);
    } else {
      log('    Operations: none detected');
    }
    if (meta.operations.support.length > 0) {
      log(`    Support: ${meta.operations.support.join(', ')}`);
    }
    if (includeFiles && meta.files.length > 0) {
      log('    Files:');
      meta.files.forEach(file => {
        log(`      - ${file}`);
      });
    }
  });
  log('');
}

function resolveCrudTemplateKey(value) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (crudTemplates[normalized]) {
    return normalized;
  }

  const aliasTarget = CRUD_TEMPLATE_ALIAS[normalized];
  if (aliasTarget && crudTemplates[aliasTarget]) {
    return aliasTarget;
  }

  return null;
}

function getSelectedCrudTemplateInfo(currentOptions = options, { assign = true } = {}) {
  if (!currentOptions) {
    return null;
  }

  const templateKey = resolveCrudTemplateKey(currentOptions.crudTemplate || currentOptions.crudType);
  if (!templateKey) {
    return null;
  }

  if (assign) {
    currentOptions.crudTemplate = templateKey;
  }

  return crudTemplates[templateKey] || null;
}

function describeCrudTemplateOperations(templateInfo) {
  if (!templateInfo) {
    return '';
  }

  const { operations } = templateInfo;
  const primary = operations.summary.join(', ');

  if (primary && operations.support.length > 0) {
    return `${primary} (support: ${operations.support.join(', ')})`;
  }

  if (primary) {
    return primary;
  }

  if (operations.support.length > 0) {
    return `Support: ${operations.support.join(', ')}`;
  }

  return '';
}

function toHumanReadable(value) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function logCrudTemplateSelection(currentOptions, { header = 'Template' } = {}) {
  const templateInfo = getSelectedCrudTemplateInfo(currentOptions);

  if (!templateInfo) {
    if (currentOptions && (currentOptions.crudType || currentOptions.crudTemplate)) {
      log(`${colors.yellow}Warning:${colors.reset} CRUD template not found for selection "${currentOptions.crudTemplate || currentOptions.crudType}".`, 'yellow');
    }
    return null;
  }

  const operationsSummary = describeCrudTemplateOperations(templateInfo);
  if (operationsSummary) {
    log(`${colors.cyan}${header}:${colors.reset} ${templateInfo.label} — ${operationsSummary}`);
  } else {
    log(`${colors.cyan}${header}:${colors.reset} ${templateInfo.label}`);
  }

  return templateInfo;
}

// Create directories
function createDirectories(pkgName, opts) {
  info('Creating directory structure...');
  const pkgDir = path.join(packagesDir, pkgName);
  const srcDir = path.join(pkgDir, 'src');
  
  // Check if package already exists
  if (fs.existsSync(pkgDir)) {
    error(`Package "${pkgName}" already exists at ${pkgDir}`);
  }
  
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(path.join(pkgDir, 'examples'), { recursive: true });
  
  // Create feature directories if specified
  if (opts.features && opts.features.length > 0) {
    opts.features.forEach(feature => {
      const featureDir = path.join(srcDir, feature);
      fs.mkdirSync(featureDir, { recursive: true });
    });
  }
  success('✓ Directory structure created');
  return { packageDir: pkgDir, srcDir };
}

// Generate package.json
function generatePackageJson(pkgName, pkgDir, opts) {
  info('Generating package.json...');
  const packageJson = {
    name: `@truths/${pkgName}`,
    version: '1.0.0',
    type: 'module',
    main: './src/index.ts',
    types: './src/index.ts',
    exports: {
      '.': './src/index.ts',
      './*': './src/*/index.ts',
    },
    scripts: {
      'type-check': 'tsc --noEmit',
    },
    files: [
      'src',
      'README.md',
    ],
    keywords: [
      'react',
      'components',
      packageName,
      'ui',
      'tailwind',
    ],
    dependencies: {
      '@truths/api': '*',
      '@truths/shared': '*',
      '@truths/ui': '*',
      '@truths/utils': '*',
      'react': '^18.3.1',
    },
    devDependencies: {
      '@types/react': '^18.3.12',
      'typescript': '^5.3.3',
    },
  };

  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );
  success('✓ package.json created');
}

// Generate tsconfig.json
function generateTsConfig(pkgDir) {
  info('Generating tsconfig.json...');
  const tsConfig = {
    extends: '../../tsconfig.json',
    compilerOptions: {
      outDir: './dist',
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  fs.writeFileSync(
    path.join(pkgDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2) + '\n'
  );
  success('✓ tsconfig.json created');
}

// Generate registry.ts
function generateRegistry(srcDirPath) {
  info('Generating registry.ts...');
  const registryContent = `/**
 * ${capitalize(packageName)} Component Registry
 * 
 * Central registry for all ${packageName} management components.
 * Each component is self-contained and can be composed with other components.
 */

export interface ${capitalize(packageName)}ComponentMetadata {
    name: string;
    description: string;
    category: ${generateCategoryTypes()};
    tags: string[];
    dependencies?: string[];
    version: string;
    author?: string;
    preview?: string;
}

export interface ${capitalize(packageName)}Component<T = any> {
    Component: React.ComponentType<T>;
    metadata: ${capitalize(packageName)}ComponentMetadata;
    examples?: {
        title: string;
        description: string;
        code: string;
    }[];
}

export interface ${capitalize(packageName)}ComponentRegistry {
    [key: string]: ${capitalize(packageName)}Component;
}

/**
 * Registry of all available ${packageName} components
 */
export const ${packageName}Components: ${capitalize(packageName)}ComponentRegistry = {};

/**
 * Register a new ${packageName} component
 */
export function register${capitalize(packageName)}Component<T = any>(
    id: string,
    component: ${capitalize(packageName)}Component<T>
): void {
    if (${packageName}Components[id]) {
        console.warn(\`${capitalize(packageName)} component "\${id}" is already registered. Overwriting...\`);
    }
    ${packageName}Components[id] = component;
}

/**
 * Get a ${packageName} component by ID
 */
export function get${capitalize(packageName)}Component(id: string): ${capitalize(packageName)}Component | undefined {
    return ${packageName}Components[id];
}

/**
 * Get all ${packageName} components
 */
export function getAll${capitalize(packageName)}Components(): ${capitalize(packageName)}ComponentRegistry {
    return ${packageName}Components;
}

/**
 * Get ${packageName} components by category
 */
export function get${capitalize(packageName)}ComponentsByCategory(
    category: ${capitalize(packageName)}ComponentMetadata['category']
): ${capitalize(packageName)}ComponentRegistry {
    return Object.entries(${packageName}Components).reduce((acc, [id, component]) => {
        if (component.metadata.category === category) {
            acc[id] = component;
        }
        return acc;
    }, {} as ${capitalize(packageName)}ComponentRegistry);
}

/**
 * Search ${packageName} components by tag
 */
export function get${capitalize(packageName)}ComponentsByTag(tag: string): ${capitalize(packageName)}ComponentRegistry {
    return Object.entries(${packageName}Components).reduce((acc, [id, component]) => {
        if (component.metadata.tags.includes(tag)) {
            acc[id] = component;
        }
        return acc;
    }, {} as ${capitalize(packageName)}ComponentRegistry);
}

/**
 * Get ${packageName} component dependencies
 */
export function get${capitalize(packageName)}ComponentDependencies(id: string): string[] {
    const component = ${packageName}Components[id];
    if (!component || !component.metadata.dependencies) {
        return [];
    }
    return component.metadata.dependencies;
}
`;

  fs.writeFileSync(path.join(srcDirPath, 'registry.ts'), registryContent);
  success('✓ registry.ts created');
}

function generateCategoryTypes() {
  if (options.features && options.features.length > 0) {
    const categories = options.features.map(f => `'${f}'`).join(' | ');
    return categories;
  }
  return "'general'";
}

// Generate types.ts
function generateTypes(srcDirPath) {
  info('Generating types.ts...');
  const typesContent = `/**
 * Common types shared across ${packageName} components
 */

import type { Pagination, PaginatedResponse } from '@truths/shared';

export interface ${capitalize(packageName)}Props {
    className?: string;
    children?: React.ReactNode;
}

export interface ${capitalize(packageName)}LayoutProps extends ${capitalize(packageName)}Props {
    variant?: 'default' | 'compact' | 'expanded';
    fullWidth?: boolean;
}

export interface ${capitalize(packageName)}WithDataProps<T> extends ${capitalize(packageName)}Props {
    data: T;
    loading?: boolean;
    error?: Error | null;
    onRetry?: () => void;
}

export interface ${capitalize(packageName)}WithActionsProps extends ${capitalize(packageName)}Props {
    actions?: React.ReactNode;
    onAction?: (action: string, data?: any) => void;
}

${generateFeatureTypes()}

/**
 * Filter Types
 */
export interface ${capitalize(packageName)}Filter {
    search?: string;
    createdAfter?: Date;
    createdBefore?: Date;
}

// Pagination and PaginatedResponse are imported from @truths/shared

/**
 * ${capitalize(packageName)} Configuration
 */
export interface ${capitalize(packageName)}Config {
    theme?: 'light' | 'dark' | 'auto';
    locale?: string;
    apiEndpoint?: string;
    features?: {
        [key: string]: boolean;
    };
}
`;

  fs.writeFileSync(path.join(srcDirPath, 'types.ts'), typesContent);
  success('✓ types.ts created');
}

function generateFeatureTypes() {
  if (!options.features || options.features.length === 0) {
    return '';
  }

  return options.features.map(feature => {
    const FeatureName = capitalize(feature);
    return `
/**
 * ${FeatureName} Types
 */
export interface ${FeatureName} {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt?: Date;
    // Add your ${FeatureName} fields here
}

export interface Create${FeatureName}Input {
    name: string;
    // Add your create ${FeatureName} fields here
}

export interface Update${FeatureName}Input {
    name?: string;
    // Add your update ${FeatureName} fields here
}
`;
  }).join('\n');
}

// Generate index.ts
function generateIndex(srcDirPath) {
  info('Generating index.ts...');
  const featureExports = options.features && options.features.length > 0
    ? options.features.map(f => `export * from './${f}';`).join('\n')
    : '// Feature exports will go here';

  const featureRegistrations = options.features && options.features.length > 0
    ? options.features.map(f => `// ${capitalize(f)} components
// import { ${capitalize(f)}List, ${f}ListMetadata } from './${f}/${f}-list';
// register${capitalize(packageName)}Component('${f}-list', {
//     Component: ${capitalize(f)}List,
//     metadata: ${f}ListMetadata(),
// });`).join('\n\n')
    : '// Component registrations will go here';

  const indexContent = `/**
 * @truths/${packageName}
 * 
 * ${options.description || `A comprehensive ${packageName} management package.`}
 */

// Registry
export * from './registry';
export * from './types';

${featureExports}

// Register all ${packageName} components
import { register${capitalize(packageName)}Component } from './registry';

${featureRegistrations}
`;

  fs.writeFileSync(path.join(srcDirPath, 'index.ts'), indexContent);
  success('✓ index.ts created');
}

// Generate feature index files
function generateFeatureIndexFiles(srcDirPath) {
  if (!options.features || options.features.length === 0) {
    return;
  }

  info('Generating feature index files...');
  options.features.forEach(feature => {
    const featureDir = path.join(srcDirPath, feature);
    const indexContent = `/**
 * ${capitalize(feature)} module exports
 */

// Export components and utilities for ${feature}
// export * from './${feature}-list';
// export * from './${feature}-detail';
`;
    fs.writeFileSync(path.join(featureDir, 'index.ts'), indexContent);
  });
  success('✓ Feature index files created');
}

// Generate README.md
function generateReadme(pkgDir) {
  info('Generating README.md...');
  const packageDisplayName = capitalize(packageName);
  const description = options.description || `A comprehensive ${packageName} management package for your application.`;
  const crudTemplateInfo = getSelectedCrudTemplateInfo(options, { assign: false });
  const crudTemplateSummary = crudTemplateInfo ? describeCrudTemplateOperations(crudTemplateInfo) : '';
  
  const featuresSection = options.features && options.features.length > 0
    ? `## Features

${options.features.map(f => `- **${capitalize(f)} Management**: Complete CRUD operations for ${f}`).join('\n')}
- 🎨 **Beautiful Designs**: Built with Tailwind CSS and shadcn/ui
- 🔧 **Customizable**: Extensive props for customization
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built with accessibility in mind
- 🎯 **Type-Safe**: Full TypeScript support
- 🔄 **Real-time**: Supports real-time updates`
    : `## Features

- 🎨 **Beautiful Designs**: Built with Tailwind CSS and shadcn/ui
- 🔧 **Customizable**: Extensive props for customization
- 📱 **Responsive**: Mobile-first design
- ♿ **Accessible**: Built with accessibility in mind
- 🎯 **Type-Safe**: Full TypeScript support
- 🔄 **Real-time**: Supports real-time updates`;

  const examplesSection = options.features && options.features.length > 0
    ? options.features.map(f => {
        const FeatureName = capitalize(f);
        return `### ${FeatureName} Management

\`\`\`tsx
import { ${FeatureName}List, Create${FeatureName}, Edit${FeatureName} } from '@truths/${packageName}';

// Display list of ${f}
<${FeatureName}List
  on${FeatureName}Click={handle${FeatureName}Click}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// Create new ${f}
<Create${FeatureName}
  onSuccess={handle${FeatureName}Created}
  onCancel={handleCancel}
/>
\`\`\``;
      }).join('\n\n')
    : `\`\`\`tsx
import { ${packageDisplayName}Component } from '@truths/${packageName}';

// Use your components here
<${packageDisplayName}Component />
\`\`\``;

  const readmeContent = `# @truths/${packageName}

${description}

## What is ${packageDisplayName} Package?

The ${packageName} package provides pre-built, styled, and functional components for managing ${packageName} in your application.

${featuresSection}

${crudTemplateInfo ? `## CRUD Template

This package scaffolds CRUD modules using the **${crudTemplateInfo.label}** template${crudTemplateSummary ? `, covering ${crudTemplateSummary}` : ''}.

Available template files:

${crudTemplateInfo.files.map(file => `- ${file}`).join('\n')}
` : ''}

## Installation

\`\`\`bash
npm install @truths/${packageName}
\`\`\`

## Quick Start

${examplesSection}

## Generating CRUD Modules

After creating your package, you can quickly generate CRUD modules for your features:

### Basic CRUD (Simple, UOM pattern)

\`\`\`bash
npm run create-basic-crud -- <entity-name> --package ${packageName}
\`\`\`

Example:
\`\`\`bash
npm run create-basic-crud -- category --package ${packageName}
npm run create-basic-crud -- supplier --package ${packageName} --fields "name:string,code:string,email:string"
\`\`\`

### Full CRUD (Advanced features)

\`\`\`bash
npm run create-crud -- <entity-name> --package ${packageName} --fields "name:string,status:enum"
\`\`\`

Example:
\`\`\`bash
npm run create-crud -- product --package ${packageName} --fields "name:string,price:number,status:enum"
\`\`\`

**Note:** Full CRUD includes advanced features like:
- Status actions (lock/unlock, activate/deactivate)
- Advanced filtering
- Detail views with tabs
- Comprehensive form validation
- Keyboard shortcuts

## Available Components

${options.features && options.features.length > 0
  ? options.features.map(f => {
      const FeatureName = capitalize(f);
      return `### ${FeatureName} Management

- **${FeatureName}List**: Display and manage ${f} in a table
- **${FeatureName}Detail**: View detailed ${f} information
- **Create${FeatureName}**: Form to create new ${f}
- **Edit${FeatureName}**: Form to edit existing ${f}`;
    }).join('\n\n')
  : 'Add your components here'}

## API Integration

The ${packageName} package integrates with \`@truths/api\` for backend communication:

\`\`\`tsx
import { use${packageDisplayName} } from "@truths/${packageName}";

// In your component
const { data, loading, error, refetch } = use${packageDisplayName}();
\`\`\`

## Component Registry

All components are automatically registered and can be accessed via the registry:

\`\`\`tsx
import { get${capitalize(packageName)}Component, getAll${capitalize(packageName)}Components } from "@truths/${packageName}";

// Get a specific component
const Component = get${capitalize(packageName)}Component("component-id");

// Get all components
const allComponents = getAll${capitalize(packageName)}Components();
\`\`\`

## Customization

### Theming

Components inherit your application's theme:

\`\`\`tsx
<${packageDisplayName}Component className="custom-class" theme="dark" />
\`\`\`

## Examples

Check the \`examples/\` directory for complete examples.

## Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## License

MIT
`;

  fs.writeFileSync(path.join(pkgDir, 'README.md'), readmeContent);
  success('✓ README.md created');
}

// Generate examples README
function generateExamplesReadme(pkgDir) {
  info('Generating examples README...');
  const examplesReadme = `# ${capitalize(packageName)} Package Examples

This directory contains example implementations of ${packageName} package components.

## Examples

${options.features && options.features.length > 0
    ? options.features.map(f => `- \`${f}-example.tsx\`: Complete ${f} management flow`).join('\n')
    : '- Add your examples here'}

## Usage

Copy the example code and adapt it to your needs.
`;

  fs.writeFileSync(path.join(pkgDir, 'examples', 'README.md'), examplesReadme);
  success('✓ Examples README created');
}

// Generate CRUD modules for features
async function generateCRUDModules() {
  if (!options.features || options.features.length === 0 || !options.crudType) {
    return;
  }

  const { execSync } = require('child_process');
  const crudCommand = options.crudType === 'basic' ? 'create-basic-crud' : 'create-crud';
  const templateInfo = getSelectedCrudTemplateInfo(options);

  if (templateInfo) {
    log(`${colors.cyan}CRUD Template:${colors.reset} ${templateInfo.label} — ${describeCrudTemplateOperations(templateInfo)}`);
    const requiredOperations = ['list', 'create', 'update', 'delete'];
    const missingOperations = requiredOperations.filter(op => !templateInfo.operations[op]);
    if (missingOperations.length > 0) {
      log(`${colors.yellow}Warning:${colors.reset} Template is missing: ${missingOperations.join(', ')}. Generated CRUD may be incomplete.`, 'yellow');
    }
    if (options.crudType === 'full' && !templateInfo.operations.detail) {
      log(`${colors.yellow}Warning:${colors.reset} Full CRUD template is missing detail views.`, 'yellow');
    }
  } else {
    log(`${colors.yellow}Warning:${colors.reset} Unable to resolve CRUD template for type "${options.crudType}".`, 'yellow');
  }
  
  for (let i = 0; i < options.features.length; i++) {
    const feature = options.features[i];
    info(`Generating ${options.crudType} CRUD for ${feature}...`);
    
    try {
      const args = [
        'run',
        crudCommand,
        '--',
        feature,
        '--package',
        packageName
      ];
      
      if (crudCommand === 'create-crud') {
        args.push('--type', 'full');
      }

      if (options.crudFields) {
        args.push('--fields', options.crudFields);
      }
      
      execSync(`npm ${args.join(' ')}`, {
        cwd: frontendRoot,
        stdio: 'inherit'
      });
      
      success(`✓ ${options.crudType} CRUD generated for ${feature}`);
    } catch (err) {
      log(`⚠ Failed to generate CRUD for ${feature}`, 'yellow');
      log(`  You can run it manually: npm run ${crudCommand} -- ${feature} --package ${packageName}`, 'yellow');
    }
  }
  
  log(`\n${colors.bright}${colors.green}✓ CRUD generation complete!${colors.reset}\n`);
}

// Install dependencies for the package
async function installDependencies(pkgDir, pkgName) {
  info('Installing dependencies...');
  
  try {
    const { execSync } = require('child_process');
    // In a workspace, we can install from root or from package directory
    // Installing from root ensures workspace links are properly set up
    try {
      // Try installing from root first (better for workspace setup)
      execSync(`npm install --workspace=packages/${pkgName}`, {
        cwd: frontendRoot,
        stdio: 'inherit'
      });
      success(`✓ Dependencies installed for @truths/${pkgName}`);
    } catch (rootErr) {
      // Fallback to installing in package directory
      log(`Installing from package directory...`, 'yellow');
      execSync('npm install', {
        cwd: pkgDir,
        stdio: 'inherit'
      });
      success(`✓ Dependencies installed for @truths/${pkgName}`);
    }
  } catch (err) {
    log(`⚠ Failed to install dependencies`, 'yellow');
    log(`  You can install manually:`, 'yellow');
    log(`    From root: ${colors.cyan}npm install --workspace=packages/${pkgName}${colors.reset}`, 'yellow');
    log(`    Or: ${colors.cyan}cd packages/${pkgName} && npm install${colors.reset}`, 'yellow');
  }
}

// Utility function to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Main execution
(async () => {
  try {
    // Collect interactive input if enabled or if package name is missing
    let finalOptions = options;
    let finalPackageName = packageName;
    
    if (options.interactive || !packageName) {
      log(`\n${colors.bright}${colors.cyan}Interactive Mode${colors.reset}\n`);
      const collected = await collectInteractiveInput();
      finalPackageName = collected.packageName;
      finalOptions = collected;
      // Update packageName for use in functions
      packageName = finalPackageName;
      options = finalOptions;
    }
    
    if (!finalPackageName) {
      error('Package name is required');
    }
    
    // Validate final package name
    if (!/^[a-z][a-z0-9-]*$/.test(finalPackageName)) {
      error('Package name must be lowercase and contain only letters, numbers, and hyphens');
    }
    
    // Show summary
    log(`\n${colors.bright}${colors.blue}Creating package: ${colors.cyan}@truths/${finalPackageName}${colors.reset}\n`);
    if (finalOptions.description) {
      log(`${colors.cyan}Description:${colors.reset} ${finalOptions.description}`);
    }
    if (finalOptions.features && finalOptions.features.length > 0) {
      log(`${colors.cyan}Features:${colors.reset} ${finalOptions.features.join(', ')}`);
    }
    if (finalOptions.crudType) {
      log(`${colors.cyan}CRUD Type:${colors.reset} ${finalOptions.crudType}`);
      logCrudTemplateSelection(finalOptions, { header: 'CRUD Template' });
    } else if (finalOptions.crudTemplate) {
      logCrudTemplateSelection(finalOptions, { header: 'CRUD Template' });
    }
    if (finalOptions.install !== undefined) {
      log(`${colors.cyan}Install Dependencies:${colors.reset} ${finalOptions.install ? 'Yes' : 'No'}`);
    }
    log('');
    
    // Setup directories
    const { packageDir, srcDir } = createDirectories(finalPackageName, finalOptions);
    
    // Temporarily set global variables for functions that still use them
    const originalPackageName = packageName;
    const originalOptions = options;
    packageName = finalPackageName;
    options = finalOptions;
    
    // Set srcDir as a global for functions that use it
    const originalSrcDir = typeof srcDir !== 'undefined' ? srcDir : null;
    if (typeof srcDir !== 'undefined') {
      // Set srcDir as a property or use a different approach
      // For now, we'll pass it to functions that need it
      generatePackageJson(finalPackageName, packageDir, finalOptions);
      generateTsConfig(packageDir);
      generateRegistry(srcDir);
      generateTypes(srcDir);
      generateIndex(srcDir);
      generateFeatureIndexFiles(srcDir);
      generateReadme(packageDir);
      generateExamplesReadme(packageDir);
    }
    
    // Restore original values
    packageName = originalPackageName;
    options = originalOptions;
    
    // Generate CRUD modules if requested (before installing dependencies)
    if (finalOptions.crudType && finalOptions.features && finalOptions.features.length > 0) {
      log(`\n${colors.yellow}Generating CRUD modules for features...${colors.reset}`);
      // Temporarily update options for CRUD generation
      const originalOptions = options;
      const originalPackageName = packageName;
      options = finalOptions;
      packageName = finalPackageName;
      await generateCRUDModules();
      options = originalOptions;
      packageName = originalPackageName;
    }
    
    // Install dependencies if requested
    if (finalOptions.install) {
      log(`\n${colors.yellow}Installing dependencies...${colors.reset}`);
      await installDependencies(packageDir, finalPackageName);
    }
    
    log(`\n${colors.bright}${colors.green}✓ Package created successfully!${colors.reset}\n`);
    log(`${colors.cyan}Next steps:${colors.reset}`);
    log(`  1. cd packages/${finalPackageName}`);
    if (!finalOptions.install) {
      log(`  2. Install dependencies: ${colors.cyan}npm install${colors.reset}`);
      log(`  3. Start building your components in src/`);
    } else {
      log(`  2. Start building your components in src/`);
    }
    if (finalOptions.features && finalOptions.features.length > 0) {
      const stepNum = finalOptions.install ? '3' : '4';
      log(`  ${stepNum}. Components are organized by features: ${finalOptions.features.join(', ')}`);
      
      if (!finalOptions.crudType) {
        log(`\n${colors.cyan}💡 Tip: Generate CRUD modules for your features:${colors.reset}`);
        finalOptions.features.forEach(feature => {
          log(`  ${colors.cyan}npm run create-basic-crud${colors.reset} -- ${feature} --package ${finalPackageName}`);
          log(`  ${colors.cyan}npm run create-crud${colors.reset} -- ${feature} --package ${finalPackageName} --fields "name:string,code:string"`);
        });
      }
    }
    log(`\n${colors.bright}Happy coding!${colors.reset}\n`);
    
  } catch (err) {
    error(err.message);
  }
})();
