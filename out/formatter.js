"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatContext = formatContext;
exports.formatProjectSummary = formatProjectSummary;
const treeBuilder_1 = require("./treeBuilder");
function formatContext(tree, files, config, options = {}) {
    const { title = 'Project Context Export', includeTree = true, includeStats = true, includeTimestamp = true, mode = 'full', } = options;
    const sections = [];
    // Header
    sections.push(`# ${title}`);
    sections.push('');
    // Metadata
    if (includeTimestamp) {
        sections.push(`> Generated: ${new Date().toISOString()}`);
        sections.push(`> Mode: ${mode}`);
        sections.push(`> Files: ${files.length}`);
        if (includeStats) {
            const stats = (0, treeBuilder_1.getTreeStats)(tree);
            const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0);
            const totalSizeKB = (files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1);
            sections.push(`> Total Lines: ${totalLines.toLocaleString()}`);
            sections.push(`> Total Size: ${totalSizeKB} KB`);
            sections.push(`> Directories: ${stats.directories}`);
        }
        sections.push('');
    }
    sections.push('---');
    sections.push('');
    // Folder Structure
    if (includeTree) {
        sections.push('## 📁 Folder Structure');
        sections.push('');
        sections.push('```');
        sections.push((0, treeBuilder_1.treeToString)(tree).trimEnd());
        sections.push('```');
        sections.push('');
        sections.push('---');
        sections.push('');
    }
    // Package.json summary (if exists)
    const packageJson = files.find(f => f.relativePath === 'package.json');
    if (packageJson) {
        try {
            const pkg = JSON.parse(packageJson.content);
            sections.push('## 📦 Project Info');
            sections.push('');
            if (pkg.name)
                sections.push(`- **Name:** ${pkg.name}`);
            if (pkg.version)
                sections.push(`- **Version:** ${pkg.version}`);
            if (pkg.description)
                sections.push(`- **Description:** ${pkg.description}`);
            if (pkg.dependencies) {
                sections.push(`- **Dependencies:** ${Object.keys(pkg.dependencies).join(', ')}`);
            }
            if (pkg.devDependencies) {
                sections.push(`- **Dev Dependencies:** ${Object.keys(pkg.devDependencies).join(', ')}`);
            }
            if (pkg.scripts) {
                sections.push('- **Scripts:**');
                for (const [key, value] of Object.entries(pkg.scripts)) {
                    sections.push(`  - \`${key}\`: \`${value}\``);
                }
            }
            sections.push('');
            sections.push('---');
            sections.push('');
        }
        catch {
            // Invalid JSON, skip summary
        }
    }
    // Source Files
    sections.push('## 📄 Source Files');
    sections.push('');
    for (const file of files) {
        sections.push(`### File: \`${file.relativePath}\``);
        sections.push('');
        sections.push(`> ${file.lineCount} lines | ${(file.size / 1024).toFixed(1)} KB`);
        sections.push('');
        const codeContent = config.includeLineNumbers
            ? addLineNumbers(file.content)
            : file.content;
        sections.push(`\`\`\`${file.language}`);
        sections.push(codeContent.trimEnd());
        sections.push('```');
        sections.push('');
    }
    return sections.join('\n');
}
function formatProjectSummary(tree, files, config) {
    const sections = [];
    sections.push('# PROJECT_CONTEXT.md');
    sections.push('');
    sections.push(`> Generated: ${new Date().toISOString()}`);
    sections.push('');
    // Tree
    sections.push('## Project Structure');
    sections.push('');
    sections.push('```');
    sections.push((0, treeBuilder_1.treeToString)(tree).trimEnd());
    sections.push('```');
    sections.push('');
    // Key config files content
    const configFiles = [
        'package.json',
        'tsconfig.json',
        'pyproject.toml',
        'Cargo.toml',
        'go.mod',
        'build.gradle',
        'pom.xml',
        'Gemfile',
        'requirements.txt',
        '.env.example',
        '.env.sample',
        'docker-compose.yml',
        'docker-compose.yaml',
        'Dockerfile',
    ];
    const foundConfigs = files.filter(f => configFiles.some(cf => f.relativePath.endsWith(cf)));
    if (foundConfigs.length > 0) {
        sections.push('## Configuration Files');
        sections.push('');
        for (const file of foundConfigs) {
            sections.push(`### \`${file.relativePath}\``);
            sections.push('');
            sections.push(`\`\`\`${file.language}`);
            sections.push(file.content.trimEnd());
            sections.push('```');
            sections.push('');
        }
    }
    // Route files
    const routePatterns = ['route', 'router', 'urls', 'endpoint', 'api'];
    const routeFiles = files.filter(f => {
        const lower = f.relativePath.toLowerCase();
        return routePatterns.some(p => lower.includes(p));
    });
    if (routeFiles.length > 0) {
        sections.push('## Route / API Files');
        sections.push('');
        for (const file of routeFiles) {
            sections.push(`### \`${file.relativePath}\``);
            sections.push('');
            sections.push(`\`\`\`${file.language}`);
            sections.push(addLineNumbers(file.content).trimEnd());
            sections.push('```');
            sections.push('');
        }
    }
    return sections.join('\n');
}
function addLineNumbers(content) {
    const lines = content.split('\n');
    const padding = String(lines.length).length;
    return lines
        .map((line, i) => {
        const num = String(i + 1).padStart(padding, ' ');
        return `${num} | ${line}`;
    })
        .join('\n');
}
//# sourceMappingURL=formatter.js.map