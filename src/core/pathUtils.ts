// src/core/pathUtils.ts
/**
 * Normalizes a file path to use forward slashes (`/`) as separators,
 * regardless of the operating system.
 * @param p - The file path to normalize.
 * @returns The normalized file path with forward slashes.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}
