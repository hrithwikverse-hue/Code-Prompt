# Code Prompt — AI Context Exporter

**Export your entire codebase as structured Markdown and paste it directly into ChatGPT, Claude, Gemini, Grok, or any AI tool — in one click.**

Code Prompt bridges the gap between your VS Code workspace and browser-based AI assistants. No API keys. No subscriptions. Works with every AI tool's free tier.

---

## Why Code Prompt?

When you paste code into an AI chat, context is everything. Code Prompt packages your project — file tree, source files, line numbers, tech stack — into a single clean Markdown document that any AI can understand instantly.

- Works with **ChatGPT, Claude, Gemini, Grok, Copilot, Perplexity, Mistral, DeepSeek** and more
- No API key required — uses browser-based free tiers
- Auto-updates your context files as you code
- One-click copy + open AI browser from the sidebar

---

## Features

### Full Project Export
Exports every file in your workspace into a single `PROJECT_CONTEXT.md`. Includes the full directory tree, file contents with line numbers, and tech stack summary. Best for Claude (handles up to ~100K tokens).

### Smart Export
AI-ranked export that automatically selects the most important files — entry points, configs, core modules. Keeps output lean for ChatGPT Free (~4K token limit).

### Source Only
Exports just your source folder (`src/`, `lib/`, `app/`, etc.) into `SRC_CONTEXT.md`. Skips docs, configs, and build artifacts.

### Current File
Exports only the file currently open in the editor into `CURRENT_FILE_CONTEXT.md`. Perfect for asking AI to review, refactor, or explain a single file.

### Chunked Export
Splits large projects into multiple paste-sized `.md` files saved to `.code prompt/chunked/`. Paste one chunk at a time for projects that exceed token limits.

---

## How to Use

### Sidebar Panel
Click the **Code Prompt icon** in the Activity Bar. Each button exports and auto-copies the Markdown to your clipboard. Use the AI shortcut icons inside each button to copy and jump straight to your preferred AI tool.

### Right-Click Menu
Right-click anywhere in the **editor** or **Explorer** → hover **Code Prompt** → choose an export mode.

### Keyboard Shortcut
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Full Project Export |

### Command Palette
`Ctrl+Shift+P` → type `AI Context` → select any export command.

---

## AI Quick-Launch

Every export button in the sidebar includes one-click icons to open your preferred AI tool directly in the browser — with the exported Markdown already copied to your clipboard. Just paste and go.

Supported: **ChatGPT · Claude · Gemini · Grok · Perplexity · Microsoft Copilot · Mistral · DeepSeek · HuggingChat · Meta AI**

---

## Auto-Update

Code Prompt watches your workspace for file changes and automatically regenerates any context files that already exist in `.code prompt/`. Your AI context stays fresh without any manual re-exports.

---

## Output Format

All exported files are saved to the `.code prompt/` folder in your workspace root:

```
.code prompt/
├── PROJECT_CONTEXT.md
├── SMART_CONTEXT.md
├── SRC_CONTEXT.md
├── CURRENT_FILE_CONTEXT.md
└── chunked/
    ├── context_part_1.md
    ├── context_part_2.md
    └── ...
```

Each file includes:
- Full directory tree
- Tech stack detection
- Every source file with syntax-highlighted code blocks
- Line numbers for precise AI references

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `aiContext.ignoredFolders` | `node_modules`, `.git`, `dist`... | Folders to exclude from export |
| `aiContext.ignoredFiles` | `*.min.js`, `*.map`, lock files... | File patterns to exclude |
| `aiContext.maxFileSizeKB` | `100` | Skip files larger than this size |
| `aiContext.chunkSizeKB` | `50` | Target size per chunk in Chunked Export |
| `aiContext.includeLineNumbers` | `true` | Prepend line numbers to each file |
| `aiContext.autoCopyToClipboard` | `true` | Auto-copy output to clipboard on export |
| `aiContext.outputLocation` | `both` | `clipboard` · `file` · `both` · `newTab` |
| `aiContext.smartExportMaxFiles` | `20` | Max files included in Smart Export |
| `aiContext.supportedExtensions` | *(see settings)* | File extensions to include |

---

## Tips

- **ChatGPT Free** → Use **Smart Export** to stay under the ~4K token limit
- **Claude Free** → Use **Full Project** — Claude handles up to ~100K tokens
- **Large projects** → Use **Chunked Export** and paste one part at a time
- Add `.code prompt/` to your `.gitignore` to keep context files out of version control
- Use **Current File** for fast single-file reviews without exporting the whole project

---

## Supported Languages

JavaScript · TypeScript · Python · Go · Rust · Java · Kotlin · C / C++ · C# · Swift · PHP · Ruby · Vue · Svelte · HTML · CSS · SCSS · JSON · YAML · TOML · SQL · Bash · Lua · Dart · Terraform · GraphQL · Markdown · and more.

---

## Requirements

- VS Code `1.85.0` or higher
- No internet connection required for export (only for opening AI browser tabs)

---

## License

MIT — free to use, modify, and distribute.
