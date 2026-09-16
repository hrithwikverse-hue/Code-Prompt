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
export declare function getConfig(): ExportConfig;
export declare function shouldIgnoreFolder(folderName: string, config: ExportConfig): boolean;
export declare function shouldIgnoreFile(fileName: string, config: ExportConfig): boolean;
/**
 * Hard security check — must be called BEFORE any file read.
 * Returns true when the file should NEVER be exported, regardless of user settings.
 */
export declare function isSecretFile(fileName: string): boolean;
/**
 * Returns true if the file should be included in an export.
 * When the user has a non-empty customised list, that list is the sole authority.
 * Built-in defaults only apply when the user list is empty (original semantics).
 */
export declare function isSupportedFile(fileName: string, config: ExportConfig): boolean;
/**
 * Returns the Markdown fenced-block language identifier for a file.
 * Delegates to the shared registry — no duplicate maps.
 */
export declare function getLanguageId(fileName: string): string;
//# sourceMappingURL=config.d.ts.map