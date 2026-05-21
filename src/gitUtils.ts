import * as cp from 'child_process';
import * as path from 'path';

function runGit(args: string[], cwd: string): string {
    try {
        return cp.execFileSync('git', args, { cwd, encoding: 'utf-8', timeout: 10000, stdio: 'pipe' });
    } catch {
        return '';
    }
}

export function getChangedFiles(workspacePath: string): string[] {
    // git rev-parse HEAD fails on repos with no commits yet
    const hasCommits = runGit(['rev-parse', 'HEAD'], workspacePath).trim().length > 0;

    const unstaged  = hasCommits ? runGit(['diff', '--name-only', 'HEAD'], workspacePath) : '';
    const staged    = runGit(['diff', '--name-only', '--cached'], workspacePath);
    const untracked = runGit(['ls-files', '--others', '--exclude-standard'], workspacePath);

    const files = [...unstaged.split('\n'), ...staged.split('\n'), ...untracked.split('\n')]
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .filter((f, i, arr) => arr.indexOf(f) === i);

    return files
        .map(f => path.resolve(workspacePath, f))
        .filter(f => f.startsWith(path.resolve(workspacePath) + path.sep) || f === path.resolve(workspacePath));
}

export function isGitRepo(workspacePath: string): boolean {
    try {
        cp.execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
            cwd: workspacePath,
            encoding: 'utf-8',
            timeout: 5000,
            stdio: 'pipe',
        });
        return true;
    } catch {
        return false;
    }
}

export function getGitBranch(workspacePath: string): string {
    try {
        const result = cp.execFileSync('git', ['branch', '--show-current'], {
            cwd: workspacePath,
            encoding: 'utf-8',
            timeout: 5000,
            stdio: 'pipe',
        });
        return result.trim();
    } catch {
        return 'unknown';
    }
}

export function getRecentCommits(workspacePath: string, count: number = 5): string[] {
    try {
        const result = cp.execFileSync(
            'git',
            ['log', '--oneline', `-${count}`],
            {
                cwd: workspacePath,
                encoding: 'utf-8',
                timeout: 5000,
                stdio: 'pipe',
            }
        );
        return result.split('\n').filter(l => l.trim().length > 0);
    } catch {
        return [];
    }
}
