// src/core/presetRules.ts
import { ProjectNode } from '../types';
import { normalizePath } from './pathUtils';

/**
 * Defines the structure for a framework-specific preset rule.
 * These rules determine which files and directories are automatically selected (checked)
 * during the scanning process.
 */
type PresetRule = {
  /** List of directory names to explicitly include (and force-include their contents). */
  includeDirs: string[];
  /** Regular expressions for files that should be explicitly included. */
  includeFiles: RegExp[];
  /** Regular expressions for paths that should be explicitly excluded from selection. */
  exclude: RegExp[];
};

/**
 * A collection of predefined preset rules for various project frameworks.
 */
const PRESETS: Record<string, PresetRule> = {
  node: {
    includeDirs: ['src', 'lib', 'config'],
    includeFiles: [
      /package\.json$/,
      /tsconfig/,
      /\.env/
    ],
    exclude: [
      /node_modules/,
      /dist/,
      /build/,
      /logs/
    ]
  },

  next: {
    includeDirs: ['app', 'pages', 'components', 'lib'],
    includeFiles: [
      /next\.config/,
      /package\.json$/,
      /tsconfig/
    ],
    exclude: [
      /node_modules/,
      /\.next/,
      /out/
    ]
  },

  laravel: {
    includeDirs: ['app', 'routes', 'config'],
    includeFiles: [
      /composer\.json$/,
      /\.env/
    ],
    exclude: [
      /vendor/,
      /storage/
    ]
  },

  python: {
    includeDirs: ['src'],
    includeFiles: [
      /\.py$/,
      /requirements\.txt$/,
      /pyproject\.toml$/
    ],
    exclude: [
      /__pycache__/,
      /\.venv/
    ]
  },

  go: {
    includeDirs: ['cmd', 'internal', 'pkg'],
    includeFiles: [
      /\.go$/,
      /go\.mod$/,
      /go\.sum$/
    ],
    exclude: [/vendor/]
  }
};

/**
 * Applies a specific set of framework rules to the project file tree.
 * * This function modifies the `checked` state of the nodes within the tree in-place
 * based on the selected preset configuration.
 *
 * @param root - The root node of the project tree.
 * @param preset - The key of the preset to apply (e.g., 'node', 'next', 'laravel').
 */
export function applyPreset(
  root: ProjectNode,
  preset: keyof typeof PRESETS
): void {
  const rule = PRESETS[preset];
  applyNode(root, rule, false);
}

/**
 * Recursively applies the preset rules to a specific node and its children.
 * * @param node - The current project node being evaluated.
 * @param rule - The preset rule configuration to apply.
 * @param forceInclude - Indicates whether the current node is within an explicitly included directory.
 * @returns `true` if the node (or any of its children) is checked; otherwise, `false`.
 */
function applyNode(
  node: ProjectNode,
  rule: PresetRule,
  forceInclude: boolean
): boolean {
  const path = normalizePath(node.path);

  if (rule.exclude.some(r => r.test(path))) {
    node.checked = false;
    return false;
  }

  if (node.type === 'directory') {
    const dirName = path.split('/').pop() ?? '';
    const isIncludeRoot = rule.includeDirs.includes(dirName);

    const nextForceInclude = forceInclude || isIncludeRoot;

    let anyChildChecked = false;

    node.children?.forEach(child => {
      const childChecked = applyNode(
        child,
        rule,
        nextForceInclude
      );
      anyChildChecked = anyChildChecked || childChecked;
    });

    node.checked = isIncludeRoot || anyChildChecked;
    return node.checked;
  }

  if (forceInclude) {
    node.checked = true;
    return true;
  }

  const included =
    rule.includeFiles.some(r => r.test(path));

  node.checked = included;
  return node.checked;
}