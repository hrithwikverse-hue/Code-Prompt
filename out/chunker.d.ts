import { ScannedFile } from './scanner';
import { TreeNode } from './treeBuilder';
import { ExportConfig } from './config';
export interface Chunk {
    index: number;
    totalChunks: number;
    content: string;
    sizeKB: number;
    files: string[];
}
export declare function createChunks(tree: TreeNode, files: ScannedFile[], config: ExportConfig): Chunk[];
//# sourceMappingURL=chunker.d.ts.map