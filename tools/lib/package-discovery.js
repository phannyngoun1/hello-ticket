const fs = require('fs');
const path = require('path');

// Get available packages from multiple sources (filesystem, vite.config.ts, tsconfig.json)
function getAvailablePackages() {
    const packagesDir = path.join(path.resolve(__dirname, '..', '..'), 'frontend', 'packages');
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
    const viteConfigPath = path.join(path.resolve(__dirname, '..', '..'), 'frontend', 'apps', 'web', 'vite.config.ts');
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
    const tsconfigPath = path.join(path.resolve(__dirname, '..', '..'), 'frontend', 'tsconfig.json');
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
    const packageDir = path.join(path.resolve(__dirname, '..', '..'), 'frontend', 'packages', packageName);
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

module.exports = {
    getAvailablePackages,
    getAvailableModulesFromPackage
};
