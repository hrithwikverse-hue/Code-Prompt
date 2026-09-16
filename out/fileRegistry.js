"use strict";
/**
 * fileRegistry.ts
 *
 * Central registry for Code Prompt's file type support.
 * Consumed by config.ts, scanner.ts, and smartSummarizer.ts.
 *
 * Rules:
 *  - Add new extensions / filenames here only.
 *  - Do NOT add AST parsers or heavy dependencies.
 *  - Security patterns are enforced hard — they cannot be overridden by user settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBEDDED_EXTENSIONS = exports.PYTHON_DEP_SIGNALS = exports.NPM_DEP_SIGNALS = exports.FILENAME_TECH_SIGNALS = exports.HIGH_PRIORITY_FILENAMES = exports.BUILT_IN_FILENAMES = exports.BUILT_IN_EXTENSIONS = exports.FILENAME_LANGUAGE_MAP = exports.LANGUAGE_MAP = exports.SAFE_ENV_SUFFIXES = exports.ENV_PREFIX = exports.SECRET_FILENAMES = exports.SECRET_EXTENSIONS = void 0;
// ---------------------------------------------------------------------------
// SECURITY — files that must NEVER be read, regardless of user settings
// ---------------------------------------------------------------------------
/** File extensions that are always secret / credential material. */
exports.SECRET_EXTENSIONS = new Set([
    '.pem', '.key', '.p12', '.pfx', '.jks', '.keystore',
]);
/**
 * Filename patterns (exact match, lowercase) that are always blocked.
 * Also covers common credential material.
 */
exports.SECRET_FILENAMES = new Set([
    '.env',
    '.env.local', '.env.development', '.env.production',
    '.env.test', '.env.staging', '.env.ci',
    'secret.env', 'production.env', 'development.env',
    'secrets.yaml', 'secrets.yml', 'secrets.json',
    'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa',
    'authorized_keys', '.htpasswd',
]);
/**
 * Glob-style prefix patterns (startsWith, lowercase) for .env.* variants.
 * e.g. ".env.something" unless it matches SAFE_ENV_SUFFIXES.
 */
exports.ENV_PREFIX = '.env.';
/**
 * Safe .env suffixes that MAY be exported (template/example files).
 */
exports.SAFE_ENV_SUFFIXES = new Set([
    '.env.example', '.env.sample', '.env.template',
    '.env.example.local',
]);
// ---------------------------------------------------------------------------
// LANGUAGE MAP — extension → Markdown fenced block language identifier
// ---------------------------------------------------------------------------
exports.LANGUAGE_MAP = {
    // JavaScript / TypeScript
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.mts': 'typescript',
    '.cts': 'typescript',
    // Web / templates
    '.html': 'html',
    '.htm': 'html',
    '.xml': 'xml',
    '.svg': 'xml',
    '.mdx': 'mdx',
    '.md': 'markdown',
    '.txt': 'text',
    // Astro
    '.astro': 'astro',
    // CSS
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.styl': 'stylus',
    // Component frameworks
    '.vue': 'vue',
    '.svelte': 'svelte',
    // Python
    '.py': 'python',
    '.pyw': 'python',
    '.pyi': 'python',
    // JVM
    '.java': 'java',
    '.kt': 'kotlin',
    '.kts': 'kotlin',
    '.groovy': 'groovy',
    '.scala': 'scala',
    // C / C++
    '.c': 'c',
    '.h': 'c',
    '.cc': 'cpp',
    '.cp': 'cpp',
    '.cpp': 'cpp',
    '.cxx': 'cpp',
    '.hh': 'cpp',
    '.hpp': 'cpp',
    '.hxx': 'cpp',
    '.ipp': 'cpp',
    // Objective-C
    '.m': 'objective-c',
    '.mm': 'objective-cpp',
    // Rust
    '.rs': 'rust',
    // Go
    '.go': 'go',
    // Zig
    '.zig': 'zig',
    // Swift
    '.swift': 'swift',
    // Dart / Flutter
    '.dart': 'dart',
    // PHP
    '.php': 'php',
    // C#
    '.cs': 'csharp',
    // Ruby
    '.rb': 'ruby',
    '.rake': 'ruby',
    '.gemspec': 'ruby',
    // Shell
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.fish': 'fish',
    // PowerShell / Windows
    '.ps1': 'powershell',
    '.bat': 'batch',
    '.cmd': 'batch',
    // SQL
    '.sql': 'sql',
    // GraphQL
    '.graphql': 'graphql',
    '.gql': 'graphql',
    // Protocol / schemas
    '.proto': 'protobuf',
    '.avsc': 'json',
    '.thrift': 'thrift',
    // Infrastructure / IaC
    '.tf': 'hcl',
    '.tfvars': 'hcl',
    '.hcl': 'hcl',
    // Config / data
    '.json': 'json',
    '.jsonc': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.conf': 'text',
    '.config': 'text',
    '.env.example': 'bash',
    '.env.sample': 'bash',
    '.env.template': 'bash',
    // Mobile / Android
    '.gradle': 'groovy',
    '.pbxproj': 'text',
    '.xcconfig': 'text',
    '.entitlements': 'xml',
    // Functional / ML languages
    '.hs': 'haskell',
    '.lhs': 'haskell',
    '.ex': 'elixir',
    '.exs': 'elixir',
    '.erl': 'erlang',
    '.hrl': 'erlang',
    '.clj': 'clojure',
    '.cljs': 'clojure',
    '.cljc': 'clojure',
    '.fs': 'fsharp',
    '.fsx': 'fsharp',
    '.fsi': 'fsharp',
    '.ml': 'ocaml',
    '.mli': 'ocaml',
    '.lua': 'lua',
    '.r': 'r',
    '.R': 'r',
    '.jl': 'julia',
    // Embedded / Arduino
    '.ino': 'cpp',
    // WebAssembly
    '.wat': 'wasm',
    '.wasm': 'text', // binary check will block actual binaries
    // Solidity / blockchain
    '.sol': 'solidity',
    // Notebooks — handled specially in scanner.ts
    '.ipynb': 'python',
};
// ---------------------------------------------------------------------------
// FILENAME → LANGUAGE (exact filename, no extension)
// ---------------------------------------------------------------------------
exports.FILENAME_LANGUAGE_MAP = {
    'Dockerfile': 'dockerfile',
    'Makefile': 'makefile',
    'Rakefile': 'ruby',
    'Gemfile': 'ruby',
    'Pipfile': 'toml',
    'Cargo.toml': 'toml',
    'go.mod': 'go',
    'go.sum': 'text',
    'requirements.txt': 'text',
    'pubspec.yaml': 'yaml',
    'build.gradle': 'groovy',
    'settings.gradle': 'groovy',
    'pom.xml': 'xml',
    '.gitignore': 'text',
    '.dockerignore': 'text',
    '.editorconfig': 'text',
    '.prettierrc': 'json',
    '.eslintrc': 'json',
    '.babelrc': 'json',
    'nginx.conf': 'text',
    'Procfile': 'text',
    '.env.example': 'bash',
    '.env.sample': 'bash',
    '.env.template': 'bash',
};
// ---------------------------------------------------------------------------
// BUILT-IN SUPPORTED EXTENSIONS (fallback when user list is empty/missing)
// ---------------------------------------------------------------------------
/** All extensions the extension supports out of the box. */
exports.BUILT_IN_EXTENSIONS = new Set(Object.keys(exports.LANGUAGE_MAP));
/** All exact filenames (no extension) supported out of the box. */
exports.BUILT_IN_FILENAMES = new Set([
    'Dockerfile', 'Makefile', 'Rakefile', 'Gemfile', 'Pipfile',
    'Cargo.toml', 'go.mod', 'go.sum',
    'requirements.txt', 'pubspec.yaml',
    'build.gradle', 'settings.gradle', 'pom.xml',
    '.gitignore', '.dockerignore', '.editorconfig',
    '.prettierrc', '.eslintrc', '.babelrc',
    'nginx.conf', 'Procfile',
    '.env.example', '.env.sample', '.env.template',
    // Common config files without stable extensions
    'docker-compose.yml', 'docker-compose.yaml',
]);
// ---------------------------------------------------------------------------
// HIGH-PRIORITY FILES for Smart Export scoring
// ---------------------------------------------------------------------------
/**
 * Lowercase filenames that get an extra priority bonus in Smart Export.
 * Values are additive score bonuses on top of the base scoring.
 */
exports.HIGH_PRIORITY_FILENAMES = new Map([
    // Framework config roots
    ['astro.config.mjs', 45], ['astro.config.ts', 45], ['astro.config.js', 45],
    ['next.config.js', 45], ['next.config.mjs', 45], ['next.config.ts', 45],
    ['nuxt.config.ts', 45], ['nuxt.config.js', 45],
    ['svelte.config.js', 45], ['svelte.config.ts', 45],
    ['vite.config.ts', 45], ['vite.config.js', 45], ['vite.config.mjs', 45],
    ['remix.config.js', 45], ['remix.config.ts', 45],
    ['angular.json', 40],
    ['tailwind.config.js', 38], ['tailwind.config.ts', 38], ['tailwind.config.mjs', 38],
    ['webpack.config.js', 35], ['webpack.config.ts', 35],
    ['rollup.config.js', 35], ['rollup.config.ts', 35],
    ['vitest.config.ts', 35], ['vitest.config.js', 35],
    ['jest.config.js', 35], ['jest.config.ts', 35],
    ['electron.config.js', 35],
    // Package manifests
    ['package.json', 40],
    ['pyproject.toml', 40],
    ['cargo.toml', 40],
    ['go.mod', 40],
    ['pubspec.yaml', 40],
    ['build.gradle', 38], ['settings.gradle', 35],
    ['pom.xml', 38],
    ['requirements.txt', 35],
    ['gemfile', 35],
    // Container / infra
    ['dockerfile', 38],
    ['docker-compose.yml', 38], ['docker-compose.yaml', 38],
    ['kubernetes.yaml', 35], ['kubernetes.yml', 35],
    ['helm.yaml', 35],
    // Env examples (safe)
    ['.env.example', 30], ['.env.sample', 30], ['.env.template', 30],
    // Docs
    ['readme.md', 45],
]);
// ---------------------------------------------------------------------------
// TECH STACK DETECTION — filename signals
// ---------------------------------------------------------------------------
/**
 * Maps a lowercase filename to zero or more tech stack labels.
 * Used by detectTechStack() in smartSummarizer.ts.
 */
exports.FILENAME_TECH_SIGNALS = new Map([
    ['astro.config.mjs', ['Astro']],
    ['astro.config.ts', ['Astro']],
    ['astro.config.js', ['Astro']],
    ['next.config.js', ['Next.js']],
    ['next.config.mjs', ['Next.js']],
    ['nuxt.config.ts', ['Nuxt.js']],
    ['nuxt.config.js', ['Nuxt.js']],
    ['svelte.config.js', ['SvelteKit']],
    ['svelte.config.ts', ['SvelteKit']],
    ['remix.config.js', ['Remix']],
    ['remix.config.ts', ['Remix']],
    ['angular.json', ['Angular']],
    ['electron-builder.yml', ['Electron']],
    ['tauri.conf.json', ['Tauri']],
    ['pubspec.yaml', ['Flutter/Dart']],
    ['cargo.toml', ['Rust']],
    ['go.mod', ['Go']],
    ['pyproject.toml', ['Python']],
    ['requirements.txt', ['Python']],
    ['build.gradle', ['Java/JVM (Gradle)']],
    ['settings.gradle', ['Java/JVM (Gradle)']],
    ['pom.xml', ['Java/JVM (Maven)']],
    ['gemfile', ['Ruby']],
    ['dockerfile', ['Docker']],
    ['docker-compose.yml', ['Docker Compose']],
    ['docker-compose.yaml', ['Docker Compose']],
    ['kubernetes.yaml', ['Kubernetes']],
    ['kubernetes.yml', ['Kubernetes']],
    ['tsconfig.json', ['TypeScript']],
]);
/**
 * npm package dependency → tech stack label.
 * Used when package.json is parsed.
 */
exports.NPM_DEP_SIGNALS = new Map([
    ['react', 'React'],
    ['next', 'Next.js'],
    ['vue', 'Vue.js'],
    ['nuxt', 'Nuxt.js'],
    ['svelte', 'Svelte'],
    ['@sveltejs/kit', 'SvelteKit'],
    ['astro', 'Astro'],
    ['@remix-run/react', 'Remix'],
    ['@remix-run/node', 'Remix'],
    ['solid-js', 'SolidJS'],
    ['@builder.io/qwik', 'Qwik'],
    ['express', 'Express.js'],
    ['fastify', 'Fastify'],
    ['@nestjs/core', 'NestJS'],
    ['@angular/core', 'Angular'],
    ['electron', 'Electron'],
    ['tailwindcss', 'Tailwind CSS'],
    ['prisma', 'Prisma'],
    ['@prisma/client', 'Prisma'],
    ['mongoose', 'MongoDB/Mongoose'],
    ['typeorm', 'TypeORM'],
    ['drizzle-orm', 'Drizzle ORM'],
    ['react-native', 'React Native'],
    ['expo', 'Expo/React Native'],
    ['torch', 'PyTorch'],
    ['tensorflow', 'TensorFlow'],
    ['jax', 'JAX'],
    ['scikit-learn', 'scikit-learn'],
    ['transformers', 'Hugging Face Transformers'],
    ['langchain', 'LangChain'],
    ['openai', 'OpenAI SDK'],
    ['vite', 'Vite'],
    ['webpack', 'Webpack'],
    ['rollup', 'Rollup'],
    ['esbuild', 'esbuild'],
    ['bun', 'Bun'],
]);
/**
 * Python requirement patterns → tech stack label.
 * Used when requirements.txt is parsed (simple substring match).
 */
exports.PYTHON_DEP_SIGNALS = new Map([
    ['torch', 'PyTorch'],
    ['tensorflow', 'TensorFlow'],
    ['jax', 'JAX'],
    ['scikit-learn', 'scikit-learn'],
    ['sklearn', 'scikit-learn'],
    ['transformers', 'Hugging Face Transformers'],
    ['diffusers', 'Hugging Face Diffusers'],
    ['langchain', 'LangChain'],
    ['fastapi', 'FastAPI'],
    ['django', 'Django'],
    ['flask', 'Flask'],
    ['starlette', 'Starlette'],
    ['pandas', 'pandas'],
    ['numpy', 'NumPy'],
    ['opencv', 'OpenCV'],
    ['openai', 'OpenAI SDK'],
]);
/** Extension sets for embedded / robotics tech detection */
exports.EMBEDDED_EXTENSIONS = new Set(['.ino', '.c', '.h', '.cpp', '.hpp']);
//# sourceMappingURL=fileRegistry.js.map