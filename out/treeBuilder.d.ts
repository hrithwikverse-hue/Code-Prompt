import { ExportConfig } from './config';
export interface TreeNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: TreeNode[];
    size?: number;
}
export declare function buildTree(rootPath: string, config: ExportConfig, relativeTo?: string): TreeNode;
export declare function treeToString(node: TreeNode, prefix?: string, isLast?: boolean, isRoot?: boolean): string;
export declare function collectFiles(node: TreeNode): TreeNode[];
export declare function getTreeStats(node: TreeNode): {
    files: number;
    directories: number;
    totalSize: number;
};
//# sourceMappingURL=treeBuilder.d.ts.map