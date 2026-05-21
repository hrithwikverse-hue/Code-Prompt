import * as fs from 'fs';
import * as path from 'path';
import { ExportConfig, isSupportedFile, shouldIgnoreFile } from './config';
import { TreeNode, collectFiles } from './treeBuilder';

export interface ScannedFile {
    relativePath: string;
    absolutePath: string;
    content: string;
    lineCount: number;
    size: number;
    language: string;
}

export function scanFiles(
    tree: TreeNode,
    rootPath: string,
    config: ExportConfig
): ScannedFile[] {
    const fileNodes = collectFiles(tree);
    const scanned: ScannedFile[] = [];

    for (const node of fileNodes) {
        try {
            const content = fs.readFileSync(node.path, 'utf-8');
            const relativePath = path.relative(rootPath, node.path).replace(/\\/g, '/');

            // Skip binary-looking files
            if (isBinary(content)) continue;

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
        } catch (err) {
            // Skip unreadable files
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

            const stats = fs.statSync(resolvedPath);
            if (stats.size > config.maxFileSizeKB * 1024) continue;

            const fileName = path.basename(resolvedPath);
            if (shouldIgnoreFile(fileName, config)) continue;
            if (!isSupportedFile(fileName, config)) continue;

            const content = fs.readFileSync(resolvedPath, 'utf-8');
            if (isBinary(content)) continue;

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
        } catch {
            continue;
        }
    }

    return scanned;
}

function isBinary(content: string): boolean {
    // Check first 8000 chars for null bytes or high ratio of non-printable chars
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
    const map: Record<string, string> = {
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
        if (fileName === 'Dockerfile') return 'dockerfile';
        if (fileName === 'Makefile') return 'makefile';
        return 'text';
    }

    return map[ext] || 'text';
}
