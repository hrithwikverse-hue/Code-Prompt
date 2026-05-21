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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const extension_1 = require("../extension");
class SidebarProvider {
    _extensionUri;
    static viewType = 'aiContext.sidebar';
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, _context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtml();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'exportFull':
                    await vscode.commands.executeCommand('aiContext.exportFull');
                    break;
                case 'exportSrc':
                    await vscode.commands.executeCommand('aiContext.exportSrc');
                    break;
                case 'exportSmart':
                    await vscode.commands.executeCommand('aiContext.exportSmart');
                    break;
                case 'exportCurrentFile':
                    await vscode.commands.executeCommand('aiContext.exportCurrentFile');
                    break;
                case 'exportChunked':
                    await vscode.commands.executeCommand('aiContext.exportChunked');
                    break;
                case 'configure':
                    await vscode.commands.executeCommand('aiContext.configure');
                    break;
                case 'openUrl':
                    await vscode.env.openExternal(vscode.Uri.parse(message.url));
                    break;
                case 'copyMd': {
                    const wp = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (wp && message.mdFile) {
                        const md = await (0, extension_1.generateMarkdown)(message.mdFile, wp);
                        if (md) {
                            if (message.mdFile !== 'CHUNKED_CONTEXT') {
                                const dir = path.join(wp, '.code prompt');
                                if (!fs.existsSync(dir))
                                    fs.mkdirSync(dir, { recursive: true });
                                const filePath = (0, extension_1.safeMdPath)(dir, message.mdFile);
                                if (filePath)
                                    fs.writeFileSync(filePath, md, 'utf-8');
                            }
                            await vscode.env.clipboard.writeText(md);
                        }
                    }
                    break;
                }
                case 'copyAndOpen': {
                    const wp = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (wp && message.mdFile) {
                        const md = await (0, extension_1.generateMarkdown)(message.mdFile, wp);
                        if (md) {
                            if (message.mdFile !== 'CHUNKED_CONTEXT') {
                                const dir = path.join(wp, '.code prompt');
                                if (!fs.existsSync(dir))
                                    fs.mkdirSync(dir, { recursive: true });
                                const filePath = (0, extension_1.safeMdPath)(dir, message.mdFile);
                                if (filePath)
                                    fs.writeFileSync(filePath, md, 'utf-8');
                            }
                            await vscode.env.clipboard.writeText(md);
                        }
                    }
                    await vscode.env.openExternal(vscode.Uri.parse(message.url));
                    break;
                }
            }
        });
    }
    _getHtml() {
        const AI = [
            { name: 'ChatGPT', url: 'https://chat.openai.com', favicon: 'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=16' },
            { name: 'Claude', url: 'https://claude.ai', favicon: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=16' },
            { name: 'Gemini', url: 'https://gemini.google.com', favicon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=16' },
            { name: 'Grok', url: 'https://grok.com', favicon: 'https://www.google.com/s2/favicons?domain=grok.com&sz=16' },
            { name: 'Perplexity', url: 'https://www.perplexity.ai', favicon: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=16' },
            { name: 'Copilot', url: 'https://copilot.microsoft.com', favicon: 'https://www.google.com/s2/favicons?domain=copilot.microsoft.com&sz=16' },
            { name: 'Mistral', url: 'https://chat.mistral.ai', favicon: 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=16' },
            { name: 'DeepSeek', url: 'https://chat.deepseek.com', favicon: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=16' },
            { name: 'HuggingChat', url: 'https://huggingface.co/chat', favicon: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=16' },
            { name: 'Meta AI', url: 'https://www.meta.ai', favicon: 'https://www.google.com/s2/favicons?domain=meta.ai&sz=16' },
        ];
        const aiIcons = (mdFile) => AI.map(a => `<span class="ai-icon" data-tip="Copy & open ${a.name}" onclick="copyAndOpen(event,'${a.url}','${mdFile}')"><img src="${a.favicon}" alt="${a.name}"></span>`).join('') + `<span class="ai-icon copy-icon" data-tip="Copy MD to clipboard" onclick="copyMd(event,'${mdFile}')"><svg viewBox="0 0 16 16"><path d="M4 4h5l3 3v6H4V4zm1 1v7h6V8H8V5H5zm4 0v2h2l-2-2zM2 2h6v1H3v8H2V2z"/></svg></span>`;
        const btn = (cmd, mdFile, name, desc, tip, secondary = false, showAi = true) => `
        <div class="btn-wrap ${secondary ? 'secondary' : ''}">
            <button class="btn-main" onclick="send('${cmd}')" data-tip="${tip}">
                <span class="btn-text">
                    <span class="btn-name">${name}</span>
                    <span class="btn-desc">${desc}</span>
                </span>
            </button>
            ${showAi ? `<div class="ai-icons">${aiIcons(mdFile)}</div>` : ''}
        </div>`;
        return /*html*/ `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            padding: 16px 12px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background: var(--vscode-sideBar-background);
        }

        .header {
            margin-bottom: 18px;
            padding-bottom: 14px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header-title {
            font-size: 13px; font-weight: 700;
            letter-spacing: 0.04em; text-transform: uppercase;
        }
        .header-sub {
            font-size: 11px; color: var(--vscode-descriptionForeground);
            margin-top: 5px; line-height: 1.5;
        }

        .section-label {
            font-size: 10px; font-weight: 600;
            letter-spacing: 0.08em; text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin: 16px 0 8px;
        }

        .btn-wrap {
            margin-bottom: 5px;
            border-radius: 5px;
            overflow: hidden;
            background: #111111;
        }
        .btn-wrap.secondary {
            background: #111111;
        }

        .btn-main {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 9px 11px;
            background: transparent;
            color: #e0e0e0;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-family: var(--vscode-font-family);
            transition: opacity 0.15s, transform 0.1s;
            text-align: left;
        }
        .btn-wrap.secondary .btn-main {
            color: #e0e0e0;
        }
        .btn-main:hover { opacity: 0.88; }
        .btn-main:active { transform: scale(0.985); }

        .btn-text { flex: 1; }
        .btn-name { font-weight: 600; display: block; }
        .btn-desc { font-size: 10px; opacity: 0.72; display: block; margin-top: 1px; }

        .ai-icons {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 5px 10px 7px 11px;
            border-top: 1px solid rgba(255,255,255,0.07);
        }
        .btn-wrap.secondary .ai-icons {
            border-top-color: rgba(255,255,255,0.05);
        }

        .ai-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px; height: 20px;
            border-radius: 4px;
            cursor: pointer;
            background: rgba(255,255,255,0.08);
            transition: background 0.12s, transform 0.1s;
            flex-shrink: 0;
        }
        .ai-icon:hover { background: rgba(255,255,255,0.22); transform: scale(1.15); }
        .ai-icon:active { transform: scale(0.95); }
        .ai-icon img { width: 13px; height: 13px; border-radius: 2px; display: block; }
        .copy-icon svg { width: 13px; height: 13px; fill: currentColor; }

        .divider {
            border: none;
            border-top: 1px solid var(--vscode-panel-border);
            margin: 14px 0;
        }

        .tooltip {
            position: fixed; z-index: 999;
            max-width: 220px;
            background: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            color: var(--vscode-editorHoverWidget-foreground);
            font-size: 11px; line-height: 1.5;
            padding: 6px 9px; border-radius: 4px;
            pointer-events: none; opacity: 0;
            transition: opacity 0.1s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .tooltip.visible { opacity: 1; }
    </style>
</head>
<body>

    <div id="tooltip" class="tooltip"></div>

    <div class="header">
        <div class="header-title">Code Prompt</div>
        <div class="header-sub">Export project context as Markdown for ChatGPT, Claude &amp; other AI tools.</div>
    </div>

    <div class="section-label">Export Modes</div>

    ${btn('exportFull', 'PROJECT_CONTEXT', 'Full Project', 'PROJECT_CONTEXT.md &middot; Every file in your project', 'Exports every file into PROJECT_CONTEXT.md. Best for full AI visibility of your codebase.')}

    ${btn('exportSmart', 'SMART_CONTEXT', 'Smart Export', 'SMART_CONTEXT.md &middot; Only the files that matter most', 'AI-ranked export of key files only. Ideal for ChatGPT Free — stays under token limits.')}

    ${btn('exportSrc', 'SRC_CONTEXT', 'Source Only', 'SRC_CONTEXT.md &middot; Just your source code folder', 'Exports only src/, lib/, app/ etc. Skips config, docs and other noise.')}

    ${btn('exportCurrentFile', 'CURRENT_FILE_CONTEXT', 'Current File', 'CURRENT_FILE_CONTEXT.md &middot; Active editor tab only', 'Exports only the file currently open in the editor. Great for single-file AI review.')}

    ${btn('exportChunked', 'CHUNKED_CONTEXT', 'Chunked Export', '.code prompt/chunked/context_part_N.md &middot; Split large projects', 'Splits your project into paste-sized .md chunks. Use for large codebases.')}

    <hr class="divider">

    ${btn('configure', '', 'Settings', 'Configure export preferences', 'Opens VS Code settings for Code Prompt. Set ignored folders, file size limits, output location and more.', false, false)}

    <script>
        const vscode = acquireVsCodeApi();
        function send(cmd) { vscode.postMessage({ command: cmd }); }
        function copyAndOpen(e, url, mdFile) {
            e.stopPropagation();
            vscode.postMessage({ command: 'copyAndOpen', url, mdFile });
        }
        function copyMd(e, mdFile) {
            e.stopPropagation();
            vscode.postMessage({ command: 'copyMd', mdFile });
        }

        const tooltip = document.getElementById('tooltip');
        document.addEventListener('mouseover', e => {
            const el = e.target.closest('[data-tip]');
            if (!el) return;
            tooltip.textContent = el.dataset.tip;
            tooltip.classList.add('visible');
        });
        document.addEventListener('mousemove', e => {
            if (!tooltip.classList.contains('visible')) return;
            tooltip.style.left = Math.min(e.clientX + 12, window.innerWidth - 236) + 'px';
            tooltip.style.top = (e.clientY + 14) + 'px';
        });
        document.addEventListener('mouseout', e => {
            if (!e.target.closest('[data-tip]')) return;
            tooltip.classList.remove('visible');
        });
    </script>
</body>
</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=sidebarProvider.js.map