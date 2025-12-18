// src/core/pathUtils.ts
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}
