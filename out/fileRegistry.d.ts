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
/** File extensions that are always secret / credential material. */
export declare const SECRET_EXTENSIONS: Set<string>;
/**
 * Filename patterns (exact match, lowercase) that are always blocked.
 * Also covers common credential material.
 */
export declare const SECRET_FILENAMES: Set<string>;
/**
 * Glob-style prefix patterns (startsWith, lowercase) for .env.* variants.
 * e.g. ".env.something" unless it matches SAFE_ENV_SUFFIXES.
 */
export declare const ENV_PREFIX = ".env.";
/**
 * Safe .env suffixes that MAY be exported (template/example files).
 */
export declare const SAFE_ENV_SUFFIXES: Set<string>;
export declare const LANGUAGE_MAP: Record<string, string>;
export declare const FILENAME_LANGUAGE_MAP: Record<string, string>;
/** All extensions the extension supports out of the box. */
export declare const BUILT_IN_EXTENSIONS: Set<string>;
/** All exact filenames (no extension) supported out of the box. */
export declare const BUILT_IN_FILENAMES: Set<string>;
/**
 * Lowercase filenames that get an extra priority bonus in Smart Export.
 * Values are additive score bonuses on top of the base scoring.
 */
export declare const HIGH_PRIORITY_FILENAMES: Map<string, number>;
/**
 * Maps a lowercase filename to zero or more tech stack labels.
 * Used by detectTechStack() in smartSummarizer.ts.
 */
export declare const FILENAME_TECH_SIGNALS: Map<string, string[]>;
/**
 * npm package dependency → tech stack label.
 * Used when package.json is parsed.
 */
export declare const NPM_DEP_SIGNALS: Map<string, string>;
/**
 * Python requirement patterns → tech stack label.
 * Used when requirements.txt is parsed (simple substring match).
 */
export declare const PYTHON_DEP_SIGNALS: Map<string, string>;
/** Extension sets for embedded / robotics tech detection */
export declare const EMBEDDED_EXTENSIONS: Set<string>;
//# sourceMappingURL=fileRegistry.d.ts.map