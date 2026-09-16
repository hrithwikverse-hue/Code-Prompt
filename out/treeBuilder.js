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
exports.buildTree = buildTree;
exports.treeToString = treeToString;
exports.collectFiles = collectFiles;
exports.getTreeStats = getTreeStats;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
function buildTree(rootPath, config, relativeTo) {
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
    const children = [];
    let entries;
    try {
        entries = fs.readdirSync(rootPath);
    }
    catch {
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
        if (aIsDir && !bIsDir)
            return -1;
        if (!aIsDir && bIsDir)
            return 1;
        return a.localeCompare(b);
    });
    for (const entry of entries) {
        const fullPath = path.join(rootPath, entry);
        let entryStats;
        try {
            entryStats = fs.statSync(fullPath);
        }
        catch {
            continue;
        }
        if (entryStats.isDirectory()) {
            if ((0, config_1.shouldIgnoreFolder)(entry, config))
                continue;
            if (entry.startsWith('.') && !config.ignoredFolders.includes(entry)) {
                // Skip hidden folders not explicitly listed
                continue;
            }
            const subtree = buildTree(fullPath, config, relativeTo);
            if (subtree.children && subtree.children.length > 0) {
                children.push(subtree);
            }
        }
        else if (entryStats.isFile()) {
            // Hard security gate — secret files must not appear in the tree at all
            if ((0, config_1.isSecretFile)(entry))
                continue;
            if ((0, config_1.shouldIgnoreFile)(entry, config))
                continue;
            if (!(0, config_1.isSupportedFile)(entry, config))
                continue;
            if (entryStats.size > config.maxFileSizeKB * 1024)
                continue;
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
function treeToString(node, prefix = '', isLast = true, isRoot = true) {
    let result = '';
    if (isRoot) {
        result += `${node.name}/\n`;
    }
    else {
        const connector = isLast ? '└── ' : '├── ';
        const suffix = node.type === 'directory' ? '/' : '';
        result += `${prefix}${connector}${node.name}${suffix}\n`;
    }
    if (node.children) {
        const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
        node.children.forEach((child, index) => {
            const childIsLast = index === node.children.length - 1;
            result += treeToString(child, childPrefix, childIsLast, false);
        });
    }
    return result;
}
function collectFiles(node) {
    const files = [];
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
function getTreeStats(node) {
    let files = 0;
    let directories = 0;
    let totalSize = 0;
    if (node.type === 'file') {
        files = 1;
        totalSize = node.size || 0;
    }
    else {
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
//# sourceMappingURL=treeBuilder.js.map