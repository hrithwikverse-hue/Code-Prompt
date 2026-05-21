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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.shouldIgnoreFolder = shouldIgnoreFolder;
exports.shouldIgnoreFile = shouldIgnoreFile;
exports.isSupportedFile = isSupportedFile;
exports.getLanguageId = getLanguageId;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const micromatch_1 = __importDefault(require("micromatch"));
function getConfig() {
    const config = vscode.workspace.getConfiguration('aiContext');
    return {
        ignoredFolders: config.get('ignoredFolders', []),
        ignoredFiles: config.get('ignoredFiles', []),
        maxFileSizeKB: config.get('maxFileSizeKB', 100),
        chunkSizeKB: config.get('chunkSizeKB', 50),
        includeLineNumbers: config.get('includeLineNumbers', true),
        autoCopyToClipboard: config.get('autoCopyToClipboard', true),
        outputLocation: config.get('outputLocation', 'both'),
        smartExportMaxFiles: config.get('smartExportMaxFiles', 20),
        supportedExtensions: config.get('supportedExtensions', []),
    };
}
function shouldIgnoreFolder(folderName, config) {
    return config.ignoredFolders.includes(folderName);
}
function shouldIgnoreFile(fileName, config) {
    // Check exact match
    if (config.ignoredFiles.includes(fileName)) {
        return true;
    }
    // Check glob patterns
    const patterns = config.ignoredFiles.filter(p => p.includes('*'));
    if (patterns.length > 0 && micromatch_1.default.isMatch(fileName, patterns)) {
        return true;
    }
    return false;
}
function isSupportedFile(fileName, config) {
    const ext = path.extname(fileName).toLowerCase();
    // Files without extensions but in supported list (Dockerfile, Makefile, etc.)
    if (!ext) {
        return config.supportedExtensions.includes(fileName);
    }
    return config.supportedExtensions.includes(ext);
}
function getLanguageId(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const map = {
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.py': 'python',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.kt': 'kotlin',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.swift': 'swift',
        '.php': 'php',
        '.vue': 'vue',
        '.svelte': 'svelte',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.xml': 'xml',
        '.sql': 'sql',
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'zsh',
        '.ps1': 'powershell',
        '.bat': 'batch',
        '.lua': 'lua',
        '.r': 'r',
        '.R': 'r',
        '.jl': 'julia',
        '.ex': 'elixir',
        '.exs': 'elixir',
        '.erl': 'erlang',
        '.clj': 'clojure',
        '.scala': 'scala',
        '.hs': 'haskell',
        '.ml': 'ocaml',
        '.fs': 'fsharp',
        '.dart': 'dart',
        '.tf': 'hcl',
        '.hcl': 'hcl',
        '.proto': 'protobuf',
        '.graphql': 'graphql',
        '.gql': 'graphql',
        '.md': 'markdown',
        '.mdx': 'mdx',
        '.txt': 'text',
    };
    if (!ext) {
        if (fileName === 'Dockerfile')
            return 'dockerfile';
        if (fileName === 'Makefile')
            return 'makefile';
        if (fileName === 'Rakefile')
            return 'ruby';
        if (fileName === 'Gemfile')
            return 'ruby';
        if (fileName === 'Pipfile')
            return 'toml';
        return 'text';
    }
    return map[ext] || 'text';
}
//# sourceMappingURL=config.js.map