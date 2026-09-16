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
exports.isSecretFile = isSecretFile;
exports.isSupportedFile = isSupportedFile;
exports.getLanguageId = getLanguageId;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const micromatch_1 = __importDefault(require("micromatch"));
const fileRegistry_1 = require("./fileRegistry");
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
/**
 * Hard security check — must be called BEFORE any file read.
 * Returns true when the file should NEVER be exported, regardless of user settings.
 */
function isSecretFile(fileName) {
    const lower = fileName.toLowerCase();
    // Exact secret filename match
    if (fileRegistry_1.SECRET_FILENAMES.has(lower) || fileRegistry_1.SECRET_FILENAMES.has(fileName)) {
        return true;
    }
    // Secret extension match
    const ext = path.extname(fileName).toLowerCase();
    if (ext && fileRegistry_1.SECRET_EXTENSIONS.has(ext)) {
        return true;
    }
    // .env.* pattern — block unless it's a safe template/example suffix
    if (lower.startsWith(fileRegistry_1.ENV_PREFIX)) {
        if (fileRegistry_1.SAFE_ENV_SUFFIXES.has(lower)) {
            return false; // explicitly safe
        }
        return true; // block all other .env.* variants
    }
    // Bare .env (no extension case — already caught above via SECRET_FILENAMES,
    // but guard again for safety)
    if (lower === '.env') {
        return true;
    }
    return false;
}
/**
 * Returns true if the file should be included in an export.
 * When the user has a non-empty customised list, that list is the sole authority.
 * Built-in defaults only apply when the user list is empty (original semantics).
 */
function isSupportedFile(fileName, config) {
    const ext = path.extname(fileName).toLowerCase();
    const userList = config.supportedExtensions;
    if (userList.length > 0) {
        // User list is authoritative — exact extension or exact filename match
        if (!ext)
            return userList.includes(fileName);
        return userList.includes(ext) || userList.includes(fileName);
    }
    // No user customisation — fall back to built-in registry
    if (!ext)
        return fileRegistry_1.BUILT_IN_FILENAMES.has(fileName);
    return fileRegistry_1.BUILT_IN_EXTENSIONS.has(ext);
}
/**
 * Returns the Markdown fenced-block language identifier for a file.
 * Delegates to the shared registry — no duplicate maps.
 */
function getLanguageId(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    // Check exact filename first (e.g. Dockerfile, Makefile)
    if (fileRegistry_1.FILENAME_LANGUAGE_MAP[fileName]) {
        return fileRegistry_1.FILENAME_LANGUAGE_MAP[fileName];
    }
    if (!ext) {
        return 'text';
    }
    return fileRegistry_1.LANGUAGE_MAP[ext] || 'text';
}
//# sourceMappingURL=config.js.map