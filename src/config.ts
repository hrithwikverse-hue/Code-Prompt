import * as vscode from 'vscode';
import * as path from 'path';
import micromatch from 'micromatch';
import {
    BUILT_IN_EXTENSIONS,
    BUILT_IN_FILENAMES,
    LANGUAGE_MAP,
    FILENAME_LANGUAGE_MAP,
    SECRET_EXTENSIONS,
    SECRET_FILENAMES,
    ENV_PREFIX,
    SAFE_ENV_SUFFIXES,
} from './fileRegistry';

export interface ExportConfig {
    ignoredFolders: string[];
    ignoredFiles: string[];
    maxFileSizeKB: number;
    chunkSizeKB: number;
    includeLineNumbers: boolean;
    autoCopyToClipboard: boolean;
    outputLocation: 'clipboard' | 'file' | 'both' | 'newTab';
    smartExportMaxFiles: number;
    supportedExtensions: string[];
}

export function getConfig(): ExportConfig {
    const config = vscode.workspace.getConfiguration('aiContext');

    return {
        ignoredFolders: config.get<string[]>('ignoredFolders', []),
        ignoredFiles: config.get<string[]>('ignoredFiles', []),
        maxFileSizeKB: config.get<number>('maxFileSizeKB', 100),
        chunkSizeKB: config.get<number>('chunkSizeKB', 50),
        includeLineNumbers: config.get<boolean>('includeLineNumbers', true),
        autoCopyToClipboard: config.get<boolean>('autoCopyToClipboard', true),
        outputLocation: config.get<string>('outputLocation', 'both') as ExportConfig['outputLocation'],
        smartExportMaxFiles: config.get<number>('smartExportMaxFiles', 20),
        supportedExtensions: config.get<string[]>('supportedExtensions', []),
    };
}

export function shouldIgnoreFolder(folderName: string, config: ExportConfig): boolean {
    return config.ignoredFolders.includes(folderName);
}

export function shouldIgnoreFile(fileName: string, config: ExportConfig): boolean {
    // Check exact match
    if (config.ignoredFiles.includes(fileName)) {
        return true;
    }

    // Check glob patterns
    const patterns = config.ignoredFiles.filter(p => p.includes('*'));
    if (patterns.length > 0 && micromatch.isMatch(fileName, patterns)) {
        return true;
    }

    return false;
}

/**
 * Hard security check — must be called BEFORE any file read.
 * Returns true when the file should NEVER be exported, regardless of user settings.
 */
export function isSecretFile(fileName: string): boolean {
    const lower = fileName.toLowerCase();

    // Exact secret filename match
    if (SECRET_FILENAMES.has(lower) || SECRET_FILENAMES.has(fileName)) {
        return true;
    }

    // Secret extension match
    const ext = path.extname(fileName).toLowerCase();
    if (ext && SECRET_EXTENSIONS.has(ext)) {
        return true;
    }

    // .env.* pattern — block unless it's a safe template/example suffix
    if (lower.startsWith(ENV_PREFIX)) {
        if (SAFE_ENV_SUFFIXES.has(lower)) {
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
export function isSupportedFile(fileName: string, config: ExportConfig): boolean {
    const ext = path.extname(fileName).toLowerCase();
    const userList = config.supportedExtensions;

    if (userList.length > 0) {
        // User list is authoritative — exact extension or exact filename match
        if (!ext) return userList.includes(fileName);
        return userList.includes(ext) || userList.includes(fileName);
    }

    // No user customisation — fall back to built-in registry
    if (!ext) return BUILT_IN_FILENAMES.has(fileName);
    return BUILT_IN_EXTENSIONS.has(ext);
}

/**
 * Returns the Markdown fenced-block language identifier for a file.
 * Delegates to the shared registry — no duplicate maps.
 */
export function getLanguageId(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    // Check exact filename first (e.g. Dockerfile, Makefile)
    if (FILENAME_LANGUAGE_MAP[fileName]) {
        return FILENAME_LANGUAGE_MAP[fileName];
    }

    if (!ext) {
        return 'text';
    }

    return LANGUAGE_MAP[ext] || 'text';
}
