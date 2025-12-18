// src/utils/git.ts
import * as cp from 'child_process';
import * as path from 'path';

/**
 * Retrieves a set of absolute file paths for files that are currently modified or untracked in the Git repository.
 *
 * This function executes the `git status` command with specific flags to ensure accurate file tracking:
 * - `--porcelain`: Ensures the output is in a stable, machine-readable format version.
 * - `-uall`: Expands untracked directories to list their individual files. This is critical for matching
 * specific file nodes in the project tree rather than just blocking out entire folders.
 *
 * @param rootPath - The absolute path to the root of the Git repository.
 * @returns A promise that resolves to a `Set` containing the normalized absolute paths of changed files.
 */
export async function getGitChangedFiles(rootPath: string): Promise<Set<string>> {
  return new Promise((resolve) => {
    // Execute git status with porcelain format for parsing stability
    // and -uall to expose every individual untracked file.
    cp.exec('git status --porcelain -uall', { cwd: rootPath }, (err, stdout) => {
      if (err) {
        console.warn('Mager Project: Git not found or not a valid git repository.', err);
        resolve(new Set()); 
        return;
      }

      const files = new Set<string>();
      const lines = stdout.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {continue;}

        // Capture the path part after the two-character Git status code (e.g., "?? file.ts" or " M file.ts")
        const match = trimmed.match(/^[ A-Z\?]{2} (.+)$/);
        if (match) {
           let rawPath = match[1];
           
           // Remove quotes if the path was quoted by Git (common for paths with spaces)
           if (rawPath.startsWith('"') && rawPath.endsWith('"')) {
             rawPath = rawPath.slice(1, -1);
           }
           
           // Convert to absolute path and normalize separators to forward slashes
           const absPath = path.join(rootPath, rawPath).replace(/\\/g, '/');
           files.add(absPath);
        }
      }
      resolve(files);
    });
  });
}