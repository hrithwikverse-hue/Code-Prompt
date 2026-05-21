import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig, getLanguageId } from './config';
import { buildTree } from './treeBuilder';
import { scanFiles } from './scanner';
import { formatContext, formatProjectSummary } from './formatter';
import { createChunks } from './chunker';
import { smartExport } from './smartSummarizer';
import { SidebarProvider } from './providers/sidebarProvider';
import { createStatusBarItem } from './providers/statusBarProvider';

const AUTO_UPDATE_FILES = ['PROJECT_CONTEXT.md', 'SMART_CONTEXT.md', 'SRC_CONTEXT.md', 'CURRENT_FILE_CONTEXT.md', 'FOLDER_CONTEXT.md'];

function getMdOutputDir(workspacePath: string): string {
    const dir = path.join(workspacePath, '.code prompt');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}
let autoUpdateTimer: NodeJS.Timeout | undefined;

function scheduleAutoUpdate(workspacePath: string) {
    if (autoUpdateTimer) clearTimeout(autoUpdateTimer);
    autoUpdateTimer = setTimeout(() => silentAutoUpdate(workspacePath), 1500);
}

async function silentAutoUpdate(workspacePath: string) {
    const config = getConfig();
    const mdDir = getMdOutputDir(workspacePath);

    const projectPath = path.join(mdDir, 'PROJECT_CONTEXT.md');
    const smartPath = path.join(mdDir, 'SMART_CONTEXT.md');
    const srcPath2 = path.join(mdDir, 'SRC_CONTEXT.md');

    const tree = buildTree(workspacePath, config);
    const files = scanFiles(tree, workspacePath, config);

    if (fs.existsSync(projectPath)) {
        const projectMd = formatContext(tree, files, config, { title: 'Full Project Context', mode: 'Full Project' });
        fs.writeFileSync(projectPath, projectMd, 'utf-8');
    }

    if (fs.existsSync(smartPath)) {
        const smartMd = smartExport(tree, files, config, workspacePath);
        fs.writeFileSync(smartPath, smartMd, 'utf-8');
    }

    if (fs.existsSync(srcPath2)) {
        const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
        for (const candidate of srcCandidates) {
            const srcPath = path.join(workspacePath, candidate);
            if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
                const srcTree = buildTree(srcPath, config);
                const srcFiles = scanFiles(srcTree, workspacePath, config);
                const srcMd = formatContext(srcTree, srcFiles, config, {
                    title: `Source Export: ${candidate}`,
                    mode: `Source folder (${candidate})`,
                });
                fs.writeFileSync(srcPath2, srcMd, 'utf-8');
                break;
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Prompt activated');

    // Sidebar
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            SidebarProvider.viewType,
            sidebarProvider
        )
    );

    // Status bar
    const statusBar = createStatusBarItem();
    context.subscriptions.push(statusBar);

    // Auto-update watcher
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspacePath) {
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspacePath, '**/*')
        );
        const onChange = (uri: vscode.Uri) => {
            const rel = path.relative(workspacePath, uri.fsPath);
            if (rel.startsWith('.code prompt' + path.sep) || rel.startsWith('.ai-context' + path.sep)) return;
            scheduleAutoUpdate(workspacePath);
        };
        watcher.onDidChange(onChange);
        watcher.onDidCreate(onChange);
        watcher.onDidDelete(onChange);
        context.subscriptions.push(watcher);
    }

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportFull', () =>
            exportFullProject()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportSrc', () =>
            exportSrcFolder()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportSelected', (uri: vscode.Uri) =>
            exportSelectedFolder(uri)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportSmart', () =>
            exportSmart()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportCurrentFile', () =>
            exportCurrentFile()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.exportChunked', () =>
            exportChunked()
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('aiContext.configure', () => {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'aiContext'
            );
        })
    );
}

function getWorkspacePath(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return undefined;
    }
    return folders[0].uri.fsPath;
}

const ALLOWED_MD_FILES = new Set([
    'PROJECT_CONTEXT', 'SMART_CONTEXT', 'SRC_CONTEXT',
    'CURRENT_FILE_CONTEXT', 'FOLDER_CONTEXT', 'CHUNKED_CONTEXT'
]);

export function safeMdPath(mdDir: string, filePrefix: string): string | undefined {
    if (!ALLOWED_MD_FILES.has(filePrefix)) return undefined;
    const resolved = path.resolve(mdDir, `${filePrefix}.md`);
    if (!resolved.startsWith(path.resolve(mdDir) + path.sep)) return undefined;
    return resolved;
}

function isPathWithinWorkspace(targetPath: string, workspacePath: string): boolean {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedWorkspace = path.resolve(workspacePath);
    return resolvedTarget.startsWith(resolvedWorkspace + path.sep) || resolvedTarget === resolvedWorkspace;
}

async function exportFullProject() {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Code Prompt: Exporting full project...',
            cancellable: false,
        },
        async () => {
            const config = getConfig();
            const tree = buildTree(workspacePath, config);
            const files = scanFiles(tree, workspacePath, config);

            const markdown = formatContext(tree, files, config, {
                title: 'Full Project Context',
                mode: 'Full Project',
            });

            await outputResult(markdown, 'PROJECT_CONTEXT', workspacePath, config, 'Full project export');
        }
    );
}

async function exportSrcFolder() {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    // Find common source directories
    const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
    let srcPath: string | undefined;

    for (const candidate of srcCandidates) {
        const candidatePath = path.join(workspacePath, candidate);
        if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
            srcPath = candidatePath;
            break;
        }
    }

    if (!srcPath) {
        const selected = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            defaultUri: vscode.Uri.file(workspacePath),
            title: 'Select source folder to export',
        });

        if (!selected || selected.length === 0) return;
        
        const selectedPath = path.normalize(selected[0].fsPath);
        if (!isPathWithinWorkspace(selectedPath, workspacePath)) {
            vscode.window.showErrorMessage('Selected folder must be within the workspace.');
            return;
        }
        srcPath = selectedPath;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Code Prompt: Exporting ${path.basename(srcPath)}/...`,
            cancellable: false,
        },
        async () => {
            const config = getConfig();
            const tree = buildTree(srcPath!, config);
            const files = scanFiles(tree, workspacePath, config);

            const markdown = formatContext(tree, files, config, {
                title: `Source Export: ${path.basename(srcPath!)}`,
                mode: `Source folder (${path.basename(srcPath!)})`,
            });

            await outputResult(markdown, 'SRC_CONTEXT', workspacePath, config, `Source export (${path.basename(srcPath!)})`);
        }
    );
}

async function exportSelectedFolder(uri: vscode.Uri) {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    const folderPath = path.normalize(uri.fsPath);
    if (!isPathWithinWorkspace(folderPath, workspacePath)) {
        vscode.window.showErrorMessage('Selected folder must be within the workspace.');
        return;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Code Prompt: Exporting ${path.basename(folderPath)}/...`,
            cancellable: false,
        },
        async () => {
            const config = getConfig();
            const tree = buildTree(folderPath, config);
            const files = scanFiles(tree, workspacePath, config);

            const markdown = formatContext(tree, files, config, {
                title: `Folder Export: ${path.relative(workspacePath, folderPath)}`,
                mode: `Selected folder`,
            });

            await outputResult(markdown, 'FOLDER_CONTEXT', workspacePath, config, `Folder export (${path.relative(workspacePath, folderPath)})`);
        }
    );
}

async function exportSmart() {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Code Prompt: Smart export...',
            cancellable: false,
        },
        async () => {
            const config = getConfig();
            const tree = buildTree(workspacePath, config);
            const allFiles = scanFiles(tree, workspacePath, config);

            const markdown = smartExport(tree, allFiles, config, workspacePath);

            await outputResult(markdown, 'SMART_CONTEXT', workspacePath, config, 'Smart export');
        }
    );
}

async function exportCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    const filePath = path.normalize(editor.document.uri.fsPath);
    if (!isPathWithinWorkspace(filePath, workspacePath)) {
        vscode.window.showErrorMessage('Current file is not within the workspace.');
        return;
    }
    
    const fileName = path.basename(filePath);
    const content = editor.document.getText();
    const config = getConfig();
    const lang = getLanguageId(fileName);
    const lines = content.split('\n');

    const numbered = config.includeLineNumbers
        ? lines.map((l, i) => `${String(i + 1).padStart(4)} | ${l}`).join('\n')
        : content;

    const relPath = path.relative(workspacePath, filePath);
    const markdown = `# Current File: ${relPath}\n\n\`\`\`${lang}\n${numbered}\n\`\`\`\n`;

    await outputResult(markdown, 'CURRENT_FILE_CONTEXT', workspacePath, config, 'Current file export');
}

async function exportChunked() {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) return;

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Code Prompt: Creating chunks...',
            cancellable: false,
        },
        async () => {
            const config = getConfig();
            const tree = buildTree(workspacePath, config);
            const files = scanFiles(tree, workspacePath, config);
            const chunks = createChunks(tree, files, config);

            // Save each chunk as a file
            const outputDir = path.join(workspacePath, '.code prompt', 'chunked');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Clean previous chunks
            const existing = fs.readdirSync(outputDir).filter(f => /^context_part_\d+\.md$/.test(f));
            for (const f of existing) {
                fs.unlinkSync(path.join(outputDir, f));
            }

            for (const chunk of chunks) {
                const fileName = `context_part_${Math.abs(Math.floor(chunk.index))}.md`;
                const filePath = path.resolve(outputDir, fileName);
                if (!filePath.startsWith(path.resolve(outputDir) + path.sep)) continue;
                fs.writeFileSync(filePath, chunk.content, 'utf-8');
            }

            // Also copy first chunk to clipboard
            if (config.autoCopyToClipboard && chunks.length > 0) {
                await vscode.env.clipboard.writeText(chunks[0].content);
            }

            // Open first chunk
            const firstChunkPath = path.join(workspacePath, '.code prompt', 'chunked', 'context_part_1.md');
            const doc = await vscode.workspace.openTextDocument(firstChunkPath);
            await vscode.window.showTextDocument(doc);


        }
    );
}

async function outputResult(
    markdown: string,
    filePrefix: string,
    workspacePath: string,
    config: ReturnType<typeof getConfig>,
    label: string
) {
    switch (config.outputLocation) {
        case 'clipboard':
            await vscode.env.clipboard.writeText(markdown);
            break;

        case 'file': {
            const filePath = safeMdPath(getMdOutputDir(workspacePath), filePrefix);
            if (!filePath) return;
            fs.writeFileSync(filePath, markdown, 'utf-8');
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
            break;
        }

        case 'newTab': {
            const doc = await vscode.workspace.openTextDocument({
                content: markdown,
                language: 'markdown',
            });
            await vscode.window.showTextDocument(doc);
            if (config.autoCopyToClipboard) {
                await vscode.env.clipboard.writeText(markdown);
            }
            break;
        }

        case 'both':
        default: {
            const filePath = safeMdPath(getMdOutputDir(workspacePath), filePrefix);
            if (!filePath) return;
            fs.writeFileSync(filePath, markdown, 'utf-8');
            await vscode.env.clipboard.writeText(markdown);
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
            break;
        }
    }
}

export async function generateMarkdown(mdFile: string, workspacePath: string): Promise<string> {
    if (!ALLOWED_MD_FILES.has(mdFile)) return '';
    const config = getConfig();
    const tree = buildTree(workspacePath, config);
    const files = scanFiles(tree, workspacePath, config);

    switch (mdFile) {
        case 'PROJECT_CONTEXT':
            return formatContext(tree, files, config, { title: 'Full Project Context', mode: 'Full Project' });

        case 'SMART_CONTEXT':
            return smartExport(tree, files, config, workspacePath);

        case 'SRC_CONTEXT': {
            const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
            for (const candidate of srcCandidates) {
                const srcPath = path.join(workspacePath, candidate);
                if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
                    const srcTree = buildTree(srcPath, config);
                    const srcFiles = scanFiles(srcTree, workspacePath, config);
                    return formatContext(srcTree, srcFiles, config, {
                        title: `Source Export: ${candidate}`,
                        mode: `Source folder (${candidate})`,
                    });
                }
            }
            return '';
        }

        case 'CHUNKED_CONTEXT': {
            const chunkedDir = path.join(workspacePath, '.code prompt', 'chunked');
            if (!fs.existsSync(chunkedDir)) fs.mkdirSync(chunkedDir, { recursive: true });
            const existing = fs.readdirSync(chunkedDir).filter(f => /^context_part_\d+\.md$/.test(f));
            for (const f of existing) fs.unlinkSync(path.resolve(chunkedDir, f));
            const chunks = createChunks(tree, files, config);
            for (const chunk of chunks) {
                const chunkPath = path.resolve(chunkedDir, `context_part_${Math.abs(Math.floor(chunk.index))}.md`);
                if (!chunkPath.startsWith(path.resolve(chunkedDir) + path.sep)) continue;
                fs.writeFileSync(chunkPath, chunk.content, 'utf-8');
            }
            return chunks[0]?.content ?? '';
        }

        case 'CURRENT_FILE_CONTEXT': {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return '';
            const filePath = path.normalize(editor.document.uri.fsPath);
            if (!isPathWithinWorkspace(filePath, workspacePath)) return '';
            const fileName = path.basename(filePath);
            const content = editor.document.getText();
            const lang = getLanguageId(fileName);
            const lines = content.split('\n');
            const numbered = config.includeLineNumbers
                ? lines.map((l, i) => `${String(i + 1).padStart(4)} | ${l}`).join('\n')
                : content;
            return `# Current File: ${path.relative(workspacePath, filePath)}\n\n\`\`\`${lang}\n${numbered}\n\`\`\`\n`;
        }

        default:
            return '';
    }
}

export function deactivate() { }
