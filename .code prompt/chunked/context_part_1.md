<!-- Chunk 1 of 3 | ~49 KB -->
# Context Part 1/3

Files in this chunk: `src/providers/sidebarProvider.ts`, `src/providers/statusBarProvider.ts`, `src/chunker.ts`, `src/config.ts`, `src/extension.ts`

---
# Project Context Export (Chunked)

> Generated: 2026-09-16T07:26:58.015Z
> Total Files: 15

## 📁 Project Structure

```
Code-Prompt/
├── src/
│   ├── providers/
│   │   ├── sidebarProvider.ts
│   │   └── statusBarProvider.ts
│   ├── chunker.ts
│   ├── config.ts
│   ├── extension.ts
│   ├── fileRegistry.ts
│   ├── formatter.ts
│   ├── gitUtils.ts
│   ├── scanner.ts
│   ├── smartSummarizer.ts
│   └── treeBuilder.ts
├── .agent.md
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

---
### File: `src/providers/sidebarProvider.ts`

> 309 lines | 13.2 KB

```typescript
  1 | import * as vscode from 'vscode';
  2 | import * as path from 'path';
  3 | import * as fs from 'fs';
  4 | import { generateMarkdown, safeMdPath } from '../extension';
  5 | 
  6 | export class SidebarProvider implements vscode.WebviewViewProvider {
  7 |     public static readonly viewType = 'aiContext.sidebar';
  8 | 
  9 |     constructor(private readonly _extensionUri: vscode.Uri) { }
 10 | 
 11 |     resolveWebviewView(
 12 |         webviewView: vscode.WebviewView,
 13 |         _context: vscode.WebviewViewResolveContext,
 14 |         _token: vscode.CancellationToken
 15 |     ): void {
 16 |         webviewView.webview.options = {
 17 |             enableScripts: true,
 18 |             localResourceRoots: [this._extensionUri],
 19 |         };
 20 | 
 21 |         webviewView.webview.html = this._getHtml();
 22 | 
 23 |         webviewView.webview.onDidReceiveMessage(async (message) => {
 24 |             switch (message.command) {
 25 |                 case 'exportFull':
 26 |                     await vscode.commands.executeCommand('aiContext.exportFull');
 27 |                     break;
 28 |                 case 'exportSrc':
 29 |                     await vscode.commands.executeCommand('aiContext.exportSrc');
 30 |                     break;
 31 |                 case 'exportSmart':
 32 |                     await vscode.commands.executeCommand('aiContext.exportSmart');
 33 |                     break;
 34 |                 case 'exportCurrentFile':
 35 |                     await vscode.commands.executeCommand('aiContext.exportCurrentFile');
 36 |                     break;
 37 |                 case 'exportChunked':
 38 |                     await vscode.commands.executeCommand('aiContext.exportChunked');
 39 |                     break;
 40 |                 case 'configure':
 41 |                     await vscode.commands.executeCommand('aiContext.configure');
 42 |                     break;
 43 |                 case 'openUrl':
 44 |                     await vscode.env.openExternal(vscode.Uri.parse(message.url));
 45 |                     break;
 46 |                 case 'copyMd': {
 47 |                     const wp = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
 48 |                     if (wp && message.mdFile) {
 49 |                         const md = await generateMarkdown(message.mdFile, wp);
 50 |                         if (md) {
 51 |                             if (message.mdFile !== 'CHUNKED_CONTEXT') {
 52 |                                 const dir = path.join(wp, '.code prompt');
 53 |                                 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 54 |                                 const filePath = safeMdPath(dir, message.mdFile);
 55 |                                 if (filePath) fs.writeFileSync(filePath, md, 'utf-8');
 56 |                             }
 57 |                             await vscode.env.clipboard.writeText(md);
 58 |                         }
 59 |                     }
 60 |                     break;
 61 |                 }
 62 |                 case 'copyAndOpen': {
 63 |                     const wp = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
 64 |                     if (wp && message.mdFile) {
 65 |                         const md = await generateMarkdown(message.mdFile, wp);
 66 |                         if (md) {
 67 |                             if (message.mdFile !== 'CHUNKED_CONTEXT') {
 68 |                                 const dir = path.join(wp, '.code prompt');
 69 |                                 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 70 |                                 const filePath = safeMdPath(dir, message.mdFile);
 71 |                                 if (filePath) fs.writeFileSync(filePath, md, 'utf-8');
 72 |                             }
 73 |                             await vscode.env.clipboard.writeText(md);
 74 |                         }
 75 |                     }
 76 |                     await vscode.env.openExternal(vscode.Uri.parse(message.url));
 77 |                     break;
 78 |                 }
 79 |             }
 80 |         });
 81 |     }
 82 | 
 83 |     private _getHtml(): string {
 84 |         const AI = [
 85 |             { name: 'ChatGPT',     url: 'https://chat.openai.com',          favicon: 'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=16' },
 86 |             { name: 'Claude',      url: 'https://claude.ai',                 favicon: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=16' },
 87 |             { name: 'Gemini',      url: 'https://gemini.google.com',         favicon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=16' },
 88 |             { name: 'Grok',        url: 'https://grok.com',                  favicon: 'https://www.google.com/s2/favicons?domain=grok.com&sz=16' },
 89 |             { name: 'Perplexity',  url: 'https://www.perplexity.ai',         favicon: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=16' },
 90 |             { name: 'Copilot',     url: 'https://copilot.microsoft.com',     favicon: 'https://www.google.com/s2/favicons?domain=copilot.microsoft.com&sz=16' },
 91 |             { name: 'Mistral',     url: 'https://chat.mistral.ai',           favicon: 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=16' },
 92 |             { name: 'DeepSeek',    url: 'https://chat.deepseek.com',         favicon: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=16' },
 93 |             { name: 'HuggingChat', url: 'https://huggingface.co/chat',       favicon: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=16' },
 94 |             { name: 'Meta AI',     url: 'https://www.meta.ai',               favicon: 'https://www.google.com/s2/favicons?domain=meta.ai&sz=16' },
 95 |         ];
 96 | 
 97 |         const aiIcons = (mdFile: string) => AI.map(a =>
 98 |             `<span class="ai-icon" data-tip="Copy & open ${a.name}" onclick="copyAndOpen(event,'${a.url}','${mdFile}')"><img src="${a.favicon}" alt="${a.name}"></span>`
 99 |         ).join('') + `<span class="ai-icon copy-icon" data-tip="Copy MD to clipboard" onclick="copyMd(event,'${mdFile}')"><svg viewBox="0 0 16 16"><path d="M4 4h5l3 3v6H4V4zm1 1v7h6V8H8V5H5zm4 0v2h2l-2-2zM2 2h6v1H3v8H2V2z"/></svg></span>`;
100 | 
101 |         const btn = (cmd: string, mdFile: string, name: string, desc: string, tip: string, secondary = false, showAi = true) => `
102 |         <div class="btn-wrap ${secondary ? 'secondary' : ''}">
103 |             <button class="btn-main" onclick="send('${cmd}')" data-tip="${tip}">
104 |                 <span class="btn-text">
105 |                     <span class="btn-name">${name}</span>
106 |                     <span class="btn-desc">${desc}</span>
107 |                 </span>
108 |             </button>
109 |             ${showAi ? `<div class="ai-icons">${aiIcons(mdFile)}</div>` : ''}
110 |         </div>`;
111 | 
112 |         return /*html*/`
113 | <!DOCTYPE html>
114 | <html lang="en">
115 | <head>
116 |     <meta charset="UTF-8">
117 |     <meta name="viewport" content="width=device-width, initial-scale=1.0">
118 |     <style>
119 |         * { box-sizing: border-box; margin: 0; padding: 0; }
120 | 
121 |         body {
122 |             padding: 16px 12px;
123 |             font-family: var(--vscode-font-family);
124 |             color: var(--vscode-foreground);
125 |             background: var(--vscode-sideBar-background);
126 |         }
127 | 
128 |         .header {
129 |             margin-bottom: 18px;
130 |             padding-bottom: 14px;
131 |             border-bottom: 1px solid var(--vscode-panel-border);
132 |         }
133 |         .header-title {
134 |             font-size: 13px; font-weight: 700;
135 |             letter-spacing: 0.04em; text-transform: uppercase;
136 |         }
137 |         .header-sub {
138 |             font-size: 11px; color: var(--vscode-descriptionForeground);
139 |             margin-top: 5px; line-height: 1.5;
140 |         }
141 | 
142 |         .section-label {
143 |             font-size: 10px; font-weight: 600;
144 |             letter-spacing: 0.08em; text-transform: uppercase;
145 |             color: var(--vscode-descriptionForeground);
146 |             margin: 16px 0 8px;
147 |         }
148 | 
149 |         .btn-wrap {
150 |             margin-bottom: 5px;
151 |             border-radius: 5px;
152 |             overflow: hidden;
153 |             background: #111111;
154 |         }
155 |         .btn-wrap.secondary {
156 |             background: #111111;
157 |         }
158 | 
159 |         .btn-main {
160 |             display: flex;
161 |             align-items: center;
162 |             gap: 10px;
163 |             width: 100%;
164 |             padding: 9px 11px;
165 |             background: transparent;
166 |             color: #e0e0e0;
167 |             border: none;
168 |             cursor: pointer;
169 |             font-size: 12px;
170 |             font-family: var(--vscode-font-family);
171 |             transition: opacity 0.15s, transform 0.1s;
172 |             text-align: left;
173 |         }
174 |         .btn-wrap.secondary .btn-main {
175 |             color: #e0e0e0;
176 |         }
177 |         .btn-main:hover { opacity: 0.88; }
178 |         .btn-main:active { transform: scale(0.985); }
179 | 
180 |         .btn-text { flex: 1; }
181 |         .btn-name { font-weight: 600; display: block; }
182 |         .btn-desc { font-size: 10px; opacity: 0.72; display: block; margin-top: 1px; }
183 | 
184 |         .ai-icons {
185 |             display: flex;
186 |             flex-wrap: wrap;
187 |             gap: 4px;
188 |             padding: 5px 10px 7px 11px;
189 |             border-top: 1px solid rgba(255,255,255,0.07);
190 |         }
191 |         .btn-wrap.secondary .ai-icons {
192 |             border-top-color: rgba(255,255,255,0.05);
193 |         }
194 | 
195 |         .ai-icon {
196 |             display: inline-flex;
197 |             align-items: center;
198 |             justify-content: center;
199 |             width: 20px; height: 20px;
200 |             border-radius: 4px;
201 |             cursor: pointer;
202 |             background: rgba(255,255,255,0.08);
203 |             transition: background 0.12s, transform 0.1s;
204 |             flex-shrink: 0;
205 |         }
206 |         .ai-icon:hover { background: rgba(255,255,255,0.22); transform: scale(1.15); }
207 |         .ai-icon:active { transform: scale(0.95); }
208 |         .ai-icon img { width: 13px; height: 13px; border-radius: 2px; display: block; }
209 |         .copy-icon svg { width: 13px; height: 13px; fill: currentColor; }
210 | 
211 |         .divider {
212 |             border: none;
213 |             border-top: 1px solid var(--vscode-panel-border);
214 |             margin: 14px 0;
215 |         }
216 | 
217 |         .tooltip {
218 |             position: fixed; z-index: 999;
219 |             max-width: 220px;
220 |             background: var(--vscode-editorHoverWidget-background);
221 |             border: 1px solid var(--vscode-editorHoverWidget-border);
222 |             color: var(--vscode-editorHoverWidget-foreground);
223 |             font-size: 11px; line-height: 1.5;
224 |             padding: 6px 9px; border-radius: 4px;
225 |             pointer-events: none; opacity: 0;
226 |             transition: opacity 0.1s;
227 |             box-shadow: 0 2px 8px rgba(0,0,0,0.3);
228 |         }
229 |         .tooltip.visible { opacity: 1; }
230 |     </style>
231 | </head>
232 | <body>
233 | 
234 |     <div id="tooltip" class="tooltip"></div>
235 | 
236 |     <div class="header">
237 |         <div class="header-title">Code Prompt</div>
238 |         <div class="header-sub">Export project context as Markdown for ChatGPT, Claude &amp; other AI tools.</div>
239 |     </div>
240 | 
241 |     <div class="section-label">Export Modes</div>
242 | 
243 |     ${btn('exportFull', 'PROJECT_CONTEXT',
244 |         'Full Project', 'PROJECT_CONTEXT.md &middot; Every file in your project',
245 |         'Exports every file into PROJECT_CONTEXT.md. Best for full AI visibility of your codebase.'
246 |     )}
247 | 
248 |     ${btn('exportSmart', 'SMART_CONTEXT',
249 |         'Smart Export', 'SMART_CONTEXT.md &middot; Only the files that matter most',
250 |         'AI-ranked export of key files only. Ideal for ChatGPT Free — stays under token limits.'
251 |     )}
252 | 
253 |     ${btn('exportSrc', 'SRC_CONTEXT',
254 |         'Source Only', 'SRC_CONTEXT.md &middot; Just your source code folder',
255 |         'Exports only src/, lib/, app/ etc. Skips config, docs and other noise.'
256 |     )}
257 | 
258 |     ${btn('exportCurrentFile', 'CURRENT_FILE_CONTEXT',
259 |         'Current File', 'CURRENT_FILE_CONTEXT.md &middot; Active editor tab only',
260 |         'Exports only the file currently open in the editor. Great for single-file AI review.'
261 |     )}
262 | 
263 |     ${btn('exportChunked', 'CHUNKED_CONTEXT',
264 |         'Chunked Export', '.code prompt/chunked/context_part_N.md &middot; Split large projects',
265 |         'Splits your project into paste-sized .md chunks. Use for large codebases.'
266 |     )}
267 | 
268 |     <hr class="divider">
269 | 
270 |     ${btn('configure', '',
271 |         'Settings', 'Configure export preferences',
272 |         'Opens VS Code settings for Code Prompt. Set ignored folders, file size limits, output location and more.',
273 |         false, false
274 |     )}
275 | 
276 |     <script>
277 |         const vscode = acquireVsCodeApi();
278 |         function send(cmd) { vscode.postMessage({ command: cmd }); }
279 |         function copyAndOpen(e, url, mdFile) {
280 |             e.stopPropagation();
281 |             vscode.postMessage({ command: 'copyAndOpen', url, mdFile });
282 |         }
283 |         function copyMd(e, mdFile) {
284 |             e.stopPropagation();
285 |             vscode.postMessage({ command: 'copyMd', mdFile });
286 |         }
287 | 
288 |         const tooltip = document.getElementById('tooltip');
289 |         document.addEventListener('mouseover', e => {
290 |             const el = e.target.closest('[data-tip]');
291 |             if (!el) return;
292 |             tooltip.textContent = el.dataset.tip;
293 |             tooltip.classList.add('visible');
294 |         });
295 |         document.addEventListener('mousemove', e => {
296 |             if (!tooltip.classList.contains('visible')) return;
297 |             tooltip.style.left = Math.min(e.clientX + 12, window.innerWidth - 236) + 'px';
298 |             tooltip.style.top = (e.clientY + 14) + 'px';
299 |         });
300 |         document.addEventListener('mouseout', e => {
301 |             if (!e.target.closest('[data-tip]')) return;
302 |             tooltip.classList.remove('visible');
303 |         });
304 |     </script>
305 | </body>
306 | </html>`;
307 |     }
308 | }
309 |
```
### File: `src/providers/statusBarProvider.ts`

> 16 lines | 0.4 KB

```typescript
 1 | import * as vscode from 'vscode';
 2 | 
 3 | export function createStatusBarItem(): vscode.StatusBarItem {
 4 |     const item = vscode.window.createStatusBarItem(
 5 |         vscode.StatusBarAlignment.Right,
 6 |         100
 7 |     );
 8 | 
 9 |     item.text = '$(file-code) Code Prompt';
10 |     item.tooltip = 'Code Prompt: Export project context';
11 |     item.command = 'aiContext.exportFull';
12 |     item.show();
13 | 
14 |     return item;
15 | }
16 |
```
### File: `src/chunker.ts`

> 132 lines | 4.0 KB

```typescript
  1 | import { ScannedFile } from './scanner';
  2 | import { TreeNode, treeToString } from './treeBuilder';
  3 | import { ExportConfig } from './config';
  4 | 
  5 | export interface Chunk {
  6 |     index: number;
  7 |     totalChunks: number;
  8 |     content: string;
  9 |     sizeKB: number;
 10 |     files: string[];
 11 | }
 12 | 
 13 | export function createChunks(
 14 |     tree: TreeNode,
 15 |     files: ScannedFile[],
 16 |     config: ExportConfig
 17 | ): Chunk[] {
 18 |     const maxChunkBytes = config.chunkSizeKB * 1024;
 19 |     const chunks: Chunk[] = [];
 20 | 
 21 |     // First chunk always contains the tree structure + metadata
 22 |     const treeContent = buildTreeChunk(tree, files);
 23 |     const treeSize = Buffer.byteLength(treeContent, 'utf-8');
 24 | 
 25 |     let currentContent = treeContent;
 26 |     let currentSize = treeSize;
 27 |     let currentFiles: string[] = [];
 28 | 
 29 |     for (const file of files) {
 30 |         const fileBlock = formatFileBlock(file, config);
 31 |         const fileBlockSize = Buffer.byteLength(fileBlock, 'utf-8');
 32 | 
 33 |         // If adding this file exceeds chunk size, save current chunk
 34 |         if (currentSize + fileBlockSize > maxChunkBytes && currentFiles.length > 0) {
 35 |             chunks.push({
 36 |                 index: chunks.length + 1,
 37 |                 totalChunks: 0, // Will be set later
 38 |                 content: currentContent,
 39 |                 sizeKB: Math.round(currentSize / 1024),
 40 |                 files: [...currentFiles],
 41 |             });
 42 | 
 43 |             currentContent = '';
 44 |             currentSize = 0;
 45 |             currentFiles = [];
 46 |         }
 47 | 
 48 |         currentContent += fileBlock;
 49 |         currentSize += fileBlockSize;
 50 |         currentFiles.push(file.relativePath);
 51 |     }
 52 | 
 53 |     // Save the last chunk
 54 |     if (currentContent.length > 0) {
 55 |         chunks.push({
 56 |             index: chunks.length + 1,
 57 |             totalChunks: 0,
 58 |             content: currentContent,
 59 |             sizeKB: Math.round(currentSize / 1024),
 60 |             files: [...currentFiles],
 61 |         });
 62 |     }
 63 | 
 64 |     // Set total chunks
 65 |     const total = chunks.length;
 66 |     for (const chunk of chunks) {
 67 |         chunk.totalChunks = total;
 68 |     }
 69 | 
 70 |     // Add headers to each chunk
 71 |     return chunks.map(chunk => ({
 72 |         ...chunk,
 73 |         content: buildChunkHeader(chunk) + chunk.content,
 74 |     }));
 75 | }
 76 | 
 77 | function buildTreeChunk(tree: TreeNode, files: ScannedFile[]): string {
 78 |     const lines: string[] = [];
 79 |     lines.push('# Project Context Export (Chunked)');
 80 |     lines.push('');
 81 |     lines.push(`> Generated: ${new Date().toISOString()}`);
 82 |     lines.push(`> Total Files: ${files.length}`);
 83 |     lines.push('');
 84 |     lines.push('## 📁 Project Structure');
 85 |     lines.push('');
 86 |     lines.push('```');
 87 |     lines.push(treeToString(tree).trimEnd());
 88 |     lines.push('```');
 89 |     lines.push('');
 90 |     lines.push('---');
 91 |     lines.push('');
 92 |     return lines.join('\n');
 93 | }
 94 | 
 95 | function buildChunkHeader(chunk: Chunk): string {
 96 |     const lines: string[] = [];
 97 |     lines.push(`<!-- Chunk ${chunk.index} of ${chunk.totalChunks} | ~${chunk.sizeKB} KB -->`);
 98 |     lines.push(`# Context Part ${chunk.index}/${chunk.totalChunks}`);
 99 |     lines.push('');
100 |     lines.push(`Files in this chunk: ${chunk.files.map(f => `\`${f}\``).join(', ')}`);
101 |     lines.push('');
102 |     lines.push('---');
103 |     lines.push('');
104 |     return lines.join('\n');
105 | }
106 | 
107 | function formatFileBlock(file: ScannedFile, config: ExportConfig): string {
108 |     const lines: string[] = [];
109 |     lines.push(`### File: \`${file.relativePath}\``);
110 |     lines.push('');
111 |     lines.push(`> ${file.lineCount} lines | ${(file.size / 1024).toFixed(1)} KB`);
112 |     lines.push('');
113 | 
114 |     const content = config.includeLineNumbers
115 |         ? addLineNumbers(file.content)
116 |         : file.content;
117 | 
118 |     lines.push(`\`\`\`${file.language}`);
119 |     lines.push(content.trimEnd());
120 |     lines.push('```');
121 |     lines.push('');
122 |     return lines.join('\n');
123 | }
124 | 
125 | function addLineNumbers(content: string): string {
126 |     const lines = content.split('\n');
127 |     const padding = String(lines.length).length;
128 |     return lines
129 |         .map((line, i) => `${String(i + 1).padStart(padding, ' ')} | ${line}`)
130 |         .join('\n');
131 | }
132 |
```
### File: `src/config.ts`

> 135 lines | 4.3 KB

```typescript
  1 | import * as vscode from 'vscode';
  2 | import * as path from 'path';
  3 | import micromatch from 'micromatch';
  4 | import {
  5 |     BUILT_IN_EXTENSIONS,
  6 |     BUILT_IN_FILENAMES,
  7 |     LANGUAGE_MAP,
  8 |     FILENAME_LANGUAGE_MAP,
  9 |     SECRET_EXTENSIONS,
 10 |     SECRET_FILENAMES,
 11 |     ENV_PREFIX,
 12 |     SAFE_ENV_SUFFIXES,
 13 | } from './fileRegistry';
 14 | 
 15 | export interface ExportConfig {
 16 |     ignoredFolders: string[];
 17 |     ignoredFiles: string[];
 18 |     maxFileSizeKB: number;
 19 |     chunkSizeKB: number;
 20 |     includeLineNumbers: boolean;
 21 |     autoCopyToClipboard: boolean;
 22 |     outputLocation: 'clipboard' | 'file' | 'both' | 'newTab';
 23 |     smartExportMaxFiles: number;
 24 |     supportedExtensions: string[];
 25 | }
 26 | 
 27 | export function getConfig(): ExportConfig {
 28 |     const config = vscode.workspace.getConfiguration('aiContext');
 29 | 
 30 |     return {
 31 |         ignoredFolders: config.get<string[]>('ignoredFolders', []),
 32 |         ignoredFiles: config.get<string[]>('ignoredFiles', []),
 33 |         maxFileSizeKB: config.get<number>('maxFileSizeKB', 100),
 34 |         chunkSizeKB: config.get<number>('chunkSizeKB', 50),
 35 |         includeLineNumbers: config.get<boolean>('includeLineNumbers', true),
 36 |         autoCopyToClipboard: config.get<boolean>('autoCopyToClipboard', true),
 37 |         outputLocation: config.get<string>('outputLocation', 'both') as ExportConfig['outputLocation'],
 38 |         smartExportMaxFiles: config.get<number>('smartExportMaxFiles', 20),
 39 |         supportedExtensions: config.get<string[]>('supportedExtensions', []),
 40 |     };
 41 | }
 42 | 
 43 | export function shouldIgnoreFolder(folderName: string, config: ExportConfig): boolean {
 44 |     return config.ignoredFolders.includes(folderName);
 45 | }
 46 | 
 47 | export function shouldIgnoreFile(fileName: string, config: ExportConfig): boolean {
 48 |     // Check exact match
 49 |     if (config.ignoredFiles.includes(fileName)) {
 50 |         return true;
 51 |     }
 52 | 
 53 |     // Check glob patterns
 54 |     const patterns = config.ignoredFiles.filter(p => p.includes('*'));
 55 |     if (patterns.length > 0 && micromatch.isMatch(fileName, patterns)) {
 56 |         return true;
 57 |     }
 58 | 
 59 |     return false;
 60 | }
 61 | 
 62 | /**
 63 |  * Hard security check — must be called BEFORE any file read.
 64 |  * Returns true when the file should NEVER be exported, regardless of user settings.
 65 |  */
 66 | export function isSecretFile(fileName: string): boolean {
 67 |     const lower = fileName.toLowerCase();
 68 | 
 69 |     // Exact secret filename match
 70 |     if (SECRET_FILENAMES.has(lower) || SECRET_FILENAMES.has(fileName)) {
 71 |         return true;
 72 |     }
 73 | 
 74 |     // Secret extension match
 75 |     const ext = path.extname(fileName).toLowerCase();
 76 |     if (ext && SECRET_EXTENSIONS.has(ext)) {
 77 |         return true;
 78 |     }
 79 | 
 80 |     // .env.* pattern — block unless it's a safe template/example suffix
 81 |     if (lower.startsWith(ENV_PREFIX)) {
 82 |         if (SAFE_ENV_SUFFIXES.has(lower)) {
 83 |             return false; // explicitly safe
 84 |         }
 85 |         return true; // block all other .env.* variants
 86 |     }
 87 | 
 88 |     // Bare .env (no extension case — already caught above via SECRET_FILENAMES,
 89 |     // but guard again for safety)
 90 |     if (lower === '.env') {
 91 |         return true;
 92 |     }
 93 | 
 94 |     return false;
 95 | }
 96 | 
 97 | /**
 98 |  * Returns true if the file should be included in an export.
 99 |  * When the user has a non-empty customised list, that list is the sole authority.
100 |  * Built-in defaults only apply when the user list is empty (original semantics).
101 |  */
102 | export function isSupportedFile(fileName: string, config: ExportConfig): boolean {
103 |     const ext = path.extname(fileName).toLowerCase();
104 |     const userList = config.supportedExtensions;
105 | 
106 |     if (userList.length > 0) {
107 |         // User list is authoritative — exact extension or exact filename match
108 |         if (!ext) return userList.includes(fileName);
109 |         return userList.includes(ext) || userList.includes(fileName);
110 |     }
111 | 
112 |     // No user customisation — fall back to built-in registry
113 |     if (!ext) return BUILT_IN_FILENAMES.has(fileName);
114 |     return BUILT_IN_EXTENSIONS.has(ext);
115 | }
116 | 
117 | /**
118 |  * Returns the Markdown fenced-block language identifier for a file.
119 |  * Delegates to the shared registry — no duplicate maps.
120 |  */
121 | export function getLanguageId(fileName: string): string {
122 |     const ext = path.extname(fileName).toLowerCase();
123 | 
124 |     // Check exact filename first (e.g. Dockerfile, Makefile)
125 |     if (FILENAME_LANGUAGE_MAP[fileName]) {
126 |         return FILENAME_LANGUAGE_MAP[fileName];
127 |     }
128 | 
129 |     if (!ext) {
130 |         return 'text';
131 |     }
132 | 
133 |     return LANGUAGE_MAP[ext] || 'text';
134 | }
135 |
```
### File: `src/extension.ts`

> 520 lines | 19.4 KB

```typescript
  1 | import * as vscode from 'vscode';
  2 | import * as path from 'path';
  3 | import * as fs from 'fs';
  4 | import { getConfig, getLanguageId, isSecretFile } from './config';
  5 | import { buildTree } from './treeBuilder';
  6 | import { scanFiles } from './scanner';
  7 | import { formatContext, formatProjectSummary } from './formatter';
  8 | import { createChunks } from './chunker';
  9 | import { smartExport } from './smartSummarizer';
 10 | import { SidebarProvider } from './providers/sidebarProvider';
 11 | import { createStatusBarItem } from './providers/statusBarProvider';
 12 | 
 13 | /** Binary / generated file extensions that never require an auto-update cycle. */
 14 | const WATCHER_SKIP_EXTENSIONS = new Set([
 15 |     '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff',
 16 |     '.mp3', '.mp4', '.webm', '.ogg', '.wav', '.avi', '.mov',
 17 |     '.zip', '.tar', '.gz', '.br', '.bz2', '.7z', '.rar',
 18 |     '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.pyo',
 19 |     '.woff', '.woff2', '.ttf', '.eot', '.otf',
 20 |     '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
 21 |     '.bin', '.o', '.obj', '.lib', '.a',
 22 |     '.vsix', '.crx',
 23 | ]);
 24 | 
 25 | const AUTO_UPDATE_FILES = ['PROJECT_CONTEXT.md', 'SMART_CONTEXT.md', 'SRC_CONTEXT.md', 'CURRENT_FILE_CONTEXT.md', 'FOLDER_CONTEXT.md'];
 26 | 
 27 | function getMdOutputDir(workspacePath: string): string {
 28 |     const dir = path.join(workspacePath, '.code prompt');
 29 |     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 30 |     return dir;
 31 | }
 32 | let autoUpdateTimer: NodeJS.Timeout | undefined;
 33 | 
 34 | function scheduleAutoUpdate(workspacePath: string) {
 35 |     if (autoUpdateTimer) clearTimeout(autoUpdateTimer);
 36 |     autoUpdateTimer = setTimeout(() => silentAutoUpdate(workspacePath), 1500);
 37 | }
 38 | 
 39 | async function silentAutoUpdate(workspacePath: string) {
 40 |     const config = getConfig();
 41 |     const mdDir = getMdOutputDir(workspacePath);
 42 | 
 43 |     const projectPath = path.join(mdDir, 'PROJECT_CONTEXT.md');
 44 |     const smartPath = path.join(mdDir, 'SMART_CONTEXT.md');
 45 |     const srcPath2 = path.join(mdDir, 'SRC_CONTEXT.md');
 46 | 
 47 |     const tree = buildTree(workspacePath, config);
 48 |     const files = scanFiles(tree, workspacePath, config);
 49 | 
 50 |     if (fs.existsSync(projectPath)) {
 51 |         const projectMd = formatContext(tree, files, config, { title: 'Full Project Context', mode: 'Full Project' });
 52 |         fs.writeFileSync(projectPath, projectMd, 'utf-8');
 53 |     }
 54 | 
 55 |     if (fs.existsSync(smartPath)) {
 56 |         const smartMd = smartExport(tree, files, config, workspacePath);
 57 |         fs.writeFileSync(smartPath, smartMd, 'utf-8');
 58 |     }
 59 | 
 60 |     if (fs.existsSync(srcPath2)) {
 61 |         const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
 62 |         for (const candidate of srcCandidates) {
 63 |             const srcPath = path.join(workspacePath, candidate);
 64 |             if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
 65 |                 const srcTree = buildTree(srcPath, config);
 66 |                 const srcFiles = scanFiles(srcTree, workspacePath, config);
 67 |                 const srcMd = formatContext(srcTree, srcFiles, config, {
 68 |                     title: `Source Export: ${candidate}`,
 69 |                     mode: `Source folder (${candidate})`,
 70 |                 });
 71 |                 fs.writeFileSync(srcPath2, srcMd, 'utf-8');
 72 |                 break;
 73 |             }
 74 |         }
 75 |     }
 76 | }
 77 | 
 78 | export function activate(context: vscode.ExtensionContext) {
 79 |     console.log('Code Prompt activated');
 80 | 
 81 |     // Sidebar
 82 |     const sidebarProvider = new SidebarProvider(context.extensionUri);
 83 |     context.subscriptions.push(
 84 |         vscode.window.registerWebviewViewProvider(
 85 |             SidebarProvider.viewType,
 86 |             sidebarProvider
 87 |         )
 88 |     );
 89 | 
 90 |     // Status bar
 91 |     const statusBar = createStatusBarItem();
 92 |     context.subscriptions.push(statusBar);
 93 | 
 94 |     // Auto-update watcher
 95 |     const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
 96 |     if (workspacePath) {
 97 |         const watcher = vscode.workspace.createFileSystemWatcher(
 98 |             new vscode.RelativePattern(workspacePath, '**/*')
 99 |         );
100 |         const onChange = (uri: vscode.Uri) => {
101 |             const rel = path.relative(workspacePath, uri.fsPath);
102 | 
103 |             // Always ignore output folders
104 |             if (rel.startsWith('.code prompt' + path.sep) || rel.startsWith('.ai-context' + path.sep)) return;
105 | 
106 |             const fileName = path.basename(uri.fsPath);
107 | 
108 |             // Hard security: never trigger auto-update for secret files
109 |             if (isSecretFile(fileName)) return;
110 | 
111 |             // Skip binary / media / generated files — they don't affect code context
112 |             const ext = path.extname(fileName).toLowerCase();
113 |             if (WATCHER_SKIP_EXTENSIONS.has(ext)) return;
114 | 
115 |             scheduleAutoUpdate(workspacePath);
116 |         };
117 |         watcher.onDidChange(onChange);
118 |         watcher.onDidCreate(onChange);
119 |         watcher.onDidDelete(onChange);
120 |         context.subscriptions.push(watcher);
121 |     }
122 | 
123 |     // Commands
124 |     context.subscriptions.push(
125 |         vscode.commands.registerCommand('aiContext.exportFull', () =>
126 |             exportFullProject()
127 |         )
128 |     );
129 | 
130 |     context.subscriptions.push(
131 |         vscode.commands.registerCommand('aiContext.exportSrc', () =>
132 |             exportSrcFolder()
133 |         )
134 |     );
135 | 
136 |     context.subscriptions.push(
137 |         vscode.commands.registerCommand('aiContext.exportSelected', (uri: vscode.Uri) =>
138 |             exportSelectedFolder(uri)
139 |         )
140 |     );
141 | 
142 |     context.subscriptions.push(
143 |         vscode.commands.registerCommand('aiContext.exportSmart', () =>
144 |             exportSmart()
145 |         )
146 |     );
147 | 
148 |     context.subscriptions.push(
149 |         vscode.commands.registerCommand('aiContext.exportCurrentFile', () =>
150 |             exportCurrentFile()
151 |         )
152 |     );
153 | 
154 |     context.subscriptions.push(
155 |         vscode.commands.registerCommand('aiContext.exportChunked', () =>
156 |             exportChunked()
157 |         )
158 |     );
159 | 
160 |     context.subscriptions.push(
161 |         vscode.commands.registerCommand('aiContext.configure', () => {
162 |             vscode.commands.executeCommand(
163 |                 'workbench.action.openSettings',
164 |                 'aiContext'
165 |             );
166 |         })
167 |     );
168 | }
169 | 
170 | function getWorkspacePath(): string | undefined {
171 |     const folders = vscode.workspace.workspaceFolders;
172 |     if (!folders || folders.length === 0) {
173 |         vscode.window.showErrorMessage('No workspace folder open.');
174 |         return undefined;
175 |     }
176 |     return folders[0].uri.fsPath;
177 | }
178 | 
179 | const ALLOWED_MD_FILES = new Set([
180 |     'PROJECT_CONTEXT', 'SMART_CONTEXT', 'SRC_CONTEXT',
181 |     'CURRENT_FILE_CONTEXT', 'FOLDER_CONTEXT', 'CHUNKED_CONTEXT'
182 | ]);
183 | 
184 | export function safeMdPath(mdDir: string, filePrefix: string): string | undefined {
185 |     if (!ALLOWED_MD_FILES.has(filePrefix)) return undefined;
186 |     const resolved = path.resolve(mdDir, `${filePrefix}.md`);
187 |     if (!resolved.startsWith(path.resolve(mdDir) + path.sep)) return undefined;
188 |     return resolved;
189 | }
190 | 
191 | function isPathWithinWorkspace(targetPath: string, workspacePath: string): boolean {
192 |     const resolvedTarget = path.resolve(targetPath);
193 |     const resolvedWorkspace = path.resolve(workspacePath);
194 |     return resolvedTarget.startsWith(resolvedWorkspace + path.sep) || resolvedTarget === resolvedWorkspace;
195 | }
196 | 
197 | async function exportFullProject() {
198 |     const workspacePath = getWorkspacePath();
199 |     if (!workspacePath) return;
200 | 
201 |     await vscode.window.withProgress(
202 |         {
203 |             location: vscode.ProgressLocation.Notification,
204 |             title: 'Code Prompt: Exporting full project...',
205 |             cancellable: false,
206 |         },
207 |         async () => {
208 |             const config = getConfig();
209 |             const tree = buildTree(workspacePath, config);
210 |             const files = scanFiles(tree, workspacePath, config);
211 | 
212 |             const markdown = formatContext(tree, files, config, {
213 |                 title: 'Full Project Context',
214 |                 mode: 'Full Project',
215 |             });
216 | 
217 |             await outputResult(markdown, 'PROJECT_CONTEXT', workspacePath, config, 'Full project export');
218 |         }
219 |     );
220 | }
221 | 
222 | async function exportSrcFolder() {
223 |     const workspacePath = getWorkspacePath();
224 |     if (!workspacePath) return;
225 | 
226 |     // Find common source directories
227 |     const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
228 |     let srcPath: string | undefined;
229 | 
230 |     for (const candidate of srcCandidates) {
231 |         const candidatePath = path.join(workspacePath, candidate);
232 |         if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
233 |             srcPath = candidatePath;
234 |             break;
235 |         }
236 |     }
237 | 
238 |     if (!srcPath) {
239 |         const selected = await vscode.window.showOpenDialog({
240 |             canSelectFolders: true,
241 |             canSelectFiles: false,
242 |             canSelectMany: false,
243 |             defaultUri: vscode.Uri.file(workspacePath),
244 |             title: 'Select source folder to export',
245 |         });
246 | 
247 |         if (!selected || selected.length === 0) return;
248 |         
249 |         const selectedPath = path.normalize(selected[0].fsPath);
250 |         if (!isPathWithinWorkspace(selectedPath, workspacePath)) {
251 |             vscode.window.showErrorMessage('Selected folder must be within the workspace.');
252 |             return;
253 |         }
254 |         srcPath = selectedPath;
255 |     }
256 | 
257 |     await vscode.window.withProgress(
258 |         {
259 |             location: vscode.ProgressLocation.Notification,
260 |             title: `Code Prompt: Exporting ${path.basename(srcPath)}/...`,
261 |             cancellable: false,
262 |         },
263 |         async () => {
264 |             const config = getConfig();
265 |             const tree = buildTree(srcPath!, config);
266 |             const files = scanFiles(tree, workspacePath, config);
267 | 
268 |             const markdown = formatContext(tree, files, config, {
269 |                 title: `Source Export: ${path.basename(srcPath!)}`,
270 |                 mode: `Source folder (${path.basename(srcPath!)})`,
271 |             });
272 | 
273 |             await outputResult(markdown, 'SRC_CONTEXT', workspacePath, config, `Source export (${path.basename(srcPath!)})`);
274 |         }
275 |     );
276 | }
277 | 
278 | async function exportSelectedFolder(uri: vscode.Uri) {
279 |     const workspacePath = getWorkspacePath();
280 |     if (!workspacePath) return;
281 | 
282 |     const folderPath = path.normalize(uri.fsPath);
283 |     if (!isPathWithinWorkspace(folderPath, workspacePath)) {
284 |         vscode.window.showErrorMessage('Selected folder must be within the workspace.');
285 |         return;
286 |     }
287 | 
288 |     await vscode.window.withProgress(
289 |         {
290 |             location: vscode.ProgressLocation.Notification,
291 |             title: `Code Prompt: Exporting ${path.basename(folderPath)}/...`,
292 |             cancellable: false,
293 |         },
294 |         async () => {
295 |             const config = getConfig();
296 |             const tree = buildTree(folderPath, config);
297 |             const files = scanFiles(tree, workspacePath, config);
298 | 
299 |             const markdown = formatContext(tree, files, config, {
300 |                 title: `Folder Export: ${path.relative(workspacePath, folderPath)}`,
301 |                 mode: `Selected folder`,
302 |             });
303 | 
304 |             await outputResult(markdown, 'FOLDER_CONTEXT', workspacePath, config, `Folder export (${path.relative(workspacePath, folderPath)})`);
305 |         }
306 |     );
307 | }
308 | 
309 | async function exportSmart() {
310 |     const workspacePath = getWorkspacePath();
311 |     if (!workspacePath) return;
312 | 
313 |     await vscode.window.withProgress(
314 |         {
315 |             location: vscode.ProgressLocation.Notification,
316 |             title: 'Code Prompt: Smart export...',
317 |             cancellable: false,
318 |         },
319 |         async () => {
320 |             const config = getConfig();
321 |             const tree = buildTree(workspacePath, config);
322 |             const allFiles = scanFiles(tree, workspacePath, config);
323 | 
324 |             const markdown = smartExport(tree, allFiles, config, workspacePath);
325 | 
326 |             await outputResult(markdown, 'SMART_CONTEXT', workspacePath, config, 'Smart export');
327 |         }
328 |     );
329 | }
330 | 
331 | async function exportCurrentFile() {
332 |     const editor = vscode.window.activeTextEditor;
333 |     if (!editor) return;
334 | 
335 |     const workspacePath = getWorkspacePath();
336 |     if (!workspacePath) return;
337 | 
338 |     const filePath = path.normalize(editor.document.uri.fsPath);
339 |     if (!isPathWithinWorkspace(filePath, workspacePath)) {
340 |         vscode.window.showErrorMessage('Current file is not within the workspace.');
341 |         return;
342 |     }
343 |     
344 |     const fileName = path.basename(filePath);
345 |     const content = editor.document.getText();
346 |     const config = getConfig();
347 |     const lang = getLanguageId(fileName);
348 |     const lines = content.split('\n');
349 | 
350 |     const numbered = config.includeLineNumbers
351 |         ? lines.map((l, i) => `${String(i + 1).padStart(4)} | ${l}`).join('\n')
352 |         : content;
353 | 
354 |     const relPath = path.relative(workspacePath, filePath);
355 |     const markdown = `# Current File: ${relPath}\n\n\`\`\`${lang}\n${numbered}\n\`\`\`\n`;
356 | 
357 |     await outputResult(markdown, 'CURRENT_FILE_CONTEXT', workspacePath, config, 'Current file export');
358 | }
359 | 
360 | async function exportChunked() {
361 |     const workspacePath = getWorkspacePath();
362 |     if (!workspacePath) return;
363 | 
364 |     await vscode.window.withProgress(
365 |         {
366 |             location: vscode.ProgressLocation.Notification,
367 |             title: 'Code Prompt: Creating chunks...',
368 |             cancellable: false,
369 |         },
370 |         async () => {
371 |             const config = getConfig();
372 |             const tree = buildTree(workspacePath, config);
373 |             const files = scanFiles(tree, workspacePath, config);
374 |             const chunks = createChunks(tree, files, config);
375 | 
376 |             // Save each chunk as a file
377 |             const outputDir = path.join(workspacePath, '.code prompt', 'chunked');
378 |             if (!fs.existsSync(outputDir)) {
379 |                 fs.mkdirSync(outputDir, { recursive: true });
380 |             }
381 | 
382 |             // Clean previous chunks
383 |             const existing = fs.readdirSync(outputDir).filter(f => /^context_part_\d+\.md$/.test(f));
384 |             for (const f of existing) {
385 |                 fs.unlinkSync(path.join(outputDir, f));
386 |             }
387 | 
388 |             for (const chunk of chunks) {
389 |                 const fileName = `context_part_${Math.abs(Math.floor(chunk.index))}.md`;
390 |                 const filePath = path.resolve(outputDir, fileName);
391 |                 if (!filePath.startsWith(path.resolve(outputDir) + path.sep)) continue;
392 |                 fs.writeFileSync(filePath, chunk.content, 'utf-8');
393 |             }
394 | 
395 |             // Also copy first chunk to clipboard
396 |             if (config.autoCopyToClipboard && chunks.length > 0) {
397 |                 await vscode.env.clipboard.writeText(chunks[0].content);
398 |             }
399 | 
400 |             // Open first chunk
401 |             const firstChunkPath = path.join(workspacePath, '.code prompt', 'chunked', 'context_part_1.md');
402 |             const doc = await vscode.workspace.openTextDocument(firstChunkPath);
403 |             await vscode.window.showTextDocument(doc);
404 | 
405 | 
406 |         }
407 |     );
408 | }
409 | 
410 | async function outputResult(
411 |     markdown: string,
412 |     filePrefix: string,
413 |     workspacePath: string,
414 |     config: ReturnType<typeof getConfig>,
415 |     label: string
416 | ) {
417 |     switch (config.outputLocation) {
418 |         case 'clipboard':
419 |             await vscode.env.clipboard.writeText(markdown);
420 |             break;
421 | 
422 |         case 'file': {
423 |             const filePath = safeMdPath(getMdOutputDir(workspacePath), filePrefix);
424 |             if (!filePath) return;
425 |             fs.writeFileSync(filePath, markdown, 'utf-8');
426 |             const doc = await vscode.workspace.openTextDocument(filePath);
427 |             await vscode.window.showTextDocument(doc);
428 |             break;
429 |         }
430 | 
431 |         case 'newTab': {
432 |             const doc = await vscode.workspace.openTextDocument({
433 |                 content: markdown,
434 |                 language: 'markdown',
435 |             });
436 |             await vscode.window.showTextDocument(doc);
437 |             if (config.autoCopyToClipboard) {
438 |                 await vscode.env.clipboard.writeText(markdown);
439 |             }
440 |             break;
441 |         }
442 | 
443 |         case 'both':
444 |         default: {
445 |             const filePath = safeMdPath(getMdOutputDir(workspacePath), filePrefix);
446 |             if (!filePath) return;
447 |             fs.writeFileSync(filePath, markdown, 'utf-8');
448 |             await vscode.env.clipboard.writeText(markdown);
449 |             const doc = await vscode.workspace.openTextDocument(filePath);
450 |             await vscode.window.showTextDocument(doc);
451 |             break;
452 |         }
453 |     }
454 | }
455 | 
456 | export async function generateMarkdown(mdFile: string, workspacePath: string): Promise<string> {
457 |     if (!ALLOWED_MD_FILES.has(mdFile)) return '';
458 |     const config = getConfig();
459 |     const tree = buildTree(workspacePath, config);
460 |     const files = scanFiles(tree, workspacePath, config);
461 | 
462 |     switch (mdFile) {
463 |         case 'PROJECT_CONTEXT':
464 |             return formatContext(tree, files, config, { title: 'Full Project Context', mode: 'Full Project' });
465 | 
466 |         case 'SMART_CONTEXT':
467 |             return smartExport(tree, files, config, workspacePath);
468 | 
469 |         case 'SRC_CONTEXT': {
470 |             const srcCandidates = ['src', 'lib', 'app', 'source', 'pkg', 'internal', 'cmd'];
471 |             for (const candidate of srcCandidates) {
472 |                 const srcPath = path.join(workspacePath, candidate);
473 |                 if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
474 |                     const srcTree = buildTree(srcPath, config);
475 |                     const srcFiles = scanFiles(srcTree, workspacePath, config);
476 |                     return formatContext(srcTree, srcFiles, config, {
477 |                         title: `Source Export: ${candidate}`,
478 |                         mode: `Source folder (${candidate})`,
479 |                     });
480 |                 }
481 |             }
482 |             return '';
483 |         }
484 | 
485 |         case 'CHUNKED_CONTEXT': {
486 |             const chunkedDir = path.join(workspacePath, '.code prompt', 'chunked');
487 |             if (!fs.existsSync(chunkedDir)) fs.mkdirSync(chunkedDir, { recursive: true });
488 |             const existing = fs.readdirSync(chunkedDir).filter(f => /^context_part_\d+\.md$/.test(f));
489 |             for (const f of existing) fs.unlinkSync(path.resolve(chunkedDir, f));
490 |             const chunks = createChunks(tree, files, config);
491 |             for (const chunk of chunks) {
492 |                 const chunkPath = path.resolve(chunkedDir, `context_part_${Math.abs(Math.floor(chunk.index))}.md`);
493 |                 if (!chunkPath.startsWith(path.resolve(chunkedDir) + path.sep)) continue;
494 |                 fs.writeFileSync(chunkPath, chunk.content, 'utf-8');
495 |             }
496 |             return chunks[0]?.content ?? '';
497 |         }
498 | 
499 |         case 'CURRENT_FILE_CONTEXT': {
500 |             const editor = vscode.window.activeTextEditor;
501 |             if (!editor) return '';
502 |             const filePath = path.normalize(editor.document.uri.fsPath);
503 |             if (!isPathWithinWorkspace(filePath, workspacePath)) return '';
504 |             const fileName = path.basename(filePath);
505 |             const content = editor.document.getText();
506 |             const lang = getLanguageId(fileName);
507 |             const lines = content.split('\n');
508 |             const numbered = config.includeLineNumbers
509 |                 ? lines.map((l, i) => `${String(i + 1).padStart(4)} | ${l}`).join('\n')
510 |                 : content;
511 |             return `# Current File: ${path.relative(workspacePath, filePath)}\n\n\`\`\`${lang}\n${numbered}\n\`\`\`\n`;
512 |         }
513 | 
514 |         default:
515 |             return '';
516 |     }
517 | }
518 | 
519 | export function deactivate() { }
520 |
```
