import * as vscode from 'vscode';
export declare class SidebarProvider implements vscode.WebviewViewProvider {
    private readonly _extensionUri;
    static readonly viewType = "aiContext.sidebar";
    constructor(_extensionUri: vscode.Uri);
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private _getHtml;
}
//# sourceMappingURL=sidebarProvider.d.ts.map