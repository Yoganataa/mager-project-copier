// src/core/frameworkDetector.ts
import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents the set of supported project frameworks that can be detected.
 */
export type Framework =
  | 'node'
  | 'next'
  | 'laravel'
  | 'python'
  | 'go'
  | 'unknown';

/**
 * Detects the development framework of a project by inspecting key configuration files in the root directory.
 *
 * This function checks for the existence of specific files (e.g., `next.config.js`, `artisan`, `go.mod`)
 * to determine the project type. The checks are performed in a specific order of precedence.
 *
 * @param rootPath - The absolute path to the project's root directory.
 * @returns The detected {@link Framework}, or `'unknown'` if no matching indicators are found.
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