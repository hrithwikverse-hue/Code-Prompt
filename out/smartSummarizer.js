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
const fileRegistry_1 = require("./fileRegistry");
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
    // --- High-priority file bonus from registry ---
    const hpBonus = fileRegistry_1.HIGH_PRIORITY_FILENAMES.get(name);
    if (hpBonus !== undefined) {
        score += hpBonus;
        reasons.push('key config/manifest');
    }
    // --- Entry points ---
    if (['index.ts', 'index.js', 'index.tsx', 'index.jsx', 'main.ts', 'main.js',
        'app.ts', 'app.js', 'app.tsx', 'app.jsx',
        'server.ts', 'server.js', 'main.py', 'app.py', 'manage.py',
        'main.go', 'main.rs', 'lib.rs', 'mod.rs',
        'index.astro', 'app.svelte', 'app.vue',
        'main.dart', 'main.swift', 'main.kt', 'main.java',
        'main.cpp', 'main.c', 'main.zig'].includes(name)) {
        score += 50;
        reasons.push('entry point');
    }
    // --- Config files not already in HIGH_PRIORITY_FILENAMES ---
    if (['tsconfig.json', '.env.example', '.env.sample', '.env.template',
        'makefile', '.editorconfig'].includes(name) && !reasons.includes('key config/manifest')) {
        score += 35;
        reasons.push('config');
    }
    // --- Route/API files ---
    if (relPath.includes('route') || relPath.includes('router') ||
        relPath.includes('controller') || relPath.includes('endpoint') ||
        relPath.includes('api/')) {
        score += 35;
        reasons.push('API/routes');
    }
    // --- Model/Schema files ---
    if (relPath.includes('model') || relPath.includes('schema') ||
        relPath.includes('entity') || relPath.includes('migration')) {
        score += 30;
        reasons.push('data model');
    }
    // --- Middleware / Auth ---
    if (relPath.includes('middleware') || relPath.includes('auth') ||
        relPath.includes('guard') || relPath.includes('permission')) {
        score += 28;
        reasons.push('middleware/auth');
    }
    // --- Service / Business logic ---
    if (relPath.includes('service') || relPath.includes('usecase') ||
        relPath.includes('handler') || relPath.includes('resolver')) {
        score += 25;
        reasons.push('business logic');
    }
    // --- AI / ML specific files ---
    if (relPath.includes('train') || relPath.includes('model') ||
        relPath.includes('inference') || relPath.includes('dataset') ||
        relPath.includes('pipeline') || relPath.includes('embeddings')) {
        score += 22;
        reasons.push('AI/ML');
    }
    // --- Utils/Helpers ---
    if (relPath.includes('util') || relPath.includes('helper') ||
        relPath.includes('lib/')) {
        score += 15;
        reasons.push('utility');
    }
    // --- Tests (lower priority) ---
    if (relPath.includes('test') || relPath.includes('spec') ||
        relPath.includes('__test__') || relPath.includes('__tests__')) {
        score += 5;
        reasons.push('test');
    }
    // --- Type definitions ---
    if (name.endsWith('.d.ts') || relPath.includes('types') ||
        relPath.includes('interfaces')) {
        score += 20;
        reasons.push('types');
    }
    // --- Root level files get a bonus ---
    if (!relPath.includes('/')) {
        score += 10;
        reasons.push('root');
    }
    // --- Shorter files are more likely to be focused/important ---
    if (file.lineCount < 50) {
        score += 5;
    }
    else if (file.lineCount > 500) {
        score -= 5;
    }
    // --- README already handled by HIGH_PRIORITY_FILENAMES ---
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
    const stack = new Set();
    const fileNames = files.map(f => path.basename(f.relativePath).toLowerCase());
    const allPaths = files.map(f => f.relativePath.toLowerCase());
    const fileNameSet = new Set(fileNames);
    // --- Filename-based signals from registry ---
    for (const [signal, labels] of fileRegistry_1.FILENAME_TECH_SIGNALS) {
        if (fileNameSet.has(signal)) {
            labels.forEach(l => stack.add(l));
        }
    }
    // --- npm package.json dependency signals ---
    const pkg = files.find(f => f.relativePath === 'package.json' || f.relativePath.endsWith('/package.json'));
    if (pkg) {
        stack.add('Node.js / npm');
        try {
            const parsed = JSON.parse(pkg.content);
            const allDeps = {
                ...parsed.dependencies,
                ...parsed.devDependencies,
            };
            for (const [dep, label] of fileRegistry_1.NPM_DEP_SIGNALS) {
                if (allDeps[dep])
                    stack.add(label);
            }
        }
        catch { /* ignore invalid JSON */ }
    }
    // --- Bun / Deno detection via lockfiles ---
    if (fileNameSet.has('bun.lockb') || fileNameSet.has('bunfig.toml'))
        stack.add('Bun');
    if (fileNameSet.has('deno.json') || fileNameSet.has('deno.jsonc') || fileNameSet.has('deno.lock'))
        stack.add('Deno');
    // --- Python requirements.txt dependency signals ---
    const reqTxt = files.find(f => f.relativePath === 'requirements.txt' || f.relativePath.endsWith('/requirements.txt'));
    if (reqTxt) {
        stack.add('Python');
        const lower = reqTxt.content.toLowerCase();
        for (const [dep, label] of fileRegistry_1.PYTHON_DEP_SIGNALS) {
            if (lower.includes(dep))
                stack.add(label);
        }
    }
    // --- pyproject.toml dependency signals ---
    const pyproject = files.find(f => f.relativePath === 'pyproject.toml' || f.relativePath.endsWith('/pyproject.toml'));
    if (pyproject) {
        stack.add('Python');
        const lower = pyproject.content.toLowerCase();
        for (const [dep, label] of fileRegistry_1.PYTHON_DEP_SIGNALS) {
            if (lower.includes(dep))
                stack.add(label);
        }
    }
    // --- Rust ---
    if (fileNameSet.has('cargo.toml'))
        stack.add('Rust');
    // --- Go ---
    if (fileNameSet.has('go.mod'))
        stack.add('Go');
    // --- Ruby ---
    if (fileNameSet.has('gemfile'))
        stack.add('Ruby');
    // --- Java/JVM ---
    if (fileNameSet.has('build.gradle') || fileNameSet.has('pom.xml'))
        stack.add('Java/JVM');
    // --- Flutter / Dart ---
    if (fileNameSet.has('pubspec.yaml') || allPaths.some(p => p.endsWith('.dart'))) {
        stack.add('Flutter/Dart');
    }
    // --- Swift / iOS / macOS ---
    if (allPaths.some(p => p.endsWith('.swift')))
        stack.add('Swift / iOS / macOS');
    // --- Kotlin / Android ---
    if (allPaths.some(p => p.endsWith('.kt') || p.endsWith('.kts')))
        stack.add('Kotlin / Android');
    // --- Zig ---
    if (allPaths.some(p => p.endsWith('.zig')))
        stack.add('Zig');
    // --- C / C++ (including embedded) ---
    const hasCFiles = allPaths.some(p => p.endsWith('.c') || p.endsWith('.h'));
    const hasCppFiles = allPaths.some(p => p.endsWith('.cpp') || p.endsWith('.hpp') || p.endsWith('.cc'));
    const hasIno = allPaths.some(p => p.endsWith('.ino'));
    if (hasIno)
        stack.add('Arduino / Embedded C++');
    else if (hasCppFiles)
        stack.add('C++');
    else if (hasCFiles)
        stack.add('C');
    // --- TypeScript (if not already added via tsconfig signal) ---
    if (!stack.has('TypeScript') &&
        (fileNameSet.has('tsconfig.json') || allPaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx')))) {
        stack.add('TypeScript');
    }
    // --- Docker ---
    if (fileNameSet.has('dockerfile') || fileNameSet.has('docker-compose.yml') || fileNameSet.has('docker-compose.yaml')) {
        stack.add('Docker');
    }
    // --- Kubernetes ---
    if (allPaths.some(p => p.includes('k8s/') || p.includes('kubernetes/') || p.endsWith('.helm.yaml'))) {
        stack.add('Kubernetes');
    }
    // --- Terraform ---
    if (allPaths.some(p => p.endsWith('.tf') || p.endsWith('.tfvars'))) {
        stack.add('Terraform');
    }
    // --- Jupyter notebooks ---
    if (allPaths.some(p => p.endsWith('.ipynb'))) {
        stack.add('Jupyter Notebooks');
    }
    return [...stack].sort();
}
function addLineNumbers(content) {
    const lines = content.split('\n');
    const padding = String(lines.length).length;
    return lines
        .map((line, i) => `${String(i + 1).padStart(padding, ' ')} | ${line}`)
        .join('\n');
}
//# sourceMappingURL=smartSummarizer.js.map