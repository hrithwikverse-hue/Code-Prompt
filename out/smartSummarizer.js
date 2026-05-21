"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartExport = smartExport;
const path = __importStar(require("path"));
const treeBuilder_1 = require("./treeBuilder");
const gitUtils_1 = require("./gitUtils");
function smartExport(tree, allFiles, config, workspacePath) {
    const sections = [];
    const maxFiles = config.smartExportMaxFiles;
    // Score and rank files
    const priorities = allFiles.map(file => scoreFile(file)).sort((a, b) => b.score - a.score);
    const selectedFiles = priorities.slice(0, maxFiles);
    const skippedFiles = priorities.slice(maxFiles);
    // Header
    sections.push('# Smart Project Context');
    sections.push('');
    sections.push(`> Generated: ${new Date().toISOString()}`);
    sections.push(`> Mode: Smart Export`);
    sections.push(`> Key Files: ${selectedFiles.length} / ${allFiles.length} total`);
    // Git info
    if ((0, gitUtils_1.isGitRepo)(workspacePath)) {
        const branch = (0, gitUtils_1.getGitBranch)(workspacePath);
        const commits = (0, gitUtils_1.getRecentCommits)(workspacePath, 5);
        sections.push(`> Branch: ${branch}`);
        if (commits.length > 0) {
            sections.push('> Recent commits:');
            commits.forEach(c => sections.push(`>   - ${c}`));
        }
    }
    sections.push('');
    sections.push('---');
    sections.push('');
    // Full tree
    sections.push('## 📁 Complete Project Structure');
    sections.push('');
    sections.push('```');
    sections.push((0, treeBuilder_1.treeToString)(tree).trimEnd());
    sections.push('```');
    sections.push('');
    sections.push('---');
    sections.push('');
    // Tech stack detection
    const techStack = detectTechStack(allFiles);
    if (techStack.length > 0) {
        sections.push('## 🛠 Detected Tech Stack');
        sections.push('');
        techStack.forEach(t => sections.push(`- ${t}`));
        sections.push('');
        sections.push('---');
        sections.push('');
    }
    // File selection rationale
    sections.push('## 📊 File Selection');
    sections.push('');
    sections.push('Key files selected by importance:');
    sections.push('');
    sections.push('| File | Score | Reason |');
    sections.push('|------|-------|--------|');
    selectedFiles.forEach(fp => {
        sections.push(`| \`${fp.file.relativePath}\` | ${fp.score} | ${fp.reason} |`);
    });
    sections.push('');
    if (skippedFiles.length > 0) {
        sections.push(`<details><summary>Skipped ${skippedFiles.length} files (click to expand)</summary>`);
        sections.push('');
        skippedFiles.forEach(fp => {
            sections.push(`- \`${fp.file.relativePath}\``);
        });
        sections.push('');
        sections.push('</details>');
        sections.push('');
    }
    sections.push('---');
    sections.push('');
    // Selected file contents
    sections.push('## 📄 Key Files');
    sections.push('');
    for (const fp of selectedFiles) {
        const file = fp.file;
        sections.push(`### \`${file.relativePath}\``);
        sections.push('');
        sections.push(`> ${file.lineCount} lines | Priority: ${fp.reason}`);
        sections.push('');
        const numberedContent = addLineNumbers(file.content);
        sections.push(`\`\`\`${file.language}`);
        sections.push(numberedContent.trimEnd());
        sections.push('```');
        sections.push('');
    }
    return sections.join('\n');
}
function scoreFile(file) {
    let score = 0;
    const reasons = [];
    const name = path.basename(file.relativePath).toLowerCase();
    const dir = path.dirname(file.relativePath).toLowerCase();
    const relPath = file.relativePath.toLowerCase();
    // Entry points
    if (['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js',
        'server.ts', 'server.js', 'main.py', 'app.py', 'manage.py',
        'main.go', 'main.rs', 'lib.rs', 'mod.rs'].includes(name)) {
        score += 50;
        reasons.push('entry point');
    }
    // Config files
    if (['package.json', 'tsconfig.json', 'pyproject.toml', 'cargo.toml',
        'go.mod', 'gemfile', 'requirements.txt', 'docker-compose.yml',
        'dockerfile', '.env.example', 'makefile'].includes(name)) {
        score += 40;
        reasons.push('config');
    }
    // Route/API files
    if (relPath.includes('route') || relPath.includes('router') ||
        relPath.includes('controller') || relPath.includes('endpoint') ||
        relPath.includes('api/')) {
        score += 35;
        reasons.push('API/routes');
    }
    // Model/Schema files
    if (relPath.includes('model') || relPath.includes('schema') ||
        relPath.includes('entity') || relPath.includes('migration')) {
        score += 30;
        reasons.push('data model');
    }
    // Middleware / Auth
    if (relPath.includes('middleware') || relPath.includes('auth') ||
        relPath.includes('guard') || relPath.includes('permission')) {
        score += 28;
        reasons.push('middleware/auth');
    }
    // Service / Business logic
    if (relPath.includes('service') || relPath.includes('usecase') ||
        relPath.includes('handler') || relPath.includes('resolver')) {
        score += 25;
        reasons.push('business logic');
    }
    // Utils/Helpers
    if (relPath.includes('util') || relPath.includes('helper') ||
        relPath.includes('lib/')) {
        score += 15;
        reasons.push('utility');
    }
    // Tests (lower priority)
    if (relPath.includes('test') || relPath.includes('spec') ||
        relPath.includes('__test__')) {
        score += 5;
        reasons.push('test');
    }
    // Type definitions
    if (name.endsWith('.d.ts') || relPath.includes('types') ||
        relPath.includes('interfaces')) {
        score += 20;
        reasons.push('types');
    }
    // Root level files get a bonus
    if (!relPath.includes('/')) {
        score += 10;
        reasons.push('root');
    }
    // Shorter files are more likely to be focused/important
    if (file.lineCount < 50) {
        score += 5;
    }
    else if (file.lineCount > 500) {
        score -= 5;
    }
    // README
    if (name === 'readme.md') {
        score += 45;
        reasons.push('documentation');
    }
    if (reasons.length === 0) {
        reasons.push('source file');
        score += 10;
    }
    return {
        file,
        score,
        reason: reasons.join(', '),
    };
}
function detectTechStack(files) {
    const stack = [];
    const fileNames = files.map(f => path.basename(f.relativePath).toLowerCase());
    const allPaths = files.map(f => f.relativePath.toLowerCase());
    // Package managers / runtimes
    if (fileNames.includes('package.json')) {
        stack.push('Node.js / npm');
        // Try to detect framework from package.json
        const pkg = files.find(f => f.relativePath === 'package.json');
        if (pkg) {
            try {
                const parsed = JSON.parse(pkg.content);
                const allDeps = {
                    ...parsed.dependencies,
                    ...parsed.devDependencies,
                };
                if (allDeps['react'])
                    stack.push('React');
                if (allDeps['next'])
                    stack.push('Next.js');
                if (allDeps['vue'])
                    stack.push('Vue.js');
                if (allDeps['nuxt'])
                    stack.push('Nuxt.js');
                if (allDeps['svelte'])
                    stack.push('Svelte');
                if (allDeps['@sveltejs/kit'])
                    stack.push('SvelteKit');
                if (allDeps['express'])
                    stack.push('Express.js');
                if (allDeps['fastify'])
                    stack.push('Fastify');
                if (allDeps['@nestjs/core'])
                    stack.push('NestJS');
                if (allDeps['angular'])
                    stack.push('Angular');
                if (allDeps['tailwindcss'])
                    stack.push('Tailwind CSS');
                if (allDeps['prisma'] || allDeps['@prisma/client'])
                    stack.push('Prisma');
                if (allDeps['mongoose'])
                    stack.push('MongoDB / Mongoose');
                if (allDeps['typeorm'])
                    stack.push('TypeORM');
                if (allDeps['drizzle-orm'])
                    stack.push('Drizzle ORM');
            }
            catch { }
        }
    }
    if (fileNames.includes('pyproject.toml') || fileNames.includes('requirements.txt')) {
        stack.push('Python');
    }
    if (fileNames.includes('cargo.toml'))
        stack.push('Rust');
    if (fileNames.includes('go.mod'))
        stack.push('Go');
    if (fileNames.includes('gemfile'))
        stack.push('Ruby');
    if (fileNames.includes('build.gradle') || fileNames.includes('pom.xml'))
        stack.push('Java/JVM');
    if (allPaths.some(p => p.endsWith('.dart')))
        stack.push('Dart/Flutter');
    // TypeScript
    if (fileNames.includes('tsconfig.json') || allPaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx'))) {
        stack.push('TypeScript');
    }
    // Docker
    if (fileNames.includes('dockerfile') || fileNames.includes('docker-compose.yml')) {
        stack.push('Docker');
    }
    // Terraform
    if (allPaths.some(p => p.endsWith('.tf'))) {
        stack.push('Terraform');
    }
    return [...new Set(stack)];
}
function addLineNumbers(content) {
    const lines = content.split('\n');
    const padding = String(lines.length).length;
    return lines
        .map((line, i) => `${String(i + 1).padStart(padding, ' ')} | ${line}`)
        .join('\n');
}
//# sourceMappingURL=smartSummarizer.js.map