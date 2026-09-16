<!-- Chunk 3 of 3 | ~32 KB -->
# Context Part 3/3

Files in this chunk: `src/smartSummarizer.ts`, `src/treeBuilder.ts`, `.agent.md`, `.gitignore`, `package.json`, `tsconfig.json`

---
### File: `src/smartSummarizer.ts`

> 371 lines | 12.0 KB

```typescript
  1 | import * as path from 'path';
  2 | import { ScannedFile } from './scanner';
  3 | import { TreeNode, treeToString } from './treeBuilder';
  4 | import { ExportConfig } from './config';
  5 | import { getGitBranch, getRecentCommits, isGitRepo } from './gitUtils';
  6 | import {
  7 |     HIGH_PRIORITY_FILENAMES,
  8 |     FILENAME_TECH_SIGNALS,
  9 |     NPM_DEP_SIGNALS,
 10 |     PYTHON_DEP_SIGNALS,
 11 |     EMBEDDED_EXTENSIONS,
 12 | } from './fileRegistry';
 13 | 
 14 | interface FilePriority {
 15 |     file: ScannedFile;
 16 |     score: number;
 17 |     reason: string;
 18 | }
 19 | 
 20 | export function smartExport(
 21 |     tree: TreeNode,
 22 |     allFiles: ScannedFile[],
 23 |     config: ExportConfig,
 24 |     workspacePath: string
 25 | ): string {
 26 |     const sections: string[] = [];
 27 |     const maxFiles = config.smartExportMaxFiles;
 28 | 
 29 |     // Score and rank files
 30 |     const priorities = allFiles.map(file => scoreFile(file)).sort((a, b) => b.score - a.score);
 31 | 
 32 |     const selectedFiles = priorities.slice(0, maxFiles);
 33 |     const skippedFiles = priorities.slice(maxFiles);
 34 | 
 35 |     // Header
 36 |     sections.push('# Smart Project Context');
 37 |     sections.push('');
 38 |     sections.push(`> Generated: ${new Date().toISOString()}`);
 39 |     sections.push(`> Mode: Smart Export`);
 40 |     sections.push(`> Key Files: ${selectedFiles.length} / ${allFiles.length} total`);
 41 | 
 42 |     // Git info
 43 |     if (isGitRepo(workspacePath)) {
 44 |         const branch = getGitBranch(workspacePath);
 45 |         const commits = getRecentCommits(workspacePath, 5);
 46 |         sections.push(`> Branch: ${branch}`);
 47 |         if (commits.length > 0) {
 48 |             sections.push('> Recent commits:');
 49 |             commits.forEach(c => sections.push(`>   - ${c}`));
 50 |         }
 51 |     }
 52 |     sections.push('');
 53 |     sections.push('---');
 54 |     sections.push('');
 55 | 
 56 |     // Full tree
 57 |     sections.push('## 📁 Complete Project Structure');
 58 |     sections.push('');
 59 |     sections.push('```');
 60 |     sections.push(treeToString(tree).trimEnd());
 61 |     sections.push('```');
 62 |     sections.push('');
 63 |     sections.push('---');
 64 |     sections.push('');
 65 | 
 66 |     // Tech stack detection
 67 |     const techStack = detectTechStack(allFiles);
 68 |     if (techStack.length > 0) {
 69 |         sections.push('## 🛠 Detected Tech Stack');
 70 |         sections.push('');
 71 |         techStack.forEach(t => sections.push(`- ${t}`));
 72 |         sections.push('');
 73 |         sections.push('---');
 74 |         sections.push('');
 75 |     }
 76 | 
 77 |     // File selection rationale
 78 |     sections.push('## 📊 File Selection');
 79 |     sections.push('');
 80 |     sections.push('Key files selected by importance:');
 81 |     sections.push('');
 82 |     sections.push('| File | Score | Reason |');
 83 |     sections.push('|------|-------|--------|');
 84 |     selectedFiles.forEach(fp => {
 85 |         sections.push(`| \`${fp.file.relativePath}\` | ${fp.score} | ${fp.reason} |`);
 86 |     });
 87 |     sections.push('');
 88 | 
 89 |     if (skippedFiles.length > 0) {
 90 |         sections.push(`<details><summary>Skipped ${skippedFiles.length} files (click to expand)</summary>`);
 91 |         sections.push('');
 92 |         skippedFiles.forEach(fp => {
 93 |             sections.push(`- \`${fp.file.relativePath}\``);
 94 |         });
 95 |         sections.push('');
 96 |         sections.push('</details>');
 97 |         sections.push('');
 98 |     }
 99 | 
100 |     sections.push('---');
101 |     sections.push('');
102 | 
103 |     // Selected file contents
104 |     sections.push('## 📄 Key Files');
105 |     sections.push('');
106 | 
107 |     for (const fp of selectedFiles) {
108 |         const file = fp.file;
109 |         sections.push(`### \`${file.relativePath}\``);
110 |         sections.push('');
111 |         sections.push(`> ${file.lineCount} lines | Priority: ${fp.reason}`);
112 |         sections.push('');
113 | 
114 |         const numberedContent = addLineNumbers(file.content);
115 |         sections.push(`\`\`\`${file.language}`);
116 |         sections.push(numberedContent.trimEnd());
117 |         sections.push('```');
118 |         sections.push('');
119 |     }
120 | 
121 |     return sections.join('\n');
122 | }
123 | 
124 | function scoreFile(file: ScannedFile): FilePriority {
125 |     let score = 0;
126 |     const reasons: string[] = [];
127 |     const name = path.basename(file.relativePath).toLowerCase();
128 |     const dir = path.dirname(file.relativePath).toLowerCase();
129 |     const relPath = file.relativePath.toLowerCase();
130 | 
131 |     // --- High-priority file bonus from registry ---
132 |     const hpBonus = HIGH_PRIORITY_FILENAMES.get(name);
133 |     if (hpBonus !== undefined) {
134 |         score += hpBonus;
135 |         reasons.push('key config/manifest');
136 |     }
137 | 
138 |     // --- Entry points ---
139 |     if (['index.ts', 'index.js', 'index.tsx', 'index.jsx', 'main.ts', 'main.js',
140 |          'app.ts', 'app.js', 'app.tsx', 'app.jsx',
141 |          'server.ts', 'server.js', 'main.py', 'app.py', 'manage.py',
142 |          'main.go', 'main.rs', 'lib.rs', 'mod.rs',
143 |          'index.astro', 'app.svelte', 'app.vue',
144 |          'main.dart', 'main.swift', 'main.kt', 'main.java',
145 |          'main.cpp', 'main.c', 'main.zig'].includes(name)) {
146 |         score += 50;
147 |         reasons.push('entry point');
148 |     }
149 | 
150 |     // --- Config files not already in HIGH_PRIORITY_FILENAMES ---
151 |     if (['tsconfig.json', '.env.example', '.env.sample', '.env.template',
152 |          'makefile', '.editorconfig'].includes(name) && !reasons.includes('key config/manifest')) {
153 |         score += 35;
154 |         reasons.push('config');
155 |     }
156 | 
157 |     // --- Route/API files ---
158 |     if (relPath.includes('route') || relPath.includes('router') ||
159 |         relPath.includes('controller') || relPath.includes('endpoint') ||
160 |         relPath.includes('api/')) {
161 |         score += 35;
162 |         reasons.push('API/routes');
163 |     }
164 | 
165 |     // --- Model/Schema files ---
166 |     if (relPath.includes('model') || relPath.includes('schema') ||
167 |         relPath.includes('entity') || relPath.includes('migration')) {
168 |         score += 30;
169 |         reasons.push('data model');
170 |     }
171 | 
172 |     // --- Middleware / Auth ---
173 |     if (relPath.includes('middleware') || relPath.includes('auth') ||
174 |         relPath.includes('guard') || relPath.includes('permission')) {
175 |         score += 28;
176 |         reasons.push('middleware/auth');
177 |     }
178 | 
179 |     // --- Service / Business logic ---
180 |     if (relPath.includes('service') || relPath.includes('usecase') ||
181 |         relPath.includes('handler') || relPath.includes('resolver')) {
182 |         score += 25;
183 |         reasons.push('business logic');
184 |     }
185 | 
186 |     // --- AI / ML specific files ---
187 |     if (relPath.includes('train') || relPath.includes('model') ||
188 |         relPath.includes('inference') || relPath.includes('dataset') ||
189 |         relPath.includes('pipeline') || relPath.includes('embeddings')) {
190 |         score += 22;
191 |         reasons.push('AI/ML');
192 |     }
193 | 
194 |     // --- Utils/Helpers ---
195 |     if (relPath.includes('util') || relPath.includes('helper') ||
196 |         relPath.includes('lib/')) {
197 |         score += 15;
198 |         reasons.push('utility');
199 |     }
200 | 
201 |     // --- Tests (lower priority) ---
202 |     if (relPath.includes('test') || relPath.includes('spec') ||
203 |         relPath.includes('__test__') || relPath.includes('__tests__')) {
204 |         score += 5;
205 |         reasons.push('test');
206 |     }
207 | 
208 |     // --- Type definitions ---
209 |     if (name.endsWith('.d.ts') || relPath.includes('types') ||
210 |         relPath.includes('interfaces')) {
211 |         score += 20;
212 |         reasons.push('types');
213 |     }
214 | 
215 |     // --- Root level files get a bonus ---
216 |     if (!relPath.includes('/')) {
217 |         score += 10;
218 |         reasons.push('root');
219 |     }
220 | 
221 |     // --- Shorter files are more likely to be focused/important ---
222 |     if (file.lineCount < 50) {
223 |         score += 5;
224 |     } else if (file.lineCount > 500) {
225 |         score -= 5;
226 |     }
227 | 
228 |     // --- README already handled by HIGH_PRIORITY_FILENAMES ---
229 | 
230 |     if (reasons.length === 0) {
231 |         reasons.push('source file');
232 |         score += 10;
233 |     }
234 | 
235 |     return {
236 |         file,
237 |         score,
238 |         reason: reasons.join(', '),
239 |     };
240 | }
241 | 
242 | function detectTechStack(files: ScannedFile[]): string[] {
243 |     const stack: Set<string> = new Set();
244 |     const fileNames = files.map(f => path.basename(f.relativePath).toLowerCase());
245 |     const allPaths = files.map(f => f.relativePath.toLowerCase());
246 |     const fileNameSet = new Set(fileNames);
247 | 
248 |     // --- Filename-based signals from registry ---
249 |     for (const [signal, labels] of FILENAME_TECH_SIGNALS) {
250 |         if (fileNameSet.has(signal)) {
251 |             labels.forEach(l => stack.add(l));
252 |         }
253 |     }
254 | 
255 |     // --- npm package.json dependency signals ---
256 |     const pkg = files.find(f =>
257 |         f.relativePath === 'package.json' || f.relativePath.endsWith('/package.json')
258 |     );
259 |     if (pkg) {
260 |         stack.add('Node.js / npm');
261 |         try {
262 |             const parsed = JSON.parse(pkg.content);
263 |             const allDeps: Record<string, string> = {
264 |                 ...parsed.dependencies,
265 |                 ...parsed.devDependencies,
266 |             };
267 |             for (const [dep, label] of NPM_DEP_SIGNALS) {
268 |                 if (allDeps[dep]) stack.add(label);
269 |             }
270 |         } catch { /* ignore invalid JSON */ }
271 |     }
272 | 
273 |     // --- Bun / Deno detection via lockfiles ---
274 |     if (fileNameSet.has('bun.lockb') || fileNameSet.has('bunfig.toml')) stack.add('Bun');
275 |     if (fileNameSet.has('deno.json') || fileNameSet.has('deno.jsonc') || fileNameSet.has('deno.lock')) stack.add('Deno');
276 | 
277 |     // --- Python requirements.txt dependency signals ---
278 |     const reqTxt = files.find(f =>
279 |         f.relativePath === 'requirements.txt' || f.relativePath.endsWith('/requirements.txt')
280 |     );
281 |     if (reqTxt) {
282 |         stack.add('Python');
283 |         const lower = reqTxt.content.toLowerCase();
284 |         for (const [dep, label] of PYTHON_DEP_SIGNALS) {
285 |             if (lower.includes(dep)) stack.add(label);
286 |         }
287 |     }
288 | 
289 |     // --- pyproject.toml dependency signals ---
290 |     const pyproject = files.find(f =>
291 |         f.relativePath === 'pyproject.toml' || f.relativePath.endsWith('/pyproject.toml')
292 |     );
293 |     if (pyproject) {
294 |         stack.add('Python');
295 |         const lower = pyproject.content.toLowerCase();
296 |         for (const [dep, label] of PYTHON_DEP_SIGNALS) {
297 |             if (lower.includes(dep)) stack.add(label);
298 |         }
299 |     }
300 | 
301 |     // --- Rust ---
302 |     if (fileNameSet.has('cargo.toml')) stack.add('Rust');
303 | 
304 |     // --- Go ---
305 |     if (fileNameSet.has('go.mod')) stack.add('Go');
306 | 
307 |     // --- Ruby ---
308 |     if (fileNameSet.has('gemfile')) stack.add('Ruby');
309 | 
310 |     // --- Java/JVM ---
311 |     if (fileNameSet.has('build.gradle') || fileNameSet.has('pom.xml')) stack.add('Java/JVM');
312 | 
313 |     // --- Flutter / Dart ---
314 |     if (fileNameSet.has('pubspec.yaml') || allPaths.some(p => p.endsWith('.dart'))) {
315 |         stack.add('Flutter/Dart');
316 |     }
317 | 
318 |     // --- Swift / iOS / macOS ---
319 |     if (allPaths.some(p => p.endsWith('.swift'))) stack.add('Swift / iOS / macOS');
320 | 
321 |     // --- Kotlin / Android ---
322 |     if (allPaths.some(p => p.endsWith('.kt') || p.endsWith('.kts'))) stack.add('Kotlin / Android');
323 | 
324 |     // --- Zig ---
325 |     if (allPaths.some(p => p.endsWith('.zig'))) stack.add('Zig');
326 | 
327 |     // --- C / C++ (including embedded) ---
328 |     const hasCFiles = allPaths.some(p => p.endsWith('.c') || p.endsWith('.h'));
329 |     const hasCppFiles = allPaths.some(p => p.endsWith('.cpp') || p.endsWith('.hpp') || p.endsWith('.cc'));
330 |     const hasIno = allPaths.some(p => p.endsWith('.ino'));
331 |     if (hasIno) stack.add('Arduino / Embedded C++');
332 |     else if (hasCppFiles) stack.add('C++');
333 |     else if (hasCFiles) stack.add('C');
334 | 
335 |     // --- TypeScript (if not already added via tsconfig signal) ---
336 |     if (!stack.has('TypeScript') &&
337 |         (fileNameSet.has('tsconfig.json') || allPaths.some(p => p.endsWith('.ts') || p.endsWith('.tsx')))) {
338 |         stack.add('TypeScript');
339 |     }
340 | 
341 |     // --- Docker ---
342 |     if (fileNameSet.has('dockerfile') || fileNameSet.has('docker-compose.yml') || fileNameSet.has('docker-compose.yaml')) {
343 |         stack.add('Docker');
344 |     }
345 | 
346 |     // --- Kubernetes ---
347 |     if (allPaths.some(p => p.includes('k8s/') || p.includes('kubernetes/') || p.endsWith('.helm.yaml'))) {
348 |         stack.add('Kubernetes');
349 |     }
350 | 
351 |     // --- Terraform ---
352 |     if (allPaths.some(p => p.endsWith('.tf') || p.endsWith('.tfvars'))) {
353 |         stack.add('Terraform');
354 |     }
355 | 
356 |     // --- Jupyter notebooks ---
357 |     if (allPaths.some(p => p.endsWith('.ipynb'))) {
358 |         stack.add('Jupyter Notebooks');
359 |     }
360 | 
361 |     return [...stack].sort();
362 | }
363 | 
364 | function addLineNumbers(content: string): string {
365 |     const lines = content.split('\n');
366 |     const padding = String(lines.length).length;
367 |     return lines
368 |         .map((line, i) => `${String(i + 1).padStart(padding, ' ')} | ${line}`)
369 |         .join('\n');
370 | }
371 |
```
### File: `src/treeBuilder.ts`

> 161 lines | 4.6 KB

```typescript
  1 | import * as fs from 'fs';
  2 | import * as path from 'path';
  3 | import { ExportConfig, shouldIgnoreFolder, shouldIgnoreFile, isSupportedFile, isSecretFile } from './config';
  4 | 
  5 | export interface TreeNode {
  6 |     name: string;
  7 |     type: 'file' | 'directory';
  8 |     path: string;
  9 |     children?: TreeNode[];
 10 |     size?: number;
 11 | }
 12 | 
 13 | export function buildTree(
 14 |     rootPath: string,
 15 |     config: ExportConfig,
 16 |     relativeTo?: string
 17 | ): TreeNode {
 18 |     const baseName = path.basename(rootPath);
 19 |     const stats = fs.statSync(rootPath);
 20 | 
 21 |     if (stats.isFile()) {
 22 |         return {
 23 |             name: baseName,
 24 |             type: 'file',
 25 |             path: rootPath,
 26 |             size: stats.size,
 27 |         };
 28 |     }
 29 | 
 30 |     const children: TreeNode[] = [];
 31 |     let entries: string[];
 32 | 
 33 |     try {
 34 |         entries = fs.readdirSync(rootPath);
 35 |     } catch {
 36 |         return {
 37 |             name: baseName,
 38 |             type: 'directory',
 39 |             path: rootPath,
 40 |             children: [],
 41 |         };
 42 |     }
 43 | 
 44 |     // Sort: directories first, then files, alphabetically
 45 |     entries.sort((a, b) => {
 46 |         const aPath = path.join(rootPath, a);
 47 |         const bPath = path.join(rootPath, b);
 48 |         const aIsDir = fs.existsSync(aPath) && fs.statSync(aPath).isDirectory();
 49 |         const bIsDir = fs.existsSync(bPath) && fs.statSync(bPath).isDirectory();
 50 | 
 51 |         if (aIsDir && !bIsDir) return -1;
 52 |         if (!aIsDir && bIsDir) return 1;
 53 |         return a.localeCompare(b);
 54 |     });
 55 | 
 56 |     for (const entry of entries) {
 57 |         const fullPath = path.join(rootPath, entry);
 58 |         let entryStats: fs.Stats;
 59 | 
 60 |         try {
 61 |             entryStats = fs.statSync(fullPath);
 62 |         } catch {
 63 |             continue;
 64 |         }
 65 | 
 66 |         if (entryStats.isDirectory()) {
 67 |             if (shouldIgnoreFolder(entry, config)) continue;
 68 |             if (entry.startsWith('.') && !config.ignoredFolders.includes(entry)) {
 69 |                 // Skip hidden folders not explicitly listed
 70 |                 continue;
 71 |             }
 72 |             const subtree = buildTree(fullPath, config, relativeTo);
 73 |             if (subtree.children && subtree.children.length > 0) {
 74 |                 children.push(subtree);
 75 |             }
 76 |         } else if (entryStats.isFile()) {
 77 |             // Hard security gate — secret files must not appear in the tree at all
 78 |             if (isSecretFile(entry)) continue;
 79 |             if (shouldIgnoreFile(entry, config)) continue;
 80 |             if (!isSupportedFile(entry, config)) continue;
 81 |             if (entryStats.size > config.maxFileSizeKB * 1024) continue;
 82 | 
 83 |             children.push({
 84 |                 name: entry,
 85 |                 type: 'file',
 86 |                 path: fullPath,
 87 |                 size: entryStats.size,
 88 |             });
 89 |         }
 90 |     }
 91 | 
 92 |     return {
 93 |         name: baseName,
 94 |         type: 'directory',
 95 |         path: rootPath,
 96 |         children,
 97 |     };
 98 | }
 99 | 
100 | export function treeToString(node: TreeNode, prefix: string = '', isLast: boolean = true, isRoot: boolean = true): string {
101 |     let result = '';
102 | 
103 |     if (isRoot) {
104 |         result += `${node.name}/\n`;
105 |     } else {
106 |         const connector = isLast ? '└── ' : '├── ';
107 |         const suffix = node.type === 'directory' ? '/' : '';
108 |         result += `${prefix}${connector}${node.name}${suffix}\n`;
109 |     }
110 | 
111 |     if (node.children) {
112 |         const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
113 |         node.children.forEach((child, index) => {
114 |             const childIsLast = index === node.children!.length - 1;
115 |             result += treeToString(child, childPrefix, childIsLast, false);
116 |         });
117 |     }
118 | 
119 |     return result;
120 | }
121 | 
122 | export function collectFiles(node: TreeNode): TreeNode[] {
123 |     const files: TreeNode[] = [];
124 | 
125 |     if (node.type === 'file') {
126 |         files.push(node);
127 |     }
128 | 
129 |     if (node.children) {
130 |         for (const child of node.children) {
131 |             files.push(...collectFiles(child));
132 |         }
133 |     }
134 | 
135 |     return files;
136 | }
137 | 
138 | export function getTreeStats(node: TreeNode): { files: number; directories: number; totalSize: number } {
139 |     let files = 0;
140 |     let directories = 0;
141 |     let totalSize = 0;
142 | 
143 |     if (node.type === 'file') {
144 |         files = 1;
145 |         totalSize = node.size || 0;
146 |     } else {
147 |         directories = 1;
148 |     }
149 | 
150 |     if (node.children) {
151 |         for (const child of node.children) {
152 |             const childStats = getTreeStats(child);
153 |             files += childStats.files;
154 |             directories += childStats.directories;
155 |             totalSize += childStats.totalSize;
156 |         }
157 |     }
158 | 
159 |     return { files, directories, totalSize };
160 | }
161 |
```
### File: `.agent.md`

> 35 lines | 1.7 KB

```markdown
 1 | ---
 2 | name: build beautiful ui
 3 | summary: "A custom coding assistant optimized for designing, implementing, and polishing user interfaces with attractive layouts, responsive styling, and accessible interactions."
 4 | ---
 5 | 
 6 | # build beautiful ui
 7 | 
 8 | This agent is specialized for UI and UX work across web applications and VS Code extension interfaces.
 9 | 
10 | ## Role
11 | - Assume the role of a UI/UX-focused developer and front-end designer.
12 | - Provide actionable recommendations for layouts, styling, component structure, accessibility, responsiveness, and visual polish.
13 | 
14 | ## Best used when
15 | - building or refining web UI components
16 | - designing a VS Code webview or sidebar UI
17 | - improving CSS/SCSS styling, responsive layouts, themes, and interaction polish
18 | - translating a rough UI idea into usable component code
19 | - reviewing UI code for visual quality, accessibility, and user experience
20 | 
21 | ## Tool preferences
22 | - Prefer workspace-aware tools: `read_file`, `file_search`, `grep_search`, `replace_string_in_file`, `create_file`
23 | - Avoid unrelated tools such as terminal automation or non-code browser navigation unless explicitly needed
24 | - Keep changes focused on UI files and UI code paths, not unrelated backend logic
25 | 
26 | ## Prompts to try
27 | - "Help me build a beautiful responsive sidebar UI for this VS Code extension."
28 | - "Refactor and style this component into a polished modern web UI."
29 | - "Design an accessible dark theme layout for the existing webview interface."
30 | - "Improve the CSS and HTML for a cleaner, mobile-friendly UI."
31 | 
32 | ## Notes
33 | - If there is ambiguity about the target platform or framework, ask whether the UI is for a web app, a VS Code webview, or another interface.
34 | - If the user has a preferred framework or styling approach, align with that preference.
35 |
```
### File: `.gitignore`

> 2 lines | 0.0 KB

```text
1 | node_modules
2 |
```
### File: `package.json`

> 293 lines | 7.6 KB

```json
  1 | {
  2 |   "name": "code-prompt",
  3 |   "displayName": "Code Prompt",
  4 |   "description": "Export your entire project as structured Markdown for ChatGPT, Claude, and other AI tools. Use free AI tiers with full project context.",
  5 |   "version": "1.0.0",
  6 |   "publisher": "your-publisher-name",
  7 |   "engines": {
  8 |     "vscode": "^1.85.0"
  9 |   },
 10 |   "categories": [
 11 |     "Other",
 12 |     "Formatters"
 13 |   ],
 14 |   "keywords": [
 15 |     "AI",
 16 |     "ChatGPT",
 17 |     "Claude",
 18 |     "context",
 19 |     "export",
 20 |     "markdown",
 21 |     "code review",
 22 |     "refactor"
 23 |   ],
 24 |   "activationEvents": [
 25 |     "onStartupFinished"
 26 |   ],
 27 |   "main": "./out/extension.js",
 28 |   "icon": "media/icon.png",
 29 |   "repository": {
 30 |     "type": "git",
 31 |     "url": "https://github.com/yourname/code-prompt"
 32 |   },
 33 |   "contributes": {
 34 |     "commands": [
 35 |       {
 36 |         "command": "aiContext.exportFull",
 37 |         "title": "Export Full Project Context",
 38 |         "category": "AI Context",
 39 |         "icon": "$(file-code)"
 40 |       },
 41 |       {
 42 |         "command": "aiContext.exportSrc",
 43 |         "title": "Export Source Folder Only",
 44 |         "category": "AI Context"
 45 |       },
 46 |       {
 47 |         "command": "aiContext.exportSelected",
 48 |         "title": "Export Selected Folder",
 49 |         "category": "AI Context"
 50 |       },
 51 |       {
 52 |         "command": "aiContext.exportSmart",
 53 |         "title": "Smart Export (Summary + Key Files)",
 54 |         "category": "AI Context"
 55 |       },
 56 |       {
 57 |         "command": "aiContext.exportChunked",
 58 |         "title": "Export Chunked (Split Large Projects)",
 59 |         "category": "AI Context"
 60 |       },
 61 |       {
 62 |         "command": "aiContext.configure",
 63 |         "title": "Configure Export Settings",
 64 |         "category": "AI Context"
 65 |       },
 66 |       {
 67 |         "command": "aiContext.exportCurrentFile",
 68 |         "title": "Export Current File",
 69 |         "category": "AI Context"
 70 |       }
 71 |     ],
 72 |     "submenus": [
 73 |       {
 74 |         "id": "codeprompt.submenu",
 75 |         "label": "Code Prompt"
 76 |       }
 77 |     ],
 78 |     "keybindings": [
 79 |       {
 80 |         "command": "aiContext.exportFull",
 81 |         "key": "ctrl+shift+e",
 82 |         "mac": "cmd+shift+e",
 83 |         "when": "workspaceFolderCount > 0"
 84 |       }
 85 |     ],
 86 |     "menus": {
 87 |       "editor/context": [
 88 |         {
 89 |           "submenu": "codeprompt.submenu",
 90 |           "group": "navigation@100"
 91 |         }
 92 |       ],
 93 |       "explorer/context": [
 94 |         {
 95 |           "submenu": "codeprompt.submenu",
 96 |           "group": "navigation@100"
 97 |         }
 98 |       ],
 99 |       "codeprompt.submenu": [
100 |         {
101 |           "command": "aiContext.exportFull",
102 |           "group": "1@1"
103 |         },
104 |         {
105 |           "command": "aiContext.exportSmart",
106 |           "group": "1@2"
107 |         },
108 |         {
109 |           "command": "aiContext.exportSrc",
110 |           "group": "1@3"
111 |         },
112 |         {
113 |           "command": "aiContext.exportCurrentFile",
114 |           "group": "1@4"
115 |         },
116 |         {
117 |           "command": "aiContext.exportChunked",
118 |           "group": "1@5"
119 |         }
120 |       ],
121 |       "editor/title": [
122 |         {
123 |           "command": "aiContext.exportFull",
124 |           "group": "navigation"
125 |         }
126 |       ]
127 |     },
128 |     "viewsContainers": {
129 |       "activitybar": [
130 |         {
131 |           "id": "aiContextExplorer",
132 |           "title": "Code Prompt",
133 |           "icon": "$(file-code)"
134 |         }
135 |       ]
136 |     },
137 |     "views": {
138 |       "aiContextExplorer": [
139 |         {
140 |           "type": "webview",
141 |           "id": "aiContext.sidebar",
142 |           "name": "Export Controls"
143 |         }
144 |       ]
145 |     },
146 |     "configuration": {
147 |       "title": "Code Prompt",
148 |       "properties": {
149 |         "aiContext.ignoredFolders": {
150 |           "type": "array",
151 |           "default": [
152 |             "node_modules",
153 |             ".git",
154 |             "dist",
155 |             "build",
156 |             ".next",
157 |             "__pycache__",
158 |             ".venv",
159 |             "venv",
160 |             "env",
161 |             ".env",
162 |             "coverage",
163 |             ".nyc_output",
164 |             ".cache",
165 |             ".parcel-cache",
166 |             "out",
167 |             ".svelte-kit",
168 |             ".nuxt",
169 |             ".output",
170 |             "vendor",
171 |             "target",
172 |             "bin",
173 |             "obj",
174 |             ".idea",
175 |             ".vscode",
176 |             ".terraform",
177 |             "terraform.tfstate.d"
178 |           ],
179 |           "description": "Folders to ignore during export"
180 |         },
181 |         "aiContext.ignoredFiles": {
182 |           "type": "array",
183 |           "default": [
184 |             "package-lock.json",
185 |             "yarn.lock",
186 |             "pnpm-lock.yaml",
187 |             "composer.lock",
188 |             "Gemfile.lock",
189 |             "Cargo.lock",
190 |             "poetry.lock",
191 |             ".DS_Store",
192 |             "Thumbs.db",
193 |             "*.min.js",
194 |             "*.min.css",
195 |             "*.map",
196 |             "*.ico",
197 |             "*.png",
198 |             "*.jpg",
199 |             "*.jpeg",
200 |             "*.gif",
201 |             "*.svg",
202 |             "*.woff",
203 |             "*.woff2",
204 |             "*.ttf",
205 |             "*.eot",
206 |             "*.mp3",
207 |             "*.mp4",
208 |             "*.webm",
209 |             "*.pdf",
210 |             "*.zip",
211 |             "*.tar",
212 |             "*.gz",
213 |             "*.exe",
214 |             "*.dll",
215 |             "*.so",
216 |             "*.dylib",
217 |             "*.pyc",
218 |             "*.class",
219 |             "*.o"
220 |           ],
221 |           "description": "File patterns to ignore during export"
222 |         },
223 |         "aiContext.maxFileSizeKB": {
224 |           "type": "number",
225 |           "default": 100,
226 |           "description": "Maximum file size in KB to include"
227 |         },
228 |         "aiContext.chunkSizeKB": {
229 |           "type": "number",
230 |           "default": 50,
231 |           "description": "Target chunk size in KB for chunked export"
232 |         },
233 |         "aiContext.includeLineNumbers": {
234 |           "type": "boolean",
235 |           "default": true,
236 |           "description": "Include line numbers in exported code"
237 |         },
238 |         "aiContext.autoCopyToClipboard": {
239 |           "type": "boolean",
240 |           "default": true,
241 |           "description": "Automatically copy export to clipboard"
242 |         },
243 |         "aiContext.outputLocation": {
244 |           "type": "string",
245 |           "enum": [
246 |             "clipboard",
247 |             "file",
248 |             "both",
249 |             "newTab"
250 |           ],
251 |           "default": "both",
252 |           "description": "Where to output the generated context"
253 |         },
254 |         "aiContext.smartExportMaxFiles": {
255 |           "type": "number",
256 |           "default": 20,
257 |           "description": "Maximum number of key files in smart export"
258 |         },
259 |         "aiContext.supportedExtensions": {
260 |           "type": "array",
261 |           "default": [],
262 |           "description": "Additional file extensions/filenames to include in exports. Leave empty (default) to use the built-in registry, which covers 100+ modern languages and frameworks. Add entries here only to include types beyond the built-in defaults, or populate this list to restrict exports to specific types only."
263 |         }
264 |       }
265 |     }
266 |   },
267 |   "scripts": {
268 |     "vscode:prepublish": "npm run compile",
269 |     "compile": "tsc -p ./",
270 |     "watch": "tsc -watch -p ./",
271 |     "lint": "eslint src --ext ts",
272 |     "package": "vsce package",
273 |     "publish": "vsce publish"
274 |   },
275 |   "devDependencies": {
276 |     "@types/micromatch": "^4.0.10",
277 |     "@types/node": "^20.11.0",
278 |     "@types/vscode": "^1.85.0",
279 |     "@typescript-eslint/eslint-plugin": "^6.15.0",
280 |     "@typescript-eslint/parser": "^6.15.0",
281 |     "@vscode/vsce": "^2.22.0",
282 |     "eslint": "^8.56.0",
283 |     "typescript": "^5.3.3"
284 |   },
285 |   "dependencies": {
286 |     "fast-glob": "^3.3.2",
287 |     "micromatch": "^4.0.5"
288 |   },
289 |   "overrides": {
290 |     "uuid": "14.0.0"
291 |   }
292 | }
293 |
```
### File: `tsconfig.json`

> 20 lines | 0.5 KB

```json
 1 | {
 2 |   "compilerOptions": {
 3 |     "module": "commonjs",
 4 |     "target": "ES2022",
 5 |     "outDir": "out",
 6 |     "rootDir": "src",
 7 |     "lib": ["ES2022"],
 8 |     "sourceMap": true,
 9 |     "strict": true,
10 |     "esModuleInterop": true,
11 |     "skipLibCheck": true,
12 |     "forceConsistentCasingInFileNames": true,
13 |     "resolveJsonModule": true,
14 |     "declaration": true,
15 |     "declarationMap": true
16 |   },
17 |   "include": ["src/**/*"],
18 |   "exclude": ["node_modules", ".vscode-test"]
19 | }
20 |
```
