import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WORKSPACE_ROOT = resolve(import.meta.dir, '../..');

// Helper to recursively find files matching a suffix
function findFiles(dir: string, suffix: string): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && entry !== '.git') {
          results.push(...findFiles(fullPath, suffix));
        }
      } else if (stat.isFile() && entry.endsWith(suffix)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
  }
  return results;
}

// Find all protected files
function getProtectedFiles(): string[] {
  const files: string[] = [
    join(WORKSPACE_ROOT, 'tools/brioela-type-guard/type.guard.baseline.json'),
    join(WORKSPACE_ROOT, 'tools/brioela-name-guard/name.guard.baseline.json'),
    join(WORKSPACE_ROOT, 'tools/brioela-lexicon-guard/lexicon.guard.baseline.json'),
    join(WORKSPACE_ROOT, 'tools/brioela-name-guard/_helpers/name.guard.config.helper.ts'),
    join(WORKSPACE_ROOT, 'tools/brioela-type-guard/_helpers/type.guard.config.helper.ts'),
    join(WORKSPACE_ROOT, 'tools/brioela-lexicon-guard/_helpers/lexicon.guard.config.helper.ts'),
  ];

  // Pattern-based files
  files.push(...findFiles(join(WORKSPACE_ROOT, 'tools/brioela-type-guard/_policies'), '.ts'));
  files.push(...findFiles(join(WORKSPACE_ROOT, 'tools/brioela-name-guard/_policies'), '.ts'));
  files.push(...findFiles(join(WORKSPACE_ROOT, 'tools/brioela-lexicon-guard/_policies'), '.ts'));
  files.push(...findFiles(join(WORKSPACE_ROOT, 'tools/brioela-lexicon-guard/_lexicon'), '.ts'));
  files.push(...findFiles(join(WORKSPACE_ROOT, 'backend/src/database'), '.ts'));

  // Deploy files (fly.toml, wrangler.toml, wrangler.json)
  function findDeployFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry === 'node_modules' || entry === '.git') continue;
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...findDeployFiles(fullPath));
        } else if (stat.isFile() && (entry === 'fly.toml' || entry === 'wrangler.toml' || entry === 'wrangler.json')) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
    }
    return results;
  }
  files.push(...findDeployFiles(WORKSPACE_ROOT));

  return files.filter(f => existsSync(f));
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: bun run git:safe <git-args>');
  process.exit(1);
}

const protectedFiles = getProtectedFiles();

// 1. Suspend ACLs (no sudo required)
for (const file of protectedFiles) {
  spawnSync('chmod', ['-N', file]);
}

// 2. Run the Git command
console.log(`Running git-safe: git ${args.join(' ')}`);
const gitRun = spawnSync('git', args, { stdio: 'inherit', cwd: WORKSPACE_ROOT });

// 3. Re-apply ACLs to files that exist (no sudo required)
const postFiles = getProtectedFiles();
for (const file of postFiles) {
  spawnSync('chmod', ['+a', 'everyone deny delete', file]);
}

process.exit(gitRun.status ?? 0);
