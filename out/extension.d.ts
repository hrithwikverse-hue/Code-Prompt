import * as vscode from 'vscode';
export declare function activate(context: vscode.ExtensionContext): void;
export declare function safeMdPath(mdDir: string, filePrefix: string): string | undefined;
export declare function generateMarkdown(mdFile: string, workspacePath: string): Promise<string>;
export declare function deactivate(): void;
//# sourceMappingURL=extension.d.ts.map