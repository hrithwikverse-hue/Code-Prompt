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
exports.scanFiles = scanFiles;
exports.scanSpecificFiles = scanSpecificFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const treeBuilder_1 = require("./treeBuilder");
function scanFiles(tree, rootPath, config) {
    const fileNodes = (0, treeBuilder_1.collectFiles)(tree);
    const scanned = [];
    for (const node of fileNodes) {
        try {
            const content = fs.readFileSync(node.path, 'utf-8');
            const relativePath = path.relative(rootPath, node.path).replace(/\\/g, '/');
            // Skip binary-looking files
            if (isBinary(content))
                continue;
            const ext = path.extname(node.name).toLowerCase();
            const language = getLanguageFromExt(ext, node.name);
            scanned.push({
                relativePath,
                absolutePath: node.path,
                content,
                lineCount: content.split('\n').length,
                size: node.size || Buffer.byteLength(content, 'utf-8'),
                language,
            });
        }
        catch (err) {
            // Skip unreadable files
            continue;
        }
    }
    return scanned;
}
function scanSpecificFiles(filePaths, rootPath, config) {
    const scanned = [];
    for (const filePath of filePaths) {
        try {
            const resolvedPath = path.resolve(filePath);
            const resolvedRoot = path.resolve(rootPath);
            if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot)
                continue;
            const stats = fs.statSync(resolvedPath);
            if (stats.size > config.maxFileSizeKB * 1024)
                continue;
            const fileName = path.basename(resolvedPath);
            if ((0, config_1.shouldIgnoreFile)(fileName, config))
                continue;
            if (!(0, config_1.isSupportedFile)(fileName, config))
                continue;
            const content = fs.readFileSync(resolvedPath, 'utf-8');
            if (isBinary(content))
                continue;
            const relativePath = path.relative(rootPath, resolvedPath).replace(/\\/g, '/');
            const ext = path.extname(fileName).toLowerCase();
            scanned.push({
                relativePath,
                absolutePath: resolvedPath,
                content,
                lineCount: content.split('\n').length,
                size: stats.size,
                language: getLanguageFromExt(ext, fileName),
            });
        }
        catch {
            continue;
        }
    }
    return scanned;
}
function isBinary(content) {
    // Check first 8000 chars for null bytes or high ratio of non-printable chars
    const sample = content.substring(0, 8000);
    let nonPrintable = 0;
    for (let i = 0; i < sample.length; i++) {
        const code = sample.charCodeAt(i);
        if (code === 0)
            return true;
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            nonPrintable++;
        }
    }
    return nonPrintable / sample.length > 0.1;
}
function getLanguageFromExt(ext, fileName) {
    const map = {
        '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
        '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust',
        '.java': 'java', '.kt': 'kotlin', '.cs': 'csharp', '.cpp': 'cpp',
        '.c': 'c', '.h': 'c', '.hpp': 'cpp', '.swift': 'swift', '.php': 'php',
        '.vue': 'vue', '.svelte': 'svelte', '.html': 'html', '.css': 'css',
        '.scss': 'scss', '.sass': 'sass', '.less': 'less', '.json': 'json',
        '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml', '.xml': 'xml',
        '.sql': 'sql', '.sh': 'bash', '.bash': 'bash', '.zsh': 'zsh',
        '.ps1': 'powershell', '.lua': 'lua', '.r': 'r', '.jl': 'julia',
        '.ex': 'elixir', '.exs': 'elixir', '.dart': 'dart', '.tf': 'hcl',
        '.graphql': 'graphql', '.gql': 'graphql', '.md': 'markdown',
        '.mdx': 'mdx', '.proto': 'protobuf', '.hs': 'haskell',
        '.scala': 'scala', '.clj': 'clojure', '.fs': 'fsharp',
        '.ml': 'ocaml',
    };
    if (!ext) {
        if (fileName === 'Dockerfile')
            return 'dockerfile';
        if (fileName === 'Makefile')
            return 'makefile';
        return 'text';
    }
    return map[ext] || 'text';
}
//# sourceMappingURL=scanner.js.map