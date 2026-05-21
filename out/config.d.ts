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
export declare function isSupportedFile(fileName: string, config: ExportConfig): boolean;
export declare function getLanguageId(fileName: string): string;
//# sourceMappingURL=config.d.ts.map