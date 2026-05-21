import { ScannedFile } from './scanner';
import { TreeNode } from './treeBuilder';
import { ExportConfig } from './config';
export interface FormatOptions {
    title?: string;
    includeTree?: boolean;
    includeStats?: boolean;
    includeTimestamp?: boolean;
    mode?: string;
}
export declare function formatContext(tree: TreeNode, files: ScannedFile[], config: ExportConfig, options?: FormatOptions): string;
export declare function formatProjectSummary(tree: TreeNode, files: ScannedFile[], config: ExportConfig): string;
//# sourceMappingURL=formatter.d.ts.map