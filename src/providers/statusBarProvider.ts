import * as vscode from 'vscode';

export function createStatusBarItem(): vscode.StatusBarItem {
    const item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    item.text = '$(file-code) Code Prompt';
    item.tooltip = 'Code Prompt: Export project context';
    item.command = 'aiContext.exportFull';
    item.show();

    return item;
}
