import * as fs from 'fs';
import * as path from 'path';
import { ExportConfig, shouldIgnoreFolder, shouldIgnoreFile, isSupportedFile, isSecretFile } from './config';

export interface TreeNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: TreeNode[];
    size?: number;
}

export function buildTree(
    rootPath: string,
    config: ExportConfig,
    relativeTo?: string
): TreeNode {
    const baseName = path.basename(rootPath);
    const stats = fs.statSync(rootPath);

    if (stats.isFile()) {
        return {
            name: baseName,
            type: 'file',
            path: rootPath,
            size: stats.size,
        };
    }

    const children: TreeNode[] = [];
    let entries: string[];

    try {
        entries = fs.readdirSync(rootPath);
    } catch {
        return {
            name: baseName,
            type: 'directory',
            path: rootPath,
            children: [],
        };
    }

    // Sort: directories first, then files, alphabetically
    entries.sort((a, b) => {
        const aPath = path.join(rootPath, a);
        const bPath = path.join(rootPath, b);
        const aIsDir = fs.existsSync(aPath) && fs.statSync(aPath).isDirectory();
        const bIsDir = fs.existsSync(bPath) && fs.statSync(bPath).isDirectory();

        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });

    for (const entry of entries) {
        const fullPath = path.join(rootPath, entry);
        let entryStats: fs.Stats;

        try {
            entryStats = fs.statSync(fullPath);
        } catch {
            continue;
        }

        if (entryStats.isDirectory()) {
            if (shouldIgnoreFolder(entry, config)) continue;
            if (entry.startsWith('.') && !config.ignoredFolders.includes(entry)) {
                // Skip hidden folders not explicitly listed
                continue;
            }
            const subtree = buildTree(fullPath, config, relativeTo);
            if (subtree.children && subtree.children.length > 0) {
                children.push(subtree);
            }
        } else if (entryStats.isFile()) {
            // Hard security gate — secret files must not appear in the tree at all
            if (isSecretFile(entry)) continue;
            if (shouldIgnoreFile(entry, config)) continue;
            if (!isSupportedFile(entry, config)) continue;
            if (entryStats.size > config.maxFileSizeKB * 1024) continue;

            children.push({
                name: entry,
                type: 'file',
                path: fullPath,
                size: entryStats.size,
            });
        }
    }

    return {
        name: baseName,
        type: 'directory',
        path: rootPath,
        children,
    };
}

export function treeToString(node: TreeNode, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
    let result = '';

    if (isRoot) {
        result += `${node.name}/\n`;
    } else {
        const connector = isLast ? '└── ' : '├── ';
        const suffix = node.type === 'directory' ? '/' : '';
        result += `${prefix}${connector}${node.name}${suffix}\n`;
    }

    if (node.children) {
        const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, index) => {
            const childIsLast = index === node.children!.length - 1;
            result += treeToString(child, childPrefix, childIsLast, false);
        });
    }

    return result;
}

export function collectFiles(node: TreeNode): TreeNode[] {
    const files: TreeNode[] = [];

    if (node.type === 'file') {
        files.push(node);
    }

    if (node.children) {
        for (const child of node.children) {
            files.push(...collectFiles(child));
        }
    }

    return files;
}

export function getTreeStats(node: TreeNode): { files: number; directories: number; totalSize: number } {
    let files = 0;
    let directories = 0;
    let totalSize = 0;

    if (node.type === 'file') {
        files = 1;
        totalSize = node.size || 0;
    } else {
        directories = 1;
    }

    if (node.children) {
        for (const child of node.children) {
            const childStats = getTreeStats(child);
            files += childStats.files;
            directories += childStats.directories;
            totalSize += childStats.totalSize;
        }
    }

    return { files, directories, totalSize };
}
