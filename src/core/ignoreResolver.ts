// src/core/ignoreResolver.ts
import fs from 'fs';
import path from 'path';
import ignore, { Ignore } from 'ignore';

/**
 * Configuration options for initializing the IgnoreResolver.
 */
export type IgnoreOptions = {
  /** The absolute path to the workspace root directory. */
  rootPath: string;

  /** Whether to respect rules defined in the project's .gitignore file. */
  useGitIgnore: boolean;

  /** Whether to automatically exclude sensitive files (e.g., .env, private keys). */
  excludeSensitive: boolean;
};

/**
 * The IgnoreResolver acts as the single source of truth for file visibility and selection eligibility.
 * * It is designed to optimize the scanning process for AI contexts by:
 * - Filtering out high-noise directories (e.g., node_modules, build artifacts).
 * - Enforcing security by hiding sensitive files.
 * - Respecting version control ignore rules when requested.
 */
export class IgnoreResolver {
  private readonly rootPath: string;
  private readonly excludeSensitive: boolean;
  private gitIgnore: Ignore | null = null;

  /**
   * A set of directory names that are unconditionally hidden from the scan.
   * These directories typically contain dependencies, build outputs, or logs 
   * that provide no semantic value for AI analysis.
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
   * A set of filenames that remain visible even if ignored by version control.
   * These files usually contain critical configuration or documentation useful for AI context.
   */
  private static readonly ALWAYS_VISIBLE_FILES = new Set([
    '.gitignore',
    'package.json',
    'tsconfig.json',
    'jsconfig.json',
    'README.md'
  ]);

  /**
   * Regular expressions matching sensitive file patterns that must never be auto-selected.
   * This ensures secrets and credentials are not accidentally exposed.
   */
  private static readonly SENSITIVE_PATTERNS: RegExp[] = [
    /^\.env($|\.)/,
    /\.pem$/,
    /\.key$/,
    /id_rsa/,
    /id_ed25519/
  ];

  /**
   * Creates an instance of IgnoreResolver.
   * * @param options - The configuration options for the resolver.
   */
  constructor(options: IgnoreOptions) {
    this.rootPath = this.normalize(options.rootPath);
    this.excludeSensitive = options.excludeSensitive;

    if (options.useGitIgnore) {
      this.loadGitIgnore();
    }
  }

  /**
   * Determines whether a specific file path should be ignored based on the established rules.
   * * The evaluation follows this precedence:
   * 1. **Absolute Hidden:** Checks against the hardcoded list of noisy directories.
   * 2. **Always Visible:** Allow-lists specific configuration files.
   * 3. **Sensitive:** Checks against security patterns (if enabled).
   * 4. **Git Ignore:** Checks against the .gitignore rules (if loaded).
   * * @param filePath - The absolute path of the file or directory to check.
   * @returns `true` if the file should be ignored; otherwise, `false`.
   */
  shouldIgnore(filePath: string): boolean {
    const normalized = this.normalize(filePath);
    const baseName = path.basename(normalized);

    if (IgnoreResolver.ABSOLUTE_HIDDEN_DIRS.has(baseName)) {
      return true;
    }

    if (IgnoreResolver.ALWAYS_VISIBLE_FILES.has(baseName)) {
      return false;
    }

    if (
      this.excludeSensitive &&
      IgnoreResolver.SENSITIVE_PATTERNS.some(r =>
        r.test(baseName)
      )
    ) {
      return true;
    }

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