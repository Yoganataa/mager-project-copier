// src/core/ignoreResolver.ts
import fs from 'fs';
import path from 'path';
import ignore, { Ignore } from 'ignore';

export type IgnoreOptions = {
  /** Absolute workspace root */
  rootPath: string;

  /** Use .gitignore as ignore source */
  useGitIgnore: boolean;

  /** Hide sensitive files (.env, keys, etc) */
  excludeSensitive: boolean;
};

/**
 * IgnoreResolver
 *
 * Single source of truth for deciding:
 * - what is hidden
 * - what is visible
 * - what is selectable
 *
 * This resolver is optimized for:
 * - AI reasoning
 * - security
 * - low noise
 */
export class IgnoreResolver {
  private readonly rootPath: string;
  private readonly excludeSensitive: boolean;
  private gitIgnore: Ignore | null = null;

  /**
   * ABSOLUTE HIDDEN DIRECTORIES
   * Never shown, never selectable, never scanned.
   *
   * Reason:
   * - Zero AI value
   * - High noise / security risk
   */
  private static readonly ABSOLUTE_HIDDEN_DIRS = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    '.svelte-kit',
    'coverage',
    'logs',
    'tmp',
    '.cache',
    '.idea',
    '.vscode'
  ]);

  /**
   * ALWAYS VISIBLE FILES
   * Even if ignored by git.
   *
   * Reason:
   * - Config / documentation
   * - Useful for AI context
   */
  private static readonly ALWAYS_VISIBLE_FILES = new Set([
    '.gitignore',
    'package.json',
    'tsconfig.json',
    'jsconfig.json',
    'README.md'
  ]);

  /**
   * SENSITIVE FILE PATTERNS
   * Must never be auto-selected.
   *
   * Reason:
   * - Security
   * - AI does not need secrets
   */
  private static readonly SENSITIVE_PATTERNS: RegExp[] = [
    /^\.env($|\.)/,
    /\.pem$/,
    /\.key$/,
    /id_rsa/,
    /id_ed25519/
  ];

  constructor(options: IgnoreOptions) {
    this.rootPath = this.normalize(options.rootPath);
    this.excludeSensitive = options.excludeSensitive;

    if (options.useGitIgnore) {
      this.loadGitIgnore();
    }
  }

  /**
   * Decide whether a path should be hidden from tree.
   */
  shouldIgnore(filePath: string): boolean {
    const normalized = this.normalize(filePath);
    const baseName = path.basename(normalized);

    /**
     * 1. Absolute hidden directories
     */
    if (IgnoreResolver.ABSOLUTE_HIDDEN_DIRS.has(baseName)) {
      return true;
    }

    /**
     * 2. Always-visible files
     */
    if (IgnoreResolver.ALWAYS_VISIBLE_FILES.has(baseName)) {
      return false;
    }

    /**
     * 3. Sensitive files
     */
    if (
      this.excludeSensitive &&
      IgnoreResolver.SENSITIVE_PATTERNS.some(r =>
        r.test(baseName)
      )
    ) {
      return true;
    }

    /**
     * 4. .gitignore rules (optional)
     */
    if (this.gitIgnore) {
      const relative = path
        .relative(this.rootPath, normalized)
        .replace(/\\/g, '/');

      if (this.gitIgnore.ignores(relative)) {
        return true;
      }
    }

    return false;
  }

  // =========================
  // Internal helpers
  // =========================

  private loadGitIgnore(): void {
    const gitignorePath = path.join(
      this.rootPath,
      '.gitignore'
    );

    if (!fs.existsSync(gitignorePath)) {
      return;
    }

    const content = fs.readFileSync(gitignorePath, 'utf8');
    this.gitIgnore = ignore().add(content);
  }

  private normalize(p: string): string {
    return p.replace(/\\/g, '/');
  }
}
