<!-- Chunk 2 of 3 | ~37 KB -->
# Context Part 2/3

Files in this chunk: `src/fileRegistry.ts`, `src/formatter.ts`, `src/gitUtils.ts`, `src/scanner.ts`

---
### File: `src/fileRegistry.ts`

> 431 lines | 13.1 KB

```typescript
  1 | /**
  2 |  * fileRegistry.ts
  3 |  *
  4 |  * Central registry for Code Prompt's file type support.
  5 |  * Consumed by config.ts, scanner.ts, and smartSummarizer.ts.
  6 |  *
  7 |  * Rules:
  8 |  *  - Add new extensions / filenames here only.
  9 |  *  - Do NOT add AST parsers or heavy dependencies.
 10 |  *  - Security patterns are enforced hard — they cannot be overridden by user settings.
 11 |  */
 12 | 
 13 | // ---------------------------------------------------------------------------
 14 | // SECURITY — files that must NEVER be read, regardless of user settings
 15 | // ---------------------------------------------------------------------------
 16 | 
 17 | /** File extensions that are always secret / credential material. */
 18 | export const SECRET_EXTENSIONS: Set<string> = new Set([
 19 |     '.pem', '.key', '.p12', '.pfx', '.jks', '.keystore',
 20 | ]);
 21 | 
 22 | /**
 23 |  * Filename patterns (exact match, lowercase) that are always blocked.
 24 |  * Also covers common credential material.
 25 |  */
 26 | export const SECRET_FILENAMES: Set<string> = new Set([
 27 |     '.env',
 28 |     '.env.local', '.env.development', '.env.production',
 29 |     '.env.test', '.env.staging', '.env.ci',
 30 |     'secret.env', 'production.env', 'development.env',
 31 |     'secrets.yaml', 'secrets.yml', 'secrets.json',
 32 |     'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa',
 33 |     'authorized_keys', '.htpasswd',
 34 | ]);
 35 | 
 36 | /**
 37 |  * Glob-style prefix patterns (startsWith, lowercase) for .env.* variants.
 38 |  * e.g. ".env.something" unless it matches SAFE_ENV_SUFFIXES.
 39 |  */
 40 | export const ENV_PREFIX = '.env.';
 41 | 
 42 | /**
 43 |  * Safe .env suffixes that MAY be exported (template/example files).
 44 |  */
 45 | export const SAFE_ENV_SUFFIXES: Set<string> = new Set([
 46 |     '.env.example', '.env.sample', '.env.template',
 47 |     '.env.example.local',
 48 | ]);
 49 | 
 50 | // ---------------------------------------------------------------------------
 51 | // LANGUAGE MAP — extension → Markdown fenced block language identifier
 52 | // ---------------------------------------------------------------------------
 53 | 
 54 | export const LANGUAGE_MAP: Record<string, string> = {
 55 |     // JavaScript / TypeScript
 56 |     '.js':   'javascript',
 57 |     '.jsx':  'jsx',
 58 |     '.ts':   'typescript',
 59 |     '.tsx':  'tsx',
 60 |     '.mjs':  'javascript',
 61 |     '.cjs':  'javascript',
 62 |     '.mts':  'typescript',
 63 |     '.cts':  'typescript',
 64 | 
 65 |     // Web / templates
 66 |     '.html': 'html',
 67 |     '.htm':  'html',
 68 |     '.xml':  'xml',
 69 |     '.svg':  'xml',
 70 |     '.mdx':  'mdx',
 71 |     '.md':   'markdown',
 72 |     '.txt':  'text',
 73 | 
 74 |     // Astro
 75 |     '.astro': 'astro',
 76 | 
 77 |     // CSS
 78 |     '.css':  'css',
 79 |     '.scss': 'scss',
 80 |     '.sass': 'sass',
 81 |     '.less': 'less',
 82 |     '.styl': 'stylus',
 83 | 
 84 |     // Component frameworks
 85 |     '.vue':    'vue',
 86 |     '.svelte': 'svelte',
 87 | 
 88 |     // Python
 89 |     '.py':  'python',
 90 |     '.pyw': 'python',
 91 |     '.pyi': 'python',
 92 | 
 93 |     // JVM
 94 |     '.java':   'java',
 95 |     '.kt':     'kotlin',
 96 |     '.kts':    'kotlin',
 97 |     '.groovy': 'groovy',
 98 |     '.scala':  'scala',
 99 | 
100 |     // C / C++
101 |     '.c':   'c',
102 |     '.h':   'c',
103 |     '.cc':  'cpp',
104 |     '.cp':  'cpp',
105 |     '.cpp': 'cpp',
106 |     '.cxx': 'cpp',
107 |     '.hh':  'cpp',
108 |     '.hpp': 'cpp',
109 |     '.hxx': 'cpp',
110 |     '.ipp': 'cpp',
111 | 
112 |     // Objective-C
113 |     '.m':  'objective-c',
114 |     '.mm': 'objective-cpp',
115 | 
116 |     // Rust
117 |     '.rs': 'rust',
118 | 
119 |     // Go
120 |     '.go': 'go',
121 | 
122 |     // Zig
123 |     '.zig': 'zig',
124 | 
125 |     // Swift
126 |     '.swift': 'swift',
127 | 
128 |     // Dart / Flutter
129 |     '.dart': 'dart',
130 | 
131 |     // PHP
132 |     '.php': 'php',
133 | 
134 |     // C#
135 |     '.cs': 'csharp',
136 | 
137 |     // Ruby
138 |     '.rb':      'ruby',
139 |     '.rake':    'ruby',
140 |     '.gemspec': 'ruby',
141 | 
142 |     // Shell
143 |     '.sh':   'bash',
144 |     '.bash': 'bash',
145 |     '.zsh':  'zsh',
146 |     '.fish': 'fish',
147 | 
148 |     // PowerShell / Windows
149 |     '.ps1': 'powershell',
150 |     '.bat': 'batch',
151 |     '.cmd': 'batch',
152 | 
153 |     // SQL
154 |     '.sql': 'sql',
155 | 
156 |     // GraphQL
157 |     '.graphql': 'graphql',
158 |     '.gql':     'graphql',
159 | 
160 |     // Protocol / schemas
161 |     '.proto': 'protobuf',
162 |     '.avsc':  'json',
163 |     '.thrift': 'thrift',
164 | 
165 |     // Infrastructure / IaC
166 |     '.tf':      'hcl',
167 |     '.tfvars':  'hcl',
168 |     '.hcl':     'hcl',
169 | 
170 |     // Config / data
171 |     '.json':   'json',
172 |     '.jsonc':  'json',
173 |     '.yaml':   'yaml',
174 |     '.yml':    'yaml',
175 |     '.toml':   'toml',
176 |     '.ini':    'ini',
177 |     '.conf':   'text',
178 |     '.config': 'text',
179 |     '.env.example': 'bash',
180 |     '.env.sample':  'bash',
181 |     '.env.template':'bash',
182 | 
183 |     // Mobile / Android
184 |     '.gradle':     'groovy',
185 |     '.pbxproj':    'text',
186 |     '.xcconfig':   'text',
187 |     '.entitlements': 'xml',
188 | 
189 |     // Functional / ML languages
190 |     '.hs':  'haskell',
191 |     '.lhs': 'haskell',
192 |     '.ex':  'elixir',
193 |     '.exs': 'elixir',
194 |     '.erl': 'erlang',
195 |     '.hrl': 'erlang',
196 |     '.clj': 'clojure',
197 |     '.cljs':'clojure',
198 |     '.cljc':'clojure',
199 |     '.fs':  'fsharp',
200 |     '.fsx': 'fsharp',
201 |     '.fsi': 'fsharp',
202 |     '.ml':  'ocaml',
203 |     '.mli': 'ocaml',
204 |     '.lua': 'lua',
205 |     '.r':   'r',
206 |     '.R':   'r',
207 |     '.jl':  'julia',
208 | 
209 |     // Embedded / Arduino
210 |     '.ino': 'cpp',
211 | 
212 |     // WebAssembly
213 |     '.wat': 'wasm',
214 |     '.wasm': 'text', // binary check will block actual binaries
215 | 
216 |     // Solidity / blockchain
217 |     '.sol': 'solidity',
218 | 
219 |     // Notebooks — handled specially in scanner.ts
220 |     '.ipynb': 'python',
221 | };
222 | 
223 | // ---------------------------------------------------------------------------
224 | // FILENAME → LANGUAGE (exact filename, no extension)
225 | // ---------------------------------------------------------------------------
226 | 
227 | export const FILENAME_LANGUAGE_MAP: Record<string, string> = {
228 |     'Dockerfile':       'dockerfile',
229 |     'Makefile':         'makefile',
230 |     'Rakefile':         'ruby',
231 |     'Gemfile':          'ruby',
232 |     'Pipfile':          'toml',
233 |     'Cargo.toml':       'toml',
234 |     'go.mod':           'go',
235 |     'go.sum':           'text',
236 |     'requirements.txt': 'text',
237 |     'pubspec.yaml':     'yaml',
238 |     'build.gradle':     'groovy',
239 |     'settings.gradle':  'groovy',
240 |     'pom.xml':          'xml',
241 |     '.gitignore':       'text',
242 |     '.dockerignore':    'text',
243 |     '.editorconfig':    'text',
244 |     '.prettierrc':      'json',
245 |     '.eslintrc':        'json',
246 |     '.babelrc':         'json',
247 |     'nginx.conf':       'text',
248 |     'Procfile':         'text',
249 |     '.env.example':     'bash',
250 |     '.env.sample':      'bash',
251 |     '.env.template':    'bash',
252 | };
253 | 
254 | // ---------------------------------------------------------------------------
255 | // BUILT-IN SUPPORTED EXTENSIONS (fallback when user list is empty/missing)
256 | // ---------------------------------------------------------------------------
257 | 
258 | /** All extensions the extension supports out of the box. */
259 | export const BUILT_IN_EXTENSIONS: Set<string> = new Set(Object.keys(LANGUAGE_MAP));
260 | 
261 | /** All exact filenames (no extension) supported out of the box. */
262 | export const BUILT_IN_FILENAMES: Set<string> = new Set([
263 |     'Dockerfile', 'Makefile', 'Rakefile', 'Gemfile', 'Pipfile',
264 |     'Cargo.toml', 'go.mod', 'go.sum',
265 |     'requirements.txt', 'pubspec.yaml',
266 |     'build.gradle', 'settings.gradle', 'pom.xml',
267 |     '.gitignore', '.dockerignore', '.editorconfig',
268 |     '.prettierrc', '.eslintrc', '.babelrc',
269 |     'nginx.conf', 'Procfile',
270 |     '.env.example', '.env.sample', '.env.template',
271 |     // Common config files without stable extensions
272 |     'docker-compose.yml', 'docker-compose.yaml',
273 | ]);
274 | 
275 | // ---------------------------------------------------------------------------
276 | // HIGH-PRIORITY FILES for Smart Export scoring
277 | // ---------------------------------------------------------------------------
278 | 
279 | /**
280 |  * Lowercase filenames that get an extra priority bonus in Smart Export.
281 |  * Values are additive score bonuses on top of the base scoring.
282 |  */
283 | export const HIGH_PRIORITY_FILENAMES: Map<string, number> = new Map([
284 |     // Framework config roots
285 |     ['astro.config.mjs',  45], ['astro.config.ts',   45], ['astro.config.js', 45],
286 |     ['next.config.js',    45], ['next.config.mjs',   45], ['next.config.ts',  45],
287 |     ['nuxt.config.ts',    45], ['nuxt.config.js',    45],
288 |     ['svelte.config.js',  45], ['svelte.config.ts',  45],
289 |     ['vite.config.ts',    45], ['vite.config.js',    45], ['vite.config.mjs', 45],
290 |     ['remix.config.js',   45], ['remix.config.ts',   45],
291 |     ['angular.json',      40],
292 |     ['tailwind.config.js',38], ['tailwind.config.ts', 38], ['tailwind.config.mjs', 38],
293 |     ['webpack.config.js', 35], ['webpack.config.ts', 35],
294 |     ['rollup.config.js',  35], ['rollup.config.ts',  35],
295 |     ['vitest.config.ts',  35], ['vitest.config.js',  35],
296 |     ['jest.config.js',    35], ['jest.config.ts',    35],
297 |     ['electron.config.js',35],
298 | 
299 |     // Package manifests
300 |     ['package.json',      40],
301 |     ['pyproject.toml',    40],
302 |     ['cargo.toml',        40],
303 |     ['go.mod',            40],
304 |     ['pubspec.yaml',      40],
305 |     ['build.gradle',      38], ['settings.gradle',   35],
306 |     ['pom.xml',           38],
307 |     ['requirements.txt',  35],
308 |     ['gemfile',           35],
309 | 
310 |     // Container / infra
311 |     ['dockerfile',           38],
312 |     ['docker-compose.yml',   38], ['docker-compose.yaml', 38],
313 |     ['kubernetes.yaml',      35], ['kubernetes.yml',      35],
314 |     ['helm.yaml',            35],
315 | 
316 |     // Env examples (safe)
317 |     ['.env.example',  30], ['.env.sample', 30], ['.env.template', 30],
318 | 
319 |     // Docs
320 |     ['readme.md', 45],
321 | ]);
322 | 
323 | // ---------------------------------------------------------------------------
324 | // TECH STACK DETECTION — filename signals
325 | // ---------------------------------------------------------------------------
326 | 
327 | /**
328 |  * Maps a lowercase filename to zero or more tech stack labels.
329 |  * Used by detectTechStack() in smartSummarizer.ts.
330 |  */
331 | export const FILENAME_TECH_SIGNALS: Map<string, string[]> = new Map([
332 |     ['astro.config.mjs',        ['Astro']],
333 |     ['astro.config.ts',         ['Astro']],
334 |     ['astro.config.js',         ['Astro']],
335 |     ['next.config.js',          ['Next.js']],
336 |     ['next.config.mjs',         ['Next.js']],
337 |     ['nuxt.config.ts',          ['Nuxt.js']],
338 |     ['nuxt.config.js',          ['Nuxt.js']],
339 |     ['svelte.config.js',        ['SvelteKit']],
340 |     ['svelte.config.ts',        ['SvelteKit']],
341 |     ['remix.config.js',         ['Remix']],
342 |     ['remix.config.ts',         ['Remix']],
343 |     ['angular.json',            ['Angular']],
344 |     ['electron-builder.yml',    ['Electron']],
345 |     ['tauri.conf.json',         ['Tauri']],
346 |     ['pubspec.yaml',            ['Flutter/Dart']],
347 |     ['cargo.toml',              ['Rust']],
348 |     ['go.mod',                  ['Go']],
349 |     ['pyproject.toml',          ['Python']],
350 |     ['requirements.txt',        ['Python']],
351 |     ['build.gradle',            ['Java/JVM (Gradle)']],
352 |     ['settings.gradle',         ['Java/JVM (Gradle)']],
353 |     ['pom.xml',                 ['Java/JVM (Maven)']],
354 |     ['gemfile',                 ['Ruby']],
355 |     ['dockerfile',              ['Docker']],
356 |     ['docker-compose.yml',      ['Docker Compose']],
357 |     ['docker-compose.yaml',     ['Docker Compose']],
358 |     ['kubernetes.yaml',         ['Kubernetes']],
359 |     ['kubernetes.yml',          ['Kubernetes']],
360 |     ['tsconfig.json',           ['TypeScript']],
361 | ]);
362 | 
363 | /**
364 |  * npm package dependency → tech stack label.
365 |  * Used when package.json is parsed.
366 |  */
367 | export const NPM_DEP_SIGNALS: Map<string, string> = new Map([
368 |     ['react',                'React'],
369 |     ['next',                 'Next.js'],
370 |     ['vue',                  'Vue.js'],
371 |     ['nuxt',                 'Nuxt.js'],
372 |     ['svelte',               'Svelte'],
373 |     ['@sveltejs/kit',        'SvelteKit'],
374 |     ['astro',                'Astro'],
375 |     ['@remix-run/react',     'Remix'],
376 |     ['@remix-run/node',      'Remix'],
377 |     ['solid-js',             'SolidJS'],
378 |     ['@builder.io/qwik',     'Qwik'],
379 |     ['express',              'Express.js'],
380 |     ['fastify',              'Fastify'],
381 |     ['@nestjs/core',         'NestJS'],
382 |     ['@angular/core',        'Angular'],
383 |     ['electron',             'Electron'],
384 |     ['tailwindcss',          'Tailwind CSS'],
385 |     ['prisma',               'Prisma'],
386 |     ['@prisma/client',       'Prisma'],
387 |     ['mongoose',             'MongoDB/Mongoose'],
388 |     ['typeorm',              'TypeORM'],
389 |     ['drizzle-orm',          'Drizzle ORM'],
390 |     ['react-native',         'React Native'],
391 |     ['expo',                 'Expo/React Native'],
392 |     ['torch',                'PyTorch'],
393 |     ['tensorflow',           'TensorFlow'],
394 |     ['jax',                  'JAX'],
395 |     ['scikit-learn',         'scikit-learn'],
396 |     ['transformers',         'Hugging Face Transformers'],
397 |     ['langchain',            'LangChain'],
398 |     ['openai',               'OpenAI SDK'],
399 |     ['vite',                 'Vite'],
400 |     ['webpack',              'Webpack'],
401 |     ['rollup',               'Rollup'],
402 |     ['esbuild',              'esbuild'],
403 |     ['bun',                  'Bun'],
404 | ]);
405 | 
406 | /**
407 |  * Python requirement patterns → tech stack label.
408 |  * Used when requirements.txt is parsed (simple substring match).
409 |  */
410 | export const PYTHON_DEP_SIGNALS: Map<string, string> = new Map([
411 |     ['torch',          'PyTorch'],
412 |     ['tensorflow',     'TensorFlow'],
413 |     ['jax',            'JAX'],
414 |     ['scikit-learn',   'scikit-learn'],
415 |     ['sklearn',        'scikit-learn'],
416 |     ['transformers',   'Hugging Face Transformers'],
417 |     ['diffusers',      'Hugging Face Diffusers'],
418 |     ['langchain',      'LangChain'],
419 |     ['fastapi',        'FastAPI'],
420 |     ['django',         'Django'],
421 |     ['flask',          'Flask'],
422 |     ['starlette',      'Starlette'],
423 |     ['pandas',         'pandas'],
424 |     ['numpy',          'NumPy'],
425 |     ['opencv',         'OpenCV'],
426 |     ['openai',         'OpenAI SDK'],
427 | ]);
428 | 
429 | /** Extension sets for embedded / robotics tech detection */
430 | export const EMBEDDED_EXTENSIONS: Set<string> = new Set(['.ino', '.c', '.h', '.cpp', '.hpp']);
431 |
```
### File: `src/formatter.ts`

> 211 lines | 6.3 KB

```typescript
  1 | import { ScannedFile } from './scanner';
  2 | import { TreeNode, treeToString, getTreeStats } from './treeBuilder';
  3 | import { ExportConfig } from './config';
  4 | 
  5 | export interface FormatOptions {
  6 |     title?: string;
  7 |     includeTree?: boolean;
  8 |     includeStats?: boolean;
  9 |     includeTimestamp?: boolean;
 10 |     mode?: string;
 11 | }
 12 | 
 13 | export function formatContext(
 14 |     tree: TreeNode,
 15 |     files: ScannedFile[],
 16 |     config: ExportConfig,
 17 |     options: FormatOptions = {}
 18 | ): string {
 19 |     const {
 20 |         title = 'Project Context Export',
 21 |         includeTree = true,
 22 |         includeStats = true,
 23 |         includeTimestamp = true,
 24 |         mode = 'full',
 25 |     } = options;
 26 | 
 27 |     const sections: string[] = [];
 28 | 
 29 |     // Header
 30 |     sections.push(`# ${title}`);
 31 |     sections.push('');
 32 | 
 33 |     // Metadata
 34 |     if (includeTimestamp) {
 35 |         sections.push(`> Generated: ${new Date().toISOString()}`);
 36 |         sections.push(`> Mode: ${mode}`);
 37 |         sections.push(`> Files: ${files.length}`);
 38 | 
 39 |         if (includeStats) {
 40 |             const stats = getTreeStats(tree);
 41 |             const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0);
 42 |             const totalSizeKB = (files.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1);
 43 |             sections.push(`> Total Lines: ${totalLines.toLocaleString()}`);
 44 |             sections.push(`> Total Size: ${totalSizeKB} KB`);
 45 |             sections.push(`> Directories: ${stats.directories}`);
 46 |         }
 47 |         sections.push('');
 48 |     }
 49 | 
 50 |     sections.push('---');
 51 |     sections.push('');
 52 | 
 53 |     // Folder Structure
 54 |     if (includeTree) {
 55 |         sections.push('## 📁 Folder Structure');
 56 |         sections.push('');
 57 |         sections.push('```');
 58 |         sections.push(treeToString(tree).trimEnd());
 59 |         sections.push('```');
 60 |         sections.push('');
 61 |         sections.push('---');
 62 |         sections.push('');
 63 |     }
 64 | 
 65 |     // Package.json summary (if exists)
 66 |     const packageJson = files.find(f =>
 67 |         f.relativePath === 'package.json'
 68 |     );
 69 |     if (packageJson) {
 70 |         try {
 71 |             const pkg = JSON.parse(packageJson.content);
 72 |             sections.push('## 📦 Project Info');
 73 |             sections.push('');
 74 |             if (pkg.name) sections.push(`- **Name:** ${pkg.name}`);
 75 |             if (pkg.version) sections.push(`- **Version:** ${pkg.version}`);
 76 |             if (pkg.description) sections.push(`- **Description:** ${pkg.description}`);
 77 | 
 78 |             if (pkg.dependencies) {
 79 |                 sections.push(`- **Dependencies:** ${Object.keys(pkg.dependencies).join(', ')}`);
 80 |             }
 81 |             if (pkg.devDependencies) {
 82 |                 sections.push(`- **Dev Dependencies:** ${Object.keys(pkg.devDependencies).join(', ')}`);
 83 |             }
 84 |             if (pkg.scripts) {
 85 |                 sections.push('- **Scripts:**');
 86 |                 for (const [key, value] of Object.entries(pkg.scripts)) {
 87 |                     sections.push(`  - \`${key}\`: \`${value}\``);
 88 |                 }
 89 |             }
 90 |             sections.push('');
 91 |             sections.push('---');
 92 |             sections.push('');
 93 |         } catch {
 94 |             // Invalid JSON, skip summary
 95 |         }
 96 |     }
 97 | 
 98 |     // Source Files
 99 |     sections.push('## 📄 Source Files');
100 |     sections.push('');
101 | 
102 |     for (const file of files) {
103 |         sections.push(`### File: \`${file.relativePath}\``);
104 |         sections.push('');
105 |         sections.push(`> ${file.lineCount} lines | ${(file.size / 1024).toFixed(1)} KB`);
106 |         sections.push('');
107 | 
108 |         const codeContent = config.includeLineNumbers
109 |             ? addLineNumbers(file.content)
110 |             : file.content;
111 | 
112 |         sections.push(`\`\`\`${file.language}`);
113 |         sections.push(codeContent.trimEnd());
114 |         sections.push('```');
115 |         sections.push('');
116 |     }
117 | 
118 |     return sections.join('\n');
119 | }
120 | 
121 | export function formatProjectSummary(
122 |     tree: TreeNode,
123 |     files: ScannedFile[],
124 |     config: ExportConfig
125 | ): string {
126 |     const sections: string[] = [];
127 | 
128 |     sections.push('# PROJECT_CONTEXT.md');
129 |     sections.push('');
130 |     sections.push(`> Generated: ${new Date().toISOString()}`);
131 |     sections.push('');
132 | 
133 |     // Tree
134 |     sections.push('## Project Structure');
135 |     sections.push('');
136 |     sections.push('```');
137 |     sections.push(treeToString(tree).trimEnd());
138 |     sections.push('```');
139 |     sections.push('');
140 | 
141 |     // Key config files content
142 |     const configFiles = [
143 |         'package.json',
144 |         'tsconfig.json',
145 |         'pyproject.toml',
146 |         'Cargo.toml',
147 |         'go.mod',
148 |         'build.gradle',
149 |         'pom.xml',
150 |         'Gemfile',
151 |         'requirements.txt',
152 |         '.env.example',
153 |         '.env.sample',
154 |         'docker-compose.yml',
155 |         'docker-compose.yaml',
156 |         'Dockerfile',
157 |     ];
158 | 
159 |     const foundConfigs = files.filter(f =>
160 |         configFiles.some(cf => f.relativePath.endsWith(cf))
161 |     );
162 | 
163 |     if (foundConfigs.length > 0) {
164 |         sections.push('## Configuration Files');
165 |         sections.push('');
166 | 
167 |         for (const file of foundConfigs) {
168 |             sections.push(`### \`${file.relativePath}\``);
169 |             sections.push('');
170 |             sections.push(`\`\`\`${file.language}`);
171 |             sections.push(file.content.trimEnd());
172 |             sections.push('```');
173 |             sections.push('');
174 |         }
175 |     }
176 | 
177 |     // Route files
178 |     const routePatterns = ['route', 'router', 'urls', 'endpoint', 'api'];
179 |     const routeFiles = files.filter(f => {
180 |         const lower = f.relativePath.toLowerCase();
181 |         return routePatterns.some(p => lower.includes(p));
182 |     });
183 | 
184 |     if (routeFiles.length > 0) {
185 |         sections.push('## Route / API Files');
186 |         sections.push('');
187 |         for (const file of routeFiles) {
188 |             sections.push(`### \`${file.relativePath}\``);
189 |             sections.push('');
190 |             sections.push(`\`\`\`${file.language}`);
191 |             sections.push(addLineNumbers(file.content).trimEnd());
192 |             sections.push('```');
193 |             sections.push('');
194 |         }
195 |     }
196 | 
197 |     return sections.join('\n');
198 | }
199 | 
200 | function addLineNumbers(content: string): string {
201 |     const lines = content.split('\n');
202 |     const padding = String(lines.length).length;
203 | 
204 |     return lines
205 |         .map((line, i) => {
206 |             const num = String(i + 1).padStart(padding, ' ');
207 |             return `${num} | ${line}`;
208 |         })
209 |         .join('\n');
210 | }
211 |
```
### File: `src/gitUtils.ts`

> 75 lines | 2.4 KB

```typescript
 1 | import * as cp from 'child_process';
 2 | import * as path from 'path';
 3 | 
 4 | function runGit(args: string[], cwd: string): string {
 5 |     try {
 6 |         return cp.execFileSync('git', args, { cwd, encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
 7 |     } catch {
 8 |         return '';
 9 |     }
10 | }
11 | 
12 | export function getChangedFiles(workspacePath: string): string[] {
13 |     // git rev-parse HEAD fails on repos with no commits yet
14 |     const hasCommits = runGit(['rev-parse', 'HEAD'], workspacePath).trim().length > 0;
15 | 
16 |     const unstaged  = hasCommits ? runGit(['diff', '--name-only', 'HEAD'], workspacePath) : '';
17 |     const staged    = runGit(['diff', '--name-only', '--cached'], workspacePath);
18 |     const untracked = runGit(['ls-files', '--others', '--exclude-standard'], workspacePath);
19 | 
20 |     const files = [...unstaged.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]
21 |         .map(f => f.trim())
22 |         .filter(f => f.length > 0)
23 |         .filter((f, i, arr) => arr.indexOf(f) === i);
24 | 
25 |     return files
26 |         .map(f => path.resolve(workspacePath, f))
27 |         .filter(f => f.startsWith(path.resolve(workspacePath) + path.sep) || f === path.resolve(workspacePath));
28 | }
29 | 
30 | export function isGitRepo(workspacePath: string): boolean {
31 |     try {
32 |         cp.execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
33 |             cwd: workspacePath,
34 |             encoding: 'utf-8',
35 |             timeout: 5000,
36 |             stdio: 'pipe',
37 |         });
38 |         return true;
39 |     } catch {
40 |         return false;
41 |     }
42 | }
43 | 
44 | export function getGitBranch(workspacePath: string): string {
45 |     try {
46 |         const result = cp.execFileSync('git', ['branch', '--show-current'], {
47 |             cwd: workspacePath,
48 |             encoding: 'utf-8',
49 |             timeout: 5000,
50 |             stdio: 'pipe',
51 |         });
52 |         return result.trim();
53 |     } catch {
54 |         return 'unknown';
55 |     }
56 | }
57 | 
58 | export function getRecentCommits(workspacePath: string, count: number = 5): string[] {
59 |     try {
60 |         const result = cp.execFileSync(
61 |             'git',
62 |             ['log', '--oneline', `-${count}`],
63 |             {
64 |                 cwd: workspacePath,
65 |                 encoding: 'utf-8',
66 |                 timeout: 5000,
67 |                 stdio: 'pipe',
68 |             }
69 |         );
70 |         return result.split('\n').filter(l => l.trim().length > 0);
71 |     } catch {
72 |         return [];
73 |     }
74 | }
75 |
```
### File: `src/scanner.ts`

> 297 lines | 9.0 KB

```typescript
  1 | import * as fs from 'fs';
  2 | import * as path from 'path';
  3 | import { ExportConfig, isSupportedFile, shouldIgnoreFile, isSecretFile } from './config';
  4 | import { LANGUAGE_MAP, FILENAME_LANGUAGE_MAP } from './fileRegistry';
  5 | import { TreeNode, collectFiles } from './treeBuilder';
  6 | 
  7 | export interface ScannedFile {
  8 |     relativePath: string;
  9 |     absolutePath: string;
 10 |     content: string;
 11 |     lineCount: number;
 12 |     size: number;
 13 |     language: string;
 14 | }
 15 | 
 16 | // ---------------------------------------------------------------------------
 17 | // In-memory scan cache
 18 | // Key: absolutePath + '|' + mtimeMs + '|' + size
 19 | // ---------------------------------------------------------------------------
 20 | interface CacheEntry {
 21 |     content: string;
 22 |     lineCount: number;
 23 |     language: string;
 24 | }
 25 | const scanCache = new Map<string, CacheEntry>();
 26 | 
 27 | function makeCacheKey(absolutePath: string, mtimeMs: number, size: number): string {
 28 |     return `${absolutePath}|${mtimeMs}|${size}`;
 29 | }
 30 | 
 31 | // ---------------------------------------------------------------------------
 32 | // Public API
 33 | // ---------------------------------------------------------------------------
 34 | 
 35 | export function scanFiles(
 36 |     tree: TreeNode,
 37 |     rootPath: string,
 38 |     config: ExportConfig
 39 | ): ScannedFile[] {
 40 |     const fileNodes = collectFiles(tree);
 41 |     const scanned: ScannedFile[] = [];
 42 | 
 43 |     for (const node of fileNodes) {
 44 |         try {
 45 |             const result = readFileEntry(node.path, node.name, node.size, config);
 46 |             if (!result) continue;
 47 | 
 48 |             const relativePath = path.relative(rootPath, node.path).replace(/\\/g, '/');
 49 |             scanned.push({
 50 |                 relativePath,
 51 |                 absolutePath: node.path,
 52 |                 content: result.content,
 53 |                 lineCount: result.lineCount,
 54 |                 size: node.size || Buffer.byteLength(result.content, 'utf-8'),
 55 |                 language: result.language,
 56 |             });
 57 |         } catch {
 58 |             // Skip unreadable files — never crash the full export
 59 |             continue;
 60 |         }
 61 |     }
 62 | 
 63 |     return scanned;
 64 | }
 65 | 
 66 | export function scanSpecificFiles(
 67 |     filePaths: string[],
 68 |     rootPath: string,
 69 |     config: ExportConfig
 70 | ): ScannedFile[] {
 71 |     const scanned: ScannedFile[] = [];
 72 | 
 73 |     for (const filePath of filePaths) {
 74 |         try {
 75 |             const resolvedPath = path.resolve(filePath);
 76 |             const resolvedRoot = path.resolve(rootPath);
 77 |             if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) continue;
 78 | 
 79 |             const fileName = path.basename(resolvedPath);
 80 | 
 81 |             // Security gate — must be first
 82 |             if (isSecretFile(fileName)) continue;
 83 | 
 84 |             if (shouldIgnoreFile(fileName, config)) continue;
 85 |             if (!isSupportedFile(fileName, config)) continue;
 86 | 
 87 |             const stats = fs.statSync(resolvedPath);
 88 |             if (stats.size > config.maxFileSizeKB * 1024) continue;
 89 | 
 90 |             const result = readFileEntry(resolvedPath, fileName, stats.size, config, stats);
 91 |             if (!result) continue;
 92 | 
 93 |             const relativePath = path.relative(rootPath, resolvedPath).replace(/\\/g, '/');
 94 |             scanned.push({
 95 |                 relativePath,
 96 |                 absolutePath: resolvedPath,
 97 |                 content: result.content,
 98 |                 lineCount: result.lineCount,
 99 |                 size: stats.size,
100 |                 language: result.language,
101 |             });
102 |         } catch {
103 |             continue;
104 |         }
105 |     }
106 | 
107 |     return scanned;
108 | }
109 | 
110 | // ---------------------------------------------------------------------------
111 | // Core file reader — security → size → cache → read → binary check → return
112 | // ---------------------------------------------------------------------------
113 | 
114 | function readFileEntry(
115 |     absolutePath: string,
116 |     fileName: string,
117 |     knownSize: number | undefined,
118 |     config: ExportConfig,
119 |     cachedStats?: fs.Stats
120 | ): CacheEntry | null {
121 |     // 1. Security gate — reject before ANY read
122 |     if (isSecretFile(fileName)) return null;
123 | 
124 |     // 2. Get stats (reuse if already obtained)
125 |     let stats: fs.Stats;
126 |     try {
127 |         stats = cachedStats ?? fs.statSync(absolutePath);
128 |     } catch {
129 |         return null;
130 |     }
131 | 
132 |     // 3. Size check
133 |     if (stats.size > config.maxFileSizeKB * 1024) return null;
134 | 
135 |     // 4. Cache lookup
136 |     const cacheKey = makeCacheKey(absolutePath, stats.mtimeMs, stats.size);
137 |     const cached = scanCache.get(cacheKey);
138 |     if (cached) return cached;
139 | 
140 |     // 5. Special handling for .ipynb notebooks
141 |     const ext = path.extname(fileName).toLowerCase();
142 |     if (ext === '.ipynb') {
143 |         const entry = readNotebook(absolutePath, fileName);
144 |         if (entry) scanCache.set(cacheKey, entry);
145 |         return entry;
146 |     }
147 | 
148 |     // 6. Fast binary pre-check: read a small header sample WITHOUT loading the whole file
149 |     if (isBinaryHeader(absolutePath)) return null;
150 | 
151 |     // 7. Full text read
152 |     let content: string;
153 |     try {
154 |         content = fs.readFileSync(absolutePath, 'utf-8');
155 |     } catch {
156 |         return null;
157 |     }
158 | 
159 |     // 8. Content-level binary safety net (catches edge cases the header missed)
160 |     if (isBinary(content)) return null;
161 | 
162 |     // 9. Build entry
163 |     const language = getLanguageFromExt(ext, fileName);
164 |     const entry: CacheEntry = {
165 |         content,
166 |         lineCount: content.split('\n').length,
167 |         language,
168 |     };
169 | 
170 |     scanCache.set(cacheKey, entry);
171 |     return entry;
172 | }
173 | 
174 | // ---------------------------------------------------------------------------
175 | // Jupyter Notebook (.ipynb) support
176 | // ---------------------------------------------------------------------------
177 | 
178 | function readNotebook(absolutePath: string, _fileName: string): CacheEntry | null {
179 |     let raw: string;
180 |     try {
181 |         raw = fs.readFileSync(absolutePath, 'utf-8');
182 |     } catch {
183 |         return null;
184 |     }
185 | 
186 |     // Must be valid JSON
187 |     let nb: Record<string, unknown>;
188 |     try {
189 |         nb = JSON.parse(raw);
190 |     } catch {
191 |         return null;
192 |     }
193 | 
194 |     const cells = nb.cells as Array<Record<string, unknown>> | undefined;
195 |     if (!Array.isArray(cells)) {
196 |         // Fallback: export raw JSON
197 |         return { content: raw, lineCount: raw.split('\n').length, language: 'json' };
198 |     }
199 | 
200 |     const lines: string[] = [];
201 |     lines.push('# Jupyter Notebook');
202 |     lines.push('');
203 | 
204 |     for (const cell of cells) {
205 |         const cellType = String(cell.cell_type ?? 'code');
206 |         const source = cell.source;
207 | 
208 |         const sourceLines: string[] = Array.isArray(source)
209 |             ? (source as string[])
210 |             : typeof source === 'string'
211 |             ? source.split('\n').map((l, i, a) => (i < a.length - 1 ? l + '\n' : l))
212 |             : [];
213 | 
214 |         if (sourceLines.length === 0) continue;
215 | 
216 |         if (cellType === 'markdown') {
217 |             lines.push('<!-- markdown cell -->');
218 |             lines.push(...sourceLines.map(l => l.replace(/\n$/, '')));
219 |         } else {
220 |             lines.push(`\`\`\`python`);
221 |             lines.push(...sourceLines.map(l => l.replace(/\n$/, '')));
222 |             lines.push('```');
223 |         }
224 |         lines.push('');
225 |     }
226 | 
227 |     const content = lines.join('\n');
228 |     return { content, lineCount: content.split('\n').length, language: 'python' };
229 | }
230 | 
231 | // ---------------------------------------------------------------------------
232 | // Helpers
233 | // ---------------------------------------------------------------------------
234 | 
235 | /**
236 |  * Fast binary pre-check: reads only the first 512 bytes via a raw file descriptor.
237 |  * Avoids loading the entire file into memory before deciding it's binary.
238 |  */
239 | function isBinaryHeader(absolutePath: string): boolean {
240 |     const SAMPLE = 512;
241 |     const buf = Buffer.alloc(SAMPLE);
242 |     let fd: number | undefined;
243 |     let bytesRead = 0;
244 | 
245 |     try {
246 |         fd = fs.openSync(absolutePath, 'r');
247 |         bytesRead = fs.readSync(fd, buf, 0, SAMPLE, 0);
248 |     } catch {
249 |         return false; // Can't read header — let full read attempt handle it
250 |     } finally {
251 |         if (fd !== undefined) {
252 |             try { fs.closeSync(fd); } catch { /* ignore */ }
253 |         }
254 |     }
255 | 
256 |     if (bytesRead === 0) return false;
257 | 
258 |     let nonPrintable = 0;
259 |     for (let i = 0; i < bytesRead; i++) {
260 |         const b = buf[i];
261 |         if (b === 0) return true; // Null byte → definitely binary
262 |         if (b < 32 && b !== 9 && b !== 10 && b !== 13) nonPrintable++;
263 |     }
264 |     return nonPrintable / bytesRead > 0.1;
265 | }
266 | 
267 | function isBinary(content: string): boolean {
268 |     // Safety-net check on full content (first 8000 chars)
269 |     const sample = content.substring(0, 8000);
270 |     let nonPrintable = 0;
271 | 
272 |     for (let i = 0; i < sample.length; i++) {
273 |         const code = sample.charCodeAt(i);
274 |         if (code === 0) return true;
275 |         if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
276 |             nonPrintable++;
277 |         }
278 |     }
279 | 
280 |     return nonPrintable / sample.length > 0.1;
281 | }
282 | 
283 | function getLanguageFromExt(ext: string, fileName: string): string {
284 |     // Exact filename check first
285 |     if (FILENAME_LANGUAGE_MAP[fileName]) {
286 |         return FILENAME_LANGUAGE_MAP[fileName];
287 |     }
288 | 
289 |     if (!ext) {
290 |         if (fileName === 'Dockerfile') return 'dockerfile';
291 |         if (fileName === 'Makefile') return 'makefile';
292 |         return 'text';
293 |     }
294 | 
295 |     return LANGUAGE_MAP[ext] || 'text';
296 | }
297 |
```
