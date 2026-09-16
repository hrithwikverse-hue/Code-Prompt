import * as fs from 'fs';
import * as path from 'path';
import { ExportConfig, isSupportedFile, shouldIgnoreFile, isSecretFile } from './config';
import { LANGUAGE_MAP, FILENAME_LANGUAGE_MAP } from './fileRegistry';
import { TreeNode, collectFiles } from './treeBuilder';

export interface ScannedFile {
    relativePath: string;
    absolutePath: string;
    content: string;
    lineCount: number;
    size: number;
    language: string;
}

// ---------------------------------------------------------------------------
// In-memory scan cache
// Key: absolutePath + '|' + mtimeMs + '|' + size
// ---------------------------------------------------------------------------
interface CacheEntry {
    content: string;
    lineCount: number;
    language: string;
}
const scanCache = new Map<string, CacheEntry>();

function makeCacheKey(absolutePath: string, mtimeMs: number, size: number): string {
    return `${absolutePath}|${mtimeMs}|${size}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function scanFiles(
    tree: TreeNode,
    rootPath: string,
    config: ExportConfig
): ScannedFile[] {
    const fileNodes = collectFiles(tree);
    const scanned: ScannedFile[] = [];

    for (const node of fileNodes) {
        try {
            const result = readFileEntry(node.path, node.name, node.size, config);
            if (!result) continue;

            const relativePath = path.relative(rootPath, node.path).replace(/\\/g, '/');
            scanned.push({
                relativePath,
                absolutePath: node.path,
                content: result.content,
                lineCount: result.lineCount,
                size: node.size || Buffer.byteLength(result.content, 'utf-8'),
                language: result.language,
            });
        } catch {
            // Skip unreadable files — never crash the full export
            continue;
        }
    }

    return scanned;
}

export function scanSpecificFiles(
    filePaths: string[],
    rootPath: string,
    config: ExportConfig
): ScannedFile[] {
    const scanned: ScannedFile[] = [];

    for (const filePath of filePaths) {
        try {
            const resolvedPath = path.resolve(filePath);
            const resolvedRoot = path.resolve(rootPath);
            if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) continue;

            const fileName = path.basename(resolvedPath);

            // Security gate — must be first
            if (isSecretFile(fileName)) continue;

            if (shouldIgnoreFile(fileName, config)) continue;
            if (!isSupportedFile(fileName, config)) continue;

            const stats = fs.statSync(resolvedPath);
            if (stats.size > config.maxFileSizeKB * 1024) continue;

            const result = readFileEntry(resolvedPath, fileName, stats.size, config, stats);
            if (!result) continue;

            const relativePath = path.relative(rootPath, resolvedPath).replace(/\\/g, '/');
            scanned.push({
                relativePath,
                absolutePath: resolvedPath,
                content: result.content,
                lineCount: result.lineCount,
                size: stats.size,
                language: result.language,
            });
        } catch {
            continue;
        }
    }

    return scanned;
}

// ---------------------------------------------------------------------------
// Core file reader — security → size → cache → read → binary check → return
// ---------------------------------------------------------------------------

function readFileEntry(
    absolutePath: string,
    fileName: string,
    knownSize: number | undefined,
    config: ExportConfig,
    cachedStats?: fs.Stats
): CacheEntry | null {
    // 1. Security gate — reject before ANY read
    if (isSecretFile(fileName)) return null;

    // 2. Get stats (reuse if already obtained)
    let stats: fs.Stats;
    try {
        stats = cachedStats ?? fs.statSync(absolutePath);
    } catch {
        return null;
    }

    // 3. Size check
    if (stats.size > config.maxFileSizeKB * 1024) return null;

    // 4. Cache lookup
    const cacheKey = makeCacheKey(absolutePath, stats.mtimeMs, stats.size);
    const cached = scanCache.get(cacheKey);
    if (cached) return cached;

    // 5. Special handling for .ipynb notebooks
    const ext = path.extname(fileName).toLowerCase();
    if (ext === '.ipynb') {
        const entry = readNotebook(absolutePath, fileName);
        if (entry) scanCache.set(cacheKey, entry);
        return entry;
    }

    // 6. Fast binary pre-check: read a small header sample WITHOUT loading the whole file
    if (isBinaryHeader(absolutePath)) return null;

    // 7. Full text read
    let content: string;
    try {
        content = fs.readFileSync(absolutePath, 'utf-8');
    } catch {
        return null;
    }

    // 8. Content-level binary safety net (catches edge cases the header missed)
    if (isBinary(content)) return null;

    // 9. Build entry
    const language = getLanguageFromExt(ext, fileName);
    const entry: CacheEntry = {
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

function readNotebook(absolutePath: string, _fileName: string): CacheEntry | null {
    let raw: string;
    try {
        raw = fs.readFileSync(absolutePath, 'utf-8');
    } catch {
        return null;
    }

    // Must be valid JSON
    let nb: Record<string, unknown>;
    try {
        nb = JSON.parse(raw);
    } catch {
        return null;
    }

    const cells = nb.cells as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(cells)) {
        // Fallback: export raw JSON
        return { content: raw, lineCount: raw.split('\n').length, language: 'json' };
    }

    const lines: string[] = [];
    lines.push('# Jupyter Notebook');
    lines.push('');

    for (const cell of cells) {
        const cellType = String(cell.cell_type ?? 'code');
        const source = cell.source;

        const sourceLines: string[] = Array.isArray(source)
            ? (source as string[])
            : typeof source === 'string'
            ? source.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l))
            : [];

        if (sourceLines.length === 0) continue;

        if (cellType === 'markdown') {
            lines.push('<!-- markdown cell -->');
            lines.push(...sourceLines.map(l => l.replace(/\n$/, '')));
        } else {
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
function isBinaryHeader(absolutePath: string): boolean {
    const SAMPLE = 512;
    const buf = Buffer.alloc(SAMPLE);
    let fd: number | undefined;
    let bytesRead = 0;

    try {
        fd = fs.openSync(absolutePath, 'r');
        bytesRead = fs.readSync(fd, buf, 0, SAMPLE, 0);
    } catch {
        return false; // Can't read header — let full read attempt handle it
    } finally {
        if (fd !== undefined) {
            try { fs.closeSync(fd); } catch { /* ignore */ }
        }
    }

    if (bytesRead === 0) return false;

    let nonPrintable = 0;
    for (let i = 0; i < bytesRead; i++) {
        const b = buf[i];
        if (b === 0) return true; // Null byte → definitely binary
        if (b < 32 && b !== 9 && b !== 10 && b !== 13) nonPrintable++;
    }
    return nonPrintable / bytesRead > 0.1;
}

function isBinary(content: string): boolean {
    // Safety-net check on full content (first 8000 chars)
    const sample = content.substring(0, 8000);
    let nonPrintable = 0;

    for (let i = 0; i < sample.length; i++) {
        const code = sample.charCodeAt(i);
        if (code === 0) return true;
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
            nonPrintable++;
        }
    }

    return nonPrintable / sample.length > 0.1;
}

function getLanguageFromExt(ext: string, fileName: string): string {
    // Exact filename check first
    if (FILENAME_LANGUAGE_MAP[fileName]) {
        return FILENAME_LANGUAGE_MAP[fileName];
    }

    if (!ext) {
        if (fileName === 'Dockerfile') return 'dockerfile';
        if (fileName === 'Makefile') return 'makefile';
        return 'text';
    }

    return LANGUAGE_MAP[ext] || 'text';
}
