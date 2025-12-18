// src/core/frameworkDetector.ts
import * as fs from 'fs';
import * as path from 'path';

/**
 * Supported project frameworks.
 */
export type Framework =
  | 'node'
  | 'next'
  | 'laravel'
  | 'python'
  | 'go'
  | 'unknown';

/**
 * Detects project framework by inspecting root files.
 */
export function detectFramework(
  rootPath: string
): Framework {
  const exists = (p: string) =>
    fs.existsSync(path.join(rootPath, p));

  if (exists('next.config.js') || exists('next.config.ts')) {
    return 'next';
  }

  if (exists('artisan') && exists('composer.json')) {
    return 'laravel';
  }

  if (exists('go.mod')) {
    return 'go';
  }

  if (exists('requirements.txt') || exists('pyproject.toml')) {
    return 'python';
  }

  if (exists('package.json')) {
    return 'node';
  }

  return 'unknown';
}
