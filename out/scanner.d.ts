import { ExportConfig } from './config';
import { TreeNode } from './treeBuilder';
export interface ScannedFile {
    relativePath: string;
    absolutePath: string;
    content: string;
    lineCount: number;
    size: number;
    language: string;
}
export declare function scanFiles(tree: TreeNode, rootPath: string, config: ExportConfig): ScannedFile[];
export declare function scanSpecificFiles(filePaths: string[], rootPath: string, config: ExportConfig): ScannedFile[];
//# sourceMappingURL=scanner.d.ts.map