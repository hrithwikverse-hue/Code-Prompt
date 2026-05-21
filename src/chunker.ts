import { ScannedFile } from './scanner';
import { TreeNode, treeToString } from './treeBuilder';
import { ExportConfig } from './config';

export interface Chunk {
    index: number;
    totalChunks: number;
    content: string;
    sizeKB: number;
    files: string[];
}

export function createChunks(
    tree: TreeNode,
    files: ScannedFile[],
    config: ExportConfig
): Chunk[] {
    const maxChunkBytes = config.chunkSizeKB * 1024;
    const chunks: Chunk[] = [];

    // First chunk always contains the tree structure + metadata
    const treeContent = buildTreeChunk(tree, files);
    const treeSize = Buffer.byteLength(treeContent, 'utf-8');

    let currentContent = treeContent;
    let currentSize = treeSize;
    let currentFiles: string[] = [];

    for (const file of files) {
        const fileBlock = formatFileBlock(file, config);
        const fileBlockSize = Buffer.byteLength(fileBlock, 'utf-8');

        // If adding this file exceeds chunk size, save current chunk
        if (currentSize + fileBlockSize > maxChunkBytes && currentFiles.length > 0) {
            chunks.push({
                index: chunks.length + 1,
                totalChunks: 0, // Will be set later
                content: currentContent,
                sizeKB: Math.round(currentSize / 1024),
                files: [...currentFiles],
            });

            currentContent = '';
            currentSize = 0;
            currentFiles = [];
        }

        currentContent += fileBlock;
        currentSize += fileBlockSize;
        currentFiles.push(file.relativePath);
    }

    // Save the last chunk
    if (currentContent.length > 0) {
        chunks.push({
            index: chunks.length + 1,
            totalChunks: 0,
            content: currentContent,
            sizeKB: Math.round(currentSize / 1024),
            files: [...currentFiles],
        });
    }

    // Set total chunks
    const total = chunks.length;
    for (const chunk of chunks) {
        chunk.totalChunks = total;
    }

    // Add headers to each chunk
    return chunks.map(chunk => ({
        ...chunk,
        content: buildChunkHeader(chunk) + chunk.content,
    }));
}

function buildTreeChunk(tree: TreeNode, files: ScannedFile[]): string {
    const lines: string[] = [];
    lines.push('# Project Context Export (Chunked)');
    lines.push('');
    lines.push(`> Generated: ${new Date().toISOString()}`);
    lines.push(`> Total Files: ${files.length}`);
    lines.push('');
    lines.push('## 📁 Project Structure');
    lines.push('');
    lines.push('```');
    lines.push(treeToString(tree).trimEnd());
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
    return lines.join('\n');
}

function buildChunkHeader(chunk: Chunk): string {
    const lines: string[] = [];
    lines.push(`<!-- Chunk ${chunk.index} of ${chunk.totalChunks} | ~${chunk.sizeKB} KB -->`);
    lines.push(`# Context Part ${chunk.index}/${chunk.totalChunks}`);
    lines.push('');
    lines.push(`Files in this chunk: ${chunk.files.map(f => `\`${f}\``).join(', ')}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    return lines.join('\n');
}

function formatFileBlock(file: ScannedFile, config: ExportConfig): string {
    const lines: string[] = [];
    lines.push(`### File: \`${file.relativePath}\``);
    lines.push('');
    lines.push(`> ${file.lineCount} lines | ${(file.size / 1024).toFixed(1)} KB`);
    lines.push('');

    const content = config.includeLineNumbers
        ? addLineNumbers(file.content)
        : file.content;

    lines.push(`\`\`\`${file.language}`);
    lines.push(content.trimEnd());
    lines.push('```');
    lines.push('');
    return lines.join('\n');
}

function addLineNumbers(content: string): string {
    const lines = content.split('\n');
    const padding = String(lines.length).length;
    return lines
        .map((line, i) => `${String(i + 1).padStart(padding, ' ')} | ${line}`)
        .join('\n');
}
