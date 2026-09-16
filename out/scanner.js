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
const fileRegistry_1 = require("./fileRegistry");
const treeBuilder_1 = require("./treeBuilder");
const scanCache = new Map();
function makeCacheKey(absolutePath, mtimeMs, size) {
    return `${absolutePath}|${mtimeMs}|${size}`;
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
function scanFiles(tree, rootPath, config) {
    const fileNodes = (0, treeBuilder_1.collectFiles)(tree);
    const scanned = [];
    for (const node of fileNodes) {
        try {
            const result = readFileEntry(node.path, node.name, node.size, config);
            if (!result)
                continue;
            const relativePath = path.relative(rootPath, node.path).replace(/\\/g, '/');
            scanned.push({
                relativePath,
                absolutePath: node.path,
                content: result.content,
                lineCount: result.lineCount,
                size: node.size || Buffer.byteLength(result.content, 'utf-8'),
                language: result.language,
            });
        }
        catch {
            // Skip unreadable files — never crash the full export
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
            const fileName = path.basename(resolvedPath);
            // Security gate — must be first
            if ((0, config_1.isSecretFile)(fileName))
                continue;
            if ((0, config_1.shouldIgnoreFile)(fileName, config))
                continue;
            if (!(0, config_1.isSupportedFile)(fileName, config))
                continue;
            const stats = fs.statSync(resolvedPath);
            if (stats.size > config.maxFileSizeKB * 1024)
                continue;
            const result = readFileEntry(resolvedPath, fileName, stats.size, config, stats);
            if (!result)
                continue;
            const relativePath = path.relative(rootPath, resolvedPath).replace(/\\/g, '/');
            scanned.push({
                relativePath,
                absolutePath: resolvedPath,
                content: result.content,
                lineCount: result.lineCount,
                size: stats.size,
                language: result.language,
            });
        }
        catch {
            continue;
        }
    }
    return scanned;
}
// ---------------------------------------------------------------------------
// Core file reader — security → size → cache → read → binary check → return
// ---------------------------------------------------------------------------
function readFileEntry(absolutePath, fileName, knownSize, config, cachedStats) {
    // 1. Security gate — reject before ANY read
    if ((0, config_1.isSecretFile)(fileName))
        return null;
    // 2. Get stats (reuse if already obtained)
    let stats;
    try {
        stats = cachedStats ?? fs.statSync(absolutePath);
    }
    catch {
        return null;
    }
    // 3. Size check
    if (stats.size > config.maxFileSizeKB * 1024)
        return null;
    // 4. Cache lookup
    const cacheKey = makeCacheKey(absolutePath, stats.mtimeMs, stats.size);
    const cached = scanCache.get(cacheKey);
    if (cached)
        return cached;
    // 5. Special handling for .ipynb notebooks
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.ipynb') {
        const entry = readNotebook(absolutePath, fileName);
        if (entry)
            scanCache.set(cacheKey, entry);
        return entry;
    }
    // 6. Fast binary pre-check: read a small header sample WITHOUT loading the whole file
    if (isBinaryHeader(absolutePath))
        return null;
    // 7. Full text read
    let content;
    try {
        content = fs.readFileSync(absolutePath, 'utf-8');
    }
    catch {
        return null;
    }
    // 8. Content-level binary safety net (catches edge cases the header missed)
    if (isBinary(content))
        return null;
    // 9. Build entry
    const language = getLanguageFromExt(ext, fileName);
    const entry = {
        content,
        lineCount: content.split('\n').length,
        language,
    };
    scanCache.set(cacheKey, entry);
    return entry;
}
// ---------------------------------------------------------------------------
// Jupyter Notebook (.ipynb) support
// ---------------------------------------------------------------------------
function readNotebook(absolutePath, _fileName) {
    let raw;
    try {
        raw = fs.readFileSync(absolutePath, 'utf-8');
    }
    catch {
        return null;
    }
    // Must be valid JSON
    let nb;
    try {
        nb = JSON.parse(raw);
    }
    catch {
        return null;
    }
    const cells = nb.cells;
    if (!Array.isArray(cells)) {
        // Fallback: export raw JSON
        return { content: raw, lineCount: raw.split('\n').length, language: 'json' };
    }
    const lines = [];
    lines.push('# Jupyter Notebook');
    lines.push('');
    for (const cell of cells) {
        const cellType = String(cell.cell_type ?? 'code');
        const source = cell.source;
        const sourceLines = Array.isArray(source)
            ? source
            : typeof source === 'string'
                ? source.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l))
                : [];
        if (sourceLines.length === 0)
            continue;
        if (cellType === 'markdown') {
            lines.push('<!-- markdown cell -->');
            lines.push(...sourceLines.map(l => l.replace(/\n$/, '')));
        }
        else {
            lines.push(`\`\`\`python`);
            lines.push(...sourceLines.map(l => l.replace(/\n$/, '')));
            lines.push('```');
        }
        lines.push('');
    }
    const content = lines.join('\n');
    return { content, lineCount: content.split('\n').length, language: 'python' };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Fast binary pre-check: reads only the first 512 bytes via a raw file descriptor.
 * Avoids loading the entire file into memory before deciding it's binary.
 */
function isBinaryHeader(absolutePath) {
    const SAMPLE = 512;
    const buf = Buffer.alloc(SAMPLE);
    let fd;
    let bytesRead = 0;
    try {
        fd = fs.openSync(absolutePath, 'r');
        bytesRead = fs.readSync(fd, buf, 0, SAMPLE, 0);
    }
    catch {
        return false; // Can't read header — let full read attempt handle it
    }
    finally {
        if (fd !== undefined) {
            try {
                fs.closeSync(fd);
            }
            catch { /* ignore */ }
        }
    }
    if (bytesRead === 0)
        return false;
    let nonPrintable = 0;
    for (let i = 0; i < bytesRead; i++) {
        const b = buf[i];
        if (b === 0)
            return true; // Null byte → definitely binary
        if (b < 32 && b !== 9 && b !== 10 && b !== 13)
            nonPrintable++;
    }
    return nonPrintable / bytesRead > 0.1;
}
function isBinary(content) {
    // Safety-net check on full content (first 8000 chars)
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
    // Exact filename check first
    if (fileRegistry_1.FILENAME_LANGUAGE_MAP[fileName]) {
        return fileRegistry_1.FILENAME_LANGUAGE_MAP[fileName];
    }
    if (!ext) {
        if (fileName === 'Dockerfile')
            return 'dockerfile';
        if (fileName === 'Makefile')
            return 'makefile';
        return 'text';
    }
    return fileRegistry_1.LANGUAGE_MAP[ext] || 'text';
}
//# sourceMappingURL=scanner.js.map