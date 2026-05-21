import * as vscode from 'vscode';
import * as path from 'path';
import micromatch from 'micromatch';

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

export function isSupportedFile(fileName: string, config: ExportConfig): boolean {
    const ext = path.extname(fileName).toLowerCase();

    // Files without extensions but in supported list (Dockerfile, Makefile, etc.)
    if (!ext) {
        return config.supportedExtensions.includes(fileName);
    }

    return config.supportedExtensions.includes(ext);
}

export function getLanguageId(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const map: Record<string, string> = {
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
        if (fileName === 'Dockerfile') return 'dockerfile';
        if (fileName === 'Makefile') return 'makefile';
        if (fileName === 'Rakefile') return 'ruby';
        if (fileName === 'Gemfile') return 'ruby';
        if (fileName === 'Pipfile') return 'toml';
        return 'text';
    }

    return map[ext] || 'text';
}
