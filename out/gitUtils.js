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
exports.getChangedFiles = getChangedFiles;
exports.isGitRepo = isGitRepo;
exports.getGitBranch = getGitBranch;
exports.getRecentCommits = getRecentCommits;
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
function runGit(args, cwd) {
    try {
        return cp.execFileSync('git', args, { cwd, encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
    }
    catch {
        return '';
    }
}
function getChangedFiles(workspacePath) {
    // git rev-parse HEAD fails on repos with no commits yet
    const hasCommits = runGit(['rev-parse', 'HEAD'], workspacePath).trim().length > 0;
    const unstaged = hasCommits ? runGit(['diff', '--name-only', 'HEAD'], workspacePath) : '';
    const staged = runGit(['diff', '--name-only', '--cached'], workspacePath);
    const untracked = runGit(['ls-files', '--others', '--exclude-standard'], workspacePath);
    const files = [...unstaged.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .filter((f, i, arr) => arr.indexOf(f) === i);
    return files
        .map(f => path.resolve(workspacePath, f))
        .filter(f => f.startsWith(path.resolve(workspacePath) + path.sep) || f === path.resolve(workspacePath));
}
function isGitRepo(workspacePath) {
    try {
        cp.execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
            cwd: workspacePath,
            encoding: 'utf-8',
            timeout: 5000,
            stdio: 'pipe',
        });
        return true;
    }
    catch {
        return false;
    }
}
function getGitBranch(workspacePath) {
    try {
        const result = cp.execFileSync('git', ['branch', '--show-current'], {
            cwd: workspacePath,
            encoding: 'utf-8',
            timeout: 5000,
            stdio: 'pipe',
        });
        return result.trim();
    }
    catch {
        return 'unknown';
    }
}
function getRecentCommits(workspacePath, count = 5) {
    try {
        const result = cp.execFileSync('git', ['log', '--oneline', `-${count}`], {
            cwd: workspacePath,
            encoding: 'utf-8',
            timeout: 5000,
            stdio: 'pipe',
        });
        return result.split('\n').filter(l => l.trim().length > 0);
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=gitUtils.js.map